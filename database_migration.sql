-- Migration: Add language fields to vocab_sets

-- Add language columns
ALTER TABLE vocab_sets ADD COLUMN IF NOT EXISTS language1 TEXT DEFAULT 'Nederlands';
ALTER TABLE vocab_sets ADD COLUMN IF NOT EXISTS language2 TEXT DEFAULT 'Frans';

-- Rename existing columns to be language-agnostic
ALTER TABLE word_pairs RENAME COLUMN dutch TO word1;
ALTER TABLE word_pairs RENAME COLUMN french TO word2;

-- Track which user created each set
ALTER TABLE vocab_sets ADD COLUMN IF NOT EXISTS created_by UUID;

-- Progress state storage
ALTER TABLE study_progress ADD COLUMN IF NOT EXISTS progress_state JSONB;
