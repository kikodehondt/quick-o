import { PlayCircle, BookOpen } from 'lucide-react'
import { VocabSet } from '../lib/supabase'

interface SetsListProps {
  sets: VocabSet[]
  onStartStudy: (set: VocabSet) => void
}

export default function SetsList({ sets, onStartStudy }: SetsListProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sets.map((set) => (
        <div
          key={set.id}
          className="bg-white rounded-2xl p-6 card-shadow hover:scale-105 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                {set.name}
              </h3>
              {set.description && (
                <p className="text-sm text-gray-600 mb-2">{set.description}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">
                  {set.language1} → {set.language2}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>{set.word_count || 0} woordjes</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartStudy(set)}
            className="w-full btn-gradient text-white px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Oefenen
          </button>
        </div>
      ))}
    </div>
  )
}
