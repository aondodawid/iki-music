## ADDED Requirements

### Requirement: Complete installable manifest

The system MUST provide a complete web app manifest including identity metadata, colors, scope, start URL, display mode, and icon set.

#### Scenario: Manifest is generated with full metadata

- **GIVEN** a production build of the app
- **WHEN** the browser requests the web app manifest
- **THEN** the manifest contains name, short_name, description, theme_color, background_color, display, start_url, and scope
- **AND** the manifest includes install icons with explicit size and purpose metadata

### Requirement: Install experience metadata

The system SHALL include optional manifest metadata to improve install UX, including shortcuts and screenshots where available.

#### Scenario: Install surfaces include richer metadata

- **GIVEN** a compliant browser reading manifest metadata
- **WHEN** install surfaces are rendered
- **THEN** shortcuts and screenshots metadata are available for use
- **AND** missing optional metadata does not break installability
