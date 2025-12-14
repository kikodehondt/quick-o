-- Database schema for Vocab Trainer
-- Upgrade: metadata & shareable link codes for vocab_sets
ALTER TABLE vocab_sets
  ADD COLUMN IF NOT EXISTS link_code text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS year text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Unique link code for sharing
CREATE UNIQUE INDEX IF NOT EXISTS vocab_sets_link_code_key ON vocab_sets (link_code);

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
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_studied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(set_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_word_pairs_set_id ON word_pairs(set_id);
CREATE INDEX IF NOT EXISTS idx_study_progress_set_id ON study_progress(set_id);

-- Enable Row Level Security (RLS)
ALTER TABLE vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your needs)
CREATE POLICY "Allow all operations on vocab_sets" ON vocab_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on word_pairs" ON word_pairs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on study_progress" ON study_progress FOR ALL USING (true) WITH CHECK (true);
