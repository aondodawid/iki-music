## ADDED Requirements

### Requirement: Real-time accompaniment generation

The system MUST generate AI accompaniment from the user's live music input and keep generated output aligned with the current session timeline.

#### Scenario: Successful accompaniment session

- **GIVEN** a user starts a live jam session and grants required audio/input permissions
- **WHEN** the user plays and AI accompaniment mode is enabled
- **THEN** the system generates accompaniment that is synchronized to the active session
- **AND** the user can hear or preview the generated accompaniment in-session

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
