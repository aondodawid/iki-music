## Context

The app already supports installation and offline behavior, but branding remains conservative and manifest metadata is not fully optimized for Android distribution flows.

## Goals / Non-Goals

**Goals:**

- Make the visual theme artistically music-oriented and immediately noticeable.
- Provide a clear light/dark mode switch with persistent user choice.
- Improve keyboard and focus visibility and strengthen color contrast for WCAG-friendly behavior.
- Improve iconography and favicon branding.
- Ensure manifest metadata is complete and practical for Android install surfaces.

**Non-Goals:**

- Building native Android wrappers in this change.
- Implementing store-side signing/assetlinks setup.

## Decisions

1. Keep UI structure stable but strongly shift global palette and CTA styling.

- Rationale: visible branding impact with low regression risk.

2. Replace complex favicon art with a cleaner branded icon.

- Rationale: better recognition at small sizes.

3. Use raster PNG screenshots in manifest.

- Rationale: better compatibility with Android install and listing surfaces.

4. Add manifest completeness fields (`dir`, `display_override`, `prefer_related_applications`, shortcut icons).

- Rationale: improve readiness for Android-focused PWA packaging.

5. Store theme preference in local storage and toggle root dark class.

- Rationale: deterministic and accessible user control over color scheme.

6. Add stronger visible focus treatment and reduced motion support.

- Rationale: improve keyboard accessibility and comfort for motion-sensitive users.

### Sequence / Data Flow

1. Browser loads updated CSS tokens and gradients.
2. UI controls inherit updated button/theme styles.
3. Browser resolves updated favicon.
4. PWA plugin emits updated manifest and includes screenshot assets.
5. Android-compatible install surfaces consume richer metadata.

## Risks / Trade-offs

- [Risk] Stronger colors may reduce readability in edge conditions.
  - Mitigation: preserve contrast and semantic text roles.
- [Risk] Manifest field support varies by browser version.
  - Mitigation: keep core required install fields unchanged and add optional fields progressively.

## Migration Plan

1. Update visual tokens and button palette.
2. Replace favicon.
3. Update manifest metadata and screenshots.
4. Run tests/build and verify output assets.

## Open Questions

- Should a dark artistic variant be added as a user preference?
- Should Android-specific TWA config files be added in a follow-up change?
