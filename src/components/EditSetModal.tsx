import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { supabase, VocabSet } from '../lib/supabase'
import ToggleSwitch from './ToggleSwitch'
import Combobox from './Combobox'
import MultiSelect from './MultiSelect'

interface EditSetModalProps {
  set: VocabSet
  onClose: () => void
  onSetEdited: () => void
}

export default function EditSetModal({ set, onClose, onSetEdited }: EditSetModalProps) {
  const [name, setName] = useState(set.name || '')
  const [description, setDescription] = useState(set.description || '')

  const [school, setSchool] = useState(set.school || '')
  const [direction, setDirection] = useState(set.direction || '')
  const [year, setYear] = useState(set.year || '')
  const [isAnonymous, setIsAnonymous] = useState(set.is_anonymous || false)
  const [isPublic, setIsPublic] = useState(set.is_public ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [existingSchools, setExistingSchools] = useState<string[]>([])
  const [existingDirections, setExistingDirections] = useState<string[]>([])
  const [existingTags, setExistingTags] = useState<string[]>([])
  // Use array state for tags instead of string input
  const [tags, setTags] = useState<string[]>([])

  // Fetch metadata on mount
  useEffect(() => {
    supabase.rpc('get_unique_metadata').then(({ data, error }) => {
      if (!error && data) {
        setExistingSchools((data as any).schools || [])
        setExistingDirections((data as any).directions || [])
        setExistingTags((data as any).tags || [])
      }
    })
  }, [])

  useEffect(() => {
    // Initialize tags input from array
    if (Array.isArray(set.tags)) {
      setTags(set.tags)
    }
  }, [set])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Vul een naam in voor de set')
      return
    }

    if (!school.trim() || !direction.trim() || !year) {
      setError('Vul alle verplichte velden in (School, Richting, Jaar)')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Prepare metadata


      // Update the set
      const { error: updateError } = await supabase
        .from('vocab_sets')
        .update({
          name,
          description,
          tags,
          school,
          direction,
          year,
          is_anonymous: isAnonymous,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', set.id)

      if (updateError) throw updateError

      onSetEdited()
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden')
      console.error('Error updating set:', err)
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
          <h2 className="text-3xl font-bold gradient-text">Set Bewerken</h2>
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
              placeholder="Korte omschrijving"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Combobox
              label="School *"
              value={school}
              onChange={setSchool}
              options={existingSchools}
              placeholder="Bijv. KU Leuven"
            />
            <Combobox
              label="Richting *"
              value={direction}
              onChange={setDirection}
              options={existingDirections}
              placeholder="Bijv. Toegepaste Informatica"
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jaar *</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
              >
                <option value="">Selecteer een jaar</option>
                <option value="Eerste Middelbaar">Eerste Middelbaar</option>
                <option value="Tweede Middelbaar">Tweede Middelbaar</option>
                <option value="Derde Middelbaar">Derde Middelbaar</option>
                <option value="Vierde Middelbaar">Vierde Middelbaar</option>
                <option value="Vijfde Middelbaar">Vijfde Middelbaar</option>
                <option value="Zesde Middelbaar">Zesde Middelbaar</option>
                <option value="Eerste Bachelor">Eerste Bachelor</option>
                <option value="Tweede Bachelor">Tweede Bachelor</option>
                <option value="Derde Bachelor">Derde Bachelor</option>
                <option value="Master">Master</option>
              </select>
            </div>
            <MultiSelect
              label="Tags"
              value={tags}
              onChange={setTags}
              options={existingTags}
              placeholder="Bijv. Frans, hoofdstuk 1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Publicatie-instellingen</label>
            <div className="space-y-3 px-4 py-4 rounded-xl border-2 border-blue-200 bg-blue-50">
              <ToggleSwitch
                id="public-toggle"
                checked={isPublic}
                onChange={setIsPublic}
                label="Openbaar"
                description={isPublic
                  ? '🌍 Set verschijnt in openbare lijst'
                  : '🔒 Alleen toegankelijk via link'
                }
              />

              <div className="border-t border-blue-200 pt-3">
                <ToggleSwitch
                  id="anonymous-toggle"
                  checked={isAnonymous}
                  onChange={setIsAnonymous}
                  label="Anoniem publiceren"
                  description={isAnonymous
                    ? '🔒 Je naam wordt verborgen'
                    : `✏️ Gepubliceerd als: ${set.creator_name || 'Onbekend'}`
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm">
            <strong>Let op:</strong> Je kunt hier alleen de metadata bewerken. Om woordjes toe te voegen of te wijzigen, moet je een nieuwe set aanmaken.
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
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-100 font-semibold text-gray-700 transition-colors"
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
                  Wijzigingen Opslaan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
