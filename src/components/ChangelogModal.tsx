import { useState, useEffect } from 'react'
import { X, ExternalLink, Check, AlertCircle, Zap, Bug } from 'lucide-react'
import { supabase, ChangelogEntry } from '../lib/supabase'

interface ChangelogModalProps {
  onClose: () => void
}

export default function ChangelogModal({ onClose }: ChangelogModalProps) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'latest' | 'all' | 'roadmap'>('latest')

  useEffect(() => {
    async function fetchChangelog() {
      try {
        const { data, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .order('release_date', { ascending: false })

        if (error) throw error
        setChangelog(data || [])
      } catch (err) {
        console.error('Error fetching changelog:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchChangelog()
  }, [])

  const typeConfig = {
    feature: { icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '✨ Feature' },
    bugfix: { icon: Bug, color: 'text-red-600', bg: 'bg-red-50', label: '🐛 Bugfix' },
    breaking: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: '⚠️ Breaking' },
    performance: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', label: '🚀 Performance' },
    docs: { icon: Check, color: 'text-gray-600', bg: 'bg-gray-50', label: '📚 Docs' },
  }

  const latestVersion = changelog[0]
  const allVersions = changelog

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <style>{`
        @keyframes modalEnter {
          0% { opacity: 0; transform: scale(0.95) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        className="bg-white rounded-3xl max-w-2xl w-full card-shadow max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'modalEnter 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Changelog</h2>
            <p className="text-sm text-gray-600 mt-1">Alle updates en releases</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-8 pt-6 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'latest'
                ? 'border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50/30'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🆕 Wat is nieuw
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50/30'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Alle versies
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'roadmap'
                ? 'border-b-2 border-emerald-500 text-emerald-600 bg-emerald-50/30'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🚀 Roadmap
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Changelog laden...</p>
              </div>
            </div>
          ) : activeTab === 'latest' ? (
            latestVersion ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-emerald-900">v{latestVersion.version}</h3>
                      <p className="text-sm text-emerald-700 mt-1">
                        {new Date(latestVersion.release_date).toLocaleDateString('nl-NL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeConfig[latestVersion.type as keyof typeof typeConfig].bg} ${typeConfig[latestVersion.type as keyof typeof typeConfig].color}`}>
                      {typeConfig[latestVersion.type as keyof typeof typeConfig].label}
                    </span>
                  </div>
                  <h4 className="text-xl font-semibold text-emerald-900 mb-3">{latestVersion.title}</h4>
                  <p className="text-emerald-800 mb-4">{latestVersion.description}</p>
                  {latestVersion.highlights && latestVersion.highlights.length > 0 && (
                    <ul className="space-y-2">
                      {latestVersion.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-emerald-700">
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null
          ) : activeTab === 'all' ? (
            <div className="space-y-4">
              {allVersions.map((entry) => {
                const config = typeConfig[entry.type as keyof typeof typeConfig]
                return (
                  <div key={entry.id} className={`${config.bg} rounded-xl p-4 border border-gray-100`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">v{entry.version}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(entry.release_date).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <h5 className="font-semibold text-gray-800 mb-1">{entry.title}</h5>
                    <p className="text-sm text-gray-700">{entry.description}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-center">
                <h4 className="font-bold text-blue-900 mb-2">🚀 Roadmap</h4>
                <p className="text-blue-800">Nog niets ingevuld - we werken eraan!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-4 bg-gray-50 flex items-center justify-between text-sm">
          <a
            href="https://github.com/kikodehondt/quick-o/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Bekijk op GitHub <ExternalLink className="w-4 h-4" />
          </a>
          <span className="text-gray-600">Quick-O Release Notes</span>
        </div>
      </div>
    </div>
  )
}
