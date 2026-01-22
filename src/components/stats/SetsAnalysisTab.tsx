import { useState, useEffect } from 'react'
import { supabase, VocabSet } from '../../lib/supabase'
import { useAuth } from '../../lib/authContext'
import { BookOpen, ChevronRight, BarChart2 } from 'lucide-react'
import SetAnalytics from '../SetAnalytics'

export default function SetsAnalysisTab() {
    const { user } = useAuth()
    const [sets, setSets] = useState<VocabSet[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSetId, setSelectedSetId] = useState<number | null>(null)

    useEffect(() => {
        if (!user) return

        async function fetchAnalyzableSets() {
            try {
                // 1. Fetch ALL study sessions for this user
                // We only need set_id to count them
                const { data: sessions, error: sessionError } = await supabase
                    .from('study_sessions')
                    .select('set_id')
                    .eq('user_id', user!.id)
                    .not('set_id', 'is', null)

                if (sessionError) throw sessionError

                // 2. Count sessions per set
                const sessionCounts: Record<number, number> = {}
                sessions?.forEach(session => {
                    const id = session.set_id
                    if (id) {
                        sessionCounts[id] = (sessionCounts[id] || 0) + 1
                    }
                })

                // 3. Filter for sets with >= 2 sessions
                const eligibleSetIds = Object.keys(sessionCounts)
                    .map(Number)
                    .filter(id => sessionCounts[id] >= 2)

                if (eligibleSetIds.length === 0) {
                    setSets([])
                    return
                }

                // 4. Fetch details for these sets
                const { data: setsData, error: setsError } = await supabase
                    .from('vocab_sets')
                    .select('*')
                    .in('id', eligibleSetIds)

                if (setsError) throw setsError
                setSets(setsData || [])

            } catch (err) {
                console.error('Error fetching sets for analysis:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchAnalyzableSets()
    }, [user])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    if (selectedSetId) {
        const selectedSet = sets.find(s => s.id === selectedSetId)
        return (
            <div className="animate-fade-in">
                <button
                    onClick={() => setSelectedSetId(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    Terug naar alle sets
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold gradient-text mb-1">{selectedSet?.name}</h2>
                    <p className="text-gray-500">Analyse & Voorspellingen</p>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-gray-100">
                    <SetAnalytics setId={selectedSetId} />
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-8 border border-orange-100">
                <h2 className="text-2xl font-bold text-orange-900 mb-2">Sets Analyse</h2>
                <p className="text-orange-700/80">
                    Kies een set om gedetailleerde voorspellingen en "Kennis Kompas" te bekijken.
                </p>
            </div>

            {sets.length === 0 ? (
                <div className="text-center p-12 text-gray-500 bg-white rounded-3xl border border-gray-100">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold mb-2">Nog geen data</h3>
                    <p>Oefen een set minimaal 2 keer om hier analyses en voorspellingen te zien.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sets.map(set => (
                        <div
                            key={set.id}
                            onClick={() => setSelectedSetId(set.id!)}
                            className="bg-white p-6 rounded-2xl card-shadow border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <BarChart2 className="w-6 h-6" />
                                </div>
                                <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium">
                                    {set.language1} → {set.language2}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">
                                {set.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">
                                {set.description || 'Geen beschrijving'}
                            </p>
                            <div className="flex items-center text-sm font-medium text-orange-600">
                                Bekijk Kennis Kompas <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
