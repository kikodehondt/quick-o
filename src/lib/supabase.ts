import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface WordPair {
  id?: number
  set_id: number
  dutch: string
  french: string
  created_at?: string
}

export interface VocabSet {
  id?: number
  name: string
  description?: string
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
