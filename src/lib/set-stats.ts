import { differenceInDays, addDays } from 'date-fns'

export interface SetPrediction {
    currentMastery: number
    predictions: {
        mastery50: Date | null
        mastery80: Date | null
        mastery90: Date | null
        mastery100: Date | null
    }
    learningVelocity: number // % per hour
    totalStudyTimeHours: number
    retentionIndex: number // 0-100
    nextMilestone: {
        target: number
        date: Date
        hoursNeeded: number
    } | null
}

export interface SetSessionData {
    date: Date
    score: number
    durationSeconds: number
}

/**
 * "The Oracle" - Predicts future mastery based on past performance using logarithmic regression.
 * Learning follows a "Power Law of Practice" (or log curve), where initial gains are fast and then plateau.
 * Model: Score = a * ln(CumulativeTime) + b
 */
export function calculateSetPredictions(sessions: SetSessionData[]): SetPrediction | null {
    if (sessions.length < 2) return null

    // 1. Prepare Data
    // Sort by date
    const sorted = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate Cumulative Time (in Hours) vs Score
    // We treat "Time" as "x" and "Score" as "y"
    let cumulativeHours = 0.1 // Start with small offset to avoid ln(0)
    const points = sorted.map(s => {
        cumulativeHours += (s.durationSeconds / 3600)
        return { x: cumulativeHours, y: s.score }
    })

    const totalStudyTimeHours = cumulativeHours
    const currentScore = points[points.length - 1].y

    // 2. Linear Regression on Transformed Data (Lik-Log Model)
    // We fit y = a * ln(x) + b
    // Transform x -> ln(x)
    // Then fit y = a * X + b  (where X = ln(x))

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    const n = points.length

    for (const p of points) {
        const lnX = Math.log(p.x)
        sumX += lnX
        sumY += p.y
        sumXY += (lnX * p.y)
        sumXX += (lnX * lnX)
    }

    // Calculate slope (a) and intercept (b)
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // 3. Helper to predict time needed for a target score
    // y = a * ln(x) + b  =>  y - b = a * ln(x)  =>  (y - b) / a = ln(x)  =>  x = e^((y - b) / a)
    const predictHoursForScore = (targetScore: number): number | null => {
        if (targetScore <= currentScore) return 0 // Already passed
        if (slope <= 1) return null // Valid learning curve should have positive slope. If negative or flat, we can't predict growth.

        // Cap extreme predictions (if slope is tiny, time explodes)
        const expectedLogX = (targetScore - intercept) / slope
        // Safety cap: e^10 is ~22,000 hours. Too much.
        if (expectedLogX > 8) return -1 // "Never" / Too long

        const totalHoursNeeded = Math.exp(expectedLogX)
        const remainingHours = totalHoursNeeded - totalStudyTimeHours

        return remainingHours > 0 ? remainingHours : 0
    }

    // 4. Calculate Milestones
    const milestones = [50, 80, 90, 100]
    const predictionDates: Record<string, Date | null> = {}

    // Average study hours per day over the last week to estimate "Real Date"
    const lastSession = sorted[sorted.length - 1].date
    const firstSession = sorted[0].date
    // Avoid division by zero days
    const daysActive = Math.max(1, differenceInDays(lastSession, firstSession) + 1)

    // Calculate "Study Velocity" (Hours per Day)
    // We default to at least 15 mins/day if data is sparse to give optimistic predictions
    const hoursPerDay = Math.max(0.25, totalStudyTimeHours / daysActive)

    milestones.forEach(m => {
        const hoursNeeded = predictHoursForScore(m)
        if (hoursNeeded === null || hoursNeeded === -1) {
            predictionDates[`mastery${m}`] = null // Infinite/Unknown
        } else if (hoursNeeded === 0) {
            predictionDates[`mastery${m}`] = new Date() // Done
        } else {
            // Convert hours needed to days based on user's velocity
            const daysNeeded = hoursNeeded / hoursPerDay
            predictionDates[`mastery${m}`] = addDays(new Date(), Math.ceil(daysNeeded))
        }
    })

    // 5. Next Milestone Logic
    let nextMilestone = null
    const upcoming = milestones.find(m => m > currentScore)
    if (upcoming && predictionDates[`mastery${upcoming}`]) {
        const hours = predictHoursForScore(upcoming) || 0
        nextMilestone = {
            target: upcoming,
            date: predictionDates[`mastery${upcoming}`]!,
            hoursNeeded: hours
        }
    }

    // 6. Secondary Metrics
    const retentionIndex = calculateRetentionIndex(sorted)

    // Slope * 10 gives roughly "% gain per e-fold time increase". 
    // Let's simpler measure: Average Gain Per Hour recently.
    // Last 3 sessions gain / time.
    const learningVelocity = Math.max(0, slope * 5) // Abstract score, purely for visual "Speed" gauge

    return {
        currentMastery: Math.min(100, Math.max(0, Math.round(currentScore))),
        predictions: {
            mastery50: predictionDates.mastery50!,
            mastery80: predictionDates.mastery80!,
            mastery90: predictionDates.mastery90!,
            mastery100: predictionDates.mastery100!,
        },
        learningVelocity,
        totalStudyTimeHours,
        retentionIndex,
        nextMilestone
    }
}

/**
 * Rough heuristic for retention based on consistency.
 * High consistency (frequent plays) + High Scores = High Retention.
 */
function calculateRetentionIndex(sessions: SetSessionData[]): number {
    if (sessions.length === 0) return 0

    // Factor 1: Recent Score Weighting (60%)
    const recentSessions = sessions.slice(-3)
    const avgRecentScore = recentSessions.reduce((a, b) => a + b.score, 0) / recentSessions.length

    // Factor 2: Consistency (Time since last play) (40%)
    const lastPlayed = sessions[sessions.length - 1].date
    const daysSince = differenceInDays(new Date(), lastPlayed)
    const recencyScore = Math.max(0, 100 - (daysSince * 10)) // Lose 10% per day not played

    return Math.round((avgRecentScore * 0.6) + (recencyScore * 0.4))
}
