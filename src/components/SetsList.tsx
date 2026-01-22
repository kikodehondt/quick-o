import { PlayCircle, BookOpen, Trash2, Link as LinkIcon, Check, Edit, BarChart2, X } from 'lucide-react'
import { useState, memo, lazy, Suspense } from 'react'
import { VocabSet } from '../lib/supabase'
import { useAuth } from '../lib/authContext'

const SetAnalytics = lazy(() => import('./SetAnalytics'))

interface SetsListProps {
  sets: VocabSet[]
  onStartStudy: (set: VocabSet) => void
  onDeleteSet: (setId: number) => void
  onEditSet?: (set: VocabSet) => void
}

export default memo(function SetsList({ sets, onStartStudy, onDeleteSet, onEditSet }: SetsListProps) {
  const { user } = useAuth()
  const currentUserId = user?.id
  const [expandedSets, setExpandedSets] = useState<number[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [statsSet, setStatsSet] = useState<VocabSet | null>(null)

  function toggleTags(setId: number) {
    setExpandedSets(prev =>
      prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    )
  }

  function handleDelete(set: VocabSet) {
    if (confirm(`Weet je zeker dat je "${set.name}" wilt verwijderen?`)) {
      if (set.id) {
        onDeleteSet(set.id)
      }
    }
  }

  function copyLink(set: VocabSet) {
    if (set.link_code && set.name) {
      const slug = set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const url = `${window.location.origin}/set/${set.link_code}/${slug}`
      navigator.clipboard.writeText(url)
      setCopiedId(set.id || null)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sets.map((set, idx) => {
          const isExpanded = set.id ? expandedSets.includes(set.id) : false
          const tagsToShow = isExpanded ? set.tags : set.tags?.slice(0, 4)
          const hasMoreTags = (set.tags?.length || 0) > 4

          return (
            <div
              key={set.id}
              className="bg-white rounded-2xl p-5 md:p-6 card-shadow transition-transform duration-300 ease-out group animate-scale-in hover:scale-[1.06] hover:shadow-2xl"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1.5 md:mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                    {set.name}
                  </h3>
                  {set.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{set.description}</p>
                  )}
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500 mb-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">
                      {set.language1} → {set.language2}
                    </span>
                  </div>
                  {(set.school || set.direction || set.year || set.course || set.semester) && (
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                      {set.school && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          🏫 {set.school}
                        </span>
                      )}
                      {set.direction && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">
                          📚 {set.direction}
                        </span>
                      )}
                      {set.year && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">
                          📅 {set.year}
                        </span>
                      )}
                      {set.course && (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium">
                          📘 {set.course}
                        </span>
                      )}
                      {set.semester && (
                        <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-lg font-medium">
                          ⏱️ {set.semester}
                        </span>
                      )}
                    </div>
                  )}
                  {set.creator_name && !set.is_anonymous && (
                    <p className="text-xs text-gray-500 mb-2">
                      👤 Door: {set.creator_name}
                    </p>
                  )}
                  {set.is_anonymous && (
                    <p className="text-xs text-gray-400 mb-2">
                      🔒 Anoniem
                    </p>
                  )}
                  {set.is_public === false && (
                    <p className="text-xs text-amber-600 mb-2 font-medium">
                      🔐 Privé (alleen via link)
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 transition-colors group-hover:text-gray-700">
                    <BookOpen className="w-4 h-4 md:w-4 md:h-4" />
                    <span>{set.word_count || 0} woordjes</span>
                  </div>
                  {Array.isArray(set.tags) && set.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
                      {tagsToShow?.map((t) => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] md:text-xs font-medium transition-transform duration-200 group-hover:scale-105">{t}</span>
                      ))}
                      {!isExpanded && hasMoreTags && set.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (set.id) toggleTags(set.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-[11px] md:text-xs font-medium hover:bg-gray-300 transition-colors cursor-pointer"
                        >
                          +{set.tags.length - 4}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {set.created_by === currentUserId && (
                  <div className="flex gap-1">
                    {onEditSet && (
                      <button
                        onClick={() => onEditSet(set)}
                        className="text-blue-500 hover:text-blue-700 transition-transform p-2 -mr-2 -mt-2 hover:scale-110"
                        title="Bewerken"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(set)}
                      className="text-red-500 hover:text-red-700 transition-transform p-2 -mr-2 -mt-2 hover:scale-110"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 md:gap-3 flex-col sm:flex-row">
                <button
                  onClick={() => onStartStudy(set)}
                  className="w-full sm:flex-1 btn-gradient text-white px-4 py-3 md:py-3 rounded-xl font-semibold hover:opacity-90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-base md:text-sm"
                >
                  <PlayCircle className="w-5 h-5" />
                  Oefenen
                </button>
                {set.link_code && (
                  <div className="relative">
                    <button
                      onClick={() => copyLink(set)}
                      className={`w-full sm:w-auto px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${copiedId === set.id
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      title="Kopieer deellink"
                    >
                      {copiedId === set.id ? (
                        <>
                          <Check className="w-5 h-5" />
                        </>
                      ) : (
                        <LinkIcon className="w-5 h-5" />
                      )}
                    </button>
                    {copiedId === set.id && (
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-green-700 text-white text-sm rounded-lg whitespace-nowrap animate-fade-in">
                        Link gekopieerd!
                      </div>
                    )}
                  </div>
                )}
                {user && (
                  <button
                    onClick={() => setStatsSet(set)}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl border bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold hover:from-purple-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    title="Statistieken bekijken"
                  >
                    <BarChart2 className="w-5 h-5" />
                    <span className="sm:hidden">Stats</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div >

      {/* Stats Modal */}
      {statsSet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setStatsSet(null)}>
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center rounded-t-3xl z-10">
              <h2 className="text-xl font-bold text-gray-800">📊 Statistieken: {statsSet.name}</h2>
              <button
                onClick={() => setStatsSet(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                </div>
              }>
                <SetAnalytics setId={statsSet.id!} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </>
  )
})
