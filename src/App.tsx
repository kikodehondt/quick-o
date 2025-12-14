import { useState, useEffect } from 'react'
import { BookOpen, Plus, PlayCircle, Trophy, Sparkles } from 'lucide-react'
import { supabase, VocabSet } from './lib/supabase'
import CreateSetModal from './components/CreateSetModal'
import StudyMode from './components/StudyMode'
import SetsList from './components/SetsList'

function App() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSet, setSelectedSet] = useState<VocabSet | null>(null)
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

  function handleStartStudy(set: VocabSet) {
    setSelectedSet(set)
    setIsStudying(true)
  }

  function handleEndStudy() {
    setIsStudying(false)
    setSelectedSet(null)
    loadSets()
  }

  if (isStudying && selectedSet) {
    return <StudyMode set={selectedSet} onEnd={handleEndStudy} />
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse-slow" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mx-4">
              Woordjes Trainer
            </h1>
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse-slow" />
          </div>
          <p className="text-xl text-white/90 mb-2">
            Leer woordjes op een leuke en effectieve manier! 🚀
          </p>
          <div className="flex items-center justify-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>{sets.length} Sets</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span>Oefen dagelijks!</span>
            </div>
          </div>
        </div>

        {/* Create Set Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white hover:bg-gray-50 text-purple-600 font-semibold px-8 py-4 rounded-2xl card-shadow hover:scale-105 transition-all duration-200 flex items-center gap-3"
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
            <BookOpen className="w-20 h-20 mx-auto mb-4 text-purple-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nog geen sets aangemaakt
            </h2>
            <p className="text-gray-600 mb-6">
              Klik op "Nieuwe Set Aanmaken" om te beginnen!
            </p>
          </div>
        ) : (
          <SetsList sets={sets} onStartStudy={handleStartStudy} onDelete={loadSets} />
        )}

        {/* Create Set Modal */}
        {showCreateModal && (
          <CreateSetModal
            onClose={() => setShowCreateModal(false)}
            onSetCreated={handleSetCreated}
          />
        )}
      </div>
    </div>
  )
}

export default App
