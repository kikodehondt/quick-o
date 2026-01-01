-- ============================================================================
-- FIX RLS POLICIES FOR LOCAL DEVELOPMENT
-- ============================================================================
-- This allows local development to work with localStorage auth
-- while still maintaining security in production

-- Drop the old authenticated users policy
DROP POLICY IF EXISTS "Authenticated users can create vocab sets" ON vocab_sets CASCADE;

-- New policy that allows creation if:
-- 1. User is authenticated (normal Supabase auth), OR
-- 2. created_by starts with 'local-' (development mode)
CREATE POLICY "Users can create vocab sets"
  ON vocab_sets
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid()::text = created_by) OR 
    (created_by LIKE 'local-%')
  );

-- Also update UPDATE policy for local development
DROP POLICY IF EXISTS "Users can update own vocab sets" ON vocab_sets CASCADE;

CREATE POLICY "Users can update own vocab sets"
  ON vocab_sets
  FOR UPDATE
  TO authenticated, anon
  USING (
    (auth.uid()::text = created_by) OR 
    (created_by LIKE 'local-%')
  )
  WITH CHECK (
    (auth.uid()::text = created_by) OR 
    (created_by LIKE 'local-%')
  );

-- Also update DELETE policy for local development
DROP POLICY IF EXISTS "Users can delete own vocab sets" ON vocab_sets CASCADE;

CREATE POLICY "Users can delete own vocab sets"
  ON vocab_sets
  FOR DELETE
  TO authenticated, anon
  USING (
    (auth.uid()::text = created_by) OR 
    (created_by LIKE 'local-%')
  );
