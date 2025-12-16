-- ============================================================================
-- SECURE ROW LEVEL SECURITY POLICIES FOR VOCAB TRAINER
-- ============================================================================
-- This file implements strict security policies requiring authentication
-- Users can only modify their own data, but can read public vocab sets
-- Run this AFTER enabling Supabase Auth in your project
-- ============================================================================

-- Step 1: Drop all existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on vocab_sets" ON vocab_sets CASCADE;
DROP POLICY IF EXISTS "Allow all operations on word_pairs" ON word_pairs CASCADE;
DROP POLICY IF EXISTS "Allow all operations on study_progress" ON study_progress CASCADE;

-- ============================================================================
-- VOCAB SETS POLICIES
-- ============================================================================

-- Anyone can READ vocab sets (public sharing feature)
CREATE POLICY "Anyone can read vocab sets"
  ON vocab_sets
  FOR SELECT
  USING (true);

-- Only authenticated users can CREATE vocab sets
-- The created_by field is automatically set to auth.uid()
CREATE POLICY "Authenticated users can create vocab sets"
  ON vocab_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = created_by
  );

-- Users can only UPDATE their own vocab sets
CREATE POLICY "Users can update own vocab sets"
  ON vocab_sets
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by)
  WITH CHECK (auth.uid()::text = created_by);

-- Users can only DELETE their own vocab sets
CREATE POLICY "Users can delete own vocab sets"
  ON vocab_sets
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = created_by);

-- ============================================================================
-- WORD PAIRS POLICIES
-- ============================================================================

-- Anyone can READ word pairs (needed for public sets)
CREATE POLICY "Anyone can read word pairs"
  ON word_pairs
  FOR SELECT
  USING (true);

-- Authenticated users can INSERT word pairs for sets they own
CREATE POLICY "Users can create word pairs for own sets"
  ON word_pairs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND vocab_sets.created_by = auth.uid()::text
    )
  );

-- Users can UPDATE word pairs only for sets they own
CREATE POLICY "Users can update word pairs for own sets"
  ON word_pairs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND vocab_sets.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND vocab_sets.created_by = auth.uid()::text
    )
  );

-- Users can DELETE word pairs only for sets they own
CREATE POLICY "Users can delete word pairs for own sets"
  ON word_pairs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vocab_sets
      WHERE vocab_sets.id = word_pairs.set_id
      AND vocab_sets.created_by = auth.uid()::text
    )
  );

-- ============================================================================
-- STUDY PROGRESS POLICIES
-- ============================================================================

-- Users can only READ their own study progress
CREATE POLICY "Users can read own study progress"
  ON study_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Users can INSERT their own study progress
CREATE POLICY "Users can create own study progress"
  ON study_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Users can UPDATE their own study progress
CREATE POLICY "Users can update own study progress"
  ON study_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can DELETE their own study progress
CREATE POLICY "Users can delete own study progress"
  ON study_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- SECURITY CHECKS AND VERIFICATION
-- ============================================================================

-- Verify RLS is enabled (should all return true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('vocab_sets', 'word_pairs', 'study_progress');

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- ADDITIONAL SECURITY RECOMMENDATIONS
-- ============================================================================

-- 1. Enable Email Confirmations in Supabase Dashboard:
--    Authentication > Settings > Enable email confirmations

-- 2. Set up Rate Limiting in Supabase Dashboard:
--    Project Settings > API > Rate Limiting

-- 3. Enable Captcha for sign-ups:
--    Authentication > Settings > Enable Captcha protection

-- 4. Set session timeout:
--    Authentication > Settings > JWT expiry

-- 5. Monitor usage:
--    Check logs regularly in Database > Logs

-- ============================================================================
-- TESTING QUERIES (Run these to verify security)
-- ============================================================================

-- Test 1: Try to read vocab_sets (should work for everyone)
-- SELECT * FROM vocab_sets LIMIT 5;

-- Test 2: Try to insert without auth (should fail)
-- INSERT INTO vocab_sets (name, created_by) VALUES ('Test', 'fake-user-id');

-- Test 3: Try to delete someone else's set (should fail)
-- DELETE FROM vocab_sets WHERE created_by != auth.uid()::text;

-- Test 4: Check your own data (should work when authenticated)
-- SELECT * FROM vocab_sets WHERE created_by = auth.uid()::text;
