## MODIFIED Requirements

### Requirement: Real-time accompaniment generation

The system MUST generate AI accompaniment from the user's live music input using a Transformers.js MusicGen-compatible model, keep generated output aligned with the current session timeline, and honor requested preview duration for returned audio output.

#### Scenario: Successful accompaniment session

- **GIVEN** a user starts a live jam session and grants required audio/input permissions
- **WHEN** the user plays, sets a valid preview duration, and AI accompaniment mode is enabled
- **THEN** the system generates accompaniment audio through the configured local Transformers.js model
- **AND** the returned audio preview is shaped to the requested duration target for playback
