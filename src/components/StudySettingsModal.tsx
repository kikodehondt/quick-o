import { useState } from 'react'
import { X, Keyboard, CreditCard, ArrowRight, ArrowLeftRight, Settings, GraduationCap, Shuffle } from 'lucide-react'
import { VocabSet, StudyMode, StudyDirection, StudySettings } from '../lib/supabase'

interface StudySettingsModalProps {
  set: VocabSet
  onClose: () => void
  onStart: (settings: StudySettings) => void
}

export default function StudySettingsModal({ set, onClose, onStart }: StudySettingsModalProps) {
  const [mode, setMode] = useState<StudyMode>('learn')
  const [direction, setDirection] = useState<StudyDirection>('forward')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [accentSensitive, setAccentSensitive] = useState(false)
  const [shuffle, setShuffle] = useState(true)

  function handleStart() {
    onStart({ mode, direction, caseSensitive, accentSensitive, shuffle })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <style>{`
        @keyframes modalEnter {
          0% { opacity: 0; transform: scale(0.95) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-container {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      <div 
        className="bg-white rounded-3xl p-8 max-w-lg w-full card-shadow modal-container"
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
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('learn')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'learn'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${mode === 'learn' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-800">Leren</div>
                <div className="text-xs text-gray-500 mt-1">Herhaal foute antwoorden</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('flashcard')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'flashcard'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <CreditCard className={`w-8 h-8 mx-auto mb-2 ${mode === 'flashcard' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-gray-800">Flashcards</div>
                <div className="text-xs text-gray-500 mt-1">Klik om te zien</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('typing')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'typing'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow'
                }`}
              >
                <Keyboard className={`w-8 h-8 mx-auto mb-2 ${mode === 'typing' ? 'text-purple-600' : 'text-gray-400'}`} />
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
            <div className="bg-purple-50 rounded-xl p-4">
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
