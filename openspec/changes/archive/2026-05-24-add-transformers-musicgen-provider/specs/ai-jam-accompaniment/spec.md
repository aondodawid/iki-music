## MODIFIED Requirements

### Requirement: Real-time accompaniment generation

The system MUST generate AI accompaniment from the user's live music input using a Transformers.js MusicGen-compatible model and keep generated output aligned with the current session timeline.

#### Scenario: Successful accompaniment session

- **GIVEN** a user starts a live jam session and grants required audio/input permissions
- **WHEN** the user plays and AI accompaniment mode is enabled
- **THEN** the system generates accompaniment audio through the configured local Transformers.js model
- **AND** the user can hear or preview the generated accompaniment in-session
