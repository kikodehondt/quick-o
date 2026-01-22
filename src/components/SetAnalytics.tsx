
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculateSetPredictions, SetPrediction } from '../lib/set-stats'
import { getMostMissedWords, MissedWord } from '../lib/stats'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Clock, TrendingUp, Target, Brain, Award, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface SetAnalyticsProps {
    setId: number
}

export default function SetAnalytics({ setId }: SetAnalyticsProps) {
    const [loading, setLoading] = useState(true)
    const [history, setHistory] = useState<any[]>([])
    const [predictions, setPredictions] = useState<SetPrediction | null>(null)
    const [missedWords, setMissedWords] = useState<MissedWord[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Parallel fetching
            const [sessionResponse, missedResponse] = await Promise.all([
                supabase
                    .from('study_sessions')
                    .select('created_at, score, duration_seconds')
                    .eq('user_id', user.id)
                    .eq('set_id', setId)
                    .order('created_at', { ascending: true }),
                getMostMissedWords(setId)
            ])

            const data = sessionResponse.data

            if (data && data.length > 0) {
                // Transform for charts
                const historyData = data.map((s, i) => ({
                    date: format(new Date(s.created_at), 'd MMM', { locale: nl }),
                    fullDate: new Date(s.created_at),
                    score: s.score,
                    session: i + 1
                }))
                setHistory(historyData)

                // Calculate Predictions
                const predictionData = data.map(s => ({
                    date: new Date(s.created_at),
                    score: s.score,
                    durationSeconds: s.duration_seconds || 0
                }))

                const pred = calculateSetPredictions(predictionData)
                setPredictions(pred)
            }

            if (missedResponse) {
                setMissedWords(missedResponse)
            }

            setLoading(false)
        }
        fetchData()
    }, [setId])

    if (loading) return <div className="p-12 text-center text-gray-400">Analyseren...</div>

    if (history.length < 2) {
        return (
            <div className="bg-white rounded-3xl p-8 border border-gray-200 text-center text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-4 text-emerald-300" />
                <h3 className="text-xl font-bold mb-2">Nog niet genoeg data</h3>
                <p>Oefen nog een paar keer om voorspellingen te ontgrendelen!</p>
            </div>
        )
    }

    const formatTimeRemaining = (hours: number) => {
        const h = Math.floor(hours)
        const m = Math.round((hours - h) * 60)
        if (h === 0) return `${m} min`
        return `${h}u ${m}m`
    }

    return (
        <div className="space-y-6 animate-fade-in text-gray-800">

            {/* THE ORACLE - Highlight Section */}
            {predictions && (
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>

                    <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-2 text-indigo-300 uppercase tracking-widest text-xs font-bold">
                                <Brain className="w-4 h-4" />
                                Kennis Kompas
                            </div>
                            <h2 className="text-3xl font-bold mb-4">
                                {predictions.nextMilestone
                                    ? `Nog ${formatTimeRemaining(predictions.nextMilestone.hoursNeeded)} te gaan`
                                    : "Je bent al een meester!"}
                            </h2>
                            <p className="text-indigo-200 mb-6 leading-relaxed">
                                {predictions.nextMilestone
                                    ? `Om ${predictions.nextMilestone.target}% meesterschap te bereiken, moet je nog ongeveer ${formatTimeRemaining(predictions.nextMilestone.hoursNeeded)} studeren aan dit tempo.`
                                    : "Je hebt de 100% meesterschap bereikt volgens onze modellen. Blijf oefenen om het te behouden!"}
                            </p>

                            <div className="flex gap-4">
                                <div className="bg-white/10 rounded-2xl p-4 flex-1">
                                    <div className="text-xs text-indigo-300 mb-1">Huidige Score</div>
                                    <div className="text-2xl font-bold">{predictions.currentMastery}%</div>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4 flex-1">
                                    <div className="text-xs text-indigo-300 mb-1">Leersnelheid</div>
                                    <div className="text-2xl font-bold">
                                        {predictions.learningVelocity > 0 ? '+' : ''}{Math.round(predictions.learningVelocity)}<span className="text-sm opacity-50">% / uur</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Timeline */}
                        <div className="space-y-4">
                            {[50, 80, 90, 100].map(milestone => {
                                // @ts-ignore
                                const date = predictions.predictions[`mastery${milestone}`] as Date | null
                                const isPassed = predictions.currentMastery >= milestone

                                return (
                                    <div key={milestone} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isPassed ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPassed ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                                            {isPassed ? <Award className="w-5 h-5" /> : `${milestone}%`}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">
                                                {milestone}% Meesterschap
                                            </div>
                                            <div className={`text-xs ${isPassed ? 'text-green-300' : 'text-indigo-300'}`}>
                                                {isPassed ? 'Behaald!' : (date ? format(date, 'd MMM yyyy', { locale: nl }) : 'Nog niet binnen bereik')}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PROGRESS CHART */}
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Groei Curve
                    </h3>
                    <div className="h-64 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="session"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    name="Sessie"
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Doel', fill: '#10b981', fontSize: 10 }} />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MOST MISSED WORDS */}
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Struikelblokken
                    </h3>

                    {missedWords.length > 0 ? (
                        <div className="space-y-4 flex-1 overflow-auto max-h-[250px] pr-2 custom-scrollbar">
                            {missedWords.map((word) => (
                                <div key={word.word_id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div>
                                        <div className="font-bold text-gray-800">{word.word1}</div>
                                        <div className="text-sm text-gray-500">{word.word2}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-600">{word.mistakes}x fout</div>
                                        <div className="text-xs text-gray-400">op {word.total_attempts} pogingen</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-4">
                            <CheckCircle className="w-12 h-12 mb-3 text-green-100" /> {/* Using CheckCircle but checking imports */}
                            {/* Wait, CheckCircle not imported. Use Award or existing icons */}
                            <Award className="w-12 h-12 mb-3 text-green-200" />
                            <p>Geen struikelblokken gevonden!</p>
                            <p className="text-sm mt-1">Je bent goed bezig.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* DEEP METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Totale Studietijd</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {predictions ? Math.round(predictions.totalStudyTimeHours * 10) / 10 : 0} <span className="text-sm text-gray-400 font-normal">uur</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Aantal Sessies</p>
                            <p className="text-2xl font-bold text-gray-800">{history.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-green-100 p-3 rounded-xl text-green-600">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Retentie Index</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {predictions?.retentionIndex || '-'}/100
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

