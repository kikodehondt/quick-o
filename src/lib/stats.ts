import { supabase, StudySession } from './supabase'
import { startOfWeek, endOfWeek, subDays, format, differenceInDays, eachDayOfInterval, isSameDay } from 'date-fns'
import { nl } from 'date-fns/locale'

export interface DashboardStats {
    totalTimeSeconds: number
    totalSessions: number
    totalItemsStudied: number
    averageScore: number
    currentStreak: number
    bestStreak: number
    xp: number
    level: number
    weeklyActivity: { day: string, count: number, seconds: number }[]
}

// Log a completed session
export async function logSession(session: Omit<StudySession, 'id' | 'created_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('study_sessions')
        .insert({
            user_id: user.id,
            ...session
        })
        .select()
        .single()

    if (error) {
        console.error('Error logging session:', error)
        return null
    }
    return data
}

// Fetch main dashboard stats
export async function getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error) throw error

    if (!sessions || sessions.length === 0) {
        return {
            totalTimeSeconds: 0,
            totalSessions: 0,
            totalItemsStudied: 0,
            averageScore: 0,
            currentStreak: 0,
            bestStreak: 0,
            xp: 0,
            level: 1,
            weeklyActivity: getEmptyWeek()
        }
    }

    // Calculate Aggregates
    const totalTimeSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
    const totalSessions = sessions.length
    const totalItemsStudied = sessions.reduce((acc, s) => acc + (s.total_items || 0), 0)
    const averageScore = Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessions)

    // Calculate Streak
    const dates = sessions.map(s => new Date(s.created_at).toDateString())
    // Distinct dates
    const uniqueDates = [...new Set(dates)].map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime())

    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    if (uniqueDates.length > 0) {
        // Check if studied today or yesterday to allow streak to continue
        const today = new Date()
        const lastSessionDate = uniqueDates[uniqueDates.length - 1]
        const diff = differenceInDays(today, lastSessionDate)

        // Streaks logic
        tempStreak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
            const d1 = uniqueDates[i - 1]
            const d2 = uniqueDates[i]
            if (differenceInDays(d2, d1) === 1) {
                tempStreak++
            } else {
                bestStreak = Math.max(bestStreak, tempStreak)
                tempStreak = 1
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak)

        // If last session was today or yesterday, current streak is valid
        if (diff <= 1) {
            currentStreak = tempStreak
        }
    }

    // Calculate XP (Example: 1 XP per item, 10 XP per minute, bonus for high scores)
    const xp = Math.floor(
        totalItemsStudied * 2 +
        (totalTimeSeconds / 60) * 10 +
        sessions.filter(s => s.score >= 80).length * 50
    )
    const level = Math.floor(Math.sqrt(xp) / 5) + 1

    // Weekly Activity for Chart
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start, end })

    const weeklyActivity = weekDays.map(day => {
        const daySessions = sessions.filter(s => isSameDay(new Date(s.created_at), day))
        return {
            day: format(day, 'EEE', { locale: nl }), // ma, di, wo...
            fullDate: day.toISOString(),
            count: daySessions.length,
            seconds: daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
        }
    })

    return {
        totalTimeSeconds,
        totalSessions,
        totalItemsStudied,
        averageScore,
        currentStreak,
        bestStreak,
        xp,
        level,
        weeklyActivity
    }
}

function getEmptyWeek() {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end }).map(day => ({
        day: format(day, 'EEE', { locale: nl }),
        count: 0,
        seconds: 0
    }))
}

// Fetch heatmap data (last 365 days)
export async function getHeatmapData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const oneYearAgo = subDays(new Date(), 365).toISOString()

    const { data, error } = await supabase
        .from('study_sessions')
        .select('created_at, duration_seconds, score')
        .eq('user_id', user.id)
        .gte('created_at', oneYearAgo)

    if (error || !data) return []

    // Group by date
    const grouped: Record<string, { count: number, date: string, score: number }> = {}

    data.forEach(s => {
        const dateStr = s.created_at.split('T')[0]
        if (!grouped[dateStr]) {
            grouped[dateStr] = { date: dateStr, count: 0, score: 0 }
        }
        grouped[dateStr].count += 1
        // Score intensity could be items or duration
        grouped[dateStr].score += (s.duration_seconds > 60 ? 2 : 1)
    })

    return Object.values(grouped)
}

