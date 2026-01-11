import { useState, useRef, useEffect } from 'react'
import { X, FileText, Save, ClipboardCopy, Plus, Trash2, Upload, Info } from 'lucide-react'
import { supabase, generateLinkCode } from '../lib/supabase'
import { parseVocabText } from '../lib/utils'
import { useAuth } from '../lib/authContext'
import ToggleSwitch from './ToggleSwitch'
import Combobox from './Combobox'
import MultiSelect from './MultiSelect'

interface CreateSetModalProps {
  onClose: () => void
  onSetCreated: () => void
}

export default function CreateSetModal({ onClose, onSetCreated }: CreateSetModalProps) {
  const { user, userFullName } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language1, setLanguage1] = useState('Nederlands')
  const [language2, setLanguage2] = useState('Frans')
  const [vocabText, setVocabText] = useState('')

  const [school, setSchool] = useState('')
  const [direction, setDirection] = useState('')
  const [course, setCourse] = useState('') // Vak
  const [semester, setSemester] = useState('') // Semester
  const [year, setYear] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'manual'>('text')

  const [manualPairs, setManualPairs] = useState<Array<{ word1: string; word2: string }>>([{ word1: '', word2: '' }])

  const [existingSchools, setExistingSchools] = useState<string[]>([])
  const [existingDirections, setExistingDirections] = useState<string[]>([])
  const [existingCourses, setExistingCourses] = useState<string[]>([]) // New
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([]) // New state array for tags 
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)

  const [progressStats, setProgressStats] = useState({ words: 0, chars: 0 })
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount to cancel any ongoing AI request
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Fetch metadata on mount
  useState(() => {
    supabase.rpc('get_unique_metadata').then(({ data, error }) => {
      if (!error && data) {
        setExistingSchools((data as any).schools || [])
        setExistingDirections((data as any).directions || [])
        setExistingCourses((data as any).courses || []) // New
        setExistingTags((data as any).tags || [])
      }
    })
  })

  const promptText = `Je bent een expert assistent die vocabulaire-lijsten omzet naar het EXACTE formaat van deze flashcard trainer app. Je taak is om woordparen of zinnenparen te identificeren en te formatteren volgens strikte regels.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATTERINGS REGELS (KRITISCH - VOLG EXACT):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ BELANGRIJKSTE REGEL: VERWERK ALLE WOORDEN - LAAT NIETS ACHTER! ⚠️
Als het document groot is en de output te lang wordt voor één chatbericht, dan:
- Meldt dit expliciet: "OUTPUT IS TE GROOT - SAVE AS TXT FILE"
- Geef instructie om de output in een .txt bestand op te slaan
- Maar verwerk WEL alle woorden, geen enkele mag overgeslagen worden
- Het is beter om een groot bestand te hebben dan incomplete data

1. SCHEIDINGSTEKENS:
   - Gebruik DUBBELE PIPE (||) om woord/zin in ${language1} te scheiden van ${language2}
   - Gebruik TRIPLE PIPE (|||) om verschillende paren te scheiden
   - Gebruik ENKELE PIPE (|) om meerdere vertalingen/synoniemen voor hetzelfde woord te geven
   - Deze tekens zijn gekozen omdat ze zelden voorkomen in normale tekst
   - Voorbeeld formaat: ${language1}tekst || ${language2}tekst1|${language2}tekst2 ||| ${language1}tekst2 || ${language2}tekst3

2. OUTPUT FORMAAT:
   - Produceer ALLEEN de geformatteerde tekst op één enkele regel
   - GEEN markdown formatting (geen backticks, geen code blocks)
   - GEEN uitleg voor of na de output
   - GEEN introductie zoals "Hier is de lijst:" of "Output:"
   - GEEN nummering of bullet points
   - GEEN quotes rondom de output
   - Begin DIRECT met de eerste ${language1} tekst

3. TAAL IDENTIFICATIE:
   - Eerste taal (bron): ${language1}
   - Tweede taal (vertaling): ${language2}
   - ✅ ALLE TALEN ZIJN MOGELIJK: Nederlands, Frans, Engels, Duits, Spaans, Italiaans, Portugees, Russisch, Chinees, Japans, Koreaans, Arabisch, Hindi, Turks, Pools, Zweeds, Noors, Deens, Fins, etc.
   - ✅ Ook minder gangbare talen werken: Latijn, Grieks, Hebreeuws, Thai, Vietnamees, Swahili, Afrikaans, etc.
   - Identificeer automatisch welke tekst in welke taal is
   - Als beide talen gemengd zijn, analyseer de context

4. CONTENT REGELS (VOLLEDIGHEID IS CRUCIAAL):
   - Behoud EXACT alle leestekens (komma's, punten, vraagtekens, etc.) in de woorden/zinnen
   - Behoud hoofdletters/kleine letters precies zoals in bron
   - Behoud alle accenten en speciale karakters (é, ñ, ü, ç, 中, 日, ا, etc.)
   - ⚠️ Verwijder GEEN ENKEL WOORD uit de input - ALLES moet worden verwerkt
   - ⚠️ Sla NIETS over, ook niet als het document lang is
   - Voeg GEEN extra woorden toe die niet in input staan
   - Als tekst al gestructureerd is (met streepjes, nummers), verwijder die structuur

5. MEERDERE VERTALINGEN:
   - Als één woord/zin meerdere vertalingen heeft, gebruik | om ze te scheiden
   - Voorbeeld: hond || perro|can (betekent: hond kan vertaald worden als perro OF can)
   - De app zal automatisch aparte flashcards maken voor elke vertaling
   - Zet de meest gebruikelijke vertaling eerst
   - Maximum 3-4 alternatieven per woord (anders wordt het te veel)

6. CONTEXTUELE AANWIJZINGEN:
   - Als er tussen haakjes context staat (bijv. "perro (dier)"), behoud dit EXACT
   - Als er toelichting na een dubbele punt staat, analyseer of dit bij het woord hoort of een vertaling is

7. VOLLEDIGHEID (ALLERBELANGRIJKST):
   - ⚠️ VERWERK ABSOLUUT ALLE woorden/zinnen uit het document
   - ⚠️ Sla NIETS over, ook niet als je denkt dat het onbelangrijk is
   - ⚠️ Als het document 500 woorden heeft, moeten er 500 paren in de output staan
   - Als je denkt "dit is te lang": FOUT - verwerk alles toch
   - Enige uitzondering: onduidelijke/corrupte data zonder vertaling

8. GROTE DOCUMENTEN:
   - Als de output te lang wordt voor één chatbericht (>10.000 karakters):
     * Meldt expliciet bovenaan: "⚠️ OUTPUT IS TE GROOT - SAVE AS TXT FILE ⚠️"
     * Geef duidelijke instructie: "Kopieer de volledige output hieronder en save als vocab.txt"
     * Maar blijf WEL ALLE woorden verwerken - geen shortcuts
   - Splits NOOIT de lijst op in meerdere berichten zonder dit te melden
   - Volledigheid > gemak

9. ONVOLLEDIGE DATA:
   - Als een woord geen duidelijke vertaling heeft: SKIP dat specifieke paar
   - Als een vertaling onduidelijk of ambigu is: SKIP dat paar
   - Maar de rest van het document MOET wel verwerkt worden

10. ZINNEN MET LEESTEKENS:
   - Zinnen mogen komma's, puntkomma's, dubbele punten, punten bevatten
   - Voorbeeld: "Hoe gaat het, ben je er klaar voor? || Comment ça va, tu es prêt ?"
   - Behoud vraag- en uitroeptekens: "Wat doe je! || Qu'est-ce que tu fais !"

11. CONSISTENTIE:
   - Als input gemengde volgorde heeft (soms ${language1} eerst, soms ${language2}), normaliseer naar:
     ALTIJD ${language1} || ${language2}
   - Als input getallen/nummering bevat (1. huis - maison), strip de nummers

12. QUALITY CHECK:
    - Tel mentaal: aantal || moet gelijk zijn aan aantal basisparen
    - Tel mentaal: aantal ||| moet gelijk zijn aan (aantal basisparen - 1)
    - Controleer dat er geen trailing/leading spaces zijn rondom |||
    - Zorg dat | alleen binnen de ${language2} kant wordt gebruikt
    - ⚠️ BELANGRIJKST: Tel of je alle woorden uit het document hebt verwerkt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOORBEELD INPUT EN CORRECTE OUTPUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Voorbeeld 1 (Simpele woorden):
Input: "1. huis - maison\\n2. auto - voiture\\n3. kat - chat"
Correct: huis || maison ||| auto || voiture ||| kat || chat

Voorbeeld 2 (Meerdere vertalingen):
Input: "hond: perro, can\\nkat: gato\\neten: comer, consumir"
Correct: hond || perro|can ||| kat || gato ||| eten || comer|consumir

Voorbeeld 3 (Zinnen met leestekens):
Input: "- Hoe gaat het? = Comment ça va?\\n- Ik hou van koffie, jij ook? = J'aime le café, toi aussi?"
Correct: Hoe gaat het? || Comment ça va? ||| Ik hou van koffie, jij ook? || J'aime le café, toi aussi?

Voorbeeld 4 (Combinatie met alternatieven en zinnen):
Input: "Goedemorgen - Buenos días / Buen día\\nDankjewel - Gracias\\nWaar is...? - ¿Dónde está...?"
Correct: Goedemorgen || Buenos días|Buen día ||| Dankjewel || Gracias ||| Waar is...? || ¿Dónde está...?

Voorbeeld 5 (Verschillende talen - Japans, Arabisch, Chinees):
Input: "こんにちは - hallo\\n本 - boek\\nمرحبا - hallo\\n你好 - hallo"
Correct: こんにちは || hallo ||| 本 || boek ||| مرحبا || hallo ||| 你好 || hallo

Voorbeeld 6 (Met context tussen haakjes):
Input: "perro (hond) masc.\\nfaire (doen/maken)"
Correct: perro || hond ||| faire || doen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FINAL REMINDER: VERWERK ALLE WOORDEN UIT HET DOCUMENT ⚠️
Als je klaar bent, check nog eens:
- Heb ik echt ALLE woorden/zinnen uit de input verwerkt?
- Is er ook maar één regel die ik per ongeluk heb overgeslagen?
- Als de output te groot is, heb ik dat gemeld met "OUTPUT IS TE GROOT - SAVE AS TXT FILE"?

VERWERK NU DE INPUT VOLGENS BOVENSTAANDE REGELS.
OutputFormat: ${language1}tekst || ${language2}tekst ||| ${language1}tekst || ${language2}tekst1|tekst2 ||| ...

BEGIN DIRECT MET DE OUTPUT (GEEN EXTRA TEKST):`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.id) {
      setError('Je moet ingelogd zijn om een set aan te maken.')
      return
    }

    if (!name.trim()) {
      setError('Vul een naam in voor de set')
      return
    }

    if (!school.trim() || !direction.trim() || !year || !course.trim() || !semester) {
      setError('Vul alle verplichte velden in (School, Richting, Vak, Semester, Jaar)')
      return
    }

    // Get word pairs based on input mode
    let wordPairs: Array<{ word1: string; word2: string }> = []

    if (inputMode === 'text') {
      if (!vocabText.trim()) {
        setError('Plak de woordjes tekst')
        return
      }
      // Parse the text
      wordPairs = parseVocabText(vocabText)

      if (wordPairs.length === 0) {
        setError('Geen geldige woordparen gevonden. Gebruik het formaat: woord1 || woord2 ||| woord3 || woord4')
        return
      }
    } else {
      // Manual mode - filter out empty pairs
      wordPairs = manualPairs.filter(pair => pair.word1.trim() && pair.word2.trim())

      if (wordPairs.length === 0) {
        setError('Voeg minstens één woordpaar toe')
        return
      }
    }

    try {
      setLoading(true)
      setError('')



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
          created_by: user.id,
          link_code,
          tags,
          school,
          direction,
          course,
          semester,
          year,
          creator_name: isAnonymous ? null : (userFullName || null),
          is_anonymous: isAnonymous,
          is_public: isPublic
        }])
        .select()
        .single()

      if (createSetError) throw createSetError

      // Insert word pairs via RPC
      const pairsPayload = wordPairs.map(pair => ({
        word_1: pair.word1,
        word_2: pair.word2,
        language_1: language1,
        language_2: language2
      }))

      const { error: wordsError } = await supabase
        .rpc('link_pairs_to_set', {
          p_set_id: setData.id,
          p_pairs: pairsPayload
        })

      if (wordsError) throw wordsError

      onSetCreated()
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden')
      console.error('Error creating set:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    if (!file.type.includes('pdf') && !file.type.includes('image') && !file.type.includes('text')) {
      setError('Alleen PDF, afbeeldingen of tekstbestanden worden ondersteund.')
      return
    }

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      setError('Bestand is te groot (max 4MB).')
      return
    }

    setIsProcessingFile(true)
    setProgressStats({ words: 0, chars: 0 })
    setError('')
    setCopyMessage('Verbinden met AI...')
    setVocabText('') // Clear previous text

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const dynamicPrompt = promptText

      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string

        try {
          const response = await fetch('/api/generate-words', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64,
              mimeType: file.type,
              prompt: dynamicPrompt,
              language1,

              language2
            }),
            signal: controller.signal
          })

          if (!response.ok) {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json()
              throw new Error(data.error || 'Fout bij verwerken bestand')
            } else {
              const text = await response.text()
              const errText = text.slice(0, 100)
              throw new Error(`Server Error (${response.status}): ${errText}`)
            }
          }

          if (!response.body) throw new Error('Geen response body')

          // Streaming Logic
          const streamReader = response.body.getReader()
          const decoder = new TextDecoder()

          setCopyMessage('AI is aan het schrijfen...')

          let fullTextBuffer = ''

          while (true) {
            const { done, value } = await streamReader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            fullTextBuffer += chunk

            // Update stats for "Real Progress"
            const wordCount = (fullTextBuffer.match(/\|\|/g) || []).length // Count pairs as proxy for progress
            setProgressStats({
              chars: fullTextBuffer.length,
              words: wordCount // Actually counts separators, good proxy for "items found"
            })
          }

          // Final Cleanup
          let cleanText = fullTextBuffer
            .replace('⚠️ OUTPUT IS TE GROOT - SAVE AS TXT FILE ⚠️', '')
            .replace('OUTPUT IS TE GROOT - SAVE AS TXT FILE', '')
            .replace('Kopieer de volledige output hieronder en save als vocab.txt', '')
            // Regex to remove any lines starting with warnings if they vary slightly
            .replace(/^⚠️? ?OUTPUT IS TE GROOT.*$/gm, '')
            .replace(/^Kopieer de volledige output.*$/gm, '')
            .trim()

          if (cleanText.includes('[TRUNCATED_WARNING]')) {
            cleanText = cleanText.replace('[TRUNCATED_WARNING]', '')
            setError('⚠️ Let op: De AI output is mogelijk incompleet (Token limiet bereikt). Controleer de laatste regels.')
          }

          setVocabText(cleanText)
          if (!error) setCopyMessage('✅ Klaar!')

        } catch (apiError: any) {
          console.error('API Error:', apiError)
          const errorMsg = apiError.message || apiError.error || 'Onbekende fout'

          if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limiet')) {
            setError('Gratis AI Limiet Bereikt. Probeer het later opnieuw of kopieer de prompt en gebruik ChatGPT handmatig.')
          } else {
            setError(`AI Fout: ${errorMsg}. Contacteer contact@quick-o.be als dit blijft gebeuren.`)
          }
        } finally {
          setIsProcessingFile(false)
          setProgressStats({ words: 0, chars: 0 })
        }
      }
      reader.onerror = () => {
        setError('Fout bij lezen bestand')
        setIsProcessingFile(false)
      }
      reader.readAsDataURL(file)

    } catch (err: any) {
      console.error('File Drop Error:', err)
      setError('Er ging iets mis bij het verwerken.')
      setIsProcessingFile(false)
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                >
                  <option value="">Kies Jaar...</option>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Semester *</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                >
                  <option value="">Kies Semester...</option>
                  <option value="Eerste Semester">Eerste Semester</option>
                  <option value="Tweede Semester">Tweede Semester</option>
                  <option value="Jaarvak">Jaarvak</option>
                </select>
              </div>

              <Combobox
                label="Vak *"
                value={course}
                onChange={setCourse}
                options={existingCourses}
                placeholder="Bijv. Wiskunde"
              />
              <MultiSelect
                label="Tags"
                value={tags}
                onChange={setTags}
                options={existingTags}
                placeholder="Bijv. Frans, hoofdstuk 1"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Publicatie-instellingen</label>
              <div className="space-y-3 px-4 py-4 rounded-xl border-2 border-gray-300 bg-white">
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

                <div className="border-t border-gray-200 pt-3">
                  <ToggleSwitch
                    id="anonymous-toggle"
                    checked={isAnonymous}
                    onChange={setIsAnonymous}
                    label="Anoniem publiceren"
                    description={isAnonymous
                      ? '🔒 Je naam wordt verborgen'
                      : `✏️ Naam zichtbaar: ${userFullName || 'Onbekend'}`
                    }
                  />
                </div>
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${inputMode === 'text'
                ? 'btn-gradient text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Tekst / PDF Invoer
            </button>
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${inputMode === 'manual'
                ? 'btn-gradient text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Handmatig Invoeren
            </button>
          </div>

          {/* Text input mode */}
          {inputMode === 'text' && (
            <div>
              {/* Instructional info box */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-2">Hoe gebruik je Tekst Invoer?</h4>
                    <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                      <li>
                        <strong>Upload je bestand met woordjes</strong> naar een AI (ChatGPT, Claude, etc.)
                        <span className="block ml-6 text-xs text-green-700 mt-1">
                          <Upload className="w-3 h-3 inline mr-1" />
                          Ondersteunt: PDF, Word, Excel, afbeeldingen, tekstbestanden...
                        </span>
                      </li>
                      <li>
                        <strong>Kopieer de prompt</strong> met de knop hieronder en plak in de AI
                      </li>
                      <li>
                        <strong>Plak de output</strong> van de AI in het tekstveld hieronder
                      </li>
                    </ol>
                    <p className="text-xs text-green-700 mt-3 italic">
                      💡 De AI zet automatisch je document om naar het correcte formaat
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Woordjes Tekst *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                    title="Upload PDF of afbeelding"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Bestand
                  </button>
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
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                    title="Kopieer instructie-prompt voor AI"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                    Prompt kopiëren
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,image/*,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    // Manually trigger drop handler logic with a fake drop event
                    // Or reuse logic. Let's create a reusable function for file processing
                    // actually better to just refactor slightly or create a synthetic event
                    const file = e.target.files[0]
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    handleDrop({
                      preventDefault: () => { },
                      dataTransfer
                    } as unknown as React.DragEvent)
                  }
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="relative"
              >
                <textarea
                  value={vocabText}
                  onChange={(e) => setVocabText(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all font-mono text-sm min-h-[250px] ${isDragOver
                    ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                    }`}
                  rows={10}
                  placeholder={
                    isDragOver
                      ? "Laat los om bestand te uploaden..."
                      : `Sleep je PDF hierin OF plak tekst:\n\n${language1} || ${language2} ||| ${language1}2 || ${language2}2`
                  }
                />

                {/* Overlay while processing, showing REAL progress stats */
                  isProcessingFile && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center border-2 border-emerald-500 z-10 px-8 transition-all duration-500">
                      {progressStats.words === 0 ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
                          <h3 className="font-bold text-lg text-emerald-900 mb-1">Verbinden met AI...</h3>
                          <p className="text-sm text-emerald-600">Document wordt geanalyseerd</p>
                        </>
                      ) : (
                        <>
                          <div className="animate-pulse bg-emerald-100 p-4 rounded-full mb-3">
                            <FileText className="w-8 h-8 text-emerald-600" />
                          </div>
                          <h3 className="font-bold text-lg text-emerald-900 mb-1">AI schrijft woordjes...</h3>
                          <div className="flex gap-4 text-sm text-emerald-700 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                              <span className="font-bold text-emerald-600">{progressStats.words}</span> woorden
                            </div>
                          </div>
                        </>
                      )}

                      <p className="text-xs text-center text-gray-500 mt-8 absolute bottom-4 px-4">
                        ⚠️ Sluit dit venster <strong>NIET</strong>.<br />
                        Dit kan enkele minuten duren voor grote bestanden.
                      </p>
                    </div>
                  )}

                {!isProcessingFile && isDragOver && (
                  <div className="absolute inset-0 bg-emerald-50/50 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-emerald-500 pointer-events-none z-10">
                    <div className="bg-white p-4 rounded-full shadow-lg">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Formaat: <code className="bg-gray-100 px-2 py-1 rounded">{language1} || {language2} ||| {language1}2 || {language2}2</code>
                <br />
                <span className="text-xs">Gebruik <strong>||</strong> om talen te scheiden, <strong>|||</strong> om paren te scheiden en <strong>|</strong> voor meerdere vertalingen (bijv: hond || perro|can)</span>
              </p>
              {copyMessage && !copyMessage.includes('Verbinden') && !copyMessage.includes('schrijven') && (
                <p className={`text-sm mt-2 ${copyMessage.includes('Fout') || copyMessage.includes('mislukt') ? 'text-red-600' : 'text-green-600'}`}>{copyMessage}</p>
              )}
            </div>
          )}

          {/* Manual input mode */}
          {inputMode === 'manual' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Woordparen
              </label>

              {manualPairs.map((pair, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={pair.word1}
                    onChange={(e) => {
                      const newPairs = [...manualPairs]
                      newPairs[index].word1 = e.target.value
                      setManualPairs(newPairs)
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    placeholder={language1}
                  />
                  <span className="text-gray-400 font-bold">→</span>
                  <input
                    type="text"
                    value={pair.word2}
                    onChange={(e) => {
                      const newPairs = [...manualPairs]
                      newPairs[index].word2 = e.target.value
                      setManualPairs(newPairs)
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    placeholder={language2}
                  />
                  {manualPairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPairs = manualPairs.filter((_, i) => i !== index)
                        setManualPairs(newPairs)
                      }}
                      className="p-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                      title="Verwijder dit paar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setManualPairs([...manualPairs, { word1: '', word2: '' }])
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-600 hover:text-green-600 font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Voeg woordpaar toe
              </button>

              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Voor meerdere vertalingen, gebruik | om ze te scheiden (bijv: perro|can)
              </p>
            </div>
          )}

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
