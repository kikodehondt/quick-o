import { useState } from 'react'
import { X, Save, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/authContext'

interface ResetPasswordModalProps {
  onClose: () => void
}

export default function ResetPasswordModal({ onClose }: ResetPasswordModalProps) {
  const { updatePassword, clearAuthEvent } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password.length < 8) {
      setError('Wachtwoord moet minstens 8 karakters zijn.')
      return
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }
    setLoading(true)
    const { error } = await updatePassword(password)
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Wachtwoord succesvol gewijzigd. Je kunt nu inloggen.')
      clearAuthEvent()
      setTimeout(onClose, 800)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-8 max-w-md w-full card-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Wachtwoord Reset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">Kies een nieuw wachtwoord voor je account.</p>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Nieuw wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="••••••••"
              minLength={8}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Minimaal 8 karakters</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Bevestig wachtwoord
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="••••••••"
              minLength={8}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Opslaan...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 inline mr-2" />
                Wachtwoord opslaan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