// Get Cumulative Growth Data
export async function getGrowthData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('study_sessions')
        .select('created_at, total_items, score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

    if (error || !data) return []

    let cumulativeItems = 0
    return data.map(s => {
        cumulativeItems += (s.total_items || 0)
        return {
            date: new Date(s.created_at).toLocaleDateString(),
            totalItems: cumulativeItems,
            score: s.score
        }
    })
}

// Update word progress (called after a session)
export async function updateWordProgress(
    setId: number,
    correctWordIds: number[],
    mistakeWordIds: number[]
) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Limit concurrency if lists are huge, but usually fine
    // We do this in parallel for correct/mistake sets
    // Actually we need to loop. 
    // Optimization: we could use a stored procedure, but loop is fine for < 50 items

    // 1. Process Correct Words
    // We only increment correct_count and update last_studied
    // We use upsert.
    const correctUpdates = correctWordIds.map(wordId => ({
        user_id: user.id,
        set_id: setId,
        word_id: wordId,
        correct_count: 1, // Logic below handles increment
        mistake_count: 0
    }))

    // 2. Process Mistake Words
    const mistakeUpdates = mistakeWordIds.map(wordId => ({
        user_id: user.id,
        set_id: setId,
        word_id: wordId,
        correct_count: 0,
        mistake_count: 1
    }))

    // Since we can't do atomic increment easily with standard upsert without raw SQL or existing row fetch,
    // and we want to avoid 100 calls.
    // The "smart" way is to use an RPC or just loop if items are few.
    // For now, let's just use a simple loop with upsert but we need to know current values?
    // No, standard upsert replaces. We need INCREMENT.
    // Supabase JS doesn't support atomic increment in upsert directly in one go without RPC.

    // Better approach: Call a custom RPC? 
    // We didn't create an RPC for batch updating progress.
    // We created `create_user_word_progress.sql` with the Table but no update RPC.

    // Fallback: Just try to insert, on conflict (user_id, word_id) DO UPDATE... 
    // BUT checking supabase-js: `.upsert` just overwrites or ignores. It doesn't enable "increment".

    // Hack: We can use `rpc` if we write one. 
    // Or we fetch existing rows for these words, calculate new values, and upsert.
    // Fetching is safer.

    const allIds = [...new Set([...correctWordIds, ...mistakeWordIds])]
    if (allIds.length === 0) return

    const { data: existing } = await supabase
        .from('user_word_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('set_id', setId)
        .in('word_id', allIds)

    const existingMap = new Map(existing?.map(x => [x.word_id, x]) || [])

    const updates: any[] = []
    const now = new Date().toISOString()

    // Helper to get current counts
    const getCounts = (wid: number) => {
        const e = existingMap.get(wid)
        return { c: e?.correct_count || 0, m: e?.mistake_count || 0 }
    }

    // Process all unique IDs involved
    for (const wid of allIds) {
        let { c, m } = getCounts(wid)

        // Check if it was in correct list (could be in both if retried?)
        // Usually we count each "event". If I got it wrong then right, count both?
        // Let's assume input lists count "events".
        // Use filter to count occurrences if multiple?
        // The input arrays might contain duplicates if multiple attempts?
        // Assuming unique IDs for "was it correct at least once" vs "mistake at least once"?
        // Simpler: Just count +1 if it appears in list.

        const correctCountInBatch = correctWordIds.filter(id => id === wid).length
        const mistakeCountInBatch = mistakeWordIds.filter(id => id === wid).length

        c += correctCountInBatch
        m += mistakeCountInBatch

        if (correctCountInBatch > 0 || mistakeCountInBatch > 0) {
            updates.push({
                user_id: user.id,
                set_id: setId,
                word_id: wid,
                correct_count: c,
                mistake_count: m,
                last_studied: now
            })
        }
    }

    if (updates.length > 0) {
        const { error } = await supabase
            .from('user_word_progress')
            .upsert(updates, { onConflict: 'user_id,word_id' })

        if (error) console.error('Error syncing word progress:', error)
    }
}

export type MissedWord = {
    word_id: number
    word1: string
    word2: string
    mistakes: number
    total_attempts: number
}

// Fetch most missed words using RPC
export async function getMostMissedWords(setId: number): Promise<MissedWord[]> {
    const { data, error } = await supabase
        .rpc('get_most_missed_words', { p_set_id: setId, p_limit: 5 })

    if (error) {
        console.error('Error fetching missed words:', error)
        return []
    }
    return data || []
}
