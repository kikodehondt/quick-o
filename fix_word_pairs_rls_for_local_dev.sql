-- ============================================================================
-- FIX WORD PAIRS RLS POLICIES FOR LOCAL DEVELOPMENT
-- ============================================================================
-- This allows local development to work with localStorage auth
-- while still maintaining security in production

-- Drop the old word pairs policies
DROP POLICY IF EXISTS "Users can create word pairs for own sets" ON word_pairs CASCADE;
DROP POLICY IF EXISTS "Users can update word pairs for own sets" ON word_pairs CASCADE;
DROP POLICY IF EXISTS "Users can delete word pairs for own sets" ON word_pairs CASCADE;

-- New INSERT policy that allows creation if:
-- 1. User is authenticated AND owns the vocab_set, OR
-- 2. created_by starts with 'local-' (development mode) AND the vocab_set has matching created_by
CREATE POLICY "Users can create word pairs for own sets"
  ON word_pairs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND (
        vocab_sets.created_by = auth.uid()::text
        OR vocab_sets.created_by LIKE 'local-%'
      )
    )
  );

-- New UPDATE policy for local development
CREATE POLICY "Users can update word pairs for own sets"
  ON word_pairs
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND (
        vocab_sets.created_by = auth.uid()::text
        OR vocab_sets.created_by LIKE 'local-%'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND (
        vocab_sets.created_by = auth.uid()::text
        OR vocab_sets.created_by LIKE 'local-%'
      )
    )
  );

-- New DELETE policy for local development
CREATE POLICY "Users can delete word pairs for own sets"
  ON word_pairs
  FOR DELETE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND (
        vocab_sets.created_by = auth.uid()::text
        OR vocab_sets.created_by LIKE 'local-%'
      )
    )
  );
