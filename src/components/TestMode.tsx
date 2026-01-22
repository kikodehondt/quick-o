import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle, RotateCcw, Star, TrendingUp, Sparkles, Save, Clock, AlertTriangle } from 'lucide-react'
import { VocabSet, VocabPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray, checkAnswer } from '../lib/utils'
import { logSession } from '../lib/stats'


interface TestModeProps {
    set: VocabSet
    settings: StudySettings
    onEnd: () => void
}

export default function TestMode({ set, settings, onEnd }: TestModeProps) {
    const [words, setWords] = useState<VocabPair[]>([])
    const [loading, setLoading] = useState(true)

    // State for the Exam Paper mode
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState({ correct: 0, incorrect: 0, total: 0 })

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number | undefined>(settings.timeLimit)
    const [timerActive, setTimerActive] = useState(false)
    const startTimeRef = useRef<number>(Date.now())

    useEffect(() => {
        loadWords()
        startTimeRef.current = Date.now()
    }, [])

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (timerActive && timeLeft !== undefined && !submitted) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === undefined || prev <= 1) {
                        clearInterval(interval)
                        handleSubmit(true) // Force submit on timeout
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [timerActive, timeLeft, submitted])

    async function loadWords() {
        try {
            setLoading(true)
            let allWords: VocabPair[] = []
            let from = 0
            const pageSize = 1000

            while (true) {
                const { data, error } = await supabase
                    .from('set_pairs')
                    .select(`
            vocab_pairs (
              id,
              word_1,
              word_2,
              language_1,
              language_2
            )
          `)
                    .eq('set_id', set.id!)
                    .range(from, from + pageSize - 1)

                if (error) throw error

                const batch = (data || []).map((item: any) => {
                    const vp = Array.isArray(item.vocab_pairs) ? item.vocab_pairs[0] : item.vocab_pairs
                    if (!vp) return null
                    return {
                        id: vp.id,
                        word_1: vp.word_1,
                        word_2: vp.word_2,
                        language_1: vp.language_1,
                        language_2: vp.language_2,
                        set_id: set.id
                    }
                }).filter(Boolean) as unknown as VocabPair[]

                allWords = [...allWords, ...batch]
                if (batch.length < pageSize) break
                from += pageSize
            }

            let processedWords = allWords

            // Filter based on settings
            if (settings.selectedWordIds && settings.selectedWordIds.length > 0) {
                const allow = new Set(settings.selectedWordIds)
                processedWords = processedWords.filter(w => w.id && allow.has(w.id))
            }

            // Always shuffle 
            processedWords = shuffleArray(processedWords)

            // Limit question count
            if (settings.questionCount && settings.questionCount < processedWords.length) {
                processedWords = processedWords.slice(0, settings.questionCount)
            }

            setWords(processedWords)

            // Initialize empty answers
            const initialAnswers: Record<string, string> = {}
            processedWords.forEach((_, i) => {
                initialAnswers[i] = ''
            })
            setUserAnswers(initialAnswers)

            // Start timer if set
            if (settings.timeLimit) {
                setTimerActive(true)
            }

        } catch (err) {
            console.error('Error loading words:', err)
        } finally {
            setLoading(false)
        }
    }

    function handleInputChange(index: number, value: string) {
        if (submitted) return
        setUserAnswers(prev => ({
            ...prev,
            [index]: value
        }))
    }

    async function handleSubmit(isTimeout = false) {
        if (submitted) return

        const endTime = Date.now()
        const durationSeconds = Math.round((endTime - startTimeRef.current) / 1000)

        let correctCount = 0
        let incorrectCount = 0

        words.forEach((word, index) => {
            const answer = userAnswers[index] || ''
            const isCorrect = checkAnswer(
                answer,
                word.word_2,
                settings.caseSensitive,
                settings.accentSensitive
            )
            if (isCorrect) correctCount++
            else incorrectCount++
        })

        setScore({
            correct: correctCount,
            incorrect: incorrectCount,
            total: words.length
        })
        setSubmitted(true)
        setTimerActive(false)

        await saveProgress(correctCount, incorrectCount, words.length, durationSeconds)

        if (!isTimeout) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }



    async function saveProgress(correct: number, incorrect: number, total: number, duration: number) {
        const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0

        await logSession({
            set_id: set.id || null,
            mode: 'test',
            duration_seconds: duration,
            score: scorePercentage,
            total_items: total,
            mistakes_count: incorrect
        })
    }

    function getInputStyle(index: number) {
        if (!submitted) {
            return "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
        }

        const word = words[index]
        const answer = userAnswers[index] || ''
        const isCorrect = checkAnswer(
            answer,
            word.word_2,
            settings.caseSensitive,
            settings.accentSensitive
        )

        return isCorrect
            ? "border-green-500 bg-green-50 text-green-900"
            : "border-red-500 bg-red-50 text-red-900"
    }

    // Format seconds to MM:SS
    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                    </div>
                    <h2 className="text-2xl font-bold gradient-text mb-2">Examen voorbereiden...</h2>
                </div>
            </div>
        )
    }

    const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-8 relative overflow-hidden" style={{ background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite' }}>
            <style>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg border border-white/20 sticky top-4 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onEnd} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Examen: {set.name}</h1>
                            <p className="text-xs text-gray-500">{submitted ? "Resultaten bekijken" : `${Object.keys(userAnswers).filter(k => userAnswers[k]).length}/${words.length} beantwoord`}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Timer Display */}
                        {timeLeft !== undefined && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                <Clock className="w-4 h-4" />
                                {formatTime(timeLeft)}
                            </div>
                        )}

                        {submitted && (
                            <div className={`px-4 py-2 rounded-xl font-bold text-white shadow-md ${percentage >= 50 ? 'bg-green-500' : 'bg-red-500'}`}>
                                {percentage}%
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeout Notification */}
                {submitted && timeLeft === 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl animate-fade-in flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-red-800">Tijd is op!</h3>
                            <p className="text-sm text-red-700">Het examen is automatisch ingediend omdat de tijd verstreken is.</p>
                        </div>
                    </div>
                )}

                {/* Result Summary Card (Only when submitted) */}
                {submitted && (
                    <div className="bg-white rounded-3xl p-8 mb-8 card-shadow text-center animate-fade-in">
                        <div className="mb-4">
                            {percentage >= 80 ? (
                                <Star className="w-16 h-16 mx-auto text-yellow-400" />
                            ) : percentage >= 50 ? (
                                <TrendingUp className="w-16 h-16 mx-auto text-green-400" />
                            ) : (
                                <RotateCcw className="w-16 h-16 mx-auto text-orange-400" />
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {percentage >= 80 ? 'Fantastisch!' : percentage >= 50 ? 'Geslaagd!' : 'Nog even oefenen'}
                        </h2>
                        <div className="flex justify-center gap-8 mt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{score.correct}</div>
                                <div className="text-xs font-semibold text-gray-400 uppercase">Correct</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{score.incorrect}</div>
                                <div className="text-xs font-semibold text-gray-400 uppercase">Fout</div>
                            </div>
                        </div>
                        <button onClick={onEnd} className="mt-8 btn-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                            Terug naar overzicht
                        </button>
                    </div>
                )}

                {/* Exam Questions List */}
                <div className="space-y-4 pb-24">
                    {words.map((word, index) => {
                        const answer = userAnswers[index] || ''
                        const isCorrect = submitted ? checkAnswer(answer, word.word_2, settings.caseSensitive, settings.accentSensitive) : undefined

                        return (
                            <div key={word.id} className={`bg-white rounded-2xl p-6 shadow-sm transition-all ${submitted ? (isCorrect ? 'border-2 border-green-100 ring-2 ring-green-50' : 'border-2 border-red-100 ring-2 ring-red-50') : 'hover:shadow-md'}`}>
                                <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-wide">Vertaal</label>
                                        <div className="text-2xl font-bold text-gray-800">{word.word_1}</div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 self-start">
                                        <Sparkles className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                            Binnenkort met AI context
                                        </span>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    disabled={submitted}
                                    placeholder="Typ je antwoord..."
                                    className={`w-full p-4 rounded-xl border-2 text-lg font-medium outline-none transition-all placeholder:text-gray-300 ${getInputStyle(index)}`}
                                />

                                {submitted && !isCorrect && (
                                    <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 animate-fade-in">
                                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                        <div>
                                            <span className="text-xs font-bold uppercase block opacity-70">Correct antwoord</span>
                                            <span className="font-bold">{word.word_2}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Submit Action Bar */}
                {!submitted && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-[2px]">
                        <div className="max-w-3xl mx-auto">
                            <button
                                onClick={() => handleSubmit(false)}
                                className="w-full btn-gradient text-white py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                            >
                                <Save className="w-6 h-6" />
                                Dien Examen In
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
