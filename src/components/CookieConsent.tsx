import { useState, useEffect } from 'react'
import { Cookie, X, Shield, ExternalLink } from 'lucide-react'

interface CookieConsentProps {
  onPrivacyClick: () => void
}

export default function CookieConsent({ onPrivacyClick }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    
    if (consent === null) {
      // No choice made yet, show banner after short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // User has made a choice, apply it
      const accepted = consent === 'accepted'
      
      // If rejected, disable analytics
      if (!accepted) {
        disableAnalytics()
      }
    }
  }, [])

  const disableAnalytics = () => {
    // Disable Vercel Analytics by setting opt-out flag
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window['va-disable'] = true
      
      // Remove any existing Vercel Analytics cookies
      document.cookie.split(";").forEach((c) => {
        const cookie = c.trim()
        if (cookie.startsWith('_vercel')) {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        }
      })
    }
  }

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setIsVisible(false)
    
    // Enable analytics (will be picked up on next page load)
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window['va-disable'] = false
    }
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    disableAnalytics()
    setIsVisible(false)
  }

  const handleDismiss = () => {
    // Treat dismiss as temporary rejection (show again next session)
    sessionStorage.setItem('cookie-banner-dismissed', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]" />
      
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-emerald-500/20 overflow-hidden">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-6 md:p-8 pr-16">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 p-3 bg-emerald-100 rounded-xl">
                  <Cookie className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🍪 We gebruiken cookies
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Quick-O gebruikt <strong>essentiële cookies</strong> voor authenticatie en <strong>analytische cookies</strong> van Vercel Analytics om te begrijpen hoe je onze site gebruikt. Deze analytics zijn volledig anoniem en bevatten geen persoonlijke gegevens.
                  </p>
                </div>
              </div>

              {/* Cookie types */}
              <div className="grid md:grid-cols-2 gap-4 mb-6 ml-0 md:ml-20">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-900">Essentiële Cookies</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Nodig voor login en basisfunctionaliteit. Deze kunnen niet worden uitgeschakeld.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Analytics Cookies (Optioneel)</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Helpen ons de site te verbeteren. Volledig anoniem, geen persoonlijke data.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 ml-0 md:ml-20">
                <button
                  onClick={handleAccept}
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
                >
                  ✓ Accepteer alle cookies
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-colors"
                >
                  Alleen essentiële cookies
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onPrivacyClick()
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border-2 border-gray-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Meer info
                </button>
              </div>

              {/* Footer text */}
              <p className="text-xs text-gray-500 mt-4 ml-0 md:ml-20">
                Door "Accepteer alle cookies" te klikken, ga je akkoord met het opslaan van cookies voor authenticatie en anonieme analytics. 
                Lees ons{' '}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    onPrivacyClick()
                  }}
                  className="underline hover:text-gray-700"
                >
                  privacybeleid
                </button>
                {' '}voor meer details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
