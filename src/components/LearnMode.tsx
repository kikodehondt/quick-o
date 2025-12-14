import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, TrendingUp, AlertCircle, Target } from 'lucide-react'
import { VocabSet, WordPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray, checkAnswer, calculateSimilarity } from '../lib/utils'

interface LearnModeProps {
  set: VocabSet
  settings: StudySettings
  onEnd: () => void
}

export default function LearnMode({ set, settings, onEnd }: LearnModeProps) {
  const [allWords, setAllWords] = useState<WordPair[]>([])
  const [activeWords, setActiveWords] = useState<WordPair[]>([])
  const [masteredWords, setMasteredWords] = useState<WordPair[]>([])
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

  async function loadWords() {
    try {
      const { data, error } = await supabase
        .from('word_pairs')
        .select('*')
        .eq('set_id', set.id!)

      if (error) throw error

      let processedWords = data || []
      
      // Handle direction
      if (settings.direction === 'both') {
        const forwardWords = processedWords
        const reverseWords = processedWords.map(w => ({
          ...w,
          word1: w.word2,
          word2: w.word1,
        }))
        processedWords = [...forwardWords, ...reverseWords]
      } else if (settings.direction === 'reverse') {
        processedWords = processedWords.map(w => ({
          ...w,
          word1: w.word2,
          word2: w.word1,
        }))
      }

      const shuffled = shuffleArray(processedWords)
      setAllWords(shuffled)
      setActiveWords(shuffled)
    } catch (err) {
      console.error('Error loading words:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!userAnswer.trim() || showFeedback || activeWords.length === 0) return

    const currentWord = activeWords[currentIndex]
    const correct = checkAnswer(
      userAnswer,
      currentWord.word2,
      settings.caseSensitive,
      settings.accentSensitive
    )

    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      setCorrectCount(prev => prev + 1)
    } else {
      setIncorrectCount(prev => prev + 1)
    }
  }

  function nextWord() {
    const currentWord = activeWords[currentIndex]
    
    if (isCorrect) {
      // Word mastered - remove from active pool
      const newMastered = [...masteredWords, currentWord]
      const newActive = activeWords.filter((_, idx) => idx !== currentIndex)
      
      setMasteredWords(newMastered)
      setActiveWords(newActive)
      
      // Check if finished
      if (newActive.length === 0) {
        setFinished(true)
        saveProgress()
        return
      }
      
      // Adjust index if needed
      if (currentIndex >= newActive.length) {
        setCurrentIndex(0)
      }
    } else {
      // Word incorrect - shuffle it back into the pool
      const wordToReinsert = activeWords[currentIndex]
      const remainingWords = activeWords.filter((_, idx) => idx !== currentIndex)
      
      // Insert at random position (not immediately next)
      const minPosition = Math.min(2, remainingWords.length)
      const maxPosition = remainingWords.length
      const randomPosition = minPosition + Math.floor(Math.random() * (maxPosition - minPosition + 1))
      
      const newActive = [
        ...remainingWords.slice(0, randomPosition),
        wordToReinsert,
        ...remainingWords.slice(randomPosition)
      ]
      
      setActiveWords(newActive)
      
      // Move to next word (which is now at current index in the new array)
      if (currentIndex >= newActive.length) {
        setCurrentIndex(0)
      }
    }
    
    setShowFeedback(false)
    setUserAnswer('')
    setShowHint(false)
  }

  async function saveProgress() {
    try {
      const { error } = await supabase
        .from('study_progress')
        .upsert({
          set_id: set.id!,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          last_studied: new Date().toISOString()
        }, {
          onConflict: 'set_id'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  function restart() {
    const shuffled = shuffleArray(allWords)
    setActiveWords(shuffled)
    setMasteredWords([])
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setUserAnswer('')
    setShowFeedback(false)
    setShowHint(false)
    setFinished(false)
  }

  function getHint() {
    if (activeWords.length === 0) return ''
    const answer = activeWords[currentIndex].word2
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

  if (allWords.length === 0) {
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
            <Star className="w-24 h-24 mx-auto text-yellow-400 animate-bounce-slow" />
          </div>
          
          <h2 className="text-4xl font-bold gradient-text mb-4">
            Alle woorden beheerst! 🎉
          </h2>
          
          <p className="text-gray-600 mb-6">
            Je hebt alle {masteredWords.length} woordjes correct beantwoord!
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold gradient-text mb-2">{percentage}%</div>
            <p className="text-gray-600">Accuracy</p>
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
              <p className="text-sm text-gray-600">Herhaald</p>
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

  const currentWord = activeWords[currentIndex]
  const progress = (masteredWords.length / allWords.length) * 100
  const similarity = userAnswer ? calculateSimilarity(userAnswer, currentWord.word2) : 0

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onEnd}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>
          <div className="text-white text-center">
            <div className="flex items-center gap-2 justify-center">
              <Target className="w-5 h-5" />
              <span className="text-lg font-semibold">{activeWords.length} te gaan</span>
            </div>
            <div className="text-sm opacity-80">{masteredWords.length} beheerst</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-4 mb-6">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <span className="text-white text-xs font-bold">{Math.round(progress)}%</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-green-500/20 text-white px-4 py-2 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">{correctCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/20 text-white px-4 py-2 rounded-xl">
            <RotateCcw className="w-5 h-5" />
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
                    className="w-full px-6 py-4 text-2xl text-center rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors mb-4"
                    placeholder="Type je antwoord..."
                    autoComplete="off"
                    autoFocus
                  />
                  
                  {/* Hint Button */}
                  {!showHint && userAnswer.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center gap-2 mx-auto mb-4"
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

              {/* Feedback */}
              {showFeedback && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <span className="text-2xl font-bold text-green-700">Perfect! ✨</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-8 h-8 text-orange-600" />
                          <span className="text-2xl font-bold text-orange-700">Komt terug</span>
                        </>
                      )}
                    </div>
                    
                    {!isCorrect && (
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Jouw antwoord:</p>
                          <p className="text-xl font-semibold text-orange-600">{userAnswer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Correct antwoord:</p>
                          <p className="text-xl font-semibold text-green-600">{currentWord.word2}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                          💡 Dit woord komt straks nog een keer terug
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={nextWord}
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
