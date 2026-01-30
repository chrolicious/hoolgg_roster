# Design: Warband HQ Application

## Context
Building a local-first web application for WoW Midnight expansion character management. Target user is a developer/theorycrafter managing 6 Tank characters over a 12-week progression cycle.

**Constraints:**
- Local-only (no external database)
- Must be zero-friction (immediate auto-save)
- Single developer workflow
- Blizzard API for gear automation

## Goals / Non-Goals

**Goals:**
- Automate everything possible (gear fetching from Blizzard API)
- Fast, responsive UI with instant feedback
- Clear visualization of progression gaps
- Unified view of all 6 characters
- Easy weekly data entry for crests and professions

**Non-Goals:**
- Multi-user support
- Cloud sync
- Mobile app
- Crest/currency API (not available from Blizzard)

## Decisions

### Decision 1: Blizzard API for Gear Data
**Choice:** Use official Blizzard Battle.net API to fetch character equipment
**Rationale:**
- Eliminates manual gear entry (16 slots × 6 chars = 96 inputs automated)
- Official API with reliable data
- Free OAuth credentials
- Returns ilvl, item names, slot info

**API Endpoint:** `GET /profile/wow/character/{realm}/{character}/equipment`
**Auth:** OAuth 2.0 Client Credentials flow
**Rate Limits:** 36,000 requests/hour (more than sufficient)

**Alternatives considered:**
- Raider.io API: Less complete, third-party
- Web scraping: Against ToS, fragile
- Manual entry only: Error-prone, tedious

### Decision 2: Flask + JSON Storage
**Choice:** Python Flask with flat `data.json` file
**Rationale:**
- Minimal setup, no database installation
- Human-readable data for manual inspection/backup
- Sufficient for 6-character dataset (~50KB max)
- Easy to version control data

### Decision 3: Single-Page Application with Vanilla JS
**Choice:** One `index.html` with CSS tab switching, no framework
**Rationale:**
- Zero build step
- Minimal dependencies
- Fast load times
- Easy to understand and modify

### Decision 4: Immediate Save on Every Change
**Choice:** Save immediately on every input change, no debounce delay
**Rationale:**
- Zero data loss risk
- User requested immediate persistence
- Local file writes are fast (<10ms)
- No network latency concerns (localhost)

**Implementation:**
```javascript
input.addEventListener('change', () => saveImmediately());
input.addEventListener('input', () => saveImmediately());
```

### Decision 5: Progressive Weekly Crest Caps
**Choice:** Track cumulative weekly cap (90 × current_week)
**Rationale:**
- WoW crest cap increases each week
- Week 1: 90 max, Week 2: 180 max, Week 12: 1080 max
- Need to track: collected_this_week, total_collected, weekly_cap_available

## Data Model

```json
{
  "meta": {
    "current_week": 1,
    "last_updated": "2025-01-29T12:00:00Z"
  },
  "blizzard_config": {
    "client_id": "",
    "client_secret": "",
    "region": "us"
  },
  "characters": [
    {
      "id": 1,
      "name": "Tank 1 (Main)",
      "realm": "",
      "character_name": "",
      "professions": ["Alchemy", "Engineering"],
      "gear": {
        "head": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "neck": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "shoulder": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "back": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "chest": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "wrist": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "hands": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "waist": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "legs": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "feet": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "ring1": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "ring2": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "trinket1": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "trinket2": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "main_hand": {"ilvl": 0, "track": "Veteran", "item_name": ""},
        "off_hand": {"ilvl": 0, "track": "Veteran", "item_name": ""}
      },
      "avg_ilvl": 0,
      "last_gear_sync": null,
      "crests": {
        "weathered": {"collected_this_week": 0, "total_collected": 0},
        "carved": {"collected_this_week": 0, "total_collected": 0},
        "runed": {"collected_this_week": 0, "total_collected": 0},
        "gilded": {"collected_this_week": 0, "total_collected": 0}
      },
      "profession_progress": {
        "Alchemy": {
          "weekly_quest": false,
          "patron_orders": false,
          "treatise": false,
          "knowledge_points": 0,
          "concentration": 1000
        },
        "Engineering": { }
      },
      "daily_checklist": {
        "world_boss": false,
        "bountiful_delve_1": false,
        "bountiful_delve_2": false
      }
    }
  ]
}
```

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | Serve index.html |
| GET | `/api/data` | Return full data.json |
| POST | `/api/character/<id>/gear` | Update gear slot (manual override) |
| POST | `/api/character/<id>/crests` | Update crest values |
| POST | `/api/character/<id>/profession` | Update profession progress |
| POST | `/api/character/<id>/checklist` | Update daily checklist |
| POST | `/api/meta` | Update week number |
| POST | `/api/blizzard/config` | Save Blizzard API credentials |
| POST | `/api/character/<id>/sync` | Fetch gear from Blizzard API |
| POST | `/api/sync-all` | Sync all 6 characters from Blizzard API |

## Blizzard API Integration

### Authentication Flow
1. User enters Client ID + Secret in Settings
2. App requests OAuth token: `POST https://oauth.battle.net/token`
3. Token cached for 24 hours
4. Gear requests use Bearer token

### Sync Flow
1. User clicks "Sync Gear" button
2. App calls Blizzard API for character equipment
3. Response parsed: extract ilvl per slot, average ilvl
4. Data merged into local storage (preserves manual Track overrides)
5. Last sync timestamp updated

### Rate Limiting
- Blizzard allows 36,000 requests/hour
- 6 characters × 4 syncs/day = 24 requests/day (well under limit)

## Crest Cap Calculation

```python
def get_weekly_cap(current_week):
    """Weekly cap increases by 90 each week"""
    return 90 * current_week

# Week 1: 90 available
# Week 4: 360 available
# Week 12: 1080 available
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| JSON corruption on crash | Atomic write with temp file + rename |
| Blizzard API down | Graceful fallback to manual entry |
| OAuth credentials storage | Stored locally, user responsibility |
| Data loss | Immediate save on every change |

## File Structure

```
midnight_tracker/
├── app.py              # Flask application + Blizzard API client
├── data.json           # Persistent storage
├── templates/
│   └── index.html      # SPA frontend
├── static/
│   ├── style.css       # Styling
│   └── app.js          # Frontend logic
└── openspec/           # Specifications
```

## Open Questions
- None currently blocking implementation
