# Changelog

All notable changes to Quick-O will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-07

### Added
- **Changelog Modal**: New "Updates" button in top-left header showing all releases and updates
- Release history with 3 tabs: "Wat is nieuw" (latest), "Alle versies" (history), "Roadmap" (upcoming)
- Badge notification system: Shows count of unread updates in red bubble (capped at 9+)
- Automatic tracking of last viewed changelog per user using localStorage
- Unread updates calculation from Supabase changelog_entries table
- Beautiful release cards with type badges (Feature, Bugfix, Breaking, Performance, Docs)
- GitHub integration link in changelog footer
- Professional version management system with semantic versioning

### Technical
- New `changelog_entries` Supabase table with UUID primary key
- `ChangelogEntry` interface for type safety
- RLS policies: Public read access, admin-only write/delete
- SQL migration file for database setup
- Automated unread tracking effect in App.tsx

## [1.1.1] - 2026-01-06

### Fixed
- TypeScript compilation error in StudySettingsModal word selection
- Include `set_id` in query for proper type casting

## [1.1.0] - 2026-01-06

### Added
- **Multi-range word selection**: Users can now combine multiple ranges (e.g., 1-100 AND 250-300) in "Bereik" mode
- "+" button to add multiple study ranges with individual delete buttons
- Improved selection change detection in Learn mode
- Learn mode now properly responds to selection changes via SessionSettings mid-session

### Fixed
- Learn mode selection handling: Settings now properly tracked with `prevSettingsRef`
- Learn mode counters ("x te gaan") now reflect selected word count after filtering
- Learn mode no longer carries over progress when selection changes
- Multiple Choice mode now draws distractors from complete set while limiting questions to selection
- Dependency array improvements for robust change detection

### Changed
- Replaced naive dependency array with smart JSON.stringify comparison in Learn mode
- Selection changes now trigger proper mode rebuilds with resetted progress

## [1.0.0] - 2025-12-15

### Initial Release
- Core vocabulary practice modes: Learn, Flashcards, Typing, Multiple Choice
- User authentication with hCaptcha
- Database: Word sets and pairs with Supabase
- Study progress tracking (local + cloud)
- Directional practice (forward, reverse, both)
- Shuffle option
- Case and accent sensitivity settings
- Drag-to-swipe functionality for flashcards
- Responsive design with Tailwind CSS
- Dark mode ready color scheme

