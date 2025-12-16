-- Add creator_name column to vocab_sets (replaces author_name)
-- This stores the user's full name at the time of set creation

ALTER TABLE vocab_sets 
  ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- Migrate existing author_name data if needed
UPDATE vocab_sets 
SET creator_name = author_name 
WHERE author_name IS NOT NULL AND creator_name IS NULL;

-- Note: is_anonymous column already exists in schema
-- When is_anonymous = true, creator_name will be hidden in the UI
