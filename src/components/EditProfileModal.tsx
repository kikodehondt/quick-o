import { useState } from 'react'
import { X, Save, Lock, User as UserIcon, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/authContext'

interface EditProfileModalProps {
  onClose: () => void
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { userFullName, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(userFullName || '')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { error } = await updateProfile(fullName.trim() || undefined, newPassword.trim() || undefined)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account bijgewerkt!')
        setNewPassword('')
      }
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-8 max-w-md w-full card-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">Account Bewerken</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">Beheer je naam en wachtwoord.</p>

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
              <UserIcon className="w-4 h-4 inline mr-2" />
              Volledige naam
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="Jan Jansen"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Nieuw wachtwoord (optioneel)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="••••••••"
              minLength={6}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Minimaal 6 karakters</p>
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
                Opslaan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
