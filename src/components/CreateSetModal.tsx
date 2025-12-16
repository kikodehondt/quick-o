import { useState } from 'react'
import { X, FileText, Save, ClipboardCopy } from 'lucide-react'
import { supabase, generateLinkCode } from '../lib/supabase'
import { parseVocabText } from '../lib/utils'
import { getOrCreateUserId } from '../lib/userUtils'

interface CreateSetModalProps {
  onClose: () => void
  onSetCreated: () => void
}

export default function CreateSetModal({ onClose, onSetCreated }: CreateSetModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language1, setLanguage1] = useState('Nederlands')
  const [language2, setLanguage2] = useState('Frans')
  const [vocabText, setVocabText] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [school, setSchool] = useState('')
  const [direction, setDirection] = useState('')
  const [year, setYear] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  const promptText = `Je bent een helper die een woordenlijst omzet naar het exacte formaat van deze vocab trainer.\n\nInstructies:\n1) Lees de brontekst en identificeer woordparen in twee talen: ${language1} en ${language2}.\n2) Output ALLEEN een enkele regel tekst zonder extra uitleg.\n3) Gebruik exact dit formaat: ${language1}woord, ${language2}vertaling; ${language1}woord2, ${language2}vertaling2; ...\n4) Scheid paren met een puntkomma plus spatie ('; ').\n5) Gebruik geen quotes, geen bullet points, geen nummers, geen extra tekst.\n6) Laat niets weg en verzin geen woorden.\n7) Bewaar casing en accenten zoals in de input.\n8) Als er bij een woord meerdere vertalingen zijn, kies de meest gebruikelijke en geef slechts één vertaling.\n9) Als een woordpaar ontbreekt of onduidelijk is, sla het over en noem het niet.\n10) Als er al puntkomma's of komma's staan, herstructureer naar het exacte formaat hierboven.\n\nVoorbeeld output (fictief):\n${language1} huis, ${language2} maison; ${language1} auto, ${language2} voiture; ${language1} eten, ${language2} manger` 

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

      // Prepare metadata
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Genereer unieke link_code met retry bij toevallige collision
      let link_code = generateLinkCode(10)
      for (let i = 0; i < 5; i++) {
        const { data: exists } = await supabase
          .from('vocab_sets')
          .select('id')
          .eq('link_code', link_code)
        if (!exists || exists.length === 0) break
        link_code = generateLinkCode(10)
      }

      // Create the set
      const { data: setData, error: createSetError } = await supabase
        .from('vocab_sets')
        .insert([{ 
          name,
          description,
          language1,
          language2,
          created_by: getOrCreateUserId(),
          link_code,
          tags,
          school,
          direction,
          year,
          author_name: isAnonymous ? null : authorName || null,
          is_anonymous: isAnonymous
        }])
        .select()
        .single()

      if (createSetError) throw createSetError

      // Insert word pairs
      const wordsToInsert = wordPairs.map(pair => ({
        set_id: setData.id,
        word1: pair.word1,
        word2: pair.word2
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
              placeholder="Korte omschrijving"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                  placeholder="Bijv. KU Leuven"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Richting</label>
                <input
                  type="text"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                  placeholder="Bijv. Toegepaste Informatica"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jaar</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (komma-gescheiden)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                  placeholder="Bijv. Frans, hoofdstuk 1, examen"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Naam (optioneel)</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                  placeholder="Je naam voor credits"
                  disabled={isAnonymous}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Anoniem publiceren</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Eerste Taal *
              </label>
              <input
                type="text"
                value={language1}
                onChange={(e) => setLanguage1(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                placeholder="Bijv. Nederlands"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tweede Taal *
              </label>
              <input
                type="text"
                value={language2}
                onChange={(e) => setLanguage2(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all"
                placeholder="Bijv. Frans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <label className="block text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 inline mr-2" />
                Woordjes Tekst *
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(promptText)
                    setCopyMessage('Prompt gekopieerd naar klembord')
                    setTimeout(() => setCopyMessage(''), 2500)
                  } catch (err) {
                    console.error('Clipboard error', err)
                    setCopyMessage('Kopiëren mislukt, selecteer en kopieer handmatig')
                    setTimeout(() => setCopyMessage(''), 4000)
                  }
                }}
                className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 hover:shadow text-sm font-semibold text-gray-700 transition-colors flex items-center gap-2"
                title="Kopieer instructie-prompt voor AI"
              >
                <ClipboardCopy className="w-4 h-4" />
                Prompt kopiëren
              </button>
            </div>
            <textarea
              value={vocabText}
              onChange={(e) => setVocabText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all font-mono text-sm"
              rows={10}
              placeholder={`${language1}, ${language2}; ${language1}2, ${language2}2`}
            />
            <p className="text-sm text-gray-500 mt-2">
              Formaat: <code className="bg-gray-100 px-2 py-1 rounded">{language1}, {language2}; {language1}2, {language2}2</code>
            </p>
            {copyMessage && (
              <p className="text-sm text-green-600 mt-2">{copyMessage}</p>
            )}
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
