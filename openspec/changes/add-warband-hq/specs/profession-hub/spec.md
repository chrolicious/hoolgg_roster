# Profession Hub Specification

## ADDED Requirements

### Requirement: Twelve Profession Coverage
The system SHALL track 12 WoW professions across the 6 tank characters: Alchemy, Engineering, Blacksmithing, Mining, Leatherworking, Skinning, Jewelcrafting, Enchanting, Inscription, Tailoring, Herbalism.

#### Scenario: View profession matrix
- **WHEN** the user opens the Profession Hub
- **THEN** a matrix shows all 6 characters with their 2 professions each

### Requirement: Weekly Quest Toggle
Each profession SHALL have a boolean toggle for "Weekly Quest" completion status.

#### Scenario: Mark weekly quest complete
- **WHEN** the user toggles Weekly Quest ON for Tank 1's Alchemy
- **THEN** the toggle is checked and auto-saved

### Requirement: Patron Orders Toggle
Each profession SHALL have a boolean toggle for "Patron Orders" completion status.

#### Scenario: Mark patron orders complete
- **WHEN** the user toggles Patron Orders ON for Tank 3's Leatherworking
- **THEN** the toggle is checked and auto-saved

### Requirement: Treatise Toggle
Each profession SHALL have a boolean toggle for "Treatise" completion status.

#### Scenario: Mark treatise complete
- **WHEN** the user toggles Treatise ON for Tank 5's Enchanting
- **THEN** the toggle is checked and auto-saved

### Requirement: Knowledge Points Tracking
Each profession SHALL track current Knowledge Points (KP) as a numeric value.

#### Scenario: Update knowledge points
- **WHEN** the user enters 150 KP for Tank 2's Blacksmithing
- **THEN** the value is saved and displayed

### Requirement: Concentration Tracking
Each profession SHALL track Concentration as a value from 0 to 1000.

#### Scenario: Update concentration
- **WHEN** the user sets Concentration to 750 for Tank 4's Jewelcrafting
- **THEN** the value is saved (valid range 0-1000)

#### Scenario: Concentration validation
- **WHEN** the user enters 1500 for Concentration
- **THEN** the value is clamped to 1000

### Requirement: Completion Status
The system SHALL indicate when all weekly profession tasks (Quest, Orders, Treatise) are complete for a character.

#### Scenario: All tasks complete
- **WHEN** a character has all 3 toggles checked for both professions
- **THEN** display a "Complete" indicator for that character
