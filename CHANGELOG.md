# Changelog

All notable changes to Hool.gg Roster will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-rev3] - 2026-01-30

### 🎨 Branding Updates

- **Updated Branding**: App now displays "Hool.gg //Roster"
- **Fixed Navigation**: Centered tabs properly to window (not just between elements)
- **Repository URLs**: Updated all GitHub URLs to actual repository
- **Consistency**: Updated README, page titles, and app header

## [0.1.0-rev2] - 2026-01-30

### 🎨 UI/UX Improvements

#### Visual Updates
- **Custom Logo**: Replaced placeholder logo with custom owl icon
- **Icon Consistency**: Updated both UI logo and window icon to match branding
- **Larger Logo**: Increased logo size from 64px to 80px for better visibility
- **Square Edges**: Removed rounded window corners for cleaner Windows integration

#### Typography Enhancements
- **100% Typography Consistency**: Fixed all hardcoded font sizes to use CSS custom properties
- **Better Readability**: Ensured consistent font hierarchy across all tabs (Dashboard, Timeline, Crest Ledger, Profession Hub, Settings)
- **Variable-Based System**: All font-size, font-weight, and line-height values now use CSS variables for easier maintenance

#### Layout Fixes
- **Content Spacing**: Added 24px right padding to main content area for proper spacing from scrollbar
- **Compact Empty State**: Reduced padding and simplified empty state display (removed verbose instructions)
- **No Characters Message**: Streamlined "No characters added yet" section for cleaner look

### 🛠️ Technical Improvements
- **Code Quality**: Eliminated inline styles in favor of CSS classes where possible
- **Maintainability**: Standardized all typography using CSS custom property variables
- **Cache Busting**: Implemented version parameters for logo to prevent browser caching issues

## [0.1.0] - 2026-01-30

### 🎉 Initial Release

First public release of Hool.gg Roster - A comprehensive WoW character tracker for the Midnight expansion.

### ✨ Features

#### Character Management
- **Multi-Character Support**: Track up to 6 characters simultaneously
- **Blizzard API Integration**: Automatic gear, stats, and avatar syncing from the Armory
- **Drag-and-Drop Reordering**: Organize characters in your preferred order
- **Class-Colored Display**: Character names styled with WoW class colors

#### Gear Tracking
- **Automatic Gear Sync**: Pull current equipment directly from Blizzard API
- **Complete Gear Display**: All 16 slots (head, neck, shoulders, back, chest, wrist, hands, waist, legs, feet, 2 rings, 2 trinkets, main hand, off hand)
- **Item Details**: Item level, quality, sockets, enchantments, and wowhead links
- **Average iLevel Calculation**: Automatic calculation with delta from weekly target
- **2H Weapon Support**: Correctly handles two-handed weapons in ilvl calculations

#### Character Stats
- **Primary Stats**: Strength, Agility, Intellect, Stamina
- **Secondary Stats**: Critical Strike, Haste, Mastery, Versatility (with percentages)
- **Compact Display**: Clean 6-stat grid for quick overview
- **Automatic Detection**: Shows relevant primary stat based on class

#### Week-Based Progression System
- **13 Week Timeline**: Pre-Season through Week 12 progression tracking
- **Week Selector**: Easy switching between weeks to view/plan progression
- **Weekly ilvl Targets**: Dynamic targets based on expansion timeline
- **Week-Aware Tasks**: Different task lists for each week of the season

#### Crest Ledger
- **4 Crest Types**: Weathered, Carved, Runed, Gilded tracking
- **Weekly History**: Per-week tracking with full edit history
- **Automatic Totals**: Total crests calculated from all weeks
- **Catchup Support**: No cap on weekly input for catchup mechanics
- **Visual Indicators**: CAP badges when hitting 90 weekly limit

#### Profession Hub
- **2 Professions per Character**: Track all 11 WoW professions
- **Weekly Tasks**: Quest, Patron Orders, Treatise completion tracking
- **Knowledge Points**: Track profession knowledge accumulation
- **Concentration**: Monitor resource regeneration (0-1000)
- **Progress Persistence**: All profession data saves automatically

#### Task Management
- **Weekly Tasks**: Week-specific task lists that persist
- **Daily Tasks**: Separate daily checklist that can be reset
- **Per-Character Tracking**: Independent completion status for each character
- **Collapsible Sections**: Clean UI with expandable gear/task sections

#### Timeline View
- **13-Week Roadmap**: Complete progression plan from pre-season to week 12
- **Content Unlock Schedule**: Raid, M+, and content unlock dates
- **Weekly Milestones**: Detailed goals for each week
- **Current Week Highlight**: Visual indicator for active week

