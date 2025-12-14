import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, TrendingUp } from 'lucide-react'
import { VocabSet, WordPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray } from '../lib/utils'

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

  useEffect(() => {
    loadWords()
  }, [])

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
    setCorrectCount(prev => prev + 1)
    nextWord()
  }

  function handleIncorrect() {
    setIncorrectCount(prev => prev + 1)
    // Blijf op dezelfde kaart tot correct
    setShowAnswer(false)
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
    <div className="min-h-screen flex flex-col p-4 md:p-8">
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
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleIncorrect}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-colors flex items-center gap-3 card-shadow"
            >
              <XCircle className="w-6 h-6" />
              Fout
            </button>
            <button
              onClick={handleCorrect}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-colors flex items-center gap-3 card-shadow"
            >
              <CheckCircle className="w-6 h-6" />
              Correct
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
