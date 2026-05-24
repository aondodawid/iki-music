## ADDED Requirements

### Requirement: Transformers.js baseline integration

The system MUST include a minimal Transformers.js inference path that can be invoked from app code.

#### Scenario: Local inference call path exists

- **GIVEN** the app source code after bootstrap
- **WHEN** a developer triggers the baseline AI generation function
- **THEN** the app executes a Transformers.js call path with typed inputs and outputs
- **AND** errors are surfaced with actionable messages

### Requirement: Hugging Face API baseline integration

The system MUST include a Hugging Face integration path configured through environment variables.

#### Scenario: Remote inference call path exists

- **GIVEN** Hugging Face token/config is available in environment variables
- **WHEN** the app triggers the remote generation function
- **THEN** the request is sent through the Hugging Face client path
- **AND** response and failure cases are handled in app state
