# pwa-offline-caching Specification

## Purpose
TBD - created by archiving change add-full-pwa-offline-support. Update Purpose after archive.
## Requirements
### Requirement: Service worker registration and update policy

The system MUST register a service worker with auto-update behavior for deployed builds.

#### Scenario: New service worker activates on update

- **GIVEN** a deployed app instance and a newer build is published
- **WHEN** the app is reopened or refreshed
- **THEN** the service worker checks for updates and applies the configured update policy
- **AND** outdated caches are cleaned up

### Requirement: Offline asset and runtime caching

The system MUST cache app shell assets and define runtime caching strategies for predictable offline and degraded-network behavior.

#### Scenario: App shell works after initial load when offline

- **GIVEN** a user has previously loaded the app online
- **WHEN** the user goes offline and revisits the app
- **THEN** the app shell is served from cache
- **AND** offline fallback content is available for uncached navigation targets

### Requirement: Runtime request strategy

The system SHALL define runtime caching for selected same-origin requests and external assets.

#### Scenario: Runtime responses use configured cache strategies

- **GIVEN** configured runtime URL patterns in service worker
- **WHEN** matching network requests are issued
- **THEN** responses follow the declared strategy (e.g. NetworkFirst/CacheFirst)
- **AND** cache limits and expiration policies are applied

