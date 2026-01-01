-- ============================================================================
-- MISTAKE TRACKING FOR INTELLIGENT MULTIPLE CHOICE
-- ============================================================================
-- Tracks wrong answers to generate smarter distractor options
-- Uses percentages to avoid feedback loops

-- Create mistake_tracking table
CREATE TABLE IF NOT EXISTS mistake_tracking (
  id BIGSERIAL PRIMARY KEY,
  set_id BIGINT NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  correct_word_id BIGINT NOT NULL REFERENCES word_pairs(id) ON DELETE CASCADE,
  wrong_answer TEXT NOT NULL,
  mistake_count INTEGER DEFAULT 1,
  times_shown INTEGER DEFAULT 0, -- How many times this option was shown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries for same wrong answer on same word
  UNIQUE(correct_word_id, wrong_answer)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mistake_tracking_set_id ON mistake_tracking(set_id);
CREATE INDEX IF NOT EXISTS idx_mistake_tracking_correct_word_id ON mistake_tracking(correct_word_id);
CREATE INDEX IF NOT EXISTS idx_mistake_tracking_percentage ON mistake_tracking((mistake_count::float / GREATEST(times_shown, 1)));

-- Enable RLS
ALTER TABLE mistake_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone can read mistake tracking (for generating better options)
CREATE POLICY "Anyone can read mistake tracking"
  ON mistake_tracking
  FOR SELECT
  USING (true);

-- Anyone can insert/update mistake tracking (anonymous learning data)
CREATE POLICY "Anyone can record mistakes"
  ON mistake_tracking
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update mistake counts"
  ON mistake_tracking
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Function to increment mistake count or create new entry
CREATE OR REPLACE FUNCTION record_mistake(
  p_set_id BIGINT,
  p_correct_word_id BIGINT,
  p_wrong_answer TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO mistake_tracking (set_id, correct_word_id, wrong_answer, mistake_count)
  VALUES (p_set_id, p_correct_word_id, p_wrong_answer, 1)
  ON CONFLICT (correct_word_id, wrong_answer) 
  DO UPDATE SET 
    mistake_count = mistake_tracking.mistake_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to record when an option was shown (for percentage calculation)
CREATE OR REPLACE FUNCTION record_option_shown(
  p_correct_word_id BIGINT,
  p_shown_answer TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO mistake_tracking (set_id, correct_word_id, wrong_answer, mistake_count, times_shown)
  VALUES (
    (SELECT set_id FROM word_pairs WHERE id = p_correct_word_id),
    p_correct_word_id, 
    p_shown_answer, 
    0, 
    1
  )
  ON CONFLICT (correct_word_id, wrong_answer) 
  DO UPDATE SET 
    times_shown = mistake_tracking.times_shown + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- View for easy percentage calculation
CREATE OR REPLACE VIEW mistake_percentages AS
SELECT 
  id,
  set_id,
  correct_word_id,
  wrong_answer,
  mistake_count,
  times_shown,
  CASE 
    WHEN times_shown > 0 THEN (mistake_count::float / times_shown * 100)
    ELSE 0
  END as mistake_percentage,
  created_at,
  updated_at
FROM mistake_tracking
WHERE times_shown >= 3; -- Only show options that have been shown at least 3 times

-- Clean up old/rare mistakes periodically (optional, run manually)
-- DELETE FROM mistake_tracking WHERE mistake_count < 2 AND updated_at < NOW() - INTERVAL '30 days';
