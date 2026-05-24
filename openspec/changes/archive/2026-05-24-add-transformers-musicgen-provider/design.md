## Context

The app currently uses a local Transformers.js wrapper oriented around text generation placeholders. Product direction requires actual music generation via a Hugging Face model in Transformers.js, with `Xenova/musicgen-small` as the initial default but not hardcoded in behavior.

## Goals / Non-Goals

**Goals:**

- Use Transformers.js MusicGen path for local generation.
- Produce audio output metadata suitable for browser playback.
- Keep model identifier configurable via environment variables.
- Preserve simulation mode for predictable tests.

**Non-Goals:**

- Full production optimization of MusicGen performance and memory.
- Multi-model routing and automatic model benchmarking.

## Decisions

1. Use direct MusicGen model classes from Transformers.js

- Rationale: aligns with model-card guidance for `Xenova/musicgen-small` and supports direct `AutoTokenizer` + `MusicgenForConditionalGeneration` + `RawAudio` generation.
- Alternative: keep generic text-to-audio pipeline; rejected because the requirement is explicit direct model loading and generation.

2. Keep env-driven model selection with stable default

- Rationale: supports future model switching without code rewrites.
- Alternative: hardcode model in source; rejected as inflexible.

3. Emit audio URL in generation result

- Rationale: allows direct playback in UI and keeps provider/orchestrator contract explicit.
- Alternative: file download-only output; rejected for interactive UX.

### Sequence / Data Flow

1. User submits prompt or live progression.
2. Provider client routes request to local MusicGen wrapper.
3. Wrapper reads env config and resolves model id.
4. In non-simulation mode, tokenizer+model generate audio tensor.
5. Tensor is converted to WAV blob URL for browser playback.
6. Result is returned with text summary and audio metadata.

## Risks / Trade-offs

- [High model runtime cost in browser] -> Mitigation: keep simulation mode and configurable model for lower-resource fallback.
- [Audio conversion edge cases] -> Mitigation: isolate WAV encoding and test deterministic behavior.
- [Long first-load model download] -> Mitigation: communicate processing state and cache model artifacts where possible.

## Migration Plan

1. Update env schema and defaults.
2. Implement MusicGen local wrapper and provider contract changes.
3. Update UI rendering and tests.
4. Run lint/test/build to validate migration.

## Open Questions

- Should we expose generation duration/length controls in UI in a follow-up change?
- Should we introduce progressive model loading indicators beyond existing status states?
