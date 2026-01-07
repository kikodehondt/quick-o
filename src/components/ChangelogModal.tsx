import { useState, useEffect } from 'react'
import { X, ExternalLink, Check, AlertCircle, Zap, Bug } from 'lucide-react'
import { supabase, ChangelogEntry } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Timeline } from './ui/timeline'

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
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 20, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22, mass: 0.8 }}
      >
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
          <div className="flex items-center justify-between px-8 py-6 border-b border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Changelog</h2>
              <p className="text-sm text-emerald-700/80 mt-1">Alle updates en releases</p>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-600/70 hover:text-emerald-700 transition-colors p-2 rounded-xl hover:bg-emerald-50"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-8 pt-6 border-b border-emerald-100 bg-white/60">
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'latest'
                ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/60'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            🆕 Wat is nieuw
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/60'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            📋 Alle versies
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'roadmap'
                ? 'border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50/60'
                : 'text-emerald-700/70 hover:text-emerald-800'
            }`}
          >
            🚀 Roadmap
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-8 py-6 bg-white">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="flex items-center justify-center h-32"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-emerald-700">Changelog laden...</p>
                </div>
              </motion.div>
            ) : activeTab === 'latest' ? (
              latestVersion ? (
                <motion.div
                  key="latest"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
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
                </motion.div>
              ) : null
            ) : activeTab === 'all' ? (
              <motion.div
                key="all"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="-mx-8"
              >
                <Timeline
                  data={allVersions.map((entry) => ({
                    title: `v${entry.version}`,
                    content: (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-2xl p-5 border border-emerald-100/60 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-emerald-700/80">
                              {new Date(entry.release_date).toLocaleDateString('nl-NL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${typeConfig[entry.type as keyof typeof typeConfig].color}`}>
                            {typeConfig[entry.type as keyof typeof typeConfig].label}
                          </span>
                        </div>
                        <h5 className="font-semibold text-emerald-900 mb-1">{entry.title}</h5>
                        <p className="text-sm text-emerald-800 mb-2">{entry.description}</p>
                        {entry.highlights && entry.highlights.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1">
                            {entry.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    ),
                  }))}
                />
              </motion.div>
            ) : (
              <motion.div
                key="roadmap"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-teal-50 rounded-xl p-6 border border-emerald-100 text-center">
                  <h4 className="font-bold text-emerald-900 mb-2">🚀 Roadmap</h4>
                  <p className="text-emerald-800">Nog niets ingevuld - we werken eraan!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-100 px-8 py-4 bg-emerald-50/50 flex items-center justify-between text-sm">
          <a
            href="https://github.com/kikodehondt/quick-o/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            Bekijk op GitHub <ExternalLink className="w-4 h-4" />
          </a>
          <span className="text-emerald-800">Quick-O Release Notes</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
