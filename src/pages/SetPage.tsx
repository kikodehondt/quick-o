import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase, VocabSet } from '../lib/supabase'
import { Play, BookOpen, GraduationCap, School, Calendar, User, Tag, ArrowLeft } from 'lucide-react'

interface SetPageProps {
    setCode: string
    onStartStudy: (set: VocabSet) => void
    onBack: () => void
}

export default function SetPage({ setCode, onStartStudy, onBack }: SetPageProps) {
    const [set, setSet] = useState<VocabSet | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSet() {
            try {
                const { data, error } = await supabase
                    .from('vocab_sets')
                    .select(`
            *,
            set_pairs(count)
          `)
                    .eq('link_code', setCode)
                    .single()

                if (error) throw error

                // Transform result to match VocabSet interface
                const setWithCount = {
                    ...data,
                    word_count: data.set_pairs?.[0]?.count || 0
                }

                setSet(setWithCount)
            } catch (err) {
                console.error('Error fetching set:', err)
                setError('Set niet gevonden of verwijderd.')
            } finally {
                setLoading(false)
            }
        }

        if (setCode) {
            fetchSet()
        }
    }, [setCode])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        )
    }

    if (error || !set) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
                <h2 className="text-2xl font-bold mb-4">Oeps!</h2>
                <p className="mb-6 opacity-80">{error || 'Er is iets misgegaan.'}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                    Terug naar Home
                </button>
            </div>
        )
    }

    // SEO Helpers
    const canonicalUrl = `https://www.quick-o.be/set/${set.link_code}/${set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const pageTitle = `${set.name} - ${set.school ? set.school + ' ' : ''}${set.direction || 'Woordenlijst'} - Quick-O`


    const metaDescription = `Oefen ${set.name} (${set.word_count} woorden) op Quick-O.${set.school ? ` Voor ${set.school}` : ''}${set.course ? `, vak ${set.course}` : ''}.${set.description ? ` Beschrijving: ${set.description}` : ''} Gratis online woordjes leren.`

    // JSON-LD Structured Data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": ["LearningResource", "CreativeWork"],
        "name": set.name,
        "description": set.description || `Woordenlijst voor ${set.name}`,
        "author": {
            "@type": "Person",
            "name": set.creator_name || "Anoniem"
        },
        "inLanguage": "nl",
        "educationalLevel": set.year || "Any",
        "learningResourceType": "Flashcards",
        "about": [
            set.course,
            set.direction,
            set.school
        ].filter(Boolean),
        "keywords": set.tags?.join(', '),
        "url": canonicalUrl
    }

    return (
        <div className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden"
            style={{
                background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)',
                backgroundSize: '400% 400%',
                animation: 'gradientShift 20s ease infinite'
            }}>

            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={metaDescription} />
                <link rel="canonical" href={canonicalUrl} />

                {/* Open Graph */}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:type" content="website" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={metaDescription} />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>

            <div className="max-w-4xl mx-auto">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 mb-8 text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Terug naar overzicht
                </button>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 md:p-12 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div className="flex-1">
                            {set.is_public && (
                                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-full mb-4 border border-green-500/30">
                                    PUBLIEKE SET
                                </span>
                            )}

                            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{set.name}</h1>

                            {set.description && (
                                <p className="text-lg text-white/80 mb-6 leading-relaxed">
                                    {set.description}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-8">
                                {set.school && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                        <School className="w-4 h-4" />
                                        {set.school}
                                    </div>
                                )}
                                {set.direction && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                        <GraduationCap className="w-4 h-4" />
                                        {set.direction}
                                    </div>
                                )}
                                {set.course && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                        <BookOpen className="w-4 h-4" />
                                        {set.course}
                                    </div>
                                )}
                                {set.year && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                        <Calendar className="w-4 h-4" />
                                        {set.year}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                                    <User className="w-4 h-4" />
                                    {set.creator_name || 'Anoniem'}
                                </div>
                            </div>

                            {set.tags && set.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {set.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-200 text-xs border border-blue-500/30">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => onStartStudy(set)}
                                    className="flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold text-lg hover:bg-emerald-50 hover:scale-105 transition-all shadow-lg"
                                >
                                    <Play className="w-6 h-6 fill-current" />
                                    Start met Oefenen
                                </button>
                                <div className="text-white/60 text-sm font-medium px-4">
                                    {set.word_count} woorden in deze lijst
                                </div>
                            </div>
                        </div>

                        {/* Visual Decoration / Card Preview */}
                        <div className="hidden md:block w-72 aspect-[3/4] bg-white text-gray-800 rounded-2xl p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 relative">
                            <div className="absolute top-4 right-4 opacity-20">
                                <BookOpen className="w-24 h-24" />
                            </div>
                            <div className="h-full flex flex-col justify-center text-center">
                                <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {set.language1}
                                </div>
                                <div className="text-2xl font-serif italic mb-4">
                                    ...
                                </div>
                                <div className="w-full h-px bg-gray-200 my-4"></div>
                                <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {set.language2}
                                </div>
                                <div className="text-2xl font-serif italic">
                                    ...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
