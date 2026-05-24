## ADDED Requirements

### Requirement: Prompt-based music generation

The system MUST allow users to describe desired music in chat and generate a music result from that prompt.

#### Scenario: Generate from chat prompt

- **GIVEN** a user opens the chat generation mode
- **WHEN** the user submits a valid text prompt describing the target music
- **THEN** the system starts generation and returns a generated music result linked to that prompt
- **AND** the result is shown in the session with playback controls

### Requirement: Prompt validation and recovery

The system SHALL validate prompt submission and provide actionable recovery guidance when generation fails.

#### Scenario: Empty or invalid prompt

- **GIVEN** a user is in chat generation mode
- **WHEN** the user submits an empty or invalid prompt
- **THEN** the system rejects the request with a clear validation message
- **AND** the user can edit and resubmit without losing session context

### Requirement: Accessible chat and result navigation

The system MUST provide WCAG-compliant navigation for chat history, generation status, and result playback controls.

#### Scenario: Screen-reader friendly result updates

- **GIVEN** a user with assistive technology submits a prompt
- **WHEN** generation status changes from processing to complete or failed
- **THEN** status updates are announced through accessible live-region semantics
- **AND** generated results can be reached and controlled via keyboard navigation
