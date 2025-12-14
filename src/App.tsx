import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trophy, Code2, Users } from 'lucide-react'
import { supabase, VocabSet, StudySettings } from './lib/supabase'
import { getOrCreateUserId } from './lib/userUtils'
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
    const [onlineCount, setOnlineCount] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterDirection, setFilterDirection] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterTags, setFilterTags] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadSets()
  }, [])

  // Open via share link /s/<code>
  useEffect(() => {
    const path = window.location.pathname
    const m = path.match(/^\/s\/(\w{10})$/)
    if (m) {
      const code = m[1]
      ;(async () => {
        const { data, error } = await supabase
          .from('vocab_sets')
          .select('*')
          .eq('link_code', code)
          .single()
        if (!error && data) {
          setSelectedSet(data as any)
          setStudySettings({ mode: 'study', direction: 'forward', shuffle: true } as any)
          setIsStudying(true)
        }
      })()
    }
  }, [])

  // Presence: track how many users have the app open
  useEffect(() => {
    const userId = getOrCreateUserId()
    const channel = supabase.channel('quick-o-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      // presenceState is a record of keys -> array of metas
      const total = Object.values(state).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
      setOnlineCount(total || 1)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() })
      }
    })

    return () => {
      channel.unsubscribe()
    }
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
            <img src="/Quick-O_logo.png" alt="Quick-O Logo" className="w-16 h-16 md:w-20 md:h-20" />
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold">Quick-O</h1>
              <p className="text-base md:text-lg text-white/80">Motiverend oefenen op je eigen tempo</p>
              <p className="text-base md:text-lg text-white/80">Leer sneller, onthoud langer</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-white/80 mt-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
              <BookOpen className="w-5 h-5" />
              <span>{sets.length} Sets</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
              <Users className="w-5 h-5" />
              <span>{onlineCount} online</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
              <Trophy className="w-5 h-5" />
              <span>Oefen dagelijks!</span>
            </div>
            {/* Subtiele zoekbalk */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10">
              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="bg-transparent text-white placeholder:text-white/60 focus:outline-none text-sm w-40"
                placeholder="Zoek sets..."
              />
              <button
                className="text-white/80 hover:text-white text-sm"
                onClick={async ()=>{
                  setLoading(true)
                  let query = supabase.from('vocab_sets').select('*')
                  if (search) {
                    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
                  }
                  const { data, error } = await query
                  if (!error && data) setSets(data as any)
                  setLoading(false)
                }}
              >Zoek</button>
              <button
                className="ml-2 px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 hover:bg-white/20 text-sm"
                onClick={()=>setShowFilters((v)=>!v)}
                title="Geavanceerde filters"
              >Filters</button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        {showFilters && (
          <div className="bg-white rounded-3xl p-6 card-shadow mb-8">
            <h3 className="text-xl font-bold mb-3">Geavanceerde filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input value={filterSchool} onChange={(e)=>setFilterSchool(e.target.value)} className="px-4 py-3 rounded-xl border-2" placeholder="School" />
              <input value={filterDirection} onChange={(e)=>setFilterDirection(e.target.value)} className="px-4 py-3 rounded-xl border-2" placeholder="Richting" />
              <input value={filterYear} onChange={(e)=>setFilterYear(e.target.value)} className="px-4 py-3 rounded-xl border-2" placeholder="Jaar" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={filterTags} onChange={(e)=>setFilterTags(e.target.value)} className="px-4 py-3 rounded-xl border-2" placeholder="Tags (komma-gescheiden)" />
              <div className="col-span-2 flex items-center gap-3">
                <button
                  className="px-4 py-3 rounded-xl bg-green-600 text-white font-semibold"
                  onClick={async ()=>{
                    setLoading(true)
                    const tagArray = filterTags.split(',').map(t=>t.trim()).filter(Boolean)
                    let query = supabase.from('vocab_sets').select('*')
                    if (search) {
                      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
                    }
                    if (filterSchool) query = query.ilike('school', `%${filterSchool}%`)
                    if (filterDirection) query = query.ilike('direction', `%${filterDirection}%`)
                    if (filterYear) query = query.ilike('year', `%${filterYear}%`)
                    if (tagArray.length) query = query.contains('tags', tagArray)
                    const { data, error } = await query
                    if (!error && data) setSets(data as any)
                    setLoading(false)
                    setShowFilters(false)
                  }}
                >Zoek</button>
                <button
                  className="px-4 py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold border border-gray-300"
                  onClick={()=>{
                    setFilterSchool(''); setFilterDirection(''); setFilterYear(''); setFilterTags('')
                  }}
                >Wis filters</button>
              </div>
            </div>
          </div>
        )}

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
