## 1. OpenSpec and Config

- [x] 1.1 Add OpenSpec artifacts for Transformers.js MusicGen migration.
- [x] 1.2 Update environment config defaults to start with `Xenova/musicgen-small` while keeping model override support.

## 2. MusicGen Implementation

- [x] 2.1 Replace local text generation wrapper with MusicGen model flow using Transformers.js classes.
- [x] 2.2 Convert generated audio output into browser-playable data (audio URL + metadata).
- [x] 2.3 Route provider generation requests to the MusicGen local wrapper.

## 3. UI and Contract Updates

- [x] 3.1 Extend generation result type to carry optional audio output metadata.
- [x] 3.2 Update UI result rendering to expose generated audio playback.

## 4. Verification

- [x] 4.1 Update tests for provider output expectations under simulation mode.
- [x] 4.2 Run lint, tests, and build to verify migration.
