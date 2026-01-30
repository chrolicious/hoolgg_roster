# Hool.gg Roster - WoW Character Tracker

A character progression tracker for World of Warcraft's Midnight expansion. Available as both a desktop application and web app. Part of the Hool.gg ecosystem.

## 🖥️ Desktop App (Recommended)

**[Download Latest Release](https://github.com/YOUR_USERNAME/midnight_tracker/releases/latest)**

The desktop app provides:
- ✅ **One-Click Install** - No Python or technical setup required
- ✅ **Auto-Updates** - Automatically downloads and installs new versions
- ✅ **Native Experience** - Proper Windows app with system tray integration
- ✅ **Bundled Dependencies** - Everything included, no conflicts

**System Requirements**: Windows 10/11 (64-bit)

**Installation**:
1. Download `Hool.gg Roster Setup.exe` from releases
2. Run the installer
3. Launch from desktop shortcut or Start Menu
4. Configure your Blizzard API credentials in Settings

For developers and advanced users, see [ELECTRON_SETUP.md](ELECTRON_SETUP.md) for building from source.

## 🌐 Web App (Alternative)

Prefer running locally via Python? Follow the installation steps below.

## Features

- **Blizzard API Integration**: Auto-sync gear data for all characters
- **Gearing Engine**: Track 16 gear slots per character with ilvl and upgrade tracks
- **Dynamic Weekly Targets**: Compare progress against week-specific ilvl goals
- **Crest Ledger**: Track 4 crest types with progressive weekly caps
- **Profession Hub**: Manage profession progress across 12 professions
- **Timeline**: 12-week roadmap with progression milestones
- **Immediate Auto-Save**: Zero data loss with instant persistence
- **Drag & Drop Reordering**: Customize character display order

## Web App Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Blizzard API (Optional but Recommended)

1. Visit [develop.battle.net](https://develop.battle.net/) and create an account
2. Create a new OAuth client:
   - Name: "Warband HQ"
   - Redirect URL: `http://localhost` (check "I do not have a service URL")
3. Copy your **Client ID** and **Client Secret**

### 3. Run the Application

```bash
python app.py
```

The app will start on [http://localhost:5000](http://localhost:5000)

## Setup Guide

### First Time Setup

1. **Configure Blizzard API** (Settings tab):
   - Enter your Client ID and Client Secret
   - Select your region (US, EU, KR, TW)
   - Click "Save API Configuration"

2. **Configure Characters** (Settings tab):
   - For each of your 6 tanks, enter:
     - Display name (e.g., "Main Tank")
     - Realm name (e.g., "Area-52")
     - Character name (e.g., "Mytank")

3. **Sync Gear** (Dashboard):
   - Click "Sync All Gear from Blizzard API"
   - Gear data for all configured characters will auto-populate

### Daily Workflow

1. **Update Crests** (Crest Ledger tab):
   - Enter crests collected today
   - Track progress against weekly/total caps

2. **Check Profession Tasks** (Profession Hub tab):
   - Toggle completed weekly tasks
   - Update Knowledge Points and Concentration

3. **Daily Checklist** (Dashboard cards):
   - Check off: World Boss, Bountiful Delves

### Weekly Workflow

1. **Advance Week** (Week selector at top):
   - Change to the new week number
   - Weekly crest collection resets automatically

2. **Review Timeline** (Timeline tab):
   - Check milestones for the current week

## Data Storage

All data is stored in `data.json` in the project directory. This file is:
- Human-readable JSON format
- Safe to backup/version control (credentials stored locally)
- Atomically written (crash-safe)

To backup: Simply copy `data.json` to a safe location.

## Weekly ilvl Targets

| Week  | Target ilvl | Content Phase |
|-------|-------------|---------------|
| 0     | 215         | Pre-Season Prep (Mar 2-16) |
| 1-2   | 235         | Heroic Week / Mythic+ Opens |
| 3-4   | 250         | Final Raid Opens |
| 5-8   | 265         | Steady Progression |
| 9-12  | 280         | Optimization Phase |

## Crest System

- **Weekly Cap**: 90 per crest type per week
- **Cumulative Cap**: 90 × current_week (e.g., Week 4 = 360 total available)
- **Tracked Fields**:
  - `collected_this_week`: Resets on week advance
  - `total_collected`: Cumulative all-time

## Pre-Configured Characters

1. **Tank 1 (Main)**: Alchemy / Engineering
2. **Tank 2**: Blacksmithing / Mining
3. **Tank 3**: Leatherworking / Skinning
4. **Tank 4**: Jewelcrafting / Mining
5. **Tank 5**: Enchanting / Inscription
6. **Tank 6**: Tailoring / Herbalism

## Troubleshooting

### Gear sync fails

- Verify your Blizzard API credentials in Settings
- Check that realm and character names are spelled correctly
- Ensure your character is on the correct region
- Character must be level 80 and have public armory enabled

### Data not saving

- Check console for errors (F12 → Console)
- Verify `data.json` has write permissions
- Ensure Flask server is running

### Port 5000 already in use

Edit `app.py` and change the port:
```python
app.run(debug=True, port=5001)
```

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: Vanilla JavaScript (no build step)
- **Storage**: JSON file (local)
- **API**: Blizzard Battle.net OAuth 2.0

## License

This is a personal project tool. Not affiliated with or endorsed by Blizzard Entertainment.
