import { useEffect, useRef, useState } from 'react'
import { X, Lock, User as UserIcon, AlertCircle, Eye, EyeOff, Mail, ChevronRight } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useAuth } from '../lib/authContext'

interface EditProfileModalProps {
  onClose: () => void
}

type EditMode = null | 'name' | 'email' | 'password'

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, userFullName, updateProfile, signIn } = useAuth() as any
  const [mounted, setMounted] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [fullName, setFullName] = useState(userFullName || '')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const captchaRef = useRef<HCaptcha | null>(null)
  const hcaptchaSiteKey = (import.meta as any).env?.VITE_HCAPTCHA_SITEKEY as string | undefined
  const isLocal = Boolean((import.meta as any).env?.DEV) || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  const captchaRequired = Boolean(hcaptchaSiteKey) && !isLocal

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      let wantsNameChange = false
      let wantsPasswordChange = false
      let wantsEmailChange = false
      let newNameValue = undefined
      let newPasswordValue = undefined
      let newEmailValue = undefined

      if (editMode === 'name') {
        const trimmedName = fullName.trim()
        const initialName = (userFullName || '').trim()
        wantsNameChange = trimmedName && trimmedName !== initialName
        newNameValue = trimmedName
      }

      if (editMode === 'password') {
        wantsPasswordChange = Boolean(newPassword.trim())
        newPasswordValue = newPassword.trim()
      }

      if (editMode === 'email') {
        const trimmedNewEmail = newEmail.trim().toLowerCase()
        const currentEmail = (user?.email || '').trim().toLowerCase()
        wantsEmailChange = Boolean(trimmedNewEmail && trimmedNewEmail !== currentEmail)
        newEmailValue = trimmedNewEmail
      }

      if (!wantsNameChange && !wantsPasswordChange && !wantsEmailChange) {
        setError('Geen wijzigingen om op te slaan.')
        setLoading(false)
        return
      }

      if (!currentPassword.trim()) {
        setError('Vul je huidige wachtwoord in.')
        setLoading(false)
        return
      }

      if (captchaRequired && !captchaToken) {
        setError('Los de captcha op.')
        setLoading(false)
        return
      }

      const email = user?.email?.trim()
      if (!email) {
        setError('Geen e-mailadres gevonden. Log opnieuw in.')
        setLoading(false)
        return
      }

      if (wantsEmailChange) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newEmailValue!)) {
          setError('Voer een geldig e-mailadres in.')
          setLoading(false)
          return
        }
        if (newEmailValue !== confirmEmail.trim().toLowerCase()) {
          setError('E-mailadressen komen niet overeen.')
          setLoading(false)
          return
        }
      }

      const { error: reauthError } = await signIn(email, currentPassword, (captchaRequired && captchaToken) ? captchaToken : undefined)
      if (reauthError) {
        const msg = reauthError.message?.toLowerCase() || ''
        if (msg.includes('captcha')) {
          setError('Captcha-fout: log uit en probeer opnieuw.')
        } else {
          setError('Wachtwoord onjuist.')
        }
        setLoading(false)
        return
      }

      const { error } = await updateProfile(
        wantsNameChange ? newNameValue : undefined,
        wantsPasswordChange ? newPasswordValue : undefined,
        wantsEmailChange ? newEmailValue : undefined
      )
      if (error) {
        setError(error.message)
      } else {
        if (wantsEmailChange) {
          setSuccess('Bevestiging verstuurd naar beide e-mailadressen.')
        } else {
          setSuccess('Opgeslagen!')
        }
        setCurrentPassword('')
        setNewPassword('')
        setNewEmail('')
        setConfirmEmail('')
        setCaptchaToken('')
        captchaRef.current?.resetCaptcha?.()
        setEditMode(null)
      }
    } catch (err: any) {
      setError(err.message || 'Fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl p-6 max-w-sm w-full card-shadow transition-all duration-300 transform ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold gradient-text">
            {editMode ? 'Bewerken' : 'Account'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {/* Selection View */}
        {!editMode && (
          <div className="space-y-2">
            <button
              onClick={() => setEditMode('name')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Naam</div>
                  <div className="text-xs text-gray-500">{userFullName || 'Niet ingesteld'}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setEditMode('email')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">E-mailadres</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setEditMode('password')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <Lock className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Wachtwoord</div>
                  <div className="text-xs text-gray-500">••••••••</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {/* Edit View */}
        {editMode && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name Edit */}
            {editMode === 'name' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nieuwe naam</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                  placeholder="Jan Jansen"
                  autoFocus
                  disabled={loading}
                />
              </div>
            )}

            {/* Email Edit */}
            {editMode === 'email' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nieuw e-mailadres</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                    placeholder="nieuw@mail.com"
                    autoFocus
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bevestig e-mailadres</label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                    placeholder="nieuw@mail.com"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </>
            )}

            {/* Password Edit */}
            {editMode === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nieuw wachtwoord</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                    placeholder="••••••••"
                    autoFocus
                    minLength={8}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(v => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Min. 8 karakters</p>
              </div>
            )}

            {/* Current Password (always required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Huidig wachtwoord</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {captchaRequired && !isLocal && (
              <div className="mt-3 flex justify-center">
                <HCaptcha
                  ref={captchaRef as any}
                  sitekey={hcaptchaSiteKey!}
                  onVerify={(token: string) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken('')}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditMode(null)
                  setError('')
                  setSuccess('')
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                disabled={loading}
              >
                Terug
              </button>
              <button
                type="submit"
                className="flex-1 btn-gradient text-white px-3 py-2 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || (captchaRequired && !captchaToken)}
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {loading ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
