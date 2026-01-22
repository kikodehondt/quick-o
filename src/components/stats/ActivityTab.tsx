import { useEffect, useState } from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { getHeatmapData } from '../../lib/stats'
import { useAuth } from '../../lib/authContext'
import 'react-calendar-heatmap/dist/styles.css'
import { Tooltip } from 'react-tooltip'
import { subDays, format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function ActivityTab() {
    const { user } = useAuth()
    const [data, setData] = useState<{ date: string, count: number, score: number }[]>([])

    useEffect(() => {
        if (!user) return
        getHeatmapData().then(setData)
    }, [user])

    const startDate = subDays(new Date(), 365)
    const endDate = new Date()

    return (
        <div className="space-y-6">
            <style>{`
            .react-calendar-heatmap text {
            font-size: 10px;
            fill: #9CA3AF;
            }
            .react-calendar-heatmap .color-empty { fill: #F3F4F6; }
            .react-calendar-heatmap .color-scale-1 { fill: #D1FAE5; }
            .react-calendar-heatmap .color-scale-2 { fill: #6EE7B7; }
            .react-calendar-heatmap .color-scale-3 { fill: #34D399; }
            .react-calendar-heatmap .color-scale-4 { fill: #10B981; }
            .react-calendar-heatmap .color-scale-5 { fill: #047857; }
        `}</style>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Jaaroverzicht</h3>

                <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[800px]">
                        <CalendarHeatmap
                            startDate={startDate}
                            endDate={endDate}
                            values={data}
                            classForValue={(value) => {
                                if (!value) return 'color-empty';
                                if (value.count >= 10) return 'color-scale-5';
                                if (value.count >= 7) return 'color-scale-4';
                                if (value.count >= 5) return 'color-scale-3';
                                if (value.count >= 3) return 'color-scale-2';
                                return 'color-scale-1'; // count >= 1
                            }}
                            tooltipDataAttrs={(value: any) => {
                                if (!value || !value.date) {
                                    return { 'data-tooltip-content': 'Geen activiteit' } as any;
                                }
                                const dateStr = format(new Date(value.date), 'd MMMM yyyy', { locale: nl })
                                return {
                                    'data-tooltip-id': 'heatmap-tooltip',
                                    'data-tooltip-content': `${value.count} sessies op ${dateStr}`,
                                } as any;
                            }}
                            showWeekdayLabels
                        />
                    </div>
                </div>
                <Tooltip id="heatmap-tooltip" style={{ borderRadius: '8px' }} />

                <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500">
                    <span>Minder</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-emerald-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-emerald-300 rounded-sm"></div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                        <div className="w-3 h-3 bg-emerald-800 rounded-sm"></div>
                    </div>
                    <span>Meer</span>
                </div>
            </div>
        </div>
    )
}
