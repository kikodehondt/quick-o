-- Add is_public column to vocab_sets
-- This allows users to control whether their sets are publicly discoverable
-- Private sets (is_public = false) can only be accessed via direct link

ALTER TABLE vocab_sets 
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Create index for better query performance when filtering by visibility
CREATE INDEX IF NOT EXISTS idx_vocab_sets_is_public ON vocab_sets(is_public);

-- By default, make all existing sets public (backwards compatible)
UPDATE vocab_sets 
SET is_public = true 
WHERE is_public IS NULL;

-- Comments for clarity
COMMENT ON COLUMN vocab_sets.is_public IS 'Controls whether the set appears in public listings. Private sets can only be accessed via direct link.';
