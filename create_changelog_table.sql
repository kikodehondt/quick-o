-- Create changelog_entries table for version management (if it doesn't exist)
CREATE TABLE IF NOT EXISTS changelog_entries (
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

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_changelog_release_date ON changelog_entries(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog_entries(version);

-- Enable RLS (if not already enabled)
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON changelog_entries;
DROP POLICY IF EXISTS "Disable insert for all" ON changelog_entries;
DROP POLICY IF EXISTS "Disable update for all" ON changelog_entries;
DROP POLICY IF EXISTS "Disable delete for all" ON changelog_entries;

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

-- Insert initial changelog entries (or update if they already exist)
INSERT INTO changelog_entries (version, release_date, type, title, description, highlights)
VALUES
  (
    '1.2.0',
    NOW(),
    'feature',
    'Volg je updates',
    'Je ziet nu direct welke nieuwe dingen er in Quick-O zijn! Een mooie overzicht van alle versies met alles wat er veranderd is.',
    ARRAY['Updates knop linksboven in de app', 'Rode indicator als je iets gemist hebt', 'Overzicht van alles wat voorbij is geweest']
  ),
  (
    '1.1.1',
    NOW() - INTERVAL '1 day',
    'bugfix',
    'Kleine fout opgelost',
    'We hebben een klein probleempje uit de weg geruimd dat soms voor problemen zorgde. Alles werkt nu nog beter.',
    ARRAY['App werkt nu soepeler', 'Alles is netjes opgelost']
  ),
  (
    '1.1.0',
    NOW() - INTERVAL '3 days',
    'feature',
    'Selecteer meerdere bereiken tegelijk',
    'Je kunt nu heel flexibel kiezen welke woorden je wilt oefenen. Wil je woord 100-200 EN 250-300? Geen probleem!',
    ARRAY['Kies meerdere bereiken tegelijk', 'Je selectie wordt meteen opgeslagen', 'Learn mode werkt nu beter met je keuzes']
  ),
  (
    '1.0.0',
    NOW() - INTERVAL '1 week',
    'feature',
    'Quick-O is live! 🎉',
    'Welkom bij Quick-O! Een manier om woordjes op een leuke en effectieve manier te leren. Met flashcards, typing, en multiple choice - kies zelf wat het beste voor jou werkt.',
    ARRAY['Leer woordjes op je eigen tempo', 'Volg je voortgang', 'Deel woordensets met vrienden']
  )
ON CONFLICT (version) DO UPDATE SET
  release_date = EXCLUDED.release_date,
  type = EXCLUDED.type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  updated_at = NOW();


