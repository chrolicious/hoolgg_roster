# Dashboard and Views Specification

## ADDED Requirements

### Requirement: Tab Navigation
The application SHALL provide top-level tab navigation for: Dashboard, Timeline, Profession Matrix, Crest Ledger, and Settings.

#### Scenario: Switch between tabs
- **WHEN** the user clicks the "Timeline" tab
- **THEN** the Timeline view is displayed and other views are hidden

#### Scenario: Active tab indicator
- **WHEN** the user is on the Dashboard tab
- **THEN** the Dashboard tab has a visual active state (#58a6ff accent)

### Requirement: Dashboard Character Cards
The Dashboard SHALL display a 3x2 grid of character cards showing summary information.

#### Scenario: View dashboard
- **WHEN** the user opens the Dashboard
- **THEN** 6 character cards are displayed in a 3-column, 2-row grid

#### Scenario: Character card content
- **WHEN** viewing a character card
- **THEN** it shows: character name, average ilvl, ilvl delta vs target, crest summary, daily checklist, last sync time

### Requirement: Sync All Button
The Dashboard SHALL include a "Sync All Gear" button to fetch gear for all characters from Blizzard API.

#### Scenario: Bulk sync from dashboard
- **WHEN** the user clicks "Sync All Gear"
- **THEN** all 6 characters are synced from Blizzard API
- **AND** a loading indicator shows progress
- **AND** character cards update with new ilvl data

### Requirement: Daily Maintenance Checklist
Each character card SHALL include a daily checklist with: World Boss, Bountiful Delve 1, Bountiful Delve 2.

#### Scenario: Check off daily task
- **WHEN** the user checks "World Boss" for Tank 1
- **THEN** the checkbox is immediately saved and shows completed state

#### Scenario: Daily reset
- **WHEN** a new day begins (or manual reset)
- **THEN** all daily checklist items reset to unchecked

### Requirement: Timeline Roadmap
The Timeline view SHALL display a vertical scrolling 12-week roadmap with milestones.

#### Scenario: View timeline
- **WHEN** the user opens the Timeline
- **THEN** weeks 1-12 are displayed vertically with associated milestones

#### Scenario: Week 1-3 milestones
- **WHEN** viewing weeks 1-3
- **THEN** milestones include: Tier 8 Delve unlock, Campaign completion

#### Scenario: Week 4-7 milestones
- **WHEN** viewing weeks 4-7
- **THEN** milestones include: Spark of Omen usage, Heroic Raid gear, 4-set Tier tracking

#### Scenario: Week 8-12 milestones
- **WHEN** viewing weeks 8-12
- **THEN** milestones include: Mythic Track upgrades, BiS optimization

#### Scenario: Current week highlight
- **WHEN** the current week is 5
- **THEN** week 5 is visually highlighted in the timeline

### Requirement: Settings Panel
The application SHALL include a Settings tab for Blizzard API configuration.

#### Scenario: Configure API credentials
- **WHEN** the user opens Settings
- **THEN** inputs are shown for Client ID, Client Secret, and Region
- **AND** character realm/name fields for each of the 6 tanks

### Requirement: GitHub Dark Mode Theme
The application SHALL use a GitHub-style dark mode color scheme.

#### Scenario: Color palette
- **WHEN** the application renders
- **THEN** background is #0d1117, cards are #161b22, accents are #58a6ff

### Requirement: Immediate Save on Change
All inputs SHALL save immediately when values change.

#### Scenario: Immediate save on input
- **WHEN** the user changes any input value
- **THEN** the value is immediately saved to the server (no debounce delay)

#### Scenario: Save indicator
- **WHEN** a save is in progress
- **THEN** a "Saving..." indicator is shown
- **AND** changes to "Saved" when complete

### Requirement: Responsive Layout
The application SHALL adapt to different screen sizes using CSS Grid and Flexbox.

#### Scenario: Desktop view
- **WHEN** screen width is >= 1024px
- **THEN** dashboard shows 3-column grid

#### Scenario: Tablet view
- **WHEN** screen width is 768px-1023px
- **THEN** dashboard shows 2-column grid

#### Scenario: Mobile view
- **WHEN** screen width is < 768px
- **THEN** dashboard shows 1-column grid
