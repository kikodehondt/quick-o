import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BookOpen, Plus, Trophy, Users } from 'lucide-react'
import { supabase, VocabSet, StudySettings } from './lib/supabase'
import { useAuth } from './lib/authContext'
import { Analytics } from '@vercel/analytics/react'
import StudyMode from './components/StudyMode'
import TypingMode from './components/TypingMode'
import LearnMode from './components/LearnMode'
import MultipleChoiceMode from './components/MultipleChoiceMode'
import StudySettingsModal from './components/StudySettingsModal'
import SetsList from './components/SetsList'
import AboutPage from './components/AboutPage'
import CookieConsent from './components/CookieConsent'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'

// Lazy load modals voor minder initial load
const CreateSetModal = lazy(() => import('./components/CreateSetModal'))
const EditSetModal = lazy(() => import('./components/EditSetModal'))
const LoginModal = lazy(() => import('./components/LoginModal'))
const EditProfileModal = lazy(() => import('./components/EditProfileModal'))
const ResetPasswordModal = lazy(() => import('./components/ResetPasswordModal'))

// SEO helper to update document title and meta description
function updatePageMeta(title: string, description: string) {
  document.title = title
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', description)
  }
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) {
    ogTitle.setAttribute('content', title)
  }
  const ogDesc = document.querySelector('meta[property="og:description"]')
  if (ogDesc) {
    ogDesc.setAttribute('content', description)
  }
}

