## Context

The local MusicGen path now generates playable audio via direct model loading (`AutoTokenizer` + `MusicgenForConditionalGeneration` + `RawAudio`), but duration is fixed by model defaults. Users need direct control over preview length for iterative jam workflows.

## Goals / Non-Goals

**Goals:**

- Add a simple duration control in live mode UI.
- Pass duration through request contracts to local inference.
- Enforce safe min/max bounds with a stable default.
- Trim generated waveform to target preview duration before WAV encoding.

**Non-Goals:**

- Exact token-to-seconds synthesis guarantees from model internals.
- Advanced controls (tempo, guidance, seed) in this change.

## Decisions

1. Use seconds-based integer control in UI

- Rationale: user-friendly and easy to validate.
- Alternative: token-based control; rejected as non-intuitive.

2. Implement duration shaping by waveform trim

- Rationale: deterministic in app runtime independent of model-specific generation params.
- Alternative: rely solely on model generation args; rejected for uncertain cross-model behavior.

3. Apply only to local live-jam path

- Rationale: chat path currently uses remote provider and different contract expectations.
- Alternative: enforce globally now; rejected to keep scope focused.

## Risks / Trade-offs

- [Generated clip shorter than requested] -> Mitigation: keep actual available samples and show requested setting as target.
- [Large requested durations increase payload size] -> Mitigation: bounded range with defaults.
- [Future model changes affect duration fidelity] -> Mitigation: duration shaping remains local and model-agnostic.

## Migration Plan

1. Add request/type fields and adapter propagation.
2. Add UI control with defaults and bounds.
3. Trim generated audio in local inference before WAV encoding.
4. Update tests and run lint/test/build.

## Open Questions

- Should chat mode also expose duration after remote provider contract is updated?
