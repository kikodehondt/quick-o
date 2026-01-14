
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Missing Supabase credentials' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all public sets
    const { data: sets, error } = await supabase
        .from('vocab_sets')
        .select('id, name, created_at, link_code')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sets for sitemap:', error)
        return res.status(500).json({ error: 'Database error' })
    }

    const baseUrl = 'https://www.quick-o.be'

    // Static pages
    const staticPages = [
        { url: '/', changefreq: 'weekly', priority: 1.0 },
        { url: '/privacy', changefreq: 'monthly', priority: 0.6 },
        { url: '/terms', changefreq: 'monthly', priority: 0.6 },
    ]

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
            .map((page) => {
                return `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
            })
            .join('')}
  ${sets
            .map((set) => {
                const slug = set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                const url = `${baseUrl}/set/${set.link_code}/${slug}`
                const date = set.created_at ? set.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
                return `
  <url>
    <loc>${url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
            })
            .join('')}
</urlset>`

    res.setHeader('Content-Type', 'text/xml')
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.status(200).send(sitemap)
}
