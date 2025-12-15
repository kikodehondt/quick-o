import { PlayCircle, BookOpen, Trash2, Link as LinkIcon, Check } from 'lucide-react'
import { useState } from 'react'
import { VocabSet } from '../lib/supabase'
import { getOrCreateUserId } from '../lib/userUtils'

interface SetsListProps {
  sets: VocabSet[]
  onStartStudy: (set: VocabSet) => void
  onDeleteSet: (setId: number) => void
}

export default function SetsList({ sets, onStartStudy, onDeleteSet }: SetsListProps) {
  const currentUserId = getOrCreateUserId()
  const [copiedId, setCopiedId] = useState<number | null>(null)

  function handleDelete(set: VocabSet) {
    if (confirm(`Weet je zeker dat je "${set.name}" wilt verwijderen?`)) {
      if (set.id) {
        onDeleteSet(set.id)
      }
    }
  }

  function copyLink(set: VocabSet) {
    if (set.link_code) {
      const url = `${window.location.origin}/s/${set.link_code}`
      navigator.clipboard.writeText(url)
      setCopiedId(set.id || null)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {sets.map((set, idx) => (
        <div
          key={set.id}
          className="bg-white rounded-2xl p-5 md:p-6 card-shadow md:hover:scale-105 transition-all duration-200 group animate-scale-in"
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
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="w-4 h-4 md:w-4 md:h-4" />
                <span>{set.word_count || 0} woordjes</span>
              </div>
              {Array.isArray(set.tags) && set.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
                  {set.tags.slice(0, 4).map((t) => (
                    <span key={t} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] md:text-xs font-medium">{t}</span>
                  ))}
                  {set.tags.length > 4 && (
                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] md:text-xs font-medium">+{set.tags.length - 4}</span>
                  )}
                </div>
              )}
            </div>
            {set.created_by === currentUserId && (
              <button
                onClick={() => handleDelete(set)}
                className="text-red-500 hover:text-red-700 transition-colors p-2 -mr-2 -mt-2 md:block"
                title="Verwijderen"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 md:gap-3 flex-col sm:flex-row">
            <button
              onClick={() => onStartStudy(set)}
              className="w-full sm:flex-1 btn-gradient text-white px-4 py-3 md:py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base md:text-sm"
            >
              <PlayCircle className="w-5 h-5" />
              Oefenen
            </button>
            {set.link_code && (
              <div className="relative">
                <button
                  onClick={() => copyLink(set)}
                  className={`w-full sm:w-auto px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    copiedId === set.id
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
          </div>
        </div>
      ))}
    </div>
  )
}
