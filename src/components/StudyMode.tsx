import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, TrendingUp } from 'lucide-react'
import { VocabSet, WordPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray } from '../lib/utils'
import { getOrCreateUserId } from '../lib/userUtils'

type SelectionState = null | 'correct' | 'incorrect'

interface StudyModeProps {
  set: VocabSet
  settings: StudySettings
  onEnd: () => void
}

export default function StudyMode({ set, settings, onEnd }: StudyModeProps) {
  const [words, setWords] = useState<WordPair[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [selected, setSelected] = useState<SelectionState>(null)

  useEffect(() => {
    loadWords()
  }, [])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!showAnswer) {
        // Space or Enter to flip card
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          setShowAnswer(true)
        }
        // Arrow up/down also flips
        if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
          e.preventDefault()
          setShowAnswer(true)
        }
      } else {
        // Arrow left for incorrect
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          setSelected('incorrect')
          setTimeout(() => {
            setIncorrectCount(prev => prev + 1)
            setShowAnswer(false)
            setSelected(null)
          }, 400)
        }
        // Arrow right for correct
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          setSelected('correct')
          setTimeout(() => {
            setCorrectCount(prev => prev + 1)
            nextWord()
            setSelected(null)
          }, 400)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showAnswer, currentIndex, words.length])

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

  function handleCorrect() {
    setSelected('correct')
    setTimeout(() => {
      setCorrectCount(prev => prev + 1)
      nextWord()
      setSelected(null)
    }, 400)
  }

  function handleIncorrect() {
    setSelected('incorrect')
    setTimeout(() => {
      setIncorrectCount(prev => prev + 1)
      // Blijf op dezelfde kaart tot correct
      setShowAnswer(false)
      setSelected(null)
    }, 400)
  }

  function nextWord() {
    setShowAnswer(false)
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
        mode: 'study',
        correctCount,
        incorrectCount,
        timestamp: Date.now(),
      }
      localStorage.setItem('progress_study_' + set.id, JSON.stringify(payload))
      
      // Device-specific cloud sync
      const userId = getOrCreateUserId()
      supabase
        .from('study_progress')
        .upsert({
          set_id: set.id!,
          user_id: userId,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          last_studied: new Date().toISOString()
        }, {
          onConflict: 'set_id,user_id'
        })
        .then(() => {}) // fire and forget
    } catch (err) {
      console.error('Error saving local progress:', err)
    }
  }

  function restart() {
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setShowAnswer(false)
    setFinished(false)
    if (settings.shuffle) {
      setWords(shuffleArray(words))
    }
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
    const percentage = Math.round((correctCount / total) * 100)

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

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)', backgroundSize: '400% 400%', animation: 'gradient 15s ease infinite'}}>
      <style>{`
        @keyframes gradient {
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

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div
            className={`bg-white rounded-3xl p-12 card-shadow w-full max-w-2xl cursor-pointer hover:scale-105 transition-all duration-300 ${
              showAnswer ? 'bg-gradient-to-br from-green-50 to-emerald-50' : ''
            }`}
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
                {showAnswer ? (settings.direction === 'reverse' ? set.language1 : set.language2) : (settings.direction === 'reverse' ? set.language2 : set.language1)}
              </p>
              <p className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                {showAnswer ? currentWord.word2 : currentWord.word1}
              </p>
              {!showAnswer && (
                <p className="text-gray-400 text-sm">Klik om het antwoord te zien</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showAnswer && (
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <button
              onClick={handleIncorrect}
              disabled={selected !== null}
              className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 card-shadow transition-all duration-300 transform ${
                selected === 'incorrect'
                  ? 'scale-95 opacity-75 bg-gradient-to-r from-red-600 to-red-700 ring-4 ring-red-400'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-110 hover:shadow-2xl'
              } text-white disabled:cursor-not-allowed`}
            >
              <XCircle className="w-6 h-6" />
              Fout
            </button>
            <button
              onClick={handleCorrect}
              disabled={selected !== null}
              className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 card-shadow transition-all duration-300 transform ${
                selected === 'correct'
                  ? 'scale-95 opacity-75 bg-gradient-to-r from-green-600 to-green-700 ring-4 ring-green-400'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-110 hover:shadow-2xl'
              } text-white disabled:cursor-not-allowed`}
            >
              <CheckCircle className="w-6 h-6" />
              Correct
            </button>
          </div>
        )}

        {/* Keyboard Hints */}
        {!showAnswer && (
          <div className="text-center text-white/70 text-sm mt-4 animate-pulse">
            <p>Druk <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono">SPATIE</kbd>, <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono">ENTER</kbd>, of <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono">↑↓</kbd> om te flippen</p>
          </div>
        )}
        {showAnswer && (
          <div className="text-center text-white/70 text-sm mt-4 animate-pulse">
            <p><kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono">←</kbd> Fout • <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono">→</kbd> Correct</p>
          </div>
        )}
      </div>
    </div>
  )
}
