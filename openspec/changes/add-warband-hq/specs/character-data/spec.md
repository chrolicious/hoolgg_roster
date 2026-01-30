# Character Data Specification

## ADDED Requirements

### Requirement: Character Storage
The system SHALL persist character data in a JSON file (`data.json`) that survives application restarts.

#### Scenario: Data persistence across restarts
- **WHEN** the user updates any character data
- **THEN** the change is written to `data.json` immediately
- **AND** restarting the application loads the saved data

#### Scenario: Atomic writes prevent corruption
- **WHEN** the application crashes during a save
- **THEN** the previous valid data remains intact

### Requirement: Six Tank Characters
The system SHALL initialize with exactly 6 tank characters with predefined profession assignments.

#### Scenario: Initial character roster
- **WHEN** the application starts with no existing data
- **THEN** 6 characters are created:
  - Tank 1 (Main): Alchemy, Engineering
  - Tank 2: Blacksmithing, Mining
  - Tank 3: Leatherworking, Skinning
  - Tank 4: Jewelcrafting, Mining
  - Tank 5: Enchanting, Inscription
  - Tank 6: Tailoring, Herbalism

### Requirement: Character Identification
Each character SHALL have a unique numeric ID (1-6), a display name, and optional Blizzard API identifiers (realm, character_name).

#### Scenario: Character lookup by ID
- **WHEN** an API request references character ID 3
- **THEN** the system returns data for Tank 3 (Leatherworking/Skinning)

#### Scenario: Blizzard API linking
- **WHEN** the user sets realm "Area-52" and character_name "Mytank" for character 1
- **THEN** the Blizzard API sync uses those identifiers to fetch gear

### Requirement: Meta Information
The system SHALL track global metadata including current progression week (1-12) and last update timestamp.

#### Scenario: Week tracking
- **WHEN** the user advances to week 5
- **THEN** `meta.current_week` is set to 5
- **AND** weekly targets and crest caps update accordingly

### Requirement: Blizzard API Configuration
The system SHALL store Blizzard API credentials (client_id, client_secret, region) for gear synchronization.

#### Scenario: Save API credentials
- **WHEN** the user enters valid Blizzard API credentials
- **THEN** credentials are saved to `data.json` under `blizzard_config`
- **AND** gear sync functionality becomes available

### Requirement: Immediate Save
The system SHALL save data immediately on every change without delay.

#### Scenario: Immediate persistence
- **WHEN** the user changes any input field
- **THEN** the data is saved immediately (not debounced)
- **AND** a "Saved" indicator confirms the save
