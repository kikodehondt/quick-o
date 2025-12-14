import { useState } from 'react'
import { X, FileText, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseVocabText } from '../lib/utils'

interface CreateSetModalProps {
  onClose: () => void
  onSetCreated: () => void
}

export default function CreateSetModal({ onClose, onSetCreated }: CreateSetModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [vocabText, setVocabText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Vul een naam in voor de set')
      return
    }

    if (!vocabText.trim()) {
      setError('Plak de woordjes tekst')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Parse the text
      const wordPairs = parseVocabText(vocabText)
      
      if (wordPairs.length === 0) {
        setError('Geen geldige woordparen gevonden. Gebruik het formaat: woord1, woord2; woord3, woord4')
        return
      }

      // Create the set
      const { data: setData, error: createSetError } = await supabase
        .from('vocab_sets')
        .insert([{ name, description }])
        .select()
        .single()

      if (createSetError) throw createSetError

      // Insert word pairs
      const wordsToInsert = wordPairs.map(pair => ({
        set_id: setData.id,
        dutch: pair.dutch,
        french: pair.french
      }))

      const { error: wordsError } = await supabase
        .from('word_pairs')
        .insert(wordsToInsert)

      if (wordsError) throw wordsError

      onSetCreated()
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden')
      console.error('Error creating set:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-8 max-w-2xl w-full card-shadow max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Nieuwe Set Aanmaken</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Naam van de Set *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="Bijv. Frans Hoofdstuk 1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Beschrijving (optioneel)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              placeholder="Bijv. Werkwoorden en bijvoeglijke naamwoorden"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Woordjes Tekst *
            </label>
            <textarea
              value={vocabText}
              onChange={(e) => setVocabText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors font-mono text-sm"
              rows={10}
              placeholder="huis, maison; kat, chat; hond, chien; boek, livre"
            />
            <p className="text-sm text-gray-500 mt-2">
              Formaat: <code className="bg-gray-100 px-2 py-1 rounded">nederlands, frans; nederlands2, frans2</code>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-semibold transition-colors"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Set Opslaan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
