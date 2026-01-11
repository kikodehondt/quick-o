import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface VocabPair {
  id?: number
  word_1: string
  word_2: string
  language_1?: string
  language_2?: string
  created_at?: string
}

export interface SetPair {
  set_id: number
  pair_id: number
  created_at?: string
  // Helper property for join results
  vocab_pairs?: VocabPair
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
  is_public?: boolean
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

export type StudyMode = 'flashcard' | 'typing' | 'learn' | 'multiple-choice'
export type StudyDirection = 'forward' | 'reverse' | 'both'

export interface StudySettings {
  mode: StudyMode
  direction: StudyDirection
  caseSensitive: boolean
  accentSensitive: boolean
  shuffle: boolean
  retryMistakes?: boolean
  /**
   * Optional lijst van woord IDs om te oefenen. Wanneer gezet worden alleen deze
   * woorden geladen in alle oefenmodi. Handig voor bereik- of handmatige selectie.
   */
  selectedWordIds?: number[]
  /** Onthoudt welke selectie-mode werd gekozen (all | range | custom). */
  selectionMode?: 'all' | 'range' | 'custom'
  /** Originele range (1-based) zodat we later dezelfde selectie opnieuw kunnen toepassen. */
  rangeStart?: number
  rangeEnd?: number
}

export interface ChangelogEntry {
  id: string
  version: string
  release_date: string
  type: 'feature' | 'bugfix' | 'breaking' | 'performance' | 'docs'
  title: string
  description: string
  highlights?: string[]
  created_at?: string
}

export interface RoadmapTicket {
  id: number
  created_at: string
  updated_at: string
  title: string
  description: string | null
  status: 'idea' | 'planned' | 'in-progress' | 'completed'
  priority: number
  tags: string[]
}
