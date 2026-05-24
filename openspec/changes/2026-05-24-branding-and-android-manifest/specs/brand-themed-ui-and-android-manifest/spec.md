## ADDED Requirements

### Requirement: Artistic music-first branding

The system MUST present a clearly artistic, music-oriented visual style across core surfaces.

#### Scenario: User opens main interface

- **GIVEN** the app is loaded in a browser
- **WHEN** the main interface is rendered
- **THEN** the global palette and key controls reflect a distinct music-themed art direction
- **AND** primary actions remain clearly legible and actionable

### Requirement: Branded favicon

The system MUST provide a recognizable music-themed favicon.

#### Scenario: Browser tab displays app icon

- **GIVEN** the app tab is open
- **WHEN** the browser renders the favicon
- **THEN** the favicon uses the updated branded music symbol

### Requirement: User-controlled light and dark mode

The system MUST provide an explicit light/dark theme switch and persist the user preference.

#### Scenario: User toggles theme

- **GIVEN** the app interface is visible
- **WHEN** the user activates the theme switch
- **THEN** the color theme changes immediately
- **AND** the chosen theme persists on the next app load

### Requirement: WCAG-oriented interaction clarity

The system MUST provide visible keyboard focus indication and readable contrast across primary controls and key status surfaces.

#### Scenario: Keyboard navigation through controls

- **GIVEN** a keyboard-only user navigates interactive elements
- **WHEN** focus moves across controls
- **THEN** the focused element has a clearly visible focus indicator
- **AND** status and action controls remain readable in both light and dark themes

### Requirement: Android-ready manifest completeness

The system MUST provide install metadata compatible with Android-oriented PWA packaging workflows.

#### Scenario: Browser reads manifest metadata

- **GIVEN** a production build is served
- **WHEN** the browser requests the manifest
- **THEN** the manifest includes complete install identity fields and behavior fields
- **AND** includes raster screenshots for narrow and wide form factors
- **AND** includes shortcut metadata with icons
