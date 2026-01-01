import { useState, useEffect } from 'react'
import { Check, X, ChevronRight, Award, Layers } from 'lucide-react'
import { VocabSet, WordPair, StudySettings } from '../lib/supabase'
import { supabase } from '../lib/supabase'

interface MultipleChoiceModeProps {
  set: VocabSet
  settings: StudySettings
  onEnd: (results: { correct: number; total: number }) => void
  onExit?: () => void
}

interface Question {
  word: WordPair
  correctAnswer: string
  options: string[]
}

export default function MultipleChoiceMode({ set, settings, onEnd, onExit }: MultipleChoiceModeProps) {
  const [words, setWords] = useState<WordPair[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [mistakes, setMistakes] = useState<WordPair[]>([])
  const [showResult, setShowResult] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'grid'>('vertical')
  const [showingFeedback, setShowingFeedback] = useState(false)

  // Fetch words and prepare questions
  useEffect(() => {
    async function fetchWords() {
      const { data, error } = await supabase
        .from('word_pairs')
        .select('*')
        .eq('set_id', set.id!)

      if (error) {
        console.error('Error fetching words:', error)
        return
      }

      let processed = data || []

      // Apply direction
      if (settings.direction === 'reverse') {
        processed = processed.map(w => ({ ...w, word1: w.word2, word2: w.word1 }))
      } else if (settings.direction === 'both') {
        const forward = processed
        const reverse = processed.map(w => ({ ...w, word1: w.word2, word2: w.word1 }))
        processed = [...forward, ...reverse]
      }

      // Shuffle if enabled
      if (settings.shuffle) {
        processed = shuffleArray(processed)
      }

      setWords(processed)
    }

    fetchWords()
  }, [set.id, settings])

  // Generate question when words change or index changes
  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length) {
      generateQuestion(words[currentIndex])
    }
  }, [words, currentIndex])

  async function generateQuestion(currentWord: WordPair) {
    const correctAnswer = currentWord.word2

    // Get mistakes with good error percentage (min 3 times shown, sorted by percentage)
    const { data: mistakes } = await supabase
      .from('mistake_percentages')
      .select('wrong_answer, mistake_percentage')
      .eq('correct_word_id', currentWord.id!)
      .gte('mistake_percentage', 20) // Only use if at least 20% error rate
      .order('mistake_percentage', { ascending: false })
      .limit(5) // Get top 5, we'll use max 1-2

    const commonMistakes = mistakes?.map(m => m.wrong_answer) || []

    // Get other words from the set for distractors
    const otherWords = words
      .filter(w => w.id !== currentWord.id && w.word2 !== correctAnswer)
      .map(w => w.word2)

    // Build options: correct + smart mix
    const distractors: string[] = []
    
    // Add MAX 1 common mistake (to avoid feedback loop)
    // Use weighted random: higher percentage = higher chance, but capped at 40% probability
    if (commonMistakes.length > 0 && Math.random() < 0.4) {
      distractors.push(commonMistakes[0])
    }

    // Fill remaining slots with random words
    const shuffledOthers = shuffleArray(otherWords)
    for (const word of shuffledOthers) {
      if (distractors.length >= 3) break
      if (!distractors.includes(word)) {
        distractors.push(word)
      }
    }

    // Combine and shuffle
    const allOptions = shuffleArray([correctAnswer, ...distractors.slice(0, 3)])

    // Record that these distractors were shown (for percentage calculation)
    // Do this async without blocking
    ;(async () => {
      for (const distractor of distractors.slice(0, 3)) {
        if (distractor !== correctAnswer) {
          try {
            await supabase.rpc('record_option_shown', {
              p_correct_word_id: currentWord.id!,
              p_shown_answer: distractor
            })
          } catch (err) {
            console.error('Error recording option shown:', err)
          }
        }
      }
    })()

    setQuestion({
      word: currentWord,
      correctAnswer,
      options: allOptions
    })
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  async function handleAnswerSelect(answer: string) {
    if (selectedAnswer || !question) return

    setSelectedAnswer(answer)
    const correct = answer === question.correctAnswer
    setIsCorrect(correct)

    if (correct) {
      setCorrectCount(prev => prev + 1)
    } else {
      setIncorrectCount(prev => prev + 1)
      setMistakes(prev => [...prev, question.word])
      // Record the mistake for future learning
      ;(async () => {
        try {
          await supabase.rpc('record_mistake', {
            p_set_id: set.id!,
            p_correct_word_id: question.word.id!,
            p_wrong_answer: answer
          })
        } catch (err) {
          console.error('Error recording mistake:', err)
        }
      })()
    }

    // Show feedback and wait for user to continue
    setShowingFeedback(true)
  }

  function handleContinue() {
    if (currentIndex + 1 >= words.length) {
      setShowResult(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setShowingFeedback(false)
    }
  }

  // Keyboard handler for Enter/Space to continue
  useEffect(() => {
    if (!showingFeedback) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        handleContinue()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showingFeedback, currentIndex, words.length])

  if (showResult) {
    const percentage = Math.round((correctCount / words.length) * 100)
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-8 relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="max-w-2xl mx-auto w-full flex items-center justify-center flex-1">
          <div className="bg-white rounded-3xl p-8 card-shadow text-center w-full">
            <Award className="w-20 h-20 mx-auto mb-6 text-emerald-500" />
            <h2 className="text-3xl font-bold mb-4 gradient-text">Geweldig gedaan!</h2>
            <div className="text-6xl font-bold text-emerald-600 mb-4">
              {percentage}%
            </div>
            <p className="text-xl text-gray-700 mb-8">
              {correctCount} van {words.length} correct
            </p>
            <div className="flex flex-col gap-4">
              {mistakes.length > 0 && (
                <button
                  onClick={() => {
                    // Reset voor mistakes review in leren mode
                    setWords(mistakes)
                    setCurrentIndex(0)
                    setCorrectCount(0)
                    setIncorrectCount(0)
                    setMistakes([])
                    setShowResult(false)
                    setSelectedAnswer(null)
                    setIsCorrect(null)
                    setShowingFeedback(false)
                  }}
                  className="btn-gradient text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Oefen foute antwoorden ({mistakes.length})
                </button>
              )}
              <button
                onClick={() => onEnd({ correct: correctCount, total: words.length })}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-4 rounded-xl font-semibold transition-opacity"
              >
                Terug naar set
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Vraag laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col p-4 md:p-8 relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="w-full mx-auto flex flex-col flex-1 overflow-hidden px-2 md:px-8">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 overflow-hidden">
          {/* Header with back button */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0" style={{animation: 'slideInDown 0.4s ease-out'}}>
          <button
            onClick={() => onExit?.()}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-110"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
            Terug
          </button>
          <button
            onClick={() => setLayoutMode(layoutMode === 'vertical' ? 'grid' : 'vertical')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 flex-shrink-0 ${
              layoutMode === 'vertical' 
                ? 'bg-emerald-400/40 hover:bg-emerald-400/60 text-emerald-100 border-2 border-emerald-300' 
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={layoutMode === 'vertical' ? 'Schakelen naar 2x2 grid' : 'Schakelen naar verticaal'}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar - Compact */}
        <div className="mb-6 flex-shrink-0" style={{animation: 'slideInDown 0.5s ease-out 0.1s both'}}>
          <div className="flex justify-between text-xs md:text-sm text-white/90 mb-2 items-center font-medium">
            <span>Vraag {currentIndex + 1}/{words.length}</span>
            <div className="flex items-center gap-4">
              <span className="text-emerald-100 font-bold">✓ {correctCount}</span>
              <span className="text-red-100 font-bold">✗ {incorrectCount}</span>
              <span className="text-white/75 font-bold">Nog {words.length - currentIndex - 1}</span>
            </div>
          </div>
            <div className="w-full bg-white/20 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              >
                {((currentIndex + 1) / words.length) * 100 > 10 && (
                  <span className="text-white text-xs font-bold">
                    {Math.round(((currentIndex + 1) / words.length) * 100)}%
                  </span>
                )}
              </div>
            </div>
        </div>

        {/* Question - More prominent */}
        <div className="text-center flex-shrink-0 mb-6" style={{animation: 'slideInUp 0.5s ease-out 0.2s both'}}>
          <p className="text-xs md:text-sm text-white/75 mb-3 font-semibold tracking-wide uppercase">Wat is de vertaling van:</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg line-clamp-2 leading-tight">
            {question.word.word1}
          </h2>
        </div>

        {/* Options Container - Better spacing */}
        <div className={`flex-1 flex ${layoutMode === 'vertical' ? 'flex-col gap-4' : 'items-center justify-center'} transition-all duration-500 min-h-0 overflow-hidden`}>
          {layoutMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-[380px] sm:w-fit justify-center">
              {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === question.correctAnswer
            
            let buttonClass = 'w-full aspect-square max-w-[170px] sm:max-w-[200px] md:w-[240px] md:h-[240px] md:aspect-auto rounded-2xl border-2 font-bold text-base md:text-lg text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 px-3 sm:px-4 flex-shrink-0 '
            
            if (!selectedAnswer) {
              buttonClass += 'border-white/40 bg-white/90 text-gray-900 hover:border-emerald-400 hover:bg-white hover:shadow-2xl hover:scale-105 active:scale-95'
            } else if (isSelected && isCorrect) {
              buttonClass += 'border-emerald-500 bg-emerald-100 text-emerald-900 shadow-lg'
            } else if (isSelected && !isCorrect) {
              buttonClass += 'border-red-500 bg-red-100 text-red-900 shadow-lg'
            } else if (isCorrectOption) {
              buttonClass += 'border-emerald-500 bg-emerald-100 text-emerald-900'
            } else {
              buttonClass += 'border-white/20 bg-white/40 text-gray-500 opacity-40'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
                className={buttonClass}
                style={{animation: `scaleIn 0.4s ease-out ${0.3 + (index * 0.1)}s both`}}
              >
                <span className="leading-snug line-clamp-3">{option}</span>
                {selectedAnswer && (
                  <>
                    {isSelected && isCorrect && <Check className="w-5 h-5 text-emerald-600 animate-bounce" />}
                    {isSelected && !isCorrect && <X className="w-5 h-5 text-red-600" />}
                    {!isSelected && isCorrectOption && <Check className="w-5 h-5 text-emerald-600" />}
                  </>
                )}
              </button>
            )
          })}
            </div>
          ) : (
            question.options.map((option, index) => {
              const isSelected = selectedAnswer === option
              const isCorrectOption = option === question.correctAnswer
              
              let buttonClass = `w-full py-5 rounded-2xl border-2 font-bold text-base text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 px-4 flex-shrink-0 `
              
              if (!selectedAnswer) {
                buttonClass += 'border-white/40 bg-white/90 text-gray-900 hover:border-emerald-400 hover:bg-white hover:shadow-2xl hover:scale-105 active:scale-95'
              } else if (isSelected && isCorrect) {
                buttonClass += 'border-emerald-500 bg-emerald-100 text-emerald-900 shadow-lg'
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-100 text-red-900 shadow-lg'
              } else if (isCorrectOption) {
                buttonClass += 'border-emerald-500 bg-emerald-100 text-emerald-900'
              } else {
                buttonClass += 'border-white/20 bg-white/40 text-gray-500 opacity-40'
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!selectedAnswer}
                  className={buttonClass}
                  style={{animation: `scaleIn 0.4s ease-out ${0.3 + (index * 0.1)}s both`}}
                >
                  <span className="leading-snug line-clamp-3">{option}</span>
                  {selectedAnswer && (
                    <>
                      {isSelected && isCorrect && <Check className="w-5 h-5 text-emerald-600 animate-bounce" />}
                      {isSelected && !isCorrect && <X className="w-5 h-5 text-red-600" />}
                      {!isSelected && isCorrectOption && <Check className="w-5 h-5 text-emerald-600" />}
                    </>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Continue button */}
        {selectedAnswer && showingFeedback && (
          <div className="flex justify-center mt-6" style={{animation: 'slideInUp 0.3s ease-out'}}>
            <button
              onClick={handleContinue}
              className="bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white font-semibold py-3 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 text-base border border-white/40"
            >
              Verder
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
