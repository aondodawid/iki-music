## Why

Music creation should be generated through a Hugging Face model running via Transformers.js in the app runtime. We need to replace text-style local generation with real music-oriented generation while keeping model selection configurable for future changes.

## What Changes

- Switch local generation flow to a Transformers.js MusicGen path.
- Set initial default model to `Xenova/musicgen-small` through environment configuration.
- Keep model identifier configurable so it can be changed without code rewrites.
- Extend generation result model to carry audio output metadata for playback.
- Update UI and tests to validate the new music generation flow.

## Capabilities

### New Capabilities

- `transformers-musicgen-generation`: Generate music audio using Hugging Face Transformers.js model execution in app runtime.

### Modified Capabilities

- `ai-jam-accompaniment`: Replace text-first local generation behavior with music-oriented generation behavior.

## Impact

- Affected code: local inference module, provider client orchestration path, environment configuration, UI rendering, test expectations.
- Affected users/teams: users of music generation flow, frontend and AI integration contributors.
- Dependencies: `@huggingface/transformers` direct model runtime and browser audio playback APIs.
- Rollback plan: restore previous text generation wrapper and env defaults if music generation path fails in target environments.
