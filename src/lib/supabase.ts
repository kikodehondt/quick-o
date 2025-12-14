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
  created_at?: string
  word_count?: number
}

export interface StudyProgress {
  id?: number
  set_id: number
  correct_count: number
  incorrect_count: number
  last_studied?: string
}

export type StudyMode = 'flashcard' | 'typing'
export type StudyDirection = 'forward' | 'reverse' | 'both'

export interface StudySettings {
  mode: StudyMode
  direction: StudyDirection
  caseSensitive: boolean
  accentSensitive: boolean
}
