import { ReactNode } from 'react'
import { LayoutDashboard, TrendingUp, Calendar, List, ChevronRight } from 'lucide-react'

interface StatsLayoutProps {
    children: ReactNode
    activeTab: 'overview' | 'activity' | 'growth' | 'sets'
    onTabChange: (tab: 'overview' | 'activity' | 'growth' | 'sets') => void
}

export default function StatsLayout({ children, activeTab, onTabChange }: StatsLayoutProps) {
    const tabs = [
        { id: 'overview', label: 'Overzicht', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'activity', label: 'Activiteit', icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'growth', label: 'Groei', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'sets', label: 'Sets Analyse', icon: List, color: 'text-orange-600', bg: 'bg-orange-50' },
    ] as const

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-gradient-to-b from-white via-white to-gray-50 border-r border-gray-200 p-6 flex flex-col gap-2 sticky top-0 h-auto md:h-screen z-10 shadow-sm">
                <div className="mb-8 px-2 hidden md:flex md:flex-col md:items-start gap-3">
                    <div className="flex items-center gap-3">
                        <img src="/Quick-O_logo.compressed-48.png" alt="Quick-O" className="w-10 h-10 rounded-xl shadow-sm" />
                        <div>
                            <h2 className="text-xl font-bold gradient-text">Quick-O</h2>
                            <p className="text-xs text-gray-400 -mt-0.5">Statistieken</p>
                        </div>
                    </div>
                </div>

                {/* Mobile Title */}
                <div className="md:hidden flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <img src="/Quick-O_logo.compressed-48.png" alt="Quick-O" className="w-8 h-8 rounded-lg" />
                        <h2 className="text-lg font-bold gradient-text">Statistieken</h2>
                    </div>
                </div>

                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${isActive
                                    ? `${tab.bg} ${tab.color} font-bold shadow-sm ring-1 ring-inset ring-gray-100`
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? tab.color : 'text-gray-400'}`} />
                                <span>{tab.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto hidden md:block opacity-50" />}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto animate-fade-in">
                    {children}
                </div>
            </div>
        </div>
    )
}
