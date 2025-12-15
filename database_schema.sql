-- Database schema for Vocab Trainer
-- Upgrade: metadata & shareable link codes for vocab_sets (fully idempotent)

-- Create function to generate random base62 codes (only if not exists)
CREATE OR REPLACE FUNCTION generate_base62_code(length INT DEFAULT 10) RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * 62)::INT + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop existing UNIQUE constraint if it exists (to allow re-adding)
ALTER TABLE IF EXISTS vocab_sets DROP CONSTRAINT IF EXISTS vocab_sets_link_code_key CASCADE;

-- Add columns if they don't exist
ALTER TABLE IF EXISTS vocab_sets
  ADD COLUMN IF NOT EXISTS link_code text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS year text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Add UNIQUE constraint on link_code
ALTER TABLE IF EXISTS vocab_sets ADD CONSTRAINT vocab_sets_link_code_key UNIQUE (link_code);

-- Generate proper base62 codes for existing sets without link_code
UPDATE vocab_sets 
SET link_code = generate_base62_code(10)
WHERE link_code IS NULL OR link_code LIKE 'tmp%';

-- Table for storing vocabulary sets
CREATE TABLE IF NOT EXISTS vocab_sets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language1 TEXT DEFAULT 'Nederlands',
  language2 TEXT DEFAULT 'Frans',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing word pairs
CREATE TABLE IF NOT EXISTS word_pairs (
  id BIGSERIAL PRIMARY KEY,
  set_id BIGINT NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  word1 TEXT NOT NULL,
  word2 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking study progress
CREATE TABLE IF NOT EXISTS study_progress (
  id BIGSERIAL PRIMARY KEY,
  set_id BIGINT NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  user_id TEXT,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_studied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(set_id, user_id)
);

-- Add user_id column to existing study_progress table if it doesn't have it
ALTER TABLE IF EXISTS study_progress ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Drop and recreate the UNIQUE constraint on study_progress to include user_id
ALTER TABLE IF EXISTS study_progress DROP CONSTRAINT IF EXISTS study_progress_set_id_key CASCADE;
ALTER TABLE IF EXISTS study_progress DROP CONSTRAINT IF EXISTS study_progress_set_id_user_id_key CASCADE;
ALTER TABLE IF EXISTS study_progress ADD CONSTRAINT study_progress_set_id_user_id_key UNIQUE(set_id, user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_word_pairs_set_id ON word_pairs(set_id);
CREATE INDEX IF NOT EXISTS idx_study_progress_set_id ON study_progress(set_id);
CREATE INDEX IF NOT EXISTS idx_study_progress_user_id ON study_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_sets_link_code ON vocab_sets(link_code);
CREATE INDEX IF NOT EXISTS idx_vocab_sets_created_by ON vocab_sets(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS word_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_progress ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they exist
DROP POLICY IF EXISTS "Allow all operations on vocab_sets" ON vocab_sets CASCADE;
DROP POLICY IF EXISTS "Allow all operations on word_pairs" ON word_pairs CASCADE;
DROP POLICY IF EXISTS "Allow all operations on study_progress" ON study_progress CASCADE;

CREATE POLICY "Allow all operations on vocab_sets" ON vocab_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on word_pairs" ON word_pairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on study_progress" ON study_progress FOR ALL USING (true) WITH CHECK (true);