#### UI/UX Improvements
- **Unified Typography System**: Consistent, readable font sizing throughout
  - Stat labels: 11px (previously 9px - unreadable)
  - Gear text: 11-12px (previously 10-11px)
  - Tab navigation: 14px (previously 13px)
  - Semantic CSS variables for all typography
- **Hool.gg Design System**: Purple/blue color palette with glow effects
- **Responsive Layout**: Works at various window sizes
- **Dark Theme**: Optimized for low-light environments
- **Info Boxes**: Helpful context in Settings with consistent styling
- **Guided Tour**: Interactive walkthrough for new users (Driver.js)

#### Desktop App (Electron)
- **Native Windows App**: Standalone desktop application
- **Embedded Python**: Bundled Flask backend (no external dependencies)
- **Custom Window Controls**: Minimize, maximize, close buttons
- **Drag-to-Reorder**: Native drag functionality for character cards
- **Auto-Updates**: Built-in update checking (electron-updater)

### 🏗️ Technical Features

#### Backend (Flask/Python)
- **RESTful API**: Clean endpoint structure for all operations
- **Atomic Saves**: Safe concurrent data updates
- **Data Migration**: Automatic schema updates on load
- **OAuth Integration**: Secure Blizzard API authentication
- **Token Caching**: Efficient API token management
- **Error Handling**: Graceful fallbacks and error messages

#### Frontend (Vanilla JS)
- **Zero Dependencies**: Pure JavaScript (no framework bloat)
- **Efficient Rendering**: Smart DOM updates and caching
- **LocalStorage**: Client-side state persistence
- **Icon Caching**: Reduced API calls for item icons
- **Auto-Save**: All changes save immediately

#### Data Structure
- **JSON Storage**: Simple, human-readable data format
- **Weekly History**: Complete per-week crest tracking
- **Task Persistence**: Historical task completion data
- **Profession Progress**: Per-character profession state
- **Character Order**: User-defined display order

### 📋 Content

#### Weekly Task Lists (13 Weeks)
- Pre-Season (Week 0): Leveling and initial gearing
- Week 1: Heroic raid, M0 tour, LFR
- Week 2: Mythic raid begins, M+ opens
- Week 3: March on Quel'danas unlocks
- Weeks 4-12: Ongoing progression with crafting

#### Profession Support
- All 11 professions: Alchemy, Blacksmithing, Enchanting, Engineering, Herbalism, Inscription, Jewelcrafting, Leatherworking, Mining, Skinning, Tailoring

#### Item Quality Colors
- Poor, Common, Uncommon, Rare, Epic, Legendary, Artifact, Heirloom

### 🔧 Configuration

#### Settings Panel
- **Blizzard API Setup**: Client ID, Client Secret, Region selection
- **Character Configuration**: Add/remove characters with realm and name
- **Utilities**: Daily checklist reset, guided tour restart

### 📦 Installation

#### Requirements
- Windows 10/11 (x64)
- ~150MB disk space

#### Installation Steps
1. Download `Hool.gg-Roster-Setup-0.1.0.exe`
2. Run installer
3. Choose installation directory
4. Launch from desktop shortcut or start menu

### 🚀 Getting Started

1. **Configure API** (optional but recommended):
   - Get free credentials at [develop.battle.net](https://develop.battle.net/)
   - Enter Client ID, Client Secret, and Region in Settings

2. **Add Characters**:
   - Go to Settings > Character Configuration
   - Add character name and realm for each character

3. **Sync Gear**:
   - Click "Sync All Gear from Blizzard API" on Dashboard
   - Or sync individual characters with the sync button on each card

4. **Track Progress**:
   - Use Week Selector to set current week
   - Mark off tasks as you complete them
   - Input crests earned each week
   - Track profession progress

### 🐛 Known Issues

- None reported yet!

### 📝 Notes

- All data stored locally in `data.json`
- API credentials never leave your device
- Weekly crest history enables accurate catchup tracking
- Task completion history preserved across weeks

### 🙏 Credits

- Built for the Hool.gg gaming community
- Designed for WoW: The War Within - Midnight expansion
- Powered by Blizzard's World of Warcraft API

---

## Coming in Future Releases

### Planned Features
- Export/import data functionality
- Multi-profile support for different characters/servers
- BiS (Best-in-Slot) gear planning
- Vault preview and optimization
- M+ score tracking
- Guild roster integration
- Calendar integration with reset timers
- Mobile companion app

### Under Consideration
- Raid progression tracking
- Achievement checklist
- Transmog collection tracking
- Mount/pet collection
- Alt army management

---

**Full Release Notes**: [GitHub Releases](https://github.com/YOUR_USERNAME/midnight_tracker/releases/tag/v0.1.0)
