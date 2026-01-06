import { useState, useEffect } from 'react'
import { X, Keyboard, CreditCard, ArrowRight, ArrowLeftRight, Settings, GraduationCap, Shuffle, CheckSquare, RotateCcw, ListChecks, Plus, Trash2 } from 'lucide-react'
import { VocabSet, StudyMode, StudyDirection, StudySettings, WordPair, supabase } from '../lib/supabase'

interface StudySettingsModalProps {
  set: VocabSet
  onClose: () => void
  onStart: (settings: StudySettings) => void
}

interface RangeItem {
  id: string
  start: number | ''
  end: number | ''
}

export default function StudySettingsModal({ set, onClose, onStart }: StudySettingsModalProps) {
  // Disable body scroll wanneer modal open is
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])
  const [mode, setMode] = useState<StudyMode>('learn')
  const [direction, setDirection] = useState<StudyDirection>('forward')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [accentSensitive, setAccentSensitive] = useState(false)
  const [shuffle, setShuffle] = useState(true)
  const [retryMistakes, setRetryMistakes] = useState(true)

  // Woord-selectie state
  const [words, setWords] = useState<WordPair[]>([])
  const [wordsLoading, setWordsLoading] = useState(true)
  const [selectionMode, setSelectionMode] = useState<'all' | 'range' | 'custom'>('all')
  const [ranges, setRanges] = useState<RangeItem[]>([{ id: '0', start: 1, end: 1 }])
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([])

  const allSelected = words.length > 0 && selectedWordIds.length === words.length
  const noneSelected = selectedWordIds.length === 0

  // Haal woorden op zodat we range of handmatige selectie kunnen tonen
  useEffect(() => {
    let isMounted = true
    async function fetchWords() {
      try {
        // Fetch all words using pagination to bypass 1000 row limit
        let allWords: WordPair[] = []
        let from = 0
        const pageSize = 1000
        
        while (true) {
          const { data, error } = await supabase
            .from('word_pairs')
            .select('id, word1, word2, set_id', { count: 'exact' })
            .eq('set_id', set.id!)
            .order('created_at', { ascending: true })
            .range(from, from + pageSize - 1)

          if (!isMounted) return
          if (error) throw error
          
          const batch = (data || []) as WordPair[]
          allWords = [...allWords, ...batch]
          
          // If we got less than pageSize, we've reached the end
          if (batch.length < pageSize) break
          
          from += pageSize
        }
        
        setWords(allWords)
        if (allWords.length > 0) {
          setRanges([{ id: '0', start: 1, end: allWords.length }])
        }
      } catch (err) {
        console.error('Error fetching words for selection', err)
      } finally {
        if (isMounted) setWordsLoading(false)
      }
    }

    fetchWords()
    return () => {
      isMounted = false
    }
  }, [set.id])

  function buildSelectedIds(): number[] | undefined {
    if (selectionMode === 'range') {
      if (!words.length) return undefined
      const selectedSet = new Set<number>()
      for (const range of ranges) {
        const total = words.length
        const start = Math.max(1, typeof range.start === 'number' ? range.start : 1)
        const endInput = typeof range.end === 'number' ? range.end : total
        const end = Math.max(start, Math.min(total, endInput))
        const rangeIds = words.slice(start - 1, end).map(w => w.id!).filter(Boolean)
        rangeIds.forEach(id => selectedSet.add(id))
      }
      return selectedSet.size > 0 ? Array.from(selectedSet) : undefined
    }
    if (selectionMode === 'custom') {
      return selectedWordIds.length > 0 ? selectedWordIds : undefined
    }
    return undefined
  }

  function addRange() {
    const newId = String(Math.max(0, ...ranges.map(r => Number(r.id) || 0)) + 1)
    const total = words.length || 1
    setRanges([...ranges, { id: newId, start: 1, end: total }])
  }

  function removeRange(id: string) {
    if (ranges.length > 1) {
      setRanges(ranges.filter(r => r.id !== id))
    }
  }

  function updateRange(id: string, field: 'start' | 'end', value: string) {
    setRanges(ranges.map(r => 
      r.id === id 
        ? { ...r, [field]: value === '' ? '' : Number(value) }
        : r
    ))
  }

  function handleStart() {
    const selectedIds = buildSelectedIds()
    onStart({
      mode,
      direction,
      caseSensitive,
      accentSensitive,
      shuffle,
      retryMistakes,
      selectedWordIds: selectedIds,
      selectionMode,
      rangeStart: undefined,
      rangeEnd: undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <style>{`
        @keyframes modalEnter {
          0% { opacity: 0; transform: scale(0.95) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div 
        className="bg-white rounded-3xl p-8 max-w-lg w-full card-shadow my-8 max-h-[90vh] overflow-y-auto"
        style={{animation: 'modalEnter 0.3s ease-out'}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Oefenmodus</h2>
            <p className="text-gray-600 mt-1">{set.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Settings className="w-4 h-4 inline mr-2" />
              Oefenmodus
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('learn')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'learn'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${mode === 'learn' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-800">Leren</div>
                <div className="text-xs text-gray-500 mt-1">Herhaal foute antwoorden</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('flashcard')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'flashcard'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <CreditCard className={`w-8 h-8 mx-auto mb-2 ${mode === 'flashcard' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-800">Flashcards</div>
                <div className="text-xs text-gray-500 mt-1">Klik om te zien</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('multiple-choice')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'multiple-choice'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <CheckSquare className={`w-8 h-8 mx-auto mb-2 ${mode === 'multiple-choice' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-800">Meerkeuze</div>
                <div className="text-xs text-gray-500 mt-1">Kies uit 4 opties</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('typing')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'typing'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <Keyboard className={`w-8 h-8 mx-auto mb-2 ${mode === 'typing' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-800">Typen</div>
                <div className="text-xs text-gray-500 mt-1">Type antwoord</div>
              </button>
            </div>
          </div>

          {/* Direction Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Richting
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDirection('forward')}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  direction === 'forward'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <span className="font-medium text-gray-800">{set.language1} → {set.language2}</span>
                <ArrowRight className={direction === 'forward' ? 'text-green-600' : 'text-gray-400'} />
              </button>
              <button
                type="button"
                onClick={() => setDirection('reverse')}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  direction === 'reverse'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <span className="font-medium text-gray-800">{set.language2} → {set.language1}</span>
                <ArrowRight className={direction === 'reverse' ? 'text-green-600' : 'text-gray-400'} />
              </button>
              <button
                type="button"
                onClick={() => setDirection('both')}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  direction === 'both'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <span className="font-medium text-gray-800">Beide Richtingen</span>
                <ArrowLeftRight className={direction === 'both' ? 'text-green-600' : 'text-gray-400'} />
              </button>
            </div>
          </div>

          {/* Word selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              <ListChecks className="w-4 h-4 inline mr-2" />
              Kies welke woorden je wilt oefenen
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectionMode('all')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  selectionMode === 'all'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <div className="font-semibold text-gray-800">Alle woorden</div>
                <div className="text-xs text-gray-600">Volledige set ({words.length || 0})</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectionMode('range')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  selectionMode === 'range'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <div className="font-semibold text-gray-800">Bereik</div>
                <div className="text-xs text-gray-600">Bijv. 1–100, 20–50</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectionMode('custom')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  selectionMode === 'custom'
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <div className="font-semibold text-gray-800">Handmatig</div>
                <div className="text-xs text-gray-600">Kies individuele woorden</div>
              </button>
            </div>

            {selectionMode === 'range' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div className="space-y-3">
                  {ranges.map((range, idx) => (
                    <div key={range.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pb-3 border-b border-emerald-100 last:border-b-0">
                      <div className="text-xs font-semibold text-emerald-700 sm:min-w-fit">Bereik {ranges.length > 1 ? idx + 1 : ''}</div>
                      <div className="flex-1 flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-emerald-700">Van</label>
                          <input
                            type="number"
                            min={1}
                            value={range.start}
                            onChange={(e) => updateRange(range.id, 'start', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-gray-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-emerald-700">Tot en met</label>
                          <input
                            type="number"
                            min={1}
                            value={range.end}
                            onChange={(e) => updateRange(range.id, 'end', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-gray-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                      </div>
                      {ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRange(range.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                          title="Verwijder dit bereik"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRange}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nog een bereik toevoegen
                </button>
                <p className="text-xs text-emerald-700">
                  {words.length === 0 && wordsLoading && 'Woordjes laden...'}
                  {words.length === 0 && !wordsLoading && 'Geen woordjes gevonden in deze set.'}
                  {words.length > 0 && 'Indexen zijn 1-based: eerste woord = 1. Je kan meerdere bereiken combineren.'}
                </p>
              </div>
            )}

            {selectionMode === 'custom' && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-gray-700 font-semibold">Selecteer woorden ({selectedWordIds.length}/{words.length})</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                        allSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedWordIds(words.map(w => w.id!).filter(Boolean))}
                    >
                      Alles
                    </button>
                    <button
                      type="button"
                      className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                        noneSelected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedWordIds([])}
                    >
                      Niets
                    </button>
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {wordsLoading && <div className="p-3 text-sm text-gray-500">Laden...</div>}
                  {!wordsLoading && words.length === 0 && <div className="p-3 text-sm text-gray-500">Geen woordjes gevonden.</div>}
                  {words.map((w, index) => {
                    const checked = selectedWordIds.includes(w.id!)
                    return (
                      <label key={w.id || index} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (!w.id) return
                            setSelectedWordIds(prev => {
                              if (e.target.checked) return [...prev, w.id!]
                              return prev.filter(id => id !== w.id)
                            })
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{index + 1}. {w.word1}</div>
                          <div className="text-xs text-gray-600">{w.word2}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Learn/Typing Mode Options */}
          {(mode === 'typing' || mode === 'learn') && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                {mode === 'learn' ? 'Opties voor Leren' : 'Opties voor Typen'}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!caseSensitive}
                  onChange={(e) => setCaseSensitive(!e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Hoofdletters negeren</div>
                  <div className="text-xs text-gray-600">Huis = huis = HUIS</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!accentSensitive}
                  onChange={(e) => setAccentSensitive(!e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Accenten negeren</div>
                  <div className="text-xs text-gray-600">été = ete, naïef = naief</div>
                </div>
              </label>
            </div>
          )}

          {/* Shuffle Option */}
          {mode !== 'learn' && (
              <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffle}
                  onChange={(e) => setShuffle(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-800">Woorden shuffelen</div>
                    <div className="text-xs text-gray-600">Random volgorde bij elke sessie</div>
                  </div>
                </div>
              </label>
                {mode === 'multiple-choice' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={retryMistakes}
                      onChange={(e) => setRetryMistakes(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-gray-800">Fouten automatisch herhalen</div>
                        <div className="text-xs text-gray-600">Krijg foute antwoorden automatisch terug</div>
                      </div>
                    </div>
                  </label>
                )}
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full btn-gradient text-white px-6 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start Oefenen
          </button>
        </div>
      </div>
    </div>
  )
}
