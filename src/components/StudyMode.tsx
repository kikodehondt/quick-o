import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, TrendingUp, Maximize2, X } from 'lucide-react'
import { VocabSet, VocabPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray } from '../lib/utils'
import { useAuth } from '../lib/authContext'

interface StudyModeProps {
  set: VocabSet
  settings: StudySettings
  onEnd: () => void
}

export default function StudyMode({ set, settings, onEnd }: StudyModeProps) {
  const { user } = useAuth()
  const [queue, setQueue] = useState<VocabPair[]>([])
  const [initialCount, setInitialCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [hasFlipped, setHasFlipped] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  // History for Undo
  const [history, setHistory] = useState<{ word: VocabPair, result: 'correct' | 'incorrect' }[]>([])

  // Modal for long text
  const [showFullText, setShowFullText] = useState<{ text: string, title?: string } | null>(null)

  // Swipe state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [swipingAway, setSwipingAway] = useState(false)

  useEffect(() => {
    loadWords()
  }, [])

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space/Enter and Up/Down flip the card with animation
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault()
        handleCardClick()
        return
      }
      // Arrow keys for swipe (only after flipping)
      if (hasFlipped) {
        // Arrow left for incorrect
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          handleSwipeWithAnimation('left')
          return
        }
        // Arrow right for correct
        if (e.code === 'ArrowRight') {
          e.preventDefault()
          handleSwipeWithAnimation('right')
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [hasFlipped, swipingAway])

  async function loadWords() {
    try {
      // Fetch all words using pagination


      // Fetch words via set_pairs -> vocab_pairs
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

        // Transform nested result to flat list
        const batch = (data || []).map((item: any) => {
          const vp = Array.isArray(item.vocab_pairs) ? item.vocab_pairs[0] : item.vocab_pairs
          if (!vp) return null
          return {
            id: vp.id,
            word_1: vp.word_1,
            word_2: vp.word_2,
            set_id: set.id // Virtual property for compatibility
          }
        }).filter(Boolean) as unknown as VocabPair[]
        // Note: We map word_1/word_2 to word1/word2 for component compatibility if needed, 
        // OR we update the component to use word_1/word_2. 
        // Given the prompt asked for "no errors", the safest path is to update the component to use word_1/word_2
        // BUT updating all usages in the component is risky if I miss one.
        // Let's check the imported type.

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
          word_1: w.word_2,
          word_2: w.word_1,
        }))
        processedWords = [...forwardWords, ...reverseWords]
      } else if (settings.direction === 'reverse') {
        // Reverse all words
        processedWords = processedWords.map(w => ({
          ...w,
          word_1: w.word_2,
          word_2: w.word_1,
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
    setDragStart({ x: clientX, y: clientY })
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!hasFlipped || !dragStart) return
    const deltaX = clientX - dragStart.x
    const deltaY = clientY - dragStart.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!hasFlipped || !dragStart) return
    const threshold = window.innerWidth * 0.35

    if (Math.abs(dragOffset.x) > threshold) {
      // Swipe detected - animate away
      setSwipingAway(true)
      const direction = dragOffset.x < 0 ? -1 : 1

      // Both platforms: keep card off-screen after animation
      setDragOffset({ x: direction * window.innerWidth * 1.5, y: dragOffset.y })

      setTimeout(() => {
        if (dragOffset.x < 0) {
          handleIncorrect()
        } else {
          handleCorrect()
        }
        setSwipingAway(false)
        setDragOffset({ x: 0, y: 0 })
        setDragStart(null)
      }, 300)
    } else {
      // Bounce back
      setDragStart(null)
      setDragOffset({ x: 0, y: 0 })
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

  function handleCorrect() {
    if (queue.length === 0) return
    const current = queue[0]

    // Add to history
    setHistory(prev => [...prev.slice(-9), { // Keep last 10
      word: current,
      result: 'correct'
    }])

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
      setDragOffset({ x: targetX, y: 0 })
    })

    setTimeout(() => {
      if (direction === 'left') {
        handleIncorrect()
      } else {
        handleCorrect()
      }
      setSwipingAway(false)
      setDragOffset({ x: 0, y: 0 })
      setDragStart(null)
    }, 600)
  }

  function handleIncorrect() {
    if (queue.length === 0) return
    const current = queue[0]

    // Add to history
    setHistory(prev => [...prev.slice(-9), { // Keep last 10
      word: current,
      result: 'incorrect'
    }])

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

  function handleUndo() {
    if (history.length === 0) return

    const lastAction = history[history.length - 1]
    const newHistory = history.slice(0, -1)
    setHistory(newHistory)

    // Restore counts
    if (lastAction.result === 'correct') {
      setCorrectCount(prev => Math.max(0, prev - 1))
      setCompletedCount(prev => Math.max(0, prev - 1))
    } else {
      setIncorrectCount(prev => Math.max(0, prev - 1))
      // Incorrect doesn't increment completedCount in this logic (it re-queues), 
      // but we assume it stays in queue. 
      // WAIT: handleIncorrect re-queues the card. handleCorrect removes it.
      // So for 'correct', we need to add it back to front.
      // For 'incorrect', we need to find it in the queue and move it back to front?
      // Actually simplest is just to Put it back at front regardless of where it went?
      // If it was incorrect, it's somewhere in the queue. 
      // If correct, it's gone.
    }

    // We need to restore the card to the FRONT of the queue.
    // If it was incorrect, it is currently somewhere in the queue. We should remove that instance first to avoid duplicates?
    // Yes.

    setQueue(prev => {
      let newQ = [...prev]
      if (lastAction.result === 'incorrect') {
        // Find and remove the specfic instance we added? 
        // It might be hard to identify if there are duplicates. 
        // Ideally we assume it's the one we just added. 
        // LIMITATION: If there are identical words, this might pick wrong one. 
        // But usually we just accept we put it back at front.
        // Let's filter out ONE instance of this word if we can find it?
        // Or simpler: Just put it at front. If user studies it again, fine.
        // ACTUALLY: logic for incorrect was "Reinsert". So it IS in the queue.
        // We should try to remove it from where we put it.
        // Since we don't know where we put it exactly (random), 
        // we'll just filter it out from the list ONCE.
        const idx = newQ.findIndex(w => w.id === lastAction.word.id)
        if (idx !== -1) {
          newQ.splice(idx, 1) // Remove it from future position
        }
      }
      return [lastAction.word, ...newQ]
    })

    setFinished(false) // If we were finished, we are not anymore
    setShowAnswer(false)
    setHasFlipped(false)
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
          .then(() => { })
      }
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
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite' }}>
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
        @keyframes thirdCardAppear {
          0% { opacity: 0; transform: scale(0.85); filter: blur(12px); }
          100% { opacity: 0.3; transform: scale(0.9); filter: blur(8px); }
        }
          @keyframes nextCardAppear {
            0% { opacity: 0.2; transform: scale(0.9); filter: blur(8px); }
            100% { opacity: 0.5; transform: scale(0.95); filter: blur(4px); }
          }
      `}</style>

      {/* Top Header Section */}
      <div className="w-full px-4 pt-4 z-30 relative animate-fade-in">
        <div className="max-w-6xl mx-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <button
                onClick={onEnd}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105 shadow-lg border border-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Stoppen</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg border border-white/10 ${history.length === 0
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/30 text-white hover:scale-105'
                  }`}
                title="Ongedaan maken"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="hidden sm:inline">Vorige</span>
              </button>
            </div>

            <div className="text-white text-lg font-bold bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur shadow-lg">
              {completedCount} / {initialCount}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-2 overflow-hidden shadow-inner">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center p-4">

        {/* Score */}
        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <div
            className="flex items-center gap-2 bg-red-400/30 backdrop-blur text-white px-4 py-2 rounded-xl border border-white/30 animate-slide-in-left hover:bg-red-400/50 transition-all duration-300 hover:scale-110 cursor-pointer select-none"
            style={{ animationDelay: '0s' }}
            role="button"
            tabIndex={0}
            title="Klik om als fout te rekenen (of druk ←)"
            aria-disabled={!hasFlipped || swipingAway}
            onClick={() => { if (hasFlipped && !swipingAway) handleSwipeWithAnimation('left') }}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && hasFlipped && !swipingAway) { e.preventDefault(); handleSwipeWithAnimation('left') } }}
          >
            <XCircle className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-lg">{incorrectCount}</span>
          </div>
          <div
            className="flex items-center gap-2 bg-green-400/30 backdrop-blur text-white px-4 py-2 rounded-xl border border-white/30 animate-slide-in-right hover:bg-green-400/50 transition-all duration-300 hover:scale-110 cursor-pointer select-none"
            style={{ animationDelay: '0.1s' }}
            role="button"
            tabIndex={0}
            title="Klik om als correct te rekenen (of druk →)"
            aria-disabled={!hasFlipped || swipingAway}
            onClick={() => { if (hasFlipped && !swipingAway) handleSwipeWithAnimation('right') }}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && hasFlipped && !swipingAway) { e.preventDefault(); handleSwipeWithAnimation('right') } }}
          >
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
                className={`text-white px-10 py-5 rounded-2xl font-black text-4xl flex items-center gap-4 shadow-2xl border-4 border-white/50 backdrop-blur transition-all duration-200 ${dragOffset.x < 0
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

        {/* ============================================ */}
        {/* MOBILE FLASHCARD STACK - DO NOT MODIFY */}
        {/* ============================================ */}
        <div className="md:hidden flex-1 flex items-center justify-center mb-8 relative">
          {/* Next card (underneath) - Mobile */}
          {queue.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="bg-white rounded-3xl p-8 card-shadow w-full max-w-2xl transition-all duration-1200 ease-out"
                key={`next-mobile-${queue[1]?.id || queue[1]?.word_1}`}
                style={{
                  opacity: swipingAway ? 1 : 0.5,
                  transform: swipingAway ? 'scale(1)' : 'scale(0.95)',
                  filter: swipingAway ? 'blur(0px)' : 'blur(4px)',
                  animation: 'nextCardAppear 1000ms ease-out',
                  overflow: 'hidden',
                  maxHeight: '400px'
                }}
              >
                <div className="text-center" style={{ paddingTop: '8px', paddingBottom: '32px', overflow: 'hidden' }}>
                  <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest transition-opacity duration-1200" style={{ opacity: swipingAway ? 1 : 0, transitionDelay: swipingAway ? '200ms' : '0ms', lineHeight: '1.6', fontSize: 'clamp(0.65rem, 2vw, 0.875rem)' }}>
                    {settings.direction === 'reverse' ? set.language2 : set.language1}
                  </p>
                  <p className={`font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 transition-opacity duration-1200 ${(queue[1]?.word_1 || '').length > 150 ? 'line-clamp-4' : ''
                    }`} style={{ opacity: swipingAway ? 1 : 0, transitionDelay: swipingAway ? '200ms' : '0ms', lineHeight: '1.4', fontSize: (queue[1]?.word_1 || '').length > 150 ? '1rem' : 'clamp(1.25rem, 5vw, 1.875rem)', wordBreak: 'break-word' }}>
                    {queue[1].word_1}
                  </p>
                  <p className="text-gray-400 text-sm transition-opacity duration-1200" style={{ opacity: swipingAway ? 1 : 0, transitionDelay: swipingAway ? '200ms' : '0ms' }}>Klik om het antwoord te zien</p>
                </div>
              </div>
            </div>
          )}

          {/* Removed third card to avoid text overlap */}

          {/* Current card (top) - Mobile */}
          <div
            className={`bg-white rounded-3xl p-8 card-shadow w-full max-w-2xl cursor-pointer relative z-10 ${showAnswer ? 'bg-gradient-to-br from-emerald-50 to-green-50' : ''
              }`}
            key={currentWord?.id ?? `${currentWord?.word_1}-${currentWord?.word_2}-mobile`}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y * 0.1}px) ${isFlipping ? 'rotateX(90deg)' : 'rotateX(0deg)'}`,
              opacity: swipingAway ? 0 : 1,
              transition:
                swipingAway ? 'transform 0.6s ease-out, opacity 0.6s ease-out' :
                  dragStart ? 'none' :
                    isFlipping ? 'transform 0.3s ease-in' :
                      'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out',
              transformStyle: 'preserve-3d',
              overflow: 'hidden',
              maxHeight: '400px'
            }}
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center relative z-10" style={{ paddingTop: '8px', paddingBottom: '32px', overflow: 'hidden' }}>
              <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest" style={{ lineHeight: '1.6', fontSize: 'clamp(0.65rem, 2vw, 0.875rem)' }}>
                {showAnswer ? (settings.direction === 'reverse' ? set.language1 : set.language2) : (settings.direction === 'reverse' ? set.language2 : set.language1)}
              </p>
              <p className={`font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 ${(showAnswer ? currentWord.word_2 : currentWord.word_1).length > 150 ? 'line-clamp-4' : ''
                }`} style={{ lineHeight: '1.4', fontSize: (showAnswer ? currentWord.word_2 : currentWord.word_1).length > 150 ? '1rem' : 'clamp(1.25rem, 5vw, 1.875rem)', wordBreak: 'break-word' }}>
                {showAnswer ? currentWord.word_2 : currentWord.word_1}
              </p>
              <p className="text-gray-400 text-sm">
                {showAnswer ? 'Klik om het origineel te zien' : 'Klik om het antwoord te zien'}
              </p>
              {/* Lees meer button logic */}
              {(() => {
                const text = showAnswer ? (settings.direction === 'reverse' ? set.language1 : set.language2) : (settings.direction === 'reverse' ? set.language2 : set.language1)
                const content = showAnswer ? currentWord.word_2 : currentWord.word_1
                // Only show button if content is long
                if (content.length > 150) {
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFullText({ text: content, title: text })
                      }}
                      className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 mx-auto transition-colors z-50 relative animate-pulse-slow"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Lees meer
                    </button>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* DESKTOP FLASHCARD STACK - MODIFIABLE */}
        {/* ============================================ */}
        <div className="hidden md:flex flex-1 items-center justify-center mb-8 relative">
          {/* Next card (underneath) - Desktop */}
          {queue.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="bg-white rounded-3xl p-12 card-shadow w-full max-w-2xl transition-all duration-1200 ease-out"
                key={`next-desktop-${queue[1]?.id || queue[1]?.word_1}`}
                style={{
                  opacity: swipingAway ? 1 : 0.5,
                  transform: swipingAway ? 'scale(1)' : 'scale(0.95)',
                  filter: swipingAway ? 'blur(0px)' : 'blur(4px)',
                  animation: 'nextCardAppear 1000ms ease-out',
                  overflow: 'hidden',
                  maxHeight: '500px'
                }}
              >
                <div className="text-center" style={{ paddingTop: '8px', paddingBottom: '32px', overflow: 'hidden' }}>
                  <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest transition-opacity duration-1200" style={{ opacity: swipingAway ? 1 : 0, transitionDelay: swipingAway ? '200ms' : '0ms', lineHeight: '1.6', fontSize: 'clamp(0.65rem, 1.5vw, 0.875rem)' }}>
                    {settings.direction === 'reverse' ? set.language2 : set.language1}
                  </p>
                  <p className={`font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 ${(queue[1]?.word_1 || '').length > 150 ? 'line-clamp-4' : ''
                    }`} style={{ lineHeight: '1.4', fontSize: (queue[1]?.word_1 || '').length > 150 ? '1.5rem' : 'clamp(1.875rem, 4vw, 3rem)', wordBreak: 'break-word' }}>
                    {queue[1].word_1}
                  </p>
                  <p className="text-gray-400 text-sm transition-opacity duration-1200" style={{ opacity: swipingAway ? 1 : 0, transitionDelay: swipingAway ? '200ms' : '0ms' }}>Klik om het antwoord te zien</p>
                </div>
              </div>
            </div>
          )}

          {/* Removed third card to avoid text overlap */}

          {/* Current card (top) - Desktop */}
          <div
            className={`bg-white rounded-3xl p-12 card-shadow w-full max-w-2xl cursor-pointer relative z-10 ${showAnswer ? 'bg-gradient-to-br from-emerald-50 to-green-50' : ''
              }`}
            key={currentWord?.id ?? `${currentWord?.word_1}-${currentWord?.word_2}-desktop`}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y * 0.1}px) rotate(${dragOffset.x * 0.03}deg) ${isFlipping ? 'rotateX(90deg)' : ''}`,
              opacity: swipingAway ? 0 : 1,
              transition:
                swipingAway ? 'all 0.6s ease-out' :
                  dragStart ? 'none' :
                    isFlipping ? 'transform 0.3s ease-in' :
                      'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              overflow: 'hidden',
              maxHeight: '500px'
            }}
            onClick={handleCardClick}
          >
            <div className="text-center relative z-10" style={{ paddingTop: '8px', paddingBottom: '32px', overflow: 'hidden' }}>
              <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest" style={{ lineHeight: '1.6', fontSize: 'clamp(0.65rem, 1.5vw, 0.875rem)' }}>
                {showAnswer ? (settings.direction === 'reverse' ? set.language1 : set.language2) : (settings.direction === 'reverse' ? set.language2 : set.language1)}
              </p>
              <p className={`font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 ${(showAnswer ? currentWord.word_2 : currentWord.word_1).length > 150 ? 'line-clamp-4' : ''
                }`} style={{ lineHeight: '1.4', fontSize: (showAnswer ? currentWord.word_2 : currentWord.word_1).length > 150 ? '1.5rem' : 'clamp(1.875rem, 4vw, 3rem)', wordBreak: 'break-word' }}>
                {showAnswer ? currentWord.word_2 : currentWord.word_1}
              </p>
              <p className="text-gray-400 text-sm">
                {showAnswer ? 'Klik om het origineel te zien' : 'Klik om het antwoord te zien'}
              </p>
              {/* Lees meer button logic desktop */}
              {(() => {
                const text = showAnswer ? (settings.direction === 'reverse' ? set.language1 : set.language2) : (settings.direction === 'reverse' ? set.language2 : set.language1)
                const content = showAnswer ? currentWord.word_2 : currentWord.word_1
                if (content.length > 150) {
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFullText({ text: content, title: text })
                      }}
                      className="mt-6 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto transition-colors z-50 relative hover:scale-105 transform"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Lees meer
                    </button>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>

        {/* Removed on-screen desktop arrow buttons per request */}

        {/* Keyboard Hints - hidden on mobile */}
        <div className="hidden md:block text-center text-white/80 text-sm mt-4 h-10 relative overflow-hidden">
          <p
            className="font-semibold absolute inset-0 flex items-center justify-center transition-opacity duration-500"
            style={{ opacity: showAnswer ? 0 : 1 }}
            aria-hidden={showAnswer}
          >
            Druk <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">SPATIE</kbd>, <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">ENTER</kbd>, of <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">↑↓</kbd> om te flippen
          </p>
          <p
            className="font-semibold absolute inset-0 flex items-center justify-center transition-opacity duration-500"
            style={{ opacity: showAnswer ? 1 : 0 }}
            aria-hidden={!showAnswer}
          >
            <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">←</kbd> Fout • <kbd className="bg-white/20 px-3 py-1 rounded-lg font-mono mx-1">→</kbd> Correct
          </p>
        </div>

        {/* Mobile swipe hint */}
        <div className="md:hidden text-center text-white/80 text-xs mt-4 h-10 flex items-center justify-center">
          <p
            className="font-semibold whitespace-nowrap transition-opacity duration-400"
            style={{ opacity: hasFlipped && !swipingAway ? 1 : 0 }}
            aria-hidden={!(hasFlipped && !swipingAway)}
          >
            ← Fout  •  Correct →
          </p>
        </div>
      </div>

      {/* Full Text Modal */}
      {/* Full Text Modal */}
      {showFullText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFullText(null)}>
          <div
            className="rounded-3xl p-1 max-w-2xl w-full max-h-[80vh] relative animate-scale-in"
            onClick={e => e.stopPropagation()}
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            <div className="bg-white rounded-[22px] p-6 md:p-8 h-full flex flex-col relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50 pointer-events-none"></div>

              <div className="flex justify-between items-start mb-6 relative z-10 border-b border-gray-100 pb-4">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  {showFullText.title}
                </h3>
                <button
                  onClick={() => setShowFullText(null)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors -mr-2 -mt-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar relative z-10" style={{ maxHeight: '60vh' }}>
                <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {showFullText.text}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end relative z-10">
                <button
                  onClick={() => setShowFullText(null)}
                  className="btn-gradient text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:opacity-90 transition-opacity"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  )
}
