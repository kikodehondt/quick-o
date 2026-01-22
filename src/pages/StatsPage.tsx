import { useEffect, useState } from 'react'
import StatsLayout from '../components/stats/StatsLayout'
import OverviewTab from '../components/stats/OverviewTab'
import GrowthTab from '../components/stats/GrowthTab'
import ActivityTab from '../components/stats/ActivityTab'
import SetsAnalysisTab from '../components/stats/SetsAnalysisTab'
import { getDashboardStats, DashboardStats } from '../lib/stats'
import { useAuth } from '../lib/authContext'
import { Lock } from 'lucide-react'

interface StatsPageProps {
    onLoginRequest?: () => void
}

export default function StatsPage({ onLoginRequest }: StatsPageProps) {
    const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'growth' | 'sets'>('overview')

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        getDashboardStats().then(s => {
            setStats(s)
            setLoading(false)
        }).catch(err => {
            console.error("Failed to load stats", err)
            setLoading(false)
        })
    }, [user])

    if (!user && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(-45deg, #10b981 0%, #059669 25%, #047857 50%, #065f46 75%, #10b981 100%)', backgroundSize: '400% 400%', animation: 'gradientShift 20s ease infinite' }}>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl animate-fade-in-up">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Statistieken</h2>
                    <p className="text-white/80 mb-8 leading-relaxed">
                        Log in om je voortgang, streaks en leerprestaties bij te houden. Ontdek hoe je groeit!
                    </p>
                    {onLoginRequest ? (
                        <button
                            onClick={onLoginRequest}
                            className="bg-white text-emerald-800 font-bold py-3 px-8 rounded-xl hover:scale-105 hover:bg-emerald-50 transition-all duration-300 shadow-lg w-full"
                        >
                            Inloggen
                        </button>
                    ) : (
                        <div className="text-white/60 text-sm">
                            Klik op "Inloggen" in het menu
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StatsLayout activeTab={activeTab} onTabChange={setActiveTab}>
                {loading && (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                )}

                {!loading && stats && activeTab === 'overview' && <OverviewTab stats={stats} />}
                {!loading && stats && activeTab === 'activity' && <ActivityTab />}
                {!loading && stats && activeTab === 'growth' && <GrowthTab />}

                {!loading && activeTab === 'sets' && <SetsAnalysisTab />}
            </StatsLayout>
        </div>
    )
}
