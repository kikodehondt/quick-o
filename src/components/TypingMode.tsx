import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, TrendingUp, AlertCircle } from 'lucide-react'
import { VocabSet, WordPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray, checkAnswer, calculateSimilarity } from '../lib/utils'
import { useAuth } from '../lib/authContext'

interface TypingModeProps {
  set: VocabSet
  settings: StudySettings
  onEnd: () => void
}

export default function TypingMode({ set, settings, onEnd }: TypingModeProps) {
  const { user } = useAuth()
  const [words, setWords] = useState<WordPair[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWords()
  }, [])

  useEffect(() => {
    if (!showFeedback && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, showFeedback])

  // Handle Enter key to go to next word after feedback
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showFeedback && e.key === 'Enter') {
        e.preventDefault()
        nextWord()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFeedback, isCorrect, currentIndex, words])

  async function loadWords() {
    try {
      // Fetch all words using pagination
      let allWords: WordPair[] = []
      let from = 0
      const pageSize = 1000
      
      while (true) {
        const { data, error } = await supabase
          .from('word_pairs')
          .select('*')
          .eq('set_id', set.id!)
          .range(from, from + pageSize - 1)

        if (error) throw error
        const batch = data || []
        allWords = [...allWords, ...batch]
        
        if (batch.length < pageSize) break
        from += pageSize
      }

      let processedWords = allWords
      // Filter op geselecteerde woorden (bereik/handmatig)
      if (settings.selectedWordIds && settings.selectedWordIds.length > 0) {
        const allow = new Set(settings.selectedWordIds)
        processedWords = processedWords.filter(w => w.id && allow.has(w.id))
      }
      
      // Handle direction
      if (settings.direction === 'both') {
        // Duplicate words and reverse half of them
        const forwardWords = processedWords
        const reverseWords = processedWords.map(w => ({
          ...w,
          word1: w.word2,
          word2: w.word1,
        }))
        processedWords = [...forwardWords, ...reverseWords]
      } else if (settings.direction === 'reverse') {
        // Reverse all words
        processedWords = processedWords.map(w => ({
          ...w,
          word1: w.word2,
          word2: w.word1,
        }))
      }

      // Shuffle if enabled
      if (settings.shuffle) {
        processedWords = shuffleArray(processedWords)
      }

      setWords(processedWords)
    } catch (err) {
      console.error('Error loading words:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!userAnswer.trim() || showFeedback) return

    const currentWord = words[currentIndex]
    const correct = checkAnswer(
      userAnswer,
      currentWord.word2,
      settings.caseSensitive,
      settings.accentSensitive
    )

    setIsCorrect(correct)

    if (correct) {
      setCorrectCount(prev => prev + 1)
      // Snel verder gaan: bij correct antwoord meteen door zonder extra Enter
      nextWord(true)
    } else {
      setIncorrectCount(prev => prev + 1)
      // Toon feedback en wacht op Enter/klik om opnieuw te proberen
      setShowFeedback(true)
    }
  }

  function nextWord(forceAdvance?: boolean) {
    setShowFeedback(false)
    setUserAnswer('')
    setShowHint(false)
    const advance = forceAdvance ?? isCorrect
    if (!advance) {
      // blijf op hetzelfde woord tot het juist is
      return
    }

    if (currentIndex >= words.length - 1) {
      setFinished(true)
      saveProgress()
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  function saveProgress() {
    try {
      const payload = {
        mode: 'typing',
        correctCount,
        incorrectCount,
        timestamp: Date.now(),
      }
      localStorage.setItem('progress_typing_' + set.id, JSON.stringify(payload))
      
      // Device-specific cloud sync
      if (user?.id) {
        supabase
          .from('study_progress')
          .upsert({
            set_id: set.id!,
            user_id: user.id,
            correct_count: correctCount,
            incorrect_count: incorrectCount,
            last_studied: new Date().toISOString()
          }, {
            onConflict: 'set_id,user_id'
          })
          .then(() => {})
      }
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  function restart() {
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setUserAnswer('')
    setShowFeedback(false)
    setShowHint(false)
    setFinished(false)
    if (settings.shuffle) {
      setWords(shuffleArray(words))
    }
  }

  function getHint() {
    const currentWord = words[currentIndex]
    const answer = currentWord.word2
    const hintLength = Math.ceil(answer.length * 0.3)
    return answer.substring(0, hintLength) + '...'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl">Laden...</p>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 card-shadow text-center max-w-md">
          <XCircle className="w-20 h-20 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Geen woordjes gevonden</h2>
          <button
            onClick={onEnd}
            className="btn-gradient text-white px-6 py-3 rounded-xl font-semibold"
          >
            Terug
          </button>
        </div>
      </div>
    )
  }

  if (finished) {
    const total = correctCount + incorrectCount
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 card-shadow text-center max-w-lg">
          <div className="mb-6">
            {percentage >= 80 ? (
              <Star className="w-24 h-24 mx-auto text-yellow-400 animate-bounce-slow" />
            ) : percentage >= 60 ? (
              <TrendingUp className="w-24 h-24 mx-auto text-green-400" />
            ) : (
              <RotateCcw className="w-24 h-24 mx-auto text-blue-400" />
            )}
          </div>
          
          <h2 className="text-4xl font-bold gradient-text mb-4">
            {percentage >= 80 ? 'Geweldig!' : percentage >= 60 ? 'Goed gedaan!' : 'Blijf oefenen!'}
          </h2>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold gradient-text mb-2">{percentage}%</div>
            <p className="text-gray-600">Correct beantwoord</p>
          </div>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-3xl font-bold text-green-600">{correctCount}</span>
              </div>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="w-6 h-6 text-red-500" />
                <span className="text-3xl font-bold text-red-600">{incorrectCount}</span>
              </div>
              <p className="text-sm text-gray-600">Fout</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={restart}
              className="flex-1 btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Opnieuw
            </button>
            <button
              onClick={onEnd}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Terug
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100
  const similarity = userAnswer ? calculateSimilarity(userAnswer, currentWord.word2) : 0

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onEnd}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>
          <div className="text-white text-lg font-semibold">
            {currentIndex + 1} / {words.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-8">
          <div
            className="bg-white h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Score */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-green-500/20 text-white px-4 py-2 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">{correctCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-red-500/20 text-white px-4 py-2 rounded-xl">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">{incorrectCount}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="bg-white rounded-3xl p-12 card-shadow w-full max-w-2xl">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
                Vertaal naar {settings.direction === 'reverse' ? set.language1 : set.language2}
              </p>
              <p className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                {currentWord.word1}
              </p>

              {/* Input Form */}
              {!showFeedback && (
                <form onSubmit={handleSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full px-6 py-4 text-2xl text-center rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all mb-4"
                    placeholder="Type je antwoord..."
                    autoComplete="off"
                    autoFocus
                  />
                  
                  {/* Hint Button */}
                  {!showHint && userAnswer.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-green-600 hover:text-green-700 text-sm font-semibold flex items-center gap-2 mx-auto mb-4"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Hint tonen
                    </button>
                  )}

                  {/* Hint */}
                  {showHint && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-4">
                      <p className="text-blue-700 font-mono text-lg">{getHint()}</p>
                    </div>
                  )}

                  {/* Similarity Indicator */}
                  {userAnswer.length > 0 && !showFeedback && (
                    <div className="mb-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            similarity > 70 ? 'bg-green-500' : similarity > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${similarity}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!userAnswer.trim()}
                    className="w-full btn-gradient text-white px-8 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    Controleren
                  </button>
                </form>
              )}

              {/* Feedback alleen bij fout */}
              {showFeedback && !isCorrect && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl bg-red-50 border-2 border-red-200`}>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <span className="text-2xl font-bold text-red-700">Fout</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Jouw antwoord:</p>
                        <p className="text-xl font-semibold text-red-600">{userAnswer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Correct antwoord:</p>
                        <p className="text-xl font-semibold text-green-600">{currentWord.word2}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => nextWord()}
                    className="w-full btn-gradient text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
                  >
                    Volgende
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
