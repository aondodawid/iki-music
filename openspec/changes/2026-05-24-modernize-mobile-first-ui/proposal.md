## Why

Current UI does not clearly communicate a modern product quality and users report little visible change. The app needs a mobile-first responsive redesign with stronger visual hierarchy and clearer interaction affordances.

## What Changes

- Redesign the main app layout using a mobile-first responsive structure.
- Improve visual hierarchy with intentional card surfaces, spacing, and typography.
- Improve control usability on small screens and maintain desktop ergonomics.
- Ensure desktop buttons show pointer cursor affordance.

## Capabilities

### New Capabilities

- `responsive-modern-ui`: The app presents a modern, mobile-first UX that scales cleanly to desktop.

### Modified Capabilities

- `ai-jam-accompaniment`: Live controls are surfaced in a more touch-friendly layout.
- `chat-prompt-music-generation`: Chat generation controls are surfaced in a clearer, responsive card layout.

## Impact

- Affected code: `app/src/App.tsx`, `app/src/components/ui/button.tsx`.
- Affected users/teams: end users on mobile and desktop, frontend team, QA.
- Dependencies: existing Tailwind/shadcn setup.
- Rollback plan: revert layout classes and button cursor class to previous versions.
