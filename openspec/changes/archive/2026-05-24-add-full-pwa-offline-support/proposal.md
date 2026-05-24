## Why

The app should be installable and resilient when network quality is poor or offline. A full PWA baseline with a complete manifest and explicit caching strategy is required now to improve reliability and mobile UX.

## What Changes

- Add full Progressive Web App setup in the Vite app.
- Add a complete web app manifest with full metadata and icon set.
- Add service worker generation and caching strategy for app shell and runtime requests.
- Add offline fallback page and update behavior for service worker lifecycle.

## Capabilities

### New Capabilities

- `pwa-manifest-complete`: Provide a complete manifest for installability and metadata compliance.
- `pwa-offline-caching`: Provide service worker caching for static assets and runtime requests with fallback behavior.

### Modified Capabilities

- None.

## Impact

- Affected code: Vite config, app bootstrap, public assets, and docs/scripts.
- Affected users/teams: all end users (especially mobile), frontend team, QA.
- Dependencies: vite-plugin-pwa and Workbox runtime in generated service worker.
- Rollback plan: disable/remove PWA plugin configuration and service worker registration, then rebuild.
