import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface WordPair {
  id?: number
  set_id: number
  word1: string
  word2: string
  created_at?: string
}

export interface VocabSet {
  id?: number
  name: string
  description?: string
  language1: string
  language2: string
  link_code?: string
  tags?: string[]
  school?: string
  direction?: string
  year?: string
  creator_name?: string | null
  is_anonymous?: boolean
  created_at?: string
  created_by?: string
  word_count?: number
}

// Helper: genereer 10-tekens base62 code (a-zA-Z0-9)
export function generateLinkCode(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export interface StudyProgress {
  id?: number
  set_id: number
  correct_count: number
  incorrect_count: number
  last_studied?: string
  progress_state?: any
}

export type StudyMode = 'flashcard' | 'typing' | 'learn'
export type StudyDirection = 'forward' | 'reverse' | 'both'

export interface StudySettings {
  mode: StudyMode
  direction: StudyDirection
  caseSensitive: boolean
  accentSensitive: boolean
  shuffle: boolean
}
