-- Create changelog_entries table for version management
CREATE TABLE changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feature', 'bugfix', 'breaking', 'performance', 'docs')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on release_date for sorting
CREATE INDEX idx_changelog_release_date ON changelog_entries(release_date DESC);
CREATE INDEX idx_changelog_version ON changelog_entries(version);

-- Enable RLS
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view changelog)
CREATE POLICY "Enable read access for all users" ON changelog_entries
  FOR SELECT USING (true);

-- Only admin can insert/update/delete (we'll handle this manually or via app backend)
CREATE POLICY "Disable insert for all" ON changelog_entries
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Disable update for all" ON changelog_entries
  FOR UPDATE WITH CHECK (false);

CREATE POLICY "Disable delete for all" ON changelog_entries
  FOR DELETE USING (false);

-- Insert initial changelog entries
INSERT INTO changelog_entries (version, release_date, type, title, description, highlights)
VALUES
  (
    '1.1.1',
    NOW() - INTERVAL '1 hour',
    'bugfix',
    'TypeScript Build Error Fix',
    'Fixed missing set_id field in Learn mode query that was causing TypeScript compilation errors. This ensures the learn mode properly fetches all required word data.',
    ARRAY['Fixed set_id in Learn mode Supabase query', 'Build now passes TypeScript checks']
  ),
  (
    '1.1.0',
    NOW() - INTERVAL '1 day',
    'feature',
    'Multi-Range Selection & Learn Mode Improvements',
    'Added advanced study selection with multiple range support. Users can now select words from multiple ranges (e.g., 100-200, 250-300). Learn mode now properly detects selection changes and rebuilds word lists accordingly.',
    ARRAY['Multi-range word selection (addRange/removeRange)', 'Learn mode change detection with prevSettingsRef', 'Multiple choice options from full word pool', 'Improved selection UX with clear visual feedback', 'Fixed Learn mode dependency tracking']
  ),
  (
    '1.0.0',
    NOW() - INTERVAL '5 days',
    'feature',
    'Initial Release',
    'Quick-O official launch! A comprehensive vocabulary learning platform with multiple study modes, progress tracking, and collaborative learning features.',
    ARRAY['Flashcard mode with adaptive spacing', 'Typing mode for practical writing', 'Multiple choice with instant feedback', 'Shared word sets with link codes', 'Study progress tracking', 'Responsive design for all devices']
  );
