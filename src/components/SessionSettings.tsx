import { X, Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { StudySettings } from '../lib/supabase'

interface SessionSettingsProps {
  settings: StudySettings
  onUpdate: (settings: StudySettings) => void
  mode: 'learn' | 'typing' | 'flashcard'
}

export default function SessionSettings({ settings, onUpdate, mode }: SessionSettingsProps) {
  const [showModal, setShowModal] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  function handleSave() {
    onUpdate(localSettings)
    setShowModal(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
        title="Instellingen aanpassen"
      >
        <SettingsIcon className="w-5 h-5" />
        <span className="hidden md:inline">Instellingen</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full card-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">Instellingen</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Typing/Learn Mode Options */}
              {(mode === 'typing' || mode === 'learn') && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={!localSettings.caseSensitive}
                      onChange={(e) => setLocalSettings({ ...localSettings, caseSensitive: !e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Hoofdletters negeren</div>
                      <div className="text-xs text-gray-600">Huis = huis = HUIS</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={!localSettings.accentSensitive}
                      onChange={(e) => setLocalSettings({ ...localSettings, accentSensitive: !e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Accenten negeren</div>
                      <div className="text-xs text-gray-600">été = ete, naïef = naief</div>
                    </div>
                  </label>
                </div>
              )}

              {/* Message */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  <strong>Let op:</strong> Instellingen worden direct toegepast op de volgende vraag.
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Toepassen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
