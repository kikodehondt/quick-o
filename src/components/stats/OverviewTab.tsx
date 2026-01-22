import { DashboardStats } from '../../lib/stats'
import { Clock, BookOpen, Flame, Trophy, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface OverviewTabProps {
    stats: DashboardStats
}

export default function OverviewTab({ stats }: OverviewTabProps) {

    // Format seconds to H uur M min
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        if (hours > 0) return `${hours}u ${mins}m`
        return `${mins}m`
    }

    const cards = [
        { label: 'Totaal Gestudeerd', value: formatTime(stats.totalTimeSeconds), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Items Geoefend', value: stats.totalItemsStudied, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Huidige Streak', value: `${stats.currentStreak} dagen`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Level', value: stats.level, icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    ]

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => {
                    const Icon = card.icon
                    return (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`p-4 rounded-xl ${card.bg}`}>
                                <Icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 font-medium">{card.label}</div>
                                <div className="text-2xl font-bold text-gray-800">{card.value}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Activity Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Activity className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Activiteit deze week</h3>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.weeklyActivity}>
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={32}>
                                    {stats.weeklyActivity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#10B981' : '#E5E7EB'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mini Stats Column */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center space-y-6">
                    <div>
                        <div className="text-sm text-gray-500 mb-1">Gemiddelde Score</div>
                        <div className="text-4xl font-bold text-gray-800">{stats.averageScore}%</div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.averageScore}%` }}></div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <div className="text-sm text-gray-500 mb-1">XP Totaal</div>
                        <div className="flex items-end gap-2">
                            <div className="text-4xl font-bold text-gray-800">{stats.xp}</div>
                            <div className="text-sm text-yellow-500 font-bold mb-1">XP</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Verdien meer XP door tests te maken en streaks te behouden.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
