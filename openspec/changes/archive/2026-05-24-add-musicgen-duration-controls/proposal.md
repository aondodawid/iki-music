## Why

Music generation currently returns a fixed-length preview, which limits user control in live accompaniment. We need a simple UI control to select target preview duration before generation.

## What Changes

- Add a user-facing duration control for local live accompaniment generation.
- Extend generation request contract with optional duration seconds.
- Apply duration during local MusicGen result shaping so returned audio matches requested preview length.
- Keep safe defaults and bounds so behavior remains stable without user overrides.

## Capabilities

### New Capabilities

- `musicgen-duration-controls`: User-configurable duration for local music preview generation.

### Modified Capabilities

- `ai-jam-accompaniment`: Live accompaniment request and output behavior now supports configurable preview duration.

## Impact

- Affected code: App live mode form state, request adapters/types, provider routing, local inference audio shaping.
- Affected users/teams: end users generating local accompaniment; frontend contributors maintaining generation UX.
- Dependencies: existing `@huggingface/transformers` direct MusicGen runtime.
- Rollback plan: remove duration field propagation and return to fixed default output length.
