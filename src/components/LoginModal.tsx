import { useRef, useState } from 'react'
import { X, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import HCaptcha from '@hcaptcha/react-hcaptcha'

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<HCaptcha | null>(null)
  const hcaptchaSiteKey = (import.meta as any).env?.VITE_HCAPTCHA_SITEKEY as string | undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, hcaptchaSiteKey ? captchaToken : undefined)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account aangemaakt! Check je email voor verificatie.')
          setEmail('')
          setPassword('')
          setCaptchaToken('')
          captchaRef.current?.resetCaptcha?.()
        }
      } else {
        const { error } = await signIn(email, password, hcaptchaSiteKey ? captchaToken : undefined)
        if (error) {
          setError(error.message)
        } else {
          onClose()
        }
      }
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth is uitgeschakeld in deze setup

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <style>{`
        @keyframes modalEnter {
          0% { opacity: 0; transform: scale(0.95) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div 
        className="bg-white rounded-3xl p-8 max-w-md w-full card-shadow"
        style={{animation: 'modalEnter 0.3s ease-out'}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">
            {isSignUp ? 'Account Maken' : 'Inloggen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          {isSignUp 
            ? 'Maak een account om je woordenlijsten op te slaan en te synchroniseren.'
            : 'Log in om je woordenlijsten te beheren en te oefenen.'}
        </p>

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
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="jouw@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">Minimaal 6 karakters</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full btn-gradient text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isSignUp ? 'Account maken...' : 'Inloggen...'}
              </div>
            ) : (
              isSignUp ? 'Account Maken' : 'Inloggen'
            )}
          </button>
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
          {!hcaptchaSiteKey && (
            <p className="mt-2 text-xs text-gray-500 text-center">Captcha staat aan in Supabase. Zet <strong>VITE_HCAPTCHA_SITEKEY</strong> in je env om de captcha zichtbaar te maken.</p>
          )}
        </form>

        {/* Optioneel: sociale login kan hier later worden toegevoegd */}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setSuccess('')
            }}
            className="text-green-600 hover:text-green-700 font-semibold transition-colors"
            disabled={loading}
          >
            {isSignUp ? 'Heb je al een account? Inloggen' : 'Nog geen account? Registreer'}
          </button>
        </div>
      </div>
    </div>
  )
}
