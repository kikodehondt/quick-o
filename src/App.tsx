import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trophy, Code2, Users } from 'lucide-react'
import { supabase, VocabSet, StudySettings } from './lib/supabase'
import { useAuth } from './lib/authContext'
import CreateSetModal from './components/CreateSetModal'
import EditSetModal from './components/EditSetModal'
import StudyMode from './components/StudyMode'
import TypingMode from './components/TypingMode'
import LearnMode from './components/LearnMode'
import StudySettingsModal from './components/StudySettingsModal'
import SetsList from './components/SetsList'
import LoginModal from './components/LoginModal'
import EditProfileModal from './components/EditProfileModal'

function App() {
  const { user, signOut } = useAuth()
  const [sets, setSets] = useState<VocabSet[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showEditProfile, setShowEditProfile] = useState(false)
  const [editingSet, setEditingSet] = useState<VocabSet | null>(null)
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

  // Handle auth callback from email confirmation link
  useEffect(() => {
    const path = window.location.pathname
    
    // Check if this is an auth callback
    if (path.startsWith('/auth/callback')) {
      // Supabase handles the token exchange automatically via onAuthStateChange in AuthContext
      // Just clean up the URL and redirect to home
      window.history.replaceState({}, '', '/')
      return
    }
  }, [])

  // Open via share link /s/<code>
  useEffect(() => {
    const path = window.location.pathname
    const m = path.match(/^\/s\/([a-zA-Z0-9]+)$/)
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
          // Open the settings modal so the user can choose mode/direction
          setShowSettingsModal(true)
        }
      })()
    }
  }, [])

  // Presence: track how many users have the app open
  useEffect(() => {
    const presenceKey = user?.id || 'guest'
    const channel = supabase.channel('quick-o-presence', {
      config: {
        presence: {
          key: presenceKey,
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
  }, [user])

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
    // Studying is allowed without login; only create/edit require auth
    setSelectedSet(set)
    setShowSettingsModal(true)
  }

  function handleEditSet(set: VocabSet) {
    if (!user) {
      setShowLogin(true)
      return
    }
    setEditingSet(set)
    setShowEditModal(true)
  }

  function handleSetEdited() {
    setShowEditModal(false)
    setEditingSet(null)
    loadSets()
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
    <div className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Auth Header Controls */}
        <div className="absolute top-4 right-4 z-20">
          {!user ? (
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur"
            >
              Inloggen
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {(user.email || 'U')[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block max-w-[180px] truncate">{user.email}</span>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border border-white/20 bg-white/10 backdrop-blur text-white overflow-hidden">
                  <div className="px-4 py-3 text-sm border-b border-white/10">
                    <div className="text-white/80">Ingelogd als</div>
                    <div className="font-semibold truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowEditProfile(true) }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/20 transition-colors"
                  >
                    Account bewerken
                  </button>
                  <button
                    onClick={async () => { setShowProfileMenu(false); await signOut(); }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-white/20 transition-colors"
                  >
                    Uitloggen
                  </button>
                </div>
              )}
                    {showEditProfile && (
                      <EditProfileModal onClose={() => setShowEditProfile(false)} />
                    )}
            </div>
          )}
        </div>
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInDown" style={{animation: 'fadeInDown 0.6s ease-out'}}>
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/10 border border-white/10 shadow-xl backdrop-blur hover:bg-white/20 hover:border-white/20 transition-all duration-300 transform hover:scale-105">
            <img src="/Quick-O_logo.png" alt="Quick-O Logo" className="w-16 h-16 md:w-20 md:h-20" />
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold">Quick-O</h1>
              <p className="text-base md:text-lg text-white/80">Leer sneller, onthoud langer</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-white/80 mt-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110" style={{animation: 'slideInLeft 0.6s ease-out', animationDelay: '0.1s'}} >
              <BookOpen className="w-5 h-5" />
              <span>{sets.length} Sets</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110" style={{animation: 'slideInLeft 0.6s ease-out', animationDelay: '0.2s'}}>
              <Users className="w-5 h-5" />
              <span>{onlineCount} online</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110" style={{animation: 'slideInLeft 0.6s ease-out', animationDelay: '0.3s'}}>
              <Trophy className="w-5 h-5" />
              <span>Oefen dagelijks!</span>
            </div>
            {/* Subtiele zoekbalk */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 w-full md:w-auto" style={{animation: 'slideInRight 0.6s ease-out', animationDelay: '0.4s'}}>
              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="bg-transparent text-white placeholder:text-white/60 focus:outline-none text-sm w-full md:w-40"
                placeholder="Zoek sets..."
              />
              <button
                className="text-white/80 hover:text-white text-sm hover:scale-110 transition-transform duration-300 px-2 py-1"
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
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 card-shadow mb-8 text-white" style={{animation: 'slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'}}>
            <h3 className="text-xl font-bold mb-3">Geavanceerde filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input value={filterSchool} onChange={(e)=>setFilterSchool(e.target.value)} className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 transition-all outline-none hover:bg-white/20" placeholder="School" />
              <input value={filterDirection} onChange={(e)=>setFilterDirection(e.target.value)} className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 transition-all outline-none hover:bg-white/20" placeholder="Richting" />
              <input value={filterYear} onChange={(e)=>setFilterYear(e.target.value)} className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 transition-all outline-none hover:bg-white/20" placeholder="Jaar" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={filterTags} onChange={(e)=>setFilterTags(e.target.value)} className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur text-white placeholder-white/50 focus:border-white/40 focus:bg-white/20 transition-all outline-none hover:bg-white/20" placeholder="Tags (komma-gescheiden)" />
              <div className="col-span-2 flex items-center gap-3">
                <button
                  className="px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 hover:scale-110 transition-all duration-300 transform"
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
                  className="px-4 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all"
                  onClick={()=>{
                    setFilterSchool(''); setFilterDirection(''); setFilterYear(''); setFilterTags('')
                  }}
                >Wis filters</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Set Button */}
        <div className="flex justify-center mb-8" style={{animation: 'slideInUp 0.6s ease-out'}}>
          <button
            onClick={() => {
              if (!user) { setShowLogin(true); return }
              setShowCreateModal(true)
            }}
            className="bg-white hover:bg-gray-50 text-green-600 font-semibold px-8 py-4 rounded-2xl card-shadow hover:scale-110 transition-all duration-300 flex items-center gap-3 transform group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
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
          <SetsList sets={sets} onStartStudy={handleStartStudy} onDeleteSet={handleDeleteSet} onEditSet={handleEditSet} />
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

        {/* Edit Set Modal */}
        {showEditModal && editingSet && (
          <EditSetModal
            set={editingSet}
            onClose={() => setShowEditModal(false)}
            onSetEdited={handleSetEdited}
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

        {/* Login Modal for unauthenticated users */}
        {!user && showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} />
        )}
      </div>
    </div>
  )
}

export default App
