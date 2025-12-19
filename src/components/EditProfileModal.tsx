import { useRef, useState } from 'react'
import { X, Save, Lock, User as UserIcon, AlertCircle, Eye, EyeOff, Mail } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useAuth } from '../lib/authContext'

interface EditProfileModalProps {
  onClose: () => void
}

export default function EditProfileModal({ onClose }: EditProfileModalProps) {
  const { user, userFullName, updateProfile, signIn } = useAuth() as any
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
  const captchaRequired = Boolean(hcaptchaSiteKey)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const trimmedName = fullName.trim()
      const initialName = (userFullName || '').trim()
      const wantsNameChange = trimmedName && trimmedName !== initialName
      const wantsPasswordChange = Boolean(newPassword.trim())
      const trimmedNewEmail = newEmail.trim().toLowerCase()
      const currentEmail = (user?.email || '').trim().toLowerCase()
      const wantsEmailChange = trimmedNewEmail && trimmedNewEmail !== currentEmail

      if (!wantsNameChange && !wantsPasswordChange && !wantsEmailChange) {
        setError('Geen wijzigingen om op te slaan.')
        setLoading(false)
        return
      }

      if (!currentPassword.trim()) {
        setError('Vul je huidige wachtwoord in om wijzigingen op te slaan.')
        setLoading(false)
        return
      }

      if (captchaRequired && !captchaToken) {
        setError('Los de captcha op om wijzigingen op te slaan.')
        setLoading(false)
        return
      }

      const email = user?.email?.trim()
      if (!email) {
        setError('Geen e-mailadres gevonden voor deze sessie. Log opnieuw in en probeer het nog eens.')
        setLoading(false)
        return
      }

      if (wantsEmailChange) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedNewEmail)) {
          setError('Voer een geldig e-mailadres in.')
          setLoading(false)
          return
        }
        if (trimmedNewEmail !== confirmEmail.trim().toLowerCase()) {
          setError('De nieuwe e-mailadressen komen niet overeen.')
          setLoading(false)
          return
        }
      }

      // Re-authenticate once for any change
      const { error: reauthError } = await signIn(email, currentPassword, captchaRequired ? captchaToken : undefined)
      if (reauthError) {
        const msg = reauthError.message?.toLowerCase() || ''
        if (msg.includes('captcha')) {
          setError('Captcha vereist: log eerst uit en weer in via de login-captcha en probeer daarna opnieuw.')
        } else {
          setError('Huidig wachtwoord is onjuist.')
        }
        setLoading(false)
        return
      }

      const { error } = await updateProfile(
        wantsNameChange ? trimmedName : undefined,
        wantsPasswordChange ? newPassword.trim() : undefined,
        wantsEmailChange ? trimmedNewEmail : undefined
      )
      if (error) {
        setError(error.message)
      } else {
        if (wantsEmailChange) {
          setSuccess('We hebben je e-mailwijziging gestart. Controleer je oude en nieuwe inbox om te bevestigen.')
        } else {
          setSuccess('Account bijgewerkt!')
        }
        setCurrentPassword('')
        setNewPassword('')
        setNewEmail('')
        setConfirmEmail('')
        setCaptchaToken('')
        captchaRef.current?.resetCaptcha?.()
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

        <p className="text-gray-600 mb-6">Beheer je naam, e-mailadres en wachtwoord.</p>

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
            <p className="text-xs text-gray-500 mt-1">Naam aanpassen vereist je huidige wachtwoord.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Nieuw e-mailadres (optioneel)
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="nieuw@mail.com"
              disabled={loading}
              autoComplete="email"
            />
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full mt-3 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="Bevestig nieuw e-mailadres"
              disabled={loading}
              autoComplete="email"
            />
            <p className="text-xs text-gray-500 mt-1">We sturen een bevestigingsmail naar je oude en nieuwe adres.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Huidig wachtwoord (vereist bij wijzigen)
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showCurrentPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Vul je huidige wachtwoord in om je naam en/of wachtwoord op te slaan.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Nieuw wachtwoord (optioneel)
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? 'Verberg nieuw wachtwoord' : 'Toon nieuw wachtwoord'}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Laat leeg als je je wachtwoord niet wilt wijzigen (min. 8 karakters indien ingevuld).</p>
          </div>

          {hcaptchaSiteKey && (
            <div className="mt-4 flex justify-center">
              <HCaptcha
                ref={captchaRef as any}
                sitekey={hcaptchaSiteKey}
                onVerify={(token: string) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
              />
            </div>
          )}
          {captchaRequired && !captchaToken && (
            <p className="text-xs text-amber-600 text-center">Captcha vereist voor wijzigingen.</p>
          )}

          <button
            type="submit"
            className="w-full btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || (captchaRequired && !captchaToken)}
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
