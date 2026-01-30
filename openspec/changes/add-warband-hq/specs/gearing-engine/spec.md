# Gearing Engine Specification

## ADDED Requirements

### Requirement: Blizzard API Gear Sync
The system SHALL fetch gear data from the Blizzard API to auto-populate character equipment.

#### Scenario: Single character sync
- **WHEN** the user clicks "Sync" for a character with valid realm/name configured
- **THEN** the system calls Blizzard API `/profile/wow/character/{realm}/{character}/equipment`
- **AND** all 16 gear slots are updated with ilvl and item names from the response
- **AND** last_gear_sync timestamp is updated

#### Scenario: Bulk sync all characters
- **WHEN** the user clicks "Sync All Gear"
- **THEN** the system syncs all 6 characters sequentially
- **AND** shows progress indicator during sync

#### Scenario: Sync preserves manual Track overrides
- **WHEN** gear is synced from Blizzard API
- **THEN** the Track field (Veteran/Champion/Hero/Myth) is NOT overwritten
- **AND** only ilvl and item_name are updated from API

#### Scenario: API unavailable fallback
- **WHEN** the Blizzard API is unavailable or credentials are invalid
- **THEN** an error message is displayed
- **AND** manual entry remains functional

### Requirement: Gear Slot Tracking
The system SHALL track 16 gear slots per character: Head, Neck, Shoulder, Back, Chest, Wrist, Hands, Waist, Legs, Feet, Ring 1, Ring 2, Trinket 1, Trinket 2, Main Hand, Off Hand.

#### Scenario: View all gear slots
- **WHEN** the user opens a character's gear panel
- **THEN** all 16 slots are displayed with current ilvl, track, and item name

#### Scenario: Manual gear override
- **WHEN** the user manually changes Head slot to ilvl 245
- **THEN** the slot is updated and immediately saved
- **AND** the manual value persists until next API sync

### Requirement: Gear Track Classification
Each gear slot SHALL have a Track property with values: Veteran, Champion, Hero, or Myth.

#### Scenario: Track dropdown selection
- **WHEN** the user clicks the Track field for a slot
- **THEN** a dropdown shows Veteran, Champion, Hero, Myth options

#### Scenario: Track persists through sync
- **WHEN** a user sets Track to "Hero" and later syncs from API
- **THEN** the Track remains "Hero" (API does not provide track info)

### Requirement: Average Item Level Calculation
The system SHALL calculate average ilvl across all 16 slots for each character.

#### Scenario: Calculate average ilvl from API data
- **WHEN** gear is synced from Blizzard API
- **THEN** average ilvl is calculated from all equipped items
- **AND** displayed rounded to 1 decimal place

#### Scenario: Empty slots counted as zero
- **WHEN** a character has 10 slots with ilvl 250 and 6 empty slots (ilvl 0)
- **THEN** the average is (10×250 + 6×0) / 16 = 156.25

### Requirement: Dynamic Weekly Targets
The system SHALL compare average ilvl against progression-week-specific targets.

#### Scenario: Week 1-2 target
- **WHEN** current week is 1 or 2
- **THEN** the target ilvl is 235

#### Scenario: Week 3-4 target
- **WHEN** current week is 3 or 4
- **THEN** the target ilvl is 250

#### Scenario: Week 5-8 target
- **WHEN** current week is 5, 6, 7, or 8
- **THEN** the target ilvl is 265

#### Scenario: Week 9-12 target
- **WHEN** current week is 9, 10, 11, or 12
- **THEN** the target ilvl is 280

### Requirement: Item Level Delta Display
The system SHALL display the difference between average ilvl and weekly target.

#### Scenario: Behind target
- **WHEN** average ilvl is 242 and target is 250
- **THEN** display delta as "-8.0" with red indicator

#### Scenario: At or above target
- **WHEN** average ilvl is 252 and target is 250
- **THEN** display delta as "+2.0" with green indicator
