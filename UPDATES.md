# Hool.gg Roster - Update: Week-Aware Task System

## What Changed

### Old System (Static)
- Fixed daily checklist: World Boss, 2x Bountiful Delves
- Same tasks every week regardless of progression

### New System (Week-Aware)
- **Weekly Maintenance Section**: Shows tasks specific to current week
- **Dynamic Daily Tasks**: Changes based on what content is available
- **Accurate Timeline**: Based on actual Midnight expansion unlock schedule

## Weekly Task Breakdown

### Week 0 - Pre-Season Prep (Mar 2-16)
**Weekly:**
- Level your characters to max level (90)
- Unlock Delves up to Tier 8/11
- Farm random heroic dungeons (ilvl 224 gear)
- Complete world quests for initial gear upgrades
- Fill vault slots (Champion track gear possible)

**Daily:**
- Level remaining characters
- Farm Delves for gear
- Queue random heroic dungeons
- Complete world quests

**Target ilvl:** 215 (baseline for Week 1)

---

### Week 1 - Heroic Week (Mar 17)
**Weekly:**
- LFR for tier pieces (unlock catalyst charges)
- Complete Mythic 0 tour (8 dungeons)
- Clear Normal raid
- Clear Heroic raid

**Daily:**
- Kill world boss
- Complete Prey quest
- Farm high-level Delves (coffer keys)

### Week 2 - Mythic+ Opens (Mar 24)
**Weekly:**
- LFR for tier pieces
- Mythic raid progression
- Fill 3 vault slots (6x M+10)

**Daily:**
- Kill world boss
- Farm M+10s for gear/crests
- Delves for crests (if needed)

### Week 3 - Final Raid Opens (Mar 31)
**Weekly:**
- Full raid reclear before mythic
- March on Quel'danas clear
- Fill 3 vault slots (6x M+12)

**Daily:**
- Kill world boss
- Farm M+12s for vault/crests

### Weeks 4-12 - Ongoing Progression
**Weekly:**
- Mythic raid progression
- Fill 3 vault slots (6x M+12)
- Craft/upgrade gear pieces

**Daily:**
- Kill world boss
- Farm M+12s

## Important Notes

### Crest Spending
- **DO NOT** spend Heroic/Mythic crests during weeks 1-2
- Begin spending after week 3's raid reclear
- Prevents wasting upgrades on items that get replaced

### Content Unlock Timeline
- **Week 0 (Mar 2-16)**: Pre-Season - Delves, Heroic dungeons, World quests
- **Week 1 (Mar 17)**: Heroic raid only, no M+
- **Week 2 (Mar 24)**: Mythic raid + M+ opens
- **Week 3 (Mar 31)**: March on Quel'danas raid

### Task Tracking
- **Weekly tasks**: Persist across days, reset when advancing week
- **Daily tasks**: Reset each day (use "Reset Daily" button in Settings)
- Completion tracked per character

## UI Changes

### Dashboard
- New "Weekly Maintenance" section at top
- Shows week name (e.g., "Heroic Week")
- Lists all weekly focus tasks
- Daily tasks now specific to current week content

### Timeline
- Updated with actual Midnight dates
- Shows content unlock schedule
- Week-specific milestones based on guide

## How to Use

1. **Start of Week**: Review Weekly Maintenance section
2. **Daily Login**: Check daily tasks for each character
3. **Week Advancement**: Use week selector - daily tasks auto-reset
4. **Manual Reset**: Settings tab has "Reset Daily Tasks" button

## Data Migration

Your existing `data.json` has been automatically updated:
- Removed old `daily_checklist` structure
- Added new `weekly_tasks` and `daily_tasks` objects
- All data preserved, just restructured
