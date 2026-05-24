## Why

The product needs a clear, testable definition of two AI music creation modes so users can quickly create or co-create music from the first session. Defining this now reduces ambiguity before implementation across UI, model orchestration, and API boundaries.

## What Changes

- Add a live co-creation mode where AI listens to the user input stream and generates synchronized accompaniment.
- Add a chat-driven generation mode where users describe what they want and AI returns a generated music result.
- Define shared guardrails for latency feedback, generation state, and accessibility behavior in both modes.
- Define failure behavior for model/API issues with user-visible recovery actions.

## Capabilities

### New Capabilities

- `ai-jam-accompaniment`: Real-time AI accompaniment generated from currently played user music input.
- `chat-prompt-music-generation`: Prompt-based music generation through a chat interface.

### Modified Capabilities

- None.

## Impact

- Affected systems: React UI flows, session state management, inference/orchestration layer, provider integrations (Transformers.js/Hugging Face).
- Affected teams/users: Product, frontend, AI/inference integration, QA; all end users of music creation flows.
- Dependencies: Browser audio capture/playback APIs, model runtime and provider endpoints, Wrangler-managed deployment.
- Rollback plan: Feature-flag both modes and route users to current non-AI creation flow if stability, latency, or output quality falls below acceptance criteria.
