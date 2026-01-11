import { ChangelogEntry, RoadmapTicket } from './supabase'

const REPO_OWNER = 'kikodehondt'
const REPO_NAME = 'quick-o'
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

interface GitHubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  published_at: string
  prerelease: boolean
}

interface GitHubLabel {
  id: number
  name: string
  color: string
}

interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  created_at: string
  updated_at: string
  labels: GitHubLabel[]
  pull_request?: any // If present, it's a PR not an issue
}

export async function fetchGitHubReleases(): Promise<ChangelogEntry[]> {
  try {
    const response = await fetch(`${BASE_URL}/releases`)
    if (!response.ok) throw new Error('Failed to fetch releases')
    const releases: GitHubRelease[] = await response.json()

    return releases.map(release => {
      // Simple heuristic to determine type
      let type: ChangelogEntry['type'] = 'feature'
      const lowerBody = (release.body || '').toLowerCase()
      const lowerTitle = (release.name || '').toLowerCase()

      if (lowerTitle.includes('fix') || lowerBody.includes('bug fix')) type = 'bugfix'
      if (lowerBody.includes('breaking change')) type = 'breaking'
      if (lowerTitle.includes('docs') || lowerBody.includes('documentation')) type = 'docs'
      if (lowerTitle.includes('perf') || lowerBody.includes('performance')) type = 'performance'

      // Parse highlights (bullet points)
      const highlights = release.body
        ? release.body.split('\n')
            .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
            .map(line => line.replace(/^[-*]\s+/, '').trim())
            .slice(0, 5) // Take top 5
        : []

      return {
        id: release.id.toString(),
        version: release.tag_name,
        release_date: release.published_at,
        type,
        title: release.name || release.tag_name,
        description: release.body || '', // Full body as description
        highlights: highlights.length > 0 ? highlights : undefined
      }
    })
  } catch (error) {
    console.error('Error fetching GitHub releases:', error)
    return []
  }
}

export async function fetchGitHubIssues(): Promise<RoadmapTicket[]> {
  try {
    // Fetch open issues (planned/in-progress) and recently closed (completed)
    const response = await fetch(`${BASE_URL}/issues?state=all&per_page=50&sort=updated`)
    if (!response.ok) throw new Error('Failed to fetch issues')
    const data: GitHubIssue[] = await response.json()

    // Filter out Pull Requests, as they appear in the issues endpoint
    const issues = data.filter(item => !item.pull_request)

    return issues.map(issue => {
      // Determine status based on labels and state
      let status: RoadmapTicket['status'] = 'planned'
      const labelNames = issue.labels.map(l => l.name.toLowerCase())

      if (issue.state === 'closed') {
        status = 'completed'
      } else {
        if (labelNames.includes('idea')) status = 'idea'
        else if (labelNames.includes('in progress') || labelNames.includes('wip')) status = 'in-progress'
        // default 'planned'
      }

      // Determine priority
      let priority = 0
      if (labelNames.includes('high priority') || labelNames.includes('urgent')) priority = 3
      if (labelNames.includes('medium')) priority = 2
      if (labelNames.includes('low')) priority = 1

      return {
        id: 1000000 + issue.number, // Offset to avoid collision with DB IDs
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        title: issue.title,
        description: issue.body,
        status,
        priority,
        tags: issue.labels.map(l => l.name)
      }
    })
  } catch (error) {
    console.error('Error fetching GitHub issues:', error)
    return []
  }
}
