# Change: Add Warband HQ Application

## Why
Managing 6 Tank characters across the first 12 weeks of WoW's Midnight expansion requires tracking gear progression, crest caps, profession cooldowns, and weekly targets. Currently there's no unified tool to handle this multi-character coordination efficiently.

## What Changes
- **NEW**: Flask backend with JSON-based persistence (`app.py`, `data.json`)
- **NEW**: Single-page application frontend with tab navigation (`index.html`)
- **NEW**: Blizzard API integration to auto-fetch gear data (ilvl, slots, tracks) for all characters
- **NEW**: Gearing Engine with 16 gear slots per character, auto-populated from API with manual override capability
- **NEW**: Dynamic weekly ilvl targets (235 Wk1-2, 250 Wk3-4, 265 Wk5-8, 280 Wk9-12)
- **NEW**: Crest Ledger tracking 4 crest types with progressive weekly caps (90/week cumulative)
- **NEW**: Profession Hub tracking 12 professions across 6 tanks with Knowledge Points and Concentration
- **NEW**: Dashboard view with 3x2 character card grid showing ilvl deltas and daily checklists
- **NEW**: Timeline view with 12-week vertical roadmap for progression milestones
- **NEW**: Immediate save on every change (no data loss)

## Impact
- Affected specs: character-data, gearing-engine, crest-ledger, profession-hub, dashboard-views (all new)
- Affected code: Creates new `app.py`, `index.html`, `data.json`, `static/` directory
- Breaking changes: None (greenfield project)
- External dependency: Blizzard Battle.net API (free OAuth credentials required)

## Automation Summary
| Data | Source | Method |
|------|--------|--------|
| Gear (ilvl, slots) | Blizzard API | Auto-fetch on demand |
| Average ilvl | Blizzard API | Auto-calculated |
| Crests | Manual | Not available via API |
| Professions | Manual | Not available via API |
| Daily checklist | Manual | User input |

## Success Criteria
- One-click gear sync from Blizzard API for all 6 characters
- Immediate save on every input change (no debounce-only delay)
- Sub-second response times for all operations
- GitHub-style dark mode aesthetic (#0d1117 background, #161b22 cards, #58a6ff accents)
- Mobile-friendly responsive layout
