## ADDED Requirements

### Requirement: User-configurable generation duration

The system SHALL provide a live accompaniment control allowing users to select target preview duration in seconds before generation starts.

#### Scenario: Select duration before generate

- **GIVEN** a user is in live accompaniment mode
- **WHEN** the user changes the duration control
- **THEN** the selected duration is preserved in local form state
- **AND** the next generation request includes the selected duration value

### Requirement: Safe default and bounds

The system MUST enforce a default duration and bounded valid range for duration input.

#### Scenario: Duration outside accepted range

- **GIVEN** a duration value outside accepted limits
- **WHEN** request construction runs
- **THEN** the duration is clamped to the nearest supported bound
- **AND** generation proceeds with a valid duration value
