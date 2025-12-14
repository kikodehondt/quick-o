import { PlayCircle, Trash2, BookOpen } from 'lucide-react'
import { VocabSet, supabase } from '../lib/supabase'

interface SetsListProps {
  sets: VocabSet[]
  onStartStudy: (set: VocabSet) => void
  onDelete: () => void
}

export default function SetsList({ sets, onStartStudy, onDelete }: SetsListProps) {
  async function handleDelete(setId: number) {
    if (!confirm('Weet je zeker dat je deze set wilt verwijderen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vocab_sets')
        .delete()
        .eq('id', setId)

      if (error) throw error
      onDelete()
    } catch (err) {
      console.error('Error deleting set:', err)
      alert('Er is een fout opgetreden bij het verwijderen')
    }
  }

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
                <p className="text-sm text-gray-600 mb-3">{set.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>{set.word_count || 0} woordjes</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onStartStudy(set)}
              className="flex-1 btn-gradient text-white px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Oefenen
            </button>
            <button
              onClick={() => handleDelete(set.id!)}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
