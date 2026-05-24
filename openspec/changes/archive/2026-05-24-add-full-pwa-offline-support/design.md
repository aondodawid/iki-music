## Context

The app is already running on Vite with React and has a deployment path through Wrangler. To make it a full PWA, we need a complete manifest and service worker caching policy integrated at build time.

## Goals / Non-Goals

**Goals:**

- Add complete manifest metadata and install icons.
- Add service worker generation with explicit cache/runtime strategies.
- Add offline fallback behavior for navigation.
- Keep existing app behavior stable.

**Non-Goals:**

- Building background sync or push notifications in this change.
- Implementing advanced cache invalidation for all dynamic APIs.

## Decisions

1. Use vite-plugin-pwa with generateSW mode

- Rationale: native fit for Vite and lower maintenance than custom SW build tooling.
- Alternative: handwritten service worker; rejected for complexity.

2. Use auto-update service worker registration

- Rationale: users get updates quickly while keeping PWA benefits.
- Alternative: prompt-based updates; deferred for later UX iteration.

3. Use mixed runtime caching

- Rationale: CacheFirst for static external assets and NetworkFirst for same-origin runtime data balances freshness and resilience.

### Sequence / Data Flow

1. Build injects manifest and generates service worker.
2. App registers service worker on startup.
3. Service worker precaches app shell assets.
4. Runtime requests pass through strategy routes and cache policies.
5. Offline navigation falls back to cached shell or offline page.

## Risks / Trade-offs

- [Large cache footprint] -> Mitigation: set expiration limits and bounded entries.
- [Stale runtime responses] -> Mitigation: use NetworkFirst where freshness matters.
- [Bundle growth from PWA/runtime] -> Mitigation: monitor build output and split where needed.

## Migration Plan

1. Add PWA dependency and plugin config.
2. Add manifest metadata and icon assets.
3. Register service worker and add offline fallback page.
4. Validate installability and offline behavior.

## Open Questions

- Should we add push notifications in a separate change?
- Which dynamic API routes need stricter cache policies later?
