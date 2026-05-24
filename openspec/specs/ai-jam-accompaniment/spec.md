# ai-jam-accompaniment Specification

## Purpose
TBD - created by archiving change add-ai-music-generation-modes. Update Purpose after archive.
## Requirements
### Requirement: Real-time accompaniment generation

The system MUST generate AI accompaniment from the user's live music input using a Transformers.js MusicGen-compatible model, keep generated output aligned with the current session timeline, and honor requested preview duration for returned audio output.

#### Scenario: Successful accompaniment session

- **GIVEN** a user starts a live jam session and grants required audio/input permissions
- **WHEN** the user plays, sets a valid preview duration, and AI accompaniment mode is enabled
- **THEN** the system generates accompaniment audio through the configured local Transformers.js model
- **AND** the returned audio preview is shaped to the requested duration target for playback

### Requirement: Latency and generation-state feedback

The system SHALL present generation state and latency feedback so users understand when accompaniment is processing, ready, or degraded.

#### Scenario: Processing feedback during generation

- **GIVEN** a live jam session with accompaniment enabled
- **WHEN** the model is processing new input
- **THEN** the UI displays an explicit processing state
- **AND** the UI updates to ready or degraded when state changes

### Requirement: Accessible control of accompaniment

The system MUST provide WCAG-compliant controls for enabling, muting, and stopping accompaniment.

#### Scenario: Keyboard-only control

- **GIVEN** a user navigates using keyboard-only interaction
- **WHEN** the user focuses accompaniment controls and activates them
- **THEN** enable, mute, and stop actions are available without pointer input
- **AND** control state changes are exposed with accessible labels/status text