function App() {
  const { user, userFullName, signOut, isPasswordRecovery } = useAuth()
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
  const [currentPage, setCurrentPage] = useState<'home' | 'privacy' | 'terms'>('home')

  const displayName = (userFullName && userFullName.trim()) || user?.email || ''
  const avatarInitial = displayName ? displayName[0].toUpperCase() : 'U'

  useEffect(() => {
    if (isStudying && selectedSet) {
      // Update title when studying a set
      updatePageMeta(
        `${selectedSet.name} - Oefenen met Quick-O`,
        `Oefen met de woordenlijst "${selectedSet.name}" op Quick-O. Verbeter je woordenschat snel en effectief.`
      )
    } else if (selectedSet) {
      // Update title when set is selected but not studying
      updatePageMeta(
        `${selectedSet.name} - Quick-O Woordenlijsten`,
        `Bekijk en oefen met "${selectedSet.name}" op Quick-O, de gratis woordenlijsten trainer.`
      )
    } else {
      // Reset to homepage title
      updatePageMeta(
        'Quick-O - Gratis Woordenlijsten Trainer | Snel Leren',
        'Quick-O is een gratis, gebruiksvriendelijke woordenlijsten trainer. Maak je eigen sets, deel ze, en oefen efficiënt.'
      )
    }
  }, [isStudying, selectedSet])

  useEffect(() => {
    loadSets()
  }, [user])

  // Handle auth callback from email confirmation link
  useEffect(() => {
    const path = window.location.pathname
    
    // Check if this is an auth callback
    if (path.startsWith('/auth/callback')) {
      // Don't immediately clear the URL - let AuthContext handle the tokens first
      // It will clean up the URL after processing
      return
    }
    
    // Handle privacy/terms routing
    if (path === '/privacy' || path.includes('privacy')) {
      setCurrentPage('privacy')
    } else if (path === '/terms' || path.includes('terms')) {
      setCurrentPage('terms')
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
      
      // Load public sets OR sets created by the current user (including private ones)
      let query = supabase
        .from('vocab_sets')
        .select(`
          id,
          name,
          description,
          language1,
          language2,
          created_by,
          link_code,
          tags,
          school,
          direction,
          year,
          creator_name,
          is_anonymous,
          is_public,
          word_pairs(count)
        `)
        .order('created_at', { ascending: false })

      // Filter: show public sets or sets created by the current user
      if (user) {
        query = query.or(`is_public.eq.true,created_by.eq.${user.id}`)
      } else {
        query = query.eq('is_public', true)
      }

      const { data, error } = await query

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

  const handleSetCreated = useCallback(() => {
    setShowCreateModal(false)
    loadSets()
  }, [])

  const handleDeleteSet = useCallback(async (setId: number) => {
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
  }, [])

  const handleStartStudy = useCallback((set: VocabSet) => {
    setSelectedSet(set)
    setShowSettingsModal(true)
  }, [])

  const handleEditSet = useCallback((set: VocabSet) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    setEditingSet(set)
    setShowEditModal(true)
  }, [user])

  const handleSetEdited = useCallback(() => {
    setShowEditModal(false)
    setEditingSet(null)
    loadSets()
  }, [])

  const handleSettingsConfirm = useCallback((settings: StudySettings) => {
    setStudySettings(settings)
    setShowSettingsModal(false)
    setIsStudying(true)
  }, [])

  const handleEndStudy = useCallback(() => {
    setIsStudying(false)
    setSelectedSet(null)
    setStudySettings(null)
    loadSets()
  }, [])

  const handleNavigateToPrivacy = useCallback(() => {
    setCurrentPage('privacy')
    window.history.pushState({}, '', '/privacy')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNavigateToTerms = useCallback(() => {
    setCurrentPage('terms')
    window.history.pushState({}, '', '/terms')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNavigateHome = useCallback(() => {
    setCurrentPage('home')
    window.history.pushState({}, '', '/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Show Privacy Policy page
  if (currentPage === 'privacy') {
    return (
      <>
        <PrivacyPolicy onBack={handleNavigateHome} />
        <Analytics />
      </>
    )
  }

  // Show Terms of Service page
  if (currentPage === 'terms') {
    return (
      <>
        <TermsOfService onBack={handleNavigateHome} />
        <Analytics />
      </>
    )
  }

  if (isStudying && selectedSet && studySettings) {
    if (studySettings.mode === 'learn') {
      return <LearnMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} />
    } else if (studySettings.mode === 'typing') {
      return <TypingMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} />
    } else if (studySettings.mode === 'multiple-choice') {
      return <MultipleChoiceMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} onExit={() => { setIsStudying(false); setSelectedSet(null) }} />
    } else {
      return <StudyMode set={selectedSet} settings={studySettings} onEnd={handleEndStudy} />
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 text-white relative overflow-hidden" style={{background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite'}}>
      <div className="max-w-6xl mx-auto">
        {/* Auth Header Controls (mobile-friendly) */}
        <div className="md:absolute md:top-4 md:right-4 md:z-20 w-full md:w-auto flex flex-col md:block mb-4 md:mb-0 transition-all duration-300">
          <div className="flex w-full md:w-auto justify-end">
            {!user ? (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur w-full md:w-auto"
              >
                Inloggen
              </button>
            ) : (
              <div className="w-full md:w-auto">
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur w-full md:w-auto justify-start"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    {avatarInitial}
                  </div>
                  <span className="max-w-[180px] truncate">{displayName}</span>
                </button>
                {showEditProfile && (
                  <Suspense fallback={null}>
                    <EditProfileModal onClose={() => setShowEditProfile(false)} />
                  </Suspense>
                )}
              </div>
            )}
          </div>
          {/* Profile menu dropdown - takes up space on mobile, absolute on desktop */}
          {showProfileMenu && user && (
            <div 
              className="w-full md:absolute md:right-0 md:top-full mt-2 md:w-64 rounded-2xl shadow-xl border border-white/20 bg-white/10 backdrop-blur text-white overflow-hidden"
              style={{animation: 'slideInDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'}}
            >
              <div className="px-4 py-3 text-sm border-b border-white/10">
                <div className="text-white/80">Ingelogd als</div>
                <div className="font-semibold truncate">{displayName}</div>
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
        </div>
        {isPasswordRecovery && (
          <Suspense fallback={null}>
            <ResetPasswordModal onClose={() => { /* modal closes itself via context clear */ }} />
          </Suspense>
        )}
        {/* Header */}
        <div className="text-center mb-12 animate-fadeInDown transition-all duration-300" style={{animation: 'fadeInDown 0.6s ease-out'}}>
          <div 
            onClick={() => {
              const aboutSection = document.getElementById('about-section')
              if (aboutSection) {
                const elementPosition = aboutSection.getBoundingClientRect().top + window.pageYOffset
                window.scrollTo({
                  top: elementPosition,
                  behavior: 'smooth'
                })
              }
            }}
            className="inline-flex items-center gap-4 px-6 py-4 rounded-3xl bg-white/10 border border-white/10 shadow-xl backdrop-blur hover:bg-white/20 hover:border-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer"
          >
            <img src="/Quick-O_logo.compressed.webp" alt="Quick-O Logo" className="w-16 h-16 md:w-20 md:h-20" loading="lazy" />
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold">Quick-O</h1>
              <p className="text-base md:text-lg text-white/80">Leer sneller, onthoud langer</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 text-white/80 mt-6 w-full">
            {/* Stats row - always inline on mobile */}
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110 flex-1 sm:flex-none justify-center" style={{animation: 'slideInLeft 0.6s ease-out', animationDelay: '0.1s'}} >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{sets.length} Sets</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110 flex-1 sm:flex-none justify-center" style={{animation: 'slideInLeft 0.6s ease-out', animationDelay: '0.2s'}}>
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{onlineCount} online</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110 flex-1 sm:flex-none justify-center" style={{animation: 'slideInLeft 0.6s ease-out', animationDelay: '0.3s'}}>
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base"><span className="sm:hidden">Dagelijks</span><span className="hidden sm:inline">Leer dagelijks!</span></span>
              </div>
            </div>
            {/* Subtiele zoekbalk */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all duration-300 w-full md:w-auto" style={{animation: 'slideInRight 0.6s ease-out', animationDelay: '0.4s'}}>
              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="bg-transparent text-white placeholder:text-white/60 focus:outline-none text-sm w-full md:w-40"
                placeholder="Zoek sets..."
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  className="flex-1 sm:flex-none text-white/80 hover:text-white text-sm hover:scale-110 transition-transform duration-300 px-2 py-1 border border-white/10 rounded-lg"
                  onClick={async ()=>{
                    setLoading(true)
                    let query = supabase.from('vocab_sets').select('*').eq('is_public', true)
                    if (search) {
                      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
                    }
                    const { data, error } = await query
                    if (!error && data) setSets(data as any)
                    setLoading(false)
                  }}
                >Zoek</button>
                <button
                  className="flex-1 sm:flex-none px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-white/80 hover:bg-white/20 text-sm"
                  onClick={()=>setShowFilters((v)=>!v)}
                  title="Geavanceerde filters"
                >Filters</button>
              </div>
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
                    let query = supabase.from('vocab_sets').select('*').eq('is_public', true)
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
            className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl hover:scale-110 transition-all duration-300 flex items-center gap-3 transform group"
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

        {/* Create Set Modal */}
        {showCreateModal && (
          <Suspense fallback={null}>
            <CreateSetModal
              onClose={() => setShowCreateModal(false)}
              onSetCreated={handleSetCreated}
            />
          </Suspense>
        )}

        {/* Edit Set Modal */}
        {showEditModal && editingSet && (
          <Suspense fallback={null}>
            <EditSetModal
              set={editingSet}
              onClose={() => setShowEditModal(false)}
              onSetEdited={handleSetEdited}
            />
          </Suspense>
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
          <Suspense fallback={null}>
            <LoginModal onClose={() => setShowLogin(false)} />
          </Suspense>
        )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <Suspense fallback={null}>
            <EditProfileModal onClose={() => setShowEditProfile(false)} />
          </Suspense>
        )}

        {/* Password Recovery Modal */}
        {isPasswordRecovery && (
          <Suspense fallback={null}>
            <ResetPasswordModal onClose={() => { /* modal closes itself via context clear */ }} />
          </Suspense>
        )}

        {/* About Page - Always visible, scroll to navigate */}
        <AboutPage />

        {/* Footer with Legal Links */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/70 text-sm">
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button
                onClick={handleNavigateToPrivacy}
                className="hover:text-white transition-colors underline"
              >
                Privacybeleid
              </button>
              <button
                onClick={handleNavigateToTerms}
                className="hover:text-white transition-colors underline"
              >
                Algemene Voorwaarden
              </button>
              <a
                href="mailto:contact@quick-o.be"
                className="hover:text-white transition-colors underline"
              >
                Contact
              </a>
            </div>
            <div className="text-center md:text-right">
              © {new Date().getFullYear()} Kiko Dehondt. Alle rechten voorbehouden.
            </div>
          </div>
        </footer>
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent onPrivacyClick={handleNavigateToPrivacy} />
      
      <Analytics />
    </div>
  )
}

export default App
