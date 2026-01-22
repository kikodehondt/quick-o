import { useEffect, useState } from 'react'
import { getGrowthData } from '../../lib/stats'
import { useAuth } from '../../lib/authContext'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'

export default function GrowthTab() {
    const { user } = useAuth()
    const [data, setData] = useState<{ date: string, totalItems: number, score: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }
        getGrowthData().then(d => {
            setData(d)
            setLoading(false)
        })
    }, [user])

    if (loading) return <div className="p-8 text-center text-gray-500">Laden...</div>
    if (data.length === 0) return <div className="p-8 text-center text-gray-500">Nog niet genoeg data voor groeimodellen. Ga studeren!</div>

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-[500px] flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Kennis Groei</h3>
                    <p className="text-sm text-gray-500">Totaal aantal items geoefend over tijd</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="totalItems"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorItems)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
