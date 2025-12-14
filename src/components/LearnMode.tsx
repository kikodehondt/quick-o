import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Star, AlertCircle, Target } from 'lucide-react'
import { VocabSet, WordPair, supabase, StudySettings } from '../lib/supabase'
import { shuffleArray, checkAnswer, calculateSimilarity } from '../lib/utils'
import SessionSettings from './SessionSettings'

interface LearnModeProps {
  set: VocabSet
  settings: StudySettings
  onEnd: () => void
}

interface LearnProgressState {
  mode: 'learn'
  activeWords: WordPair[]
  masteredWords: WordPair[]
  currentIndex: number
  correctCount: number
  incorrectCount: number
  settings: StudySettings
  timestamp: number
}

const LOCAL_KEY_PREFIX = 'progress_learn_'

export default function LearnMode({ set, settings: initialSettings, onEnd }: LearnModeProps) {
  const [settings, setSettings] = useState<StudySettings>(initialSettings)
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
  const [initialized, setInitialized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initSession()
  }, [])

  useEffect(() => {
    if (!showFeedback && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, showFeedback])

  // Rebuild words when direction or shuffle changes
  useEffect(() => {
    if (initialized) {
      rebuildWithSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.direction, settings.shuffle])

  useEffect(() => {
    if (!loading && initialized) {
      saveProgressLocal()
      saveProgressCloud()
    }
  }, [currentIndex, correctCount, incorrectCount, masteredWords, activeWords])

  async function initSession() {
    setLoading(true)
    const words = await fetchWordsWithSettings(settings)
    const restored = await restoreProgress()
    applyProgress(restored || { activeWords: words, masteredWords: [], currentIndex: 0, correctCount: 0, incorrectCount: 0, settings, timestamp: Date.now(), mode: 'learn' })
    setInitialized(true)
    setLoading(false)
  }

  async function rebuildWithSettings() {
    setLoading(true)
    const words = await fetchWordsWithSettings(settings)
    applyProgress({ activeWords: words, masteredWords: [], currentIndex: 0, correctCount: 0, incorrectCount: 0, settings, timestamp: Date.now(), mode: 'learn' })
    setFinished(false)
    setLoading(false)
  }

  async function fetchWordsWithSettings(currentSettings: StudySettings) {
    try {
      const { data, error } = await supabase
        .from('word_pairs')
        .select('*')
        .eq('set_id', set.id!)

      if (error) throw error

      let processed = data || []

      if (currentSettings.direction === 'both') {
        const forward = processed
        const reverse = processed.map(w => ({ ...w, word1: w.word2, word2: w.word1 }))
        processed = [...forward, ...reverse]
      } else if (currentSettings.direction === 'reverse') {
        processed = processed.map(w => ({ ...w, word1: w.word2, word2: w.word1 }))
      }

      const shuffled = currentSettings.shuffle ? shuffleArray(processed) : processed
      setAllWords(shuffled)
      setActiveWords(shuffled)
      return shuffled
    } catch (err) {
      console.error('Error loading words:', err)
      return []
    }
  }

  function applyProgress(state: LearnProgressState) {
    setActiveWords(state.activeWords)
    setMasteredWords(state.masteredWords)
    setCurrentIndex(Math.min(state.currentIndex, Math.max(state.activeWords.length - 1, 0)))
    setCorrectCount(state.correctCount)
    setIncorrectCount(state.incorrectCount)
    setUserAnswer('')
    setShowFeedback(false)
    setShowHint(false)
    setFinished(false)
  }

  async function restoreProgress() {
    const local = loadProgressLocal()
    const cloud = await loadProgressCloud()

    const latest = [local, cloud]
      .filter(Boolean)
      .sort((a, b) => (b!.timestamp || 0) - (a!.timestamp || 0))[0] as LearnProgressState | undefined

    if (latest && latest.activeWords && latest.activeWords.length > 0) {
      return latest
    }

    return null
  }

  function loadProgressLocal(): LearnProgressState | null {
    const raw = localStorage.getItem(LOCAL_KEY_PREFIX + set.id)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (parsed.mode === 'learn') return parsed as LearnProgressState
    } catch (err) {
      console.error('Error parsing local progress', err)
    }
    return null
  }

  async function loadProgressCloud(): Promise<LearnProgressState | null> {
    try {
      const { data, error } = await supabase
        .from('study_progress')
        .select('progress_state, correct_count, incorrect_count')
        .eq('set_id', set.id!)
        .maybeSingle()

      if (error) throw error
      const state = data?.progress_state
      if (state && state.mode === 'learn') {
        return {
          ...(state as LearnProgressState),
          correctCount: data?.correct_count ?? state.correctCount ?? 0,
          incorrectCount: data?.incorrect_count ?? state.incorrectCount ?? 0,
        }
      }
    } catch (err) {
      console.error('Error loading cloud progress:', err)
    }
    return null
  }

  function saveProgressLocal() {
    const payload: LearnProgressState = {
      mode: 'learn',
      activeWords,
      masteredWords,
      currentIndex,
      correctCount,
      incorrectCount,
      settings,
      timestamp: Date.now(),
    }
    localStorage.setItem(LOCAL_KEY_PREFIX + set.id, JSON.stringify(payload))
  }

  async function saveProgressCloud() {
    try {
      const payload: LearnProgressState = {
        mode: 'learn',
        activeWords,
        masteredWords,
        currentIndex,
        correctCount,
        incorrectCount,
        settings,
        timestamp: Date.now(),
      }

      const { error } = await supabase
        .from('study_progress')
        .upsert({
          set_id: set.id!,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          last_studied: new Date().toISOString(),
          progress_state: payload,
        }, {
          onConflict: 'set_id'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }

  async function clearCloudProgress() {
    try {
      const { error } = await supabase
        .from('study_progress')
        .upsert({
          set_id: set.id!,
          correct_count: 0,
          incorrect_count: 0,
          last_studied: new Date().toISOString(),
          progress_state: null,
        }, {
          onConflict: 'set_id'
        })
      if (error) throw error
    } catch (err) {
      console.error('Error clearing cloud progress:', err)
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
      const newMastered = [...masteredWords, currentWord]
      const newActive = activeWords.filter((_, idx) => idx !== currentIndex)

      setMasteredWords(newMastered)
      setActiveWords(newActive)

      if (newActive.length === 0) {
        setFinished(true)
        clearProgress()
        return
      }

      if (currentIndex >= newActive.length) {
        setCurrentIndex(0)
      }
    } else {
      const wordToReinsert = activeWords[currentIndex]
      const remainingWords = activeWords.filter((_, idx) => idx !== currentIndex)

      const minPosition = Math.min(2, remainingWords.length)
      const maxPosition = remainingWords.length
      const randomPosition = minPosition + Math.floor(Math.random() * (maxPosition - minPosition + 1))

      const newActive = [
        ...remainingWords.slice(0, randomPosition),
        wordToReinsert,
        ...remainingWords.slice(randomPosition)
      ]

      setActiveWords(newActive)

      if (currentIndex >= newActive.length) {
        setCurrentIndex(0)
      }
    }

    setShowFeedback(false)
    setUserAnswer('')
    setShowHint(false)
  }

  function clearProgress() {
    localStorage.removeItem(LOCAL_KEY_PREFIX + set.id)
    clearCloudProgress()
  }

  function restart() {
    const reshuffled = settings.shuffle ? shuffleArray(allWords) : allWords
    setActiveWords(reshuffled)
    setMasteredWords([])
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setUserAnswer('')
    setShowFeedback(false)
    setShowHint(false)
    setFinished(false)
    clearProgress()
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
          <SessionSettings
            settings={settings}
            onUpdate={setSettings}
            mode="learn"
            onResetProgress={restart}
          />
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
                    className="w-full px-6 py-4 text-2xl text-center rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all mb-4"
                    placeholder="Type je antwoord..."
                    autoComplete="off"
                    autoFocus
                  />

                  {/* Similarity Bar */}
                  {userAnswer && similarity > 0 && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 transition-all duration-300 ${
                            similarity >= 80 ? 'bg-green-500' :
                            similarity >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${similarity}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{similarity}% correct</p>
                    </div>
                  )}

                  {/* Hint */}
                  {showHint && (
                    <div className="mb-4 bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">💡 Hint:</p>
                      <p className="text-xl font-semibold text-blue-600">{getHint()}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={!userAnswer.trim()}
                      className="flex-1 btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Controleer
                    </button>
                    {!showHint && (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="bg-blue-100 text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2"
                      >
                        <AlertCircle className="w-5 h-5" />
                        Hint
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Feedback */}
              {showFeedback && (
                <div className={`rounded-2xl p-8 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-center mb-4">
                    {isCorrect ? (
                      <CheckCircle className="w-16 h-16 text-green-500" />
                    ) : (
                      <XCircle className="w-16 h-16 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Correct!' : 'Helaas, niet correct'}
                  </p>
                  {!isCorrect && (
                    <div className="mb-6">
                      <p className="text-gray-600 mb-2">Het juiste antwoord is:</p>
                      <p className="text-3xl font-bold text-gray-800">{currentWord.word2}</p>
                      <p className="text-gray-600 mt-2">Jouw antwoord was:</p>
                      <p className="text-xl text-gray-600">{userAnswer}</p>
                    </div>
                  )}
                  <button
                    onClick={nextWord}
                    className="btn-gradient text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    {activeWords.length === 1 && isCorrect ? 'Afronden' : 'Volgende'}
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
