import { useState, useEffect } from 'react'
import { X, ExternalLink, Check, AlertCircle, Zap, Bug, Lightbulb, Calendar, Hammer, CheckCircle2 } from 'lucide-react'
import { supabase, ChangelogEntry, RoadmapTicket } from '../lib/supabase'
import { fetchGitHubReleases, fetchGitHubIssues } from '../lib/github'
import { motion, AnimatePresence } from 'framer-motion'
import { Timeline } from './ui/timeline'

interface ChangelogModalProps {
  onClose: () => void
}

export default function ChangelogModal({ onClose }: ChangelogModalProps) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'latest' | 'all' | 'roadmap'>('latest')

  useEffect(() => {
    async function fetchData() {
      try {
        const [changelogRes, roadmapRes, githubReleases, githubIssues] = await Promise.all([
          supabase
            .from('changelog_entries')
            .select('*')
            .order('version', { ascending: false }),
          supabase
            .from('roadmap_tickets')
            .select('*')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false }),
          fetchGitHubReleases(),
          fetchGitHubIssues()
        ])

        // Merge Changelog
        const mergedChangelog = [
          ...(changelogRes.data || []),
          ...githubReleases
        ].sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())

        setChangelog(mergedChangelog)

        // Merge Roadmap
        const mergedRoadmap = [
          ...(roadmapRes.data || []),
          ...githubIssues
        ].sort((a, b) => b.priority - a.priority || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setRoadmap(mergedRoadmap)
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const typeConfig = {
    feature: { icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '✨ Feature' },
    bugfix: { icon: Bug, color: 'text-red-600', bg: 'bg-red-50', label: '🐛 Bugfix' },
    breaking: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: '⚠️ Breaking' },
    performance: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', label: '🚀 Performance' },
    docs: { icon: Check, color: 'text-gray-600', bg: 'bg-gray-50', label: '📚 Docs' },
  }

  const statusConfig = {
    idea: { icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50', label: '💡 Idee' },
    planned: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', label: '📅 Gepland' },
    'in-progress': { icon: Hammer, color: 'text-purple-600', bg: 'bg-purple-50', label: '🔨 Bezig' },
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: '✅ Klaar' },
  }

  const parseDescription = (text: string | null) => {
    if (!text) return null
    // Split by the whole img tag, capturing it
    const parts = text.split(/(<img[^>]+src="[^"]+"[^>]*\/>)/g)
    
    return parts.map((part, index) => {
      const imgMatch = part.match(/src="([^"]+)"/)
      if (part.startsWith('<img') && imgMatch) {
        return (
          <img 
            key={index} 
            src={imgMatch[1]} 
            alt="Feature preview" 
            className="max-w-full h-auto rounded-lg border border-emerald-100 my-3 shadow-sm" 
            loading="lazy"
          />
        )
      }
      // Clean up extra newlines but keep text structure
      if (!part.trim()) return null
      return <span key={index} className="whitespace-pre-wrap">{part}</span>
    })
  }

  const latestVersion = changelog[0]
  const allVersions = changelog

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 20, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22, mass: 0.8 }}
      >
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
          <div className="flex items-center justify-between px-8 py-6 border-b border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Changelog</h2>
              <p className="text-sm text-emerald-700/80 mt-1">Alle updates en releases</p>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-600/70 hover:text-emerald-700 transition-colors p-2 rounded-xl hover:bg-emerald-50"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-8 pt-6 border-b border-emerald-100 bg-white/60">
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'latest'
                ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/60'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            🆕 Wat is nieuw
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/60'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            📋 Alle versies
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'roadmap'
                ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/60'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            🚀 Roadmap
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6 bg-white">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="flex items-center justify-center h-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-emerald-700">Changelog laden...</p>
                </div>
              </motion.div>
            ) : activeTab === 'latest' ? (
              latestVersion ? (
                <motion.div
                  key="latest"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-900">v{latestVersion.version}</h3>
                        <p className="text-sm text-emerald-700 mt-1">
                          {new Date(latestVersion.release_date).toLocaleDateString('nl-NL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeConfig[latestVersion.type as keyof typeof typeConfig].bg} ${typeConfig[latestVersion.type as keyof typeof typeConfig].color}`}>
                        {typeConfig[latestVersion.type as keyof typeof typeConfig].label}
                      </span>
                    </div>
                    <h4 className="text-xl font-semibold text-emerald-900 mb-3">{latestVersion.title}</h4>
                    <p className="text-emerald-800 mb-4">{latestVersion.description}</p>
                    {latestVersion.highlights && latestVersion.highlights.length > 0 && (
                      <ul className="space-y-2">
                        {latestVersion.highlights.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-emerald-700">
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="latest-empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-100 text-center">
                    <h4 className="font-bold text-emerald-900 mb-2">Geen changelog gevonden</h4>
                    <p className="text-emerald-800 mb-3">Er zijn nog geen entries in de database of de verbinding faalde.</p>
                    <a
                      href="https://github.com/kikodehondt/quick-o/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      Bekijk releases op GitHub <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              )
            ) : activeTab === 'all' ? (
              allVersions.length > 0 ? (
                <motion.div
                  key="all"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="-mx-8"
                >
                  <Timeline
                    data={allVersions.map((entry) => ({
                      title: `v${entry.version}`,
                      content: (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
                          transition={{ duration: 0.25 }}
                          className="bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-xs text-emerald-700/80">
                                {new Date(entry.release_date).toLocaleDateString('nl-NL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${typeConfig[entry.type as keyof typeof typeConfig].color}`}>
                              {typeConfig[entry.type as keyof typeof typeConfig].label}
                            </span>
                          </div>
                          <h5 className="font-semibold text-emerald-900 mb-1">{entry.title}</h5>
                          <p className="text-sm text-emerald-800 mb-2">{entry.description}</p>
                          {entry.highlights && entry.highlights.length > 0 && (
                            <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1">
                              {entry.highlights.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      ),
                    }))}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="all-empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-100 text-center">
                    <h4 className="font-bold text-emerald-900 mb-2">Nog geen versies om te tonen</h4>
                    <p className="text-emerald-800 mb-3">Plaats changelog entries in Supabase of bekijk de GitHub releases.</p>
                    <a
                      href="https://github.com/kikodehondt/quick-o/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      Naar GitHub releases <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {roadmap.length > 0 ? (
                  <div className="grid gap-4">
                    {roadmap.map((ticket, i) => {
                      const StatusIcon = statusConfig[ticket.status].icon
                      return (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                        >
                          <div className={`p-3 rounded-xl flex-shrink-0 ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color}`}>
                            <StatusIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-emerald-900 text-lg">{ticket.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].color}`}>
                                {statusConfig[ticket.status].label}
                              </span>
                            </div>
                            <div className="text-emerald-800/80 text-sm leading-relaxed mb-2 block">
                              {parseDescription(ticket.description)}
                            </div>
                            
                            {ticket.tags && ticket.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {ticket.tags.map(tag => (
                                  <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-teal-50 rounded-xl p-6 border border-emerald-100 text-center">
                    <h4 className="font-bold text-emerald-900 mb-2">🚀 Roadmap</h4>
                    <p className="text-emerald-800">Nog geen items op de roadmap. Check later terug!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-100 px-8 py-4 bg-emerald-50/50 flex items-center justify-between text-sm">
          <a
            href="https://github.com/kikodehondt/quick-o/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            Bekijk op GitHub <ExternalLink className="w-4 h-4" />
          </a>
          <span className="text-emerald-800">Quick-O Release Notes</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
