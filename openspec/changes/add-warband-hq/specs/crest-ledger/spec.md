# Crest Ledger Specification

## ADDED Requirements

### Requirement: Four Crest Types
The system SHALL track four crest types per character: Weathered, Carved, Runed, and Gilded.

#### Scenario: View crest inventory
- **WHEN** the user opens the Crest Ledger
- **THEN** all 4 crest types are shown for each of the 6 characters

### Requirement: Weekly Collection Tracking
Each crest type SHALL track `collected_this_week` (0 to 90 per week).

#### Scenario: Record weekly crest collection
- **WHEN** the user enters 45 for Weathered crests collected this week
- **THEN** `collected_this_week` is set to 45 and immediately saved

### Requirement: Total Collection Tracking
Each crest type SHALL track `total_collected` (cumulative crests earned all-time).

#### Scenario: Update total collected
- **WHEN** the user enters 180 total Carved crests collected
- **THEN** `total_collected` is set to 180

### Requirement: Progressive Weekly Cap
The system SHALL calculate the total available crests based on current week (90 × current_week).

#### Scenario: Week 1 cap
- **WHEN** current week is 1
- **THEN** maximum total available per crest type is 90

#### Scenario: Week 4 cap
- **WHEN** current week is 4
- **THEN** maximum total available per crest type is 360

#### Scenario: Week 12 cap
- **WHEN** current week is 12
- **THEN** maximum total available per crest type is 1080

### Requirement: Cap Progress Display
The system SHALL display progress against both weekly and cumulative caps.

#### Scenario: Weekly progress indicator
- **WHEN** `collected_this_week` is 60 and weekly cap is 90
- **THEN** display "60/90 this week"

#### Scenario: Total progress indicator
- **WHEN** `total_collected` is 240 and total available is 360 (week 4)
- **THEN** display "240/360 total"

#### Scenario: Weekly cap reached indicator
- **WHEN** `collected_this_week` equals 90
- **THEN** display "CAP REACHED" badge for that crest type

### Requirement: Spreadsheet-Style Input
The Crest Ledger view SHALL display as a table with characters as rows and crest types as columns.

#### Scenario: Quick data entry
- **WHEN** the user views the Crest Ledger
- **THEN** they can tab through inputs to quickly update all 6 characters

### Requirement: Weekly Reset
The system SHALL reset `collected_this_week` to 0 for all characters when advancing to a new week.

#### Scenario: Advance week
- **WHEN** the user advances from week 3 to week 4
- **THEN** all `collected_this_week` values reset to 0
- **AND** `total_collected` values are preserved
- **AND** total available cap increases to 360
