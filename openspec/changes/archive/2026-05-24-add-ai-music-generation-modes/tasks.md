## 1. Foundation and State Model

- [x] 1.1 Define a shared generation orchestration contract for lifecycle states and error payloads.
- [x] 1.2 Implement mode adapters for live accompaniment input and chat prompt input.
- [x] 1.3 Add feature flags for `ai-jam-accompaniment` and `chat-prompt-music-generation`.

## 2. Live Accompaniment Mode

- [x] 2.1 Implement live session controls (enable, mute, stop) wired to the shared orchestrator.
- [x] 2.2 Integrate provider request path for accompaniment generation and timeline synchronization.
- [x] 2.3 Add explicit processing/ready/degraded UI states for live mode.

## 3. Chat Prompt Generation Mode

- [x] 3.1 Implement chat prompt submit flow with prompt validation and inline error messaging.
- [x] 3.2 Integrate provider request path for prompt-driven generation and result attachment to session.
- [x] 3.3 Add playback controls and generation status updates for chat-generated results.

## 4. Verification

- [x] 4.1 Add accessibility verification tasks for keyboard navigation, labels, and live-region announcements.
- [x] 4.2 Add integration tests for successful and failed generation in both modes.
- [x] 4.3 Validate rollback behavior by disabling feature flags and confirming fallback flow.
