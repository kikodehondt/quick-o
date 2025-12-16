import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, TrendingUp } from 'lucide-react'
import { VocabSet, WordPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray } from '../lib/utils'
import { getOrCreateUserId } from '../lib/userUtils'

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
  const [isFlipping, setIsFlipping] = useState(false)
  const [hasFlipped, setHasFlipped] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  
  // Swipe state
  const [dragStart, setDragStart] = useState<{x: number; y: number} | null>(null)
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})
  const [swipingAway, setSwipingAway] = useState(false)

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

  // Handle card flip
  const handleCardClick = () => {
    if (swipingAway) return
    setIsFlipping(true)
    if (!hasFlipped) setHasFlipped(true)
    setTimeout(() => {
      setShowAnswer(prev => !prev)
      setIsFlipping(false)
    }, 150)
  }

  // Touch/Mouse handlers for swipe (only after first flip)
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!hasFlipped) return
    setDragStart({x: clientX, y: clientY})
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!hasFlipped || !dragStart) return
    const deltaX = clientX - dragStart.x
    const deltaY = clientY - dragStart.y
    setDragOffset({x: deltaX, y: deltaY})
  }

  const handleDragEnd = () => {
    if (!hasFlipped || !dragStart) return
    const threshold = window.innerWidth * 0.35
    
    if (Math.abs(dragOffset.x) > threshold) {
      // Swipe detected - animate away
      setSwipingAway(true)
      const direction = dragOffset.x < 0 ? -1 : 1
      
      // Both platforms: keep card off-screen after animation
      setDragOffset({x: direction * window.innerWidth * 1.5, y: dragOffset.y})
      
      setTimeout(() => {
        if (dragOffset.x < 0) {
          handleIncorrect()
        } else {
          handleCorrect()
        }
        setSwipingAway(false)
        setDragOffset({x: 0, y: 0})
        setDragStart(null)
      }, 300)
    } else {
      // Bounce back
      setDragStart(null)
      setDragOffset({x: 0, y: 0})
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart) return
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Desktop only uses arrow buttons, not mouse drag
    if (window.innerWidth >= 768) return
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Desktop only uses arrow buttons, not mouse drag
    if (window.innerWidth >= 768) return
    if (!dragStart) return
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    // Desktop only uses arrow buttons, not mouse drag
    if (window.innerWidth >= 768) return
    handleDragEnd()
  }

  function handleCorrect() {
    if (queue.length === 0) return
    setCorrectCount(prev => prev + 1)
    setCompletedCount(prev => prev + 1)
    setShowAnswer(false)
    setHasFlipped(false)
    // dequeue current and advance
    setQueue(prev => {
      const newQ = prev.slice(1)
      if (newQ.length === 0) {
        setFinished(true)
        saveProgress()
      }
      return newQ
    })
  }

  // Programmatic swipe with animation
  const handleSwipeWithAnimation = (direction: 'left' | 'right') => {
    if (!hasFlipped || swipingAway) return
    setSwipingAway(true)
    const targetX = direction === 'left' ? -window.innerWidth * 1.5 : window.innerWidth * 1.5
    
    // Animate card away smoothly
    requestAnimationFrame(() => {
      setDragOffset({x: targetX, y: 0})
    })
    
    setTimeout(() => {
      if (direction === 'left') {
        handleIncorrect()
      } else {
        handleCorrect()
      }
      setSwipingAway(false)
      setDragOffset({x: 0, y: 0})
      setDragStart(null)
    }, 300)
  }

  function handleIncorrect() {
    if (queue.length === 0) return
    setIncorrectCount(prev => prev + 1)
    setShowAnswer(false)
    setHasFlipped(false)
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
          <div className="flex items-center gap-2 bg-red-400/30 backdrop-blur text-white px-4 py-2 rounded-xl border border-white/30 animate-slide-in-left hover:bg-red-400/50 transition-all duration-300 hover:scale-110" style={{animationDelay: '0s'}}>
            <XCircle className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-lg">{incorrectCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-green-400/30 backdrop-blur text-white px-4 py-2 rounded-xl border border-white/30 animate-slide-in-right hover:bg-green-400/50 transition-all duration-300 hover:scale-110" style={{animationDelay: '0.1s'}}>
            <CheckCircle className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-lg">{correctCount}</span>
          </div>
        </div>

        {/* Swipe status indicator - above cards */}
        {dragOffset.x !== 0 && hasFlipped && !swipingAway && (
          <div className="flex justify-center mb-4 animate-slide-in-down h-24">
            <div 
              className="transition-all duration-200"
              style={{
                opacity: Math.min(Math.abs(dragOffset.x) / 80, 1),
                transform: `scale(${Math.min(Math.abs(dragOffset.x) / 100, 1.2)})`
              }}
            >
              <div 
                className={`text-white px-10 py-5 rounded-2xl font-black text-4xl flex items-center gap-4 shadow-2xl border-4 border-white/50 backdrop-blur transition-all duration-200 ${
                  dragOffset.x < 0 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
              >
                {dragOffset.x < 0 ? (
                  <>
                    <XCircle className="w-12 h-12" strokeWidth={3} />
                    <span>FOUT</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12" strokeWidth={3} />
                    <span>CORRECT</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Flashcard stack with swipe gestures */}
        <div className="flex-1 flex items-center justify-center mb-8 relative">
          {/* Next card (underneath) - Unified animated card stack */}
          {queue.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="bg-white rounded-3xl p-8 md:p-12 card-shadow w-full max-w-2xl transition-all duration-300"
                style={{
                  opacity: swipingAway ? 1 : 0.5,
                  transform: swipingAway ? 'scale(1)' : 'scale(0.95)',
                  filter: swipingAway ? 'blur(0px)' : 'blur(4px)'
                }}
              >
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest">
                    {settings.direction === 'reverse' ? set.language2 : set.language1}
                  </p>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                    {queue[1].word1}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Current card (top) */}
          <div
            className={`bg-white rounded-3xl p-8 md:p-12 card-shadow w-full max-w-2xl cursor-pointer relative z-10 ${
              showAnswer ? 'bg-gradient-to-br from-emerald-50 to-green-50' : ''
            }`}
            style={{
              transform: (() => {
                // Always include flip animation for consistency
                const flip = isFlipping ? 'rotateX(90deg)' : 'rotateX(0deg)'
                
                // Desktop: include rotation during drag
                if (window.innerWidth >= 768) {
                  return `translate(${dragOffset.x}px, ${dragOffset.y * 0.1}px) rotate(${dragOffset.x * 0.03}deg) ${flip}`
                }
                
                // Mobile: just translate, no rotation
                return `translate(${dragOffset.x}px, ${dragOffset.y * 0.1}px) ${flip}`
              })(),
              opacity: swipingAway ? 0 : 1,
              transition: 
                swipingAway ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 
                dragStart ? 'none' : 
                isFlipping ? 'transform 0.15s ease-in' : 
                'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out',
              transformStyle: 'preserve-3d'
            }}
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
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

        {/* Arrow buttons - desktop only */}
        {hasFlipped && (
          <div className="hidden md:flex gap-8 justify-center items-center animate-slide-in-up">
            <button
              onClick={() => handleSwipeWithAnimation('left')}
              disabled={swipingAway}
              className="group relative bg-white/20 hover:bg-red-500/30 backdrop-blur text-white p-6 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30 hover:border-red-400"
              title="Fout (← arrow key)"
            >
              <svg className="w-10 h-10 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleSwipeWithAnimation('right')}
              disabled={swipingAway}
              className="group relative bg-white/20 hover:bg-green-500/30 backdrop-blur text-white p-6 rounded-full transition-all duration-300 hover:scale-125 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30 hover:border-green-400"
              title="Correct (→ arrow key)"
            >
              <svg className="w-10 h-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Keyboard Hints - hidden on mobile */}
        <div className="hidden md:block text-center text-white/80 text-sm mt-4 h-10">
          {!showAnswer && (
            <p className="font-semibold animate-bounce" style={{animationDelay: '0.3s'}}>
              Druk <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">SPATIE</kbd>, <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">ENTER</kbd>, of <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">↑↓</kbd> om te flippen
            </p>
          )}
          {showAnswer && (
            <p className="font-semibold animate-bounce" style={{animationDelay: '0.3s'}}>
              <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">←</kbd> Fout • <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">→</kbd> Correct
            </p>
          )}
        </div>
        
        {/* Mobile swipe hint */}
        <div className="md:hidden text-center text-white/80 text-xs mt-4 h-10 flex items-center justify-center">
          {hasFlipped && !swipingAway && (
            <p className="font-semibold animate-bounce whitespace-nowrap" style={{animationDelay: '0.3s'}}>
              ← Fout  •  Correct →
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
