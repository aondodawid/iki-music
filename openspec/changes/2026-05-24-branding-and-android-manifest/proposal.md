## Why

The product needs a clearer music-first visual identity and stronger install metadata quality for Android distribution paths (including TWA/PWA packaging workflows).

## What Changes

- Apply an artistic, music-themed global color system.
- Update favicon to a branded music icon.
- Add a user-facing light/dark theme switch with persisted preference.
- Improve UI contrast and keyboard/focus behavior to align with WCAG accessibility expectations.
- Expand manifest metadata to an Android-ready completeness level (identity fields, display behavior, shortcuts with icons, raster screenshots, and install-safe defaults).

## Capabilities

### New Capabilities

- `brand-themed-ui-and-android-manifest`: The app exposes a cohesive artistic brand and full Android-oriented PWA manifest metadata.

### Modified Capabilities

- `pwa-manifest-complete`: Manifest quality is raised with additional metadata and raster screenshot assets.

## Impact

- Affected code: `app/src/index.css`, `app/src/components/ui/button.tsx`, `app/public/favicon.svg`, `app/vite.config.ts`, `app/index.html`, `app/public/screenshot-wide.png`, `app/public/screenshot-mobile.png`.
- Affected users/teams: end users (visual quality and install surfaces), frontend team, release/deployment team.
- Dependencies: existing Vite PWA plugin and public assets pipeline.
- Rollback plan: restore previous color tokens, previous favicon, and previous manifest fields/screenshots.
