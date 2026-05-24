## Context

The change introduces two user-facing AI creation modes in one application flow: live accompaniment and chat-prompt generation. The project uses React + TypeScript with model/provider integrations through Transformers.js and Hugging Face, and deployment via Wrangler. WCAG compliance is mandatory for interaction and status feedback.

## Goals / Non-Goals

**Goals:**

- Define a consistent architecture for both generation modes with shared session and generation-state handling.
- Ensure users receive clear status/latency/failure feedback.
- Enforce accessibility behavior across controls, status changes, and generated result navigation.

**Non-Goals:**

- Training custom music models.
- Building collaborative multi-user sessions in this change.
- Replacing all existing creation flows outside these two modes.

## Decisions

1. Shared generation orchestration layer

- Decision: Use one client-side orchestration abstraction for request lifecycle (`idle -> processing -> complete|failed`) used by both modes.
- Rationale: Reduces duplicated state logic and aligns UX behavior.
- Alternative considered: Separate orchestration per mode; rejected due to drift risk and higher maintenance.

2. Mode-specific input adapters

- Decision: Keep separate adapters for live input (stream/session events) and chat prompt input (message submit flow), both feeding the same orchestration lifecycle.
- Rationale: Preserves mode-specific behavior while sharing core state transitions and error handling.
- Alternative considered: Fully unified input model; rejected because timing/stream semantics differ from chat submissions.

3. Accessibility-first status model

- Decision: Treat generation status as a first-class UI contract with keyboard focus order, explicit labels, and live updates for assistive tech.
- Rationale: WCAG is a hard requirement and status changes are central to trust in AI generation.
- Alternative considered: Passive visual-only feedback; rejected as non-compliant.

4. Feature-flag rollout

- Decision: Ship both modes behind independent feature flags.
- Rationale: Allows safe rollout, incremental validation, and quick rollback.
- Alternative considered: Full immediate release; rejected due to risk around model latency and provider reliability.

### Sequence / Data Flow

1. User selects mode (`live-jam` or `chat-generate`).
2. Mode adapter validates input and creates a generation request payload.
3. Orchestrator transitions state to `processing` and emits UI status update.
4. Provider call executes (Transformers.js local/runtime path or Hugging Face-backed path).
5. On success, orchestrator stores result in session timeline and transitions to `complete`.
6. On failure/timeout, orchestrator transitions to `failed` with recovery action metadata.
7. UI presents playable output and accessible status announcement.

## Risks / Trade-offs

- [Provider latency spikes] -> Mitigation: timeout thresholds, degraded-state UI, and retry controls.
- [Inconsistent output quality between modes] -> Mitigation: mode-specific acceptance criteria and QA baselines.
- [Complexity of live session synchronization] -> Mitigation: define synchronization boundaries and add instrumentation for timing drift.
- [Accessibility regressions in dynamic status UI] -> Mitigation: explicit accessibility acceptance checks in tasks.

## Migration Plan

1. Introduce feature flags for both modes in non-production environments.
2. Implement shared orchestration and mode adapters.
3. Run functional and accessibility verification for both flows.
4. Enable gradual rollout by flag cohort.
5. Rollback by disabling one or both flags if KPIs or reliability degrade.

## Open Questions

- What are target latency thresholds for each mode in MVP?
- Which provider path is primary for production by default?
- Should generated outputs be auto-saved to a persistent user library in this change or later?
