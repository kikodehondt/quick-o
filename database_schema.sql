-- Database schema for Vocab Trainer

-- Table for storing vocabulary sets
CREATE TABLE IF NOT EXISTS vocab_sets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing word pairs
CREATE TABLE IF NOT EXISTS word_pairs (
  id BIGSERIAL PRIMARY KEY,
  set_id BIGINT NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  dutch TEXT NOT NULL,
  french TEXT NOT NULL,
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
