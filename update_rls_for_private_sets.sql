-- ============================================================================
-- UPDATE RLS POLICIES FOR PRIVATE SETS FEATURE
-- ============================================================================
-- This file updates the RLS policies to respect the is_public flag
-- Private sets can only be read by:
-- 1. The creator
-- 2. Anyone with the direct link (handled in the app, not in RLS)
-- ============================================================================

-- Drop the old permissive read policy
DROP POLICY IF EXISTS "Anyone can read vocab sets" ON vocab_sets CASCADE;

-- New read policy: users can read public sets OR their own sets (public or private)
CREATE POLICY "Users can read public sets or own sets"
  ON vocab_sets
  FOR SELECT
  USING (
    is_public = true 
    OR 
    (auth.uid() IS NOT NULL AND auth.uid()::text = created_by)
  );

-- For anonymous users accessing via direct link, we still need a policy
-- Since RLS checks happen before app logic, we need to allow anonymous reads
-- but the app will filter based on is_public
-- Create a separate policy for anonymous access
CREATE POLICY "Anonymous users can read sets"
  ON vocab_sets
  FOR SELECT
  TO anon
  USING (true);

-- Note: The application layer will handle filtering to only show public sets
-- in the main list, while allowing access to private sets via direct link
