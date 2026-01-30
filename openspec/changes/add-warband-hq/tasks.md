# Tasks: Add Warband HQ Application

## 1. Project Setup
- [x] 1.1 Create Flask application skeleton (`app.py`)
- [x] 1.2 Initialize `data.json` with 6 tank characters and default structure
- [x] 1.3 Create directory structure (`templates/`, `static/`)
- [x] 1.4 Set up CSS variables and base styles (`static/style.css`)

## 2. Blizzard API Integration
- [x] 2.1 Implement OAuth token fetch (`POST https://oauth.battle.net/token`)
- [x] 2.2 Add token caching (24-hour expiry)
- [x] 2.3 Implement character equipment endpoint call
- [x] 2.4 Parse API response to extract ilvl per slot and item names
- [x] 2.5 Create POST `/api/blizzard/config` for credential storage
- [x] 2.6 Create POST `/api/character/<id>/sync` for single character sync
- [x] 2.7 Create POST `/api/sync-all` for bulk sync of all 6 characters
- [x] 2.8 Add Settings panel in UI for API credentials input

## 3. Backend API
- [x] 3.1 Implement GET `/api/data` to return full data
- [x] 3.2 Implement POST `/api/character/<id>/gear` for manual gear overrides
- [x] 3.3 Implement POST `/api/character/<id>/crests` for crest updates
- [x] 3.4 Implement POST `/api/character/<id>/profession` for profession updates
- [x] 3.5 Implement POST `/api/character/<id>/checklist` for daily checklist
- [x] 3.6 Implement POST `/api/meta` for week number updates
- [x] 3.7 Add atomic JSON write with temp file for crash safety

## 4. Frontend Foundation
- [x] 4.1 Create `index.html` with tab navigation structure
- [x] 4.2 Implement tab switching logic in `app.js`
- [x] 4.3 Create immediate-save utility (save on every change event)
- [x] 4.4 Add save indicator (showing "Saved" / "Saving...")

## 5. Dashboard View
- [x] 5.1 Build 3x2 character card grid layout
- [x] 5.2 Display average ilvl (from API sync)
- [x] 5.3 Implement ilvl delta calculation and display (vs weekly target)
- [x] 5.4 Add crest status summary badges per character
- [x] 5.5 Add daily maintenance checklist (World Boss, 2x Bountiful Delves)
- [x] 5.6 Add "Sync All Gear" button with loading state
- [x] 5.7 Show last sync timestamp per character

## 6. Gearing Engine
- [x] 6.1 Create gear slot viewer (16 slots per character, auto-populated)
- [x] 6.2 Implement Track dropdown (Veteran/Champion/Hero/Myth) for manual override
- [x] 6.3 Add manual ilvl override input (optional, API takes precedence on sync)
- [x] 6.4 Display item names from API
- [x] 6.5 Show average ilvl calculation
- [x] 6.6 Show ilvl vs weekly target comparison with color coding

## 7. Crest Ledger View
- [x] 7.1 Build spreadsheet-style table for all 6 characters
- [x] 7.2 Add inputs for 4 crest types per character
- [x] 7.3 Implement "collected_this_week" column
- [x] 7.4 Implement "total_collected" column (cumulative all-time)
- [x] 7.5 Display weekly cap available (90 × current_week)
- [x] 7.6 Add progress indicator (e.g., "60/90 this week, 240/360 total available")
- [x] 7.7 Add "CAP REACHED" badge when weekly collection equals 90
- [x] 7.8 Add weekly reset functionality (resets collected_this_week to 0)

## 8. Profession Hub View
- [x] 8.1 Create profession matrix table (6 chars × their 2 professions)
- [x] 8.2 Add boolean toggles (Weekly Quest, Patron Orders, Treatise)
- [x] 8.3 Add Knowledge Points input field
- [x] 8.4 Add Concentration slider/input (0-1000)
- [x] 8.5 Show completion status per character

## 9. Timeline View
- [x] 9.1 Build vertical scrolling 12-week roadmap structure
- [x] 9.2 Add Week 1-3 milestones (Tier 8 Delve, Campaign)
- [x] 9.3 Add Week 4-7 milestones (Spark of Omen, Heroic Raid, 4-set)
- [x] 9.4 Add Week 8-12 milestones (Mythic Track, BiS optimization)
- [x] 9.5 Highlight current week

## 10. Polish & Testing
- [x] 10.1 Test Blizzard API sync flow end-to-end
- [x] 10.2 Test all immediate-save flows
- [x] 10.3 Verify responsive layout on different screen sizes
- [x] 10.4 Add keyboard navigation support
- [x] 10.5 Final UI polish and consistency check
