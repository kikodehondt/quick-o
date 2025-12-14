import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trophy, Code2 } from 'lucide-react'
import { supabase, VocabSet, StudySettings } from './lib/supabase'
import CreateSetModal from './components/CreateSetModal'
import StudyMode from './components/StudyMode'
import TypingMode from './components/TypingMode'
import LearnMode from './components/LearnMode'
import StudySettingsModal from './components/StudySettingsModal'
import SetsList from './components/SetsList'

function App() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedSet, setSelectedSet] = useState<VocabSet | null>(null)
  const [studySettings, setStudySettings] = useState<StudySettings | null>(null)
  const [isStudying, setIsStudying] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSets()
  }, [])

  async function loadSets() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vocab_sets')
        .select(`
          *,
          word_pairs(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const setsWithCount = data?.map(set => ({
        ...set,
        word_count: set.word_pairs?.[0]?.count || 0
      })) || []

      setSets(setsWithCount)
    } catch (error) {
      console.error('Error loading sets:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSetCreated() {
    setShowCreateModal(false)
    loadSets()
  }

  async function handleDeleteSet(setId: number) {
    try {
      // Delete word pairs first (foreign key constraint)
      const { error: wordsError } = await supabase
        .from('word_pairs')
        .delete()
        .eq('set_id', setId)

      if (wordsError) throw wordsError

      // Delete study progress
      const { error: progressError } = await supabase
        .from('study_progress')
        .delete()
        .eq('set_id', setId)

      if (progressError) throw progressError

      // Delete the set itself
      const { error: setError } = await supabase
        .from('vocab_sets')
        .delete()
        .eq('id', setId)

      if (setError) throw setError

      // Reload sets
      loadSets()
    } catch (error) {
      console.error('Error deleting set:', error)
      alert('Fout bij het verwijderen van de set')
    }
  }

  function handleStartStudy(set: VocabSet) {
    setSelectedSet(set)
    setShowSettingsModal(true)
  }

  function handleSettingsConfirm(settings: StudySettings) {
    setStudySettings(settings)
    setShowSettingsModal(false)
    setIsStudying(true)
  }

  function handleEndStudy() {
    setIsStudying(false)
    setSelectedSet(null)
    setStudySettings(null)
    loadSets()
  }

  if (isStudying && selectedSet && studySettings) {
    if (studySettings.mode === 'learn') {
      return <LearnMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} />
    } else if (studySettings.mode === 'typing') {
      return <TypingMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} />
    } else {
      return <StudyMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} />
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-950 via-green-900 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/10 border border-white/10 shadow-xl backdrop-blur">
            <img src="/logo.png" alt="Woordjes Trainer Logo" className="w-16 h-16 md:w-20 md:h-20" />
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold">Woordjes Trainer</h1>
              <p className="text-base md:text-lg text-white/80">Motiverend oefenen op je eigen tempo</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-white/80 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
              <BookOpen className="w-5 h-5" />
              <span>{sets.length} Sets</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
              <Trophy className="w-5 h-5" />
              <span>Oefen dagelijks!</span>
            </div>
          </div>
        </div>

        {/* Create Set Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-4 rounded-2xl card-shadow hover:scale-105 transition-all duration-200 flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            <span className="text-lg">Nieuwe Set Aanmaken</span>
          </button>
        </div>

        {/* Sets List */}
        {loading ? (
          <div className="text-center text-white text-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            Laden...
          </div>
        ) : sets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 card-shadow text-center">
            <BookOpen className="w-20 h-20 mx-auto mb-4 text-green-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nog geen sets aangemaakt
            </h2>
            <p className="text-gray-600 mb-6">
              Klik op "Nieuwe Set Aanmaken" om te beginnen!
            </p>
          </div>
        ) : (
          <SetsList sets={sets} onStartStudy={handleStartStudy} onDeleteSet={handleDeleteSet} />
        )}

        {/* Developer Credit */}
        <div className="mt-12 text-center">
          <a
            href="https://www.kikodehondt.be"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 backdrop-blur"
          >
            <Code2 className="w-5 h-5" />
            <span className="text-sm font-medium">Gemaakt door Kiko Dehondt</span>
          </a>
        </div>

        {/* Create Set Modal */}
        {showCreateModal && (
          <CreateSetModal
            onClose={() => setShowCreateModal(false)}
            onSetCreated={handleSetCreated}
          />
        )}

        {/* Study Settings Modal */}
        {showSettingsModal && selectedSet && (
          <StudySettingsModal
            set={selectedSet}
            onClose={() => {
              setShowSettingsModal(false)
              setSelectedSet(null)
            }}
            onStart={handleSettingsConfirm}
          />
        )}
      </div>
    </div>
  )
}

export default App
