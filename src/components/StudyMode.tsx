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
  const [queue, setQueue] = useState<WordPair[]>([])
  const [initialCount, setInitialCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [selected, setSelected] = useState<SelectionState>(null)
  
  // Swipe state
  const [dragStart, setDragStart] = useState<{x: number; y: number} | null>(null)
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})

  useEffect(() => {
    loadWords()
  }, [])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space/Enter and Up/Down flip to answer; second press hides answer (no animation)
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault()
        setShowAnswer(prev => !prev)
        return
      }
      if (showAnswer) {
        // Arrow left for incorrect
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          handleIncorrect()
          return
        }
        // Arrow right for correct
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          handleCorrect()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showAnswer, queue])

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

      setQueue(processedWords)
      setInitialCount(processedWords.length)
    } catch (err) {
      console.error('Error loading words:', err)
    } finally {
      setLoading(false)
    }
  }

  // Touch handlers for swipe (only when answer is shown)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showAnswer) return
    const touch = e.touches[0]
    setDragStart({x: touch.clientX, y: touch.clientY})
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!showAnswer || !dragStart) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragStart.x
    const deltaY = touch.clientY - dragStart.y
    setDragOffset({x: deltaX, y: deltaY})
  }

  const handleTouchEnd = () => {
    if (!showAnswer || !dragStart) return
    const threshold = window.innerWidth * 0.4
    
    if (Math.abs(dragOffset.x) > threshold) {
      // Swipe detected
      if (dragOffset.x < 0) {
        // Swipe left = incorrect
        handleIncorrect()
      } else {
        // Swipe right = correct
        handleCorrect()
      }
    }
    
    // Reset drag state
    setDragStart(null)
    setDragOffset({x: 0, y: 0})
  }

  function handleCorrect() {
    if (queue.length === 0) return
    setSelected('correct')
    setTimeout(() => {
      setCorrectCount(prev => prev + 1)
      setCompletedCount(prev => prev + 1)
      setShowAnswer(false)
      // dequeue current and advance
      setQueue(prev => {
        const newQ = prev.slice(1)
        if (newQ.length === 0) {
          setFinished(true)
          saveProgress()
        }
        return newQ
      })
      setSelected(null)
      setDragOffset({x: 0, y: 0})
      setDragStart(null)
    }, 250)
  }

  function handleIncorrect() {
    if (queue.length === 0) return
    setSelected('incorrect')
    setTimeout(() => {
      setIncorrectCount(prev => prev + 1)
      setShowAnswer(false)
      // Reinsert current card 5-10 positions later (or later, not within first 2 remaining)
      setQueue(prev => {
        const [current, ...rest] = prev
        const remaining = rest.length
        if (remaining === 0) {
          // only this card remains; put it back to end
          return [current]
        }
        let minPos = Math.min(3, remaining) // index position in rest to insert after first 2
        let maxPos = remaining
        // Prefer 5-10 if possible
        if (remaining >= 10) {
          minPos = 5
          maxPos = 10
        } else if (remaining >= 5) {
          minPos = 5
          maxPos = remaining
        }
        // Random int between minPos and maxPos inclusive, then clamp to [minPos, remaining]
        const randBetween = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
        let insertPos = remaining >= 3 ? randBetween(minPos, Math.min(maxPos, remaining)) : remaining
        // Build new queue: take prefix of rest up to insertPos, insert current, then suffix
        const before = rest.slice(0, insertPos)
        const after = rest.slice(insertPos)
        return [...before, current, ...after]
      })
      setSelected(null)
      setDragOffset({x: 0, y: 0})
      setDragStart(null)
    }, 250)
  }

  // nextWord no longer needed; advancing handled in handlers

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
    setCorrectCount(0)
    setIncorrectCount(0)
    setCompletedCount(0)
    setShowAnswer(false)
    setFinished(false)
    loadWords()
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

  if (queue.length === 0 && !finished) {
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

  const currentWord = queue[0]
  const progress = initialCount > 0 ? (completedCount / initialCount) * 100 : 0

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cardFlip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes cardFlipIn {
          0% { transform: rotateX(-90deg); opacity: 0; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        @keyframes cardFlipOut {
          0% { transform: rotateX(0deg); opacity: 1; }
          100% { transform: rotateX(90deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 5px rgba(255,255,255,0.5); }
          50% { text-shadow: 0 0 15px rgba(255,255,255,0.8); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <button
            onClick={onEnd}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug
          </button>
          <div className="text-white text-lg font-semibold">
            {completedCount} / {initialCount}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-8 overflow-hidden animate-slide-in-down">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Score */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-2 bg-green-400/30 backdrop-blur text-white px-4 py-2 rounded-xl border border-white/30 animate-slide-in-left hover:bg-green-400/50 transition-all duration-300 hover:scale-110" style={{animationDelay: '0s'}}>
            <CheckCircle className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-lg">{correctCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-red-400/30 backdrop-blur text-white px-4 py-2 rounded-xl border border-white/30 animate-slide-in-right hover:bg-red-400/50 transition-all duration-300 hover:scale-110" style={{animationDelay: '0.1s'}}>
            <XCircle className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-lg">{incorrectCount}</span>
          </div>
        </div>

        {/* Flashcard with swipe gestures */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div
            className={`bg-white rounded-3xl p-8 md:p-12 card-shadow w-full max-w-2xl cursor-pointer relative ${
              showAnswer ? 'bg-gradient-to-br from-emerald-50 to-green-50' : ''
            }`}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
              opacity: 1 - Math.abs(dragOffset.x) / (window.innerWidth * 0.7),
              transition: dragStart ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
            }}
            onClick={() => setShowAnswer(prev => !prev)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe indicators */}
            {dragOffset.x !== 0 && (
              <>
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: dragOffset.x < 0 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0
                  }}
                >
                  <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-2xl flex items-center gap-2 shadow-2xl rotate-12">
                    <XCircle className="w-8 h-8" />
                    FOUT
                  </div>
                </div>
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: dragOffset.x > 0 ? Math.min(dragOffset.x / 150, 1) : 0
                  }}
                >
                  <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-2xl flex items-center gap-2 shadow-2xl -rotate-12">
                    <CheckCircle className="w-8 h-8" />
                    CORRECT
                  </div>
                </div>
              </>
            )}
            
            <div className="text-center relative z-10">
              <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest">
                {showAnswer ? (settings.direction === 'reverse' ? set.language1 : set.language2) : (settings.direction === 'reverse' ? set.language2 : set.language1)}
              </p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                {showAnswer ? currentWord.word2 : currentWord.word1}
              </p>
              {!showAnswer && (
                <p className="text-gray-400 text-sm">Klik om het antwoord te zien</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - hidden on mobile, shown on desktop */}
        {showAnswer && (
          <div className="hidden md:flex gap-3 justify-center flex-col sm:flex-row animate-slide-in-up">
            <button
              onClick={handleIncorrect}
              disabled={selected !== null}
              className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 card-shadow transition-all duration-300 transform relative group ${
                selected === 'incorrect'
                  ? 'scale-95 opacity-75 bg-gradient-to-r from-red-600 to-red-700 ring-4 ring-red-400'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-110 hover:shadow-2xl'
              } text-white disabled:cursor-not-allowed`}
            >
              <XCircle className="w-6 h-6 group-hover:animate-spin-slow" />
              Fout
            </button>
            <button
              onClick={handleCorrect}
              disabled={selected !== null}
              className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 card-shadow transition-all duration-300 transform relative group ${
                selected === 'correct'
                  ? 'scale-95 opacity-75 bg-gradient-to-r from-green-600 to-green-700 ring-4 ring-green-400'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-110 hover:shadow-2xl'
              } text-white disabled:cursor-not-allowed`}
            >
              <CheckCircle className="w-6 h-6 group-hover:animate-spin-slow" />
              Correct
            </button>
          </div>
        )}

        {/* Keyboard Hints - hidden on mobile */}
        {!showAnswer && (
          <div className="hidden md:block text-center text-white/80 text-sm mt-4 animate-bounce" style={{animationDelay: '0.3s'}}>
            <p className="font-semibold">Druk <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">SPATIE</kbd>, <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">ENTER</kbd>, of <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">↑↓</kbd> om te flippen</p>
          </div>
        )}
        {showAnswer && (
          <div className="hidden md:block text-center text-white/80 text-sm mt-4 animate-bounce" style={{animationDelay: '0.3s'}}>
            <p className="font-semibold"><kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">←</kbd> Fout • <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">→</kbd> Correct</p>
          </div>
        )}
        
        {/* Mobile swipe hint */}
        {showAnswer && (
          <div className="md:hidden text-center text-white/80 text-sm mt-4 animate-bounce" style={{animationDelay: '0.3s'}}>
            <p className="font-semibold">← Swipe links voor fout • Swipe rechts voor correct →</p>
          </div>
        )}
      </div>
    </div>
  )
}
