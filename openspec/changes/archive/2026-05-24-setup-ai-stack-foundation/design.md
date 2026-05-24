## Context

The current app exists at `app/` and uses React + TypeScript with Vite. The desired project baseline includes Tailwind CSS, shadcn/ui, Transformers.js, Hugging Face integration, and Wrangler deployment scripts. This setup is cross-cutting and touches styling, UI primitives, runtime integration, environment handling, and deployment tooling.

## Goals / Non-Goals

**Goals:**

- Install and configure Tailwind CSS and shadcn/ui in the current app.
- Add a minimal but real AI integration path for Transformers.js and Hugging Face.
- Add Wrangler configuration and scripts so deployment path is reproducible.
- Keep setup reversible and verify with build/tests.

**Non-Goals:**

- Full production model tuning or advanced inference optimization.
- Building all product features on top of the stack in this change.
- Finalizing all infra secrets and environment governance.

## Decisions

1. Keep existing Vite app and layer setup incrementally

- Rationale: lower migration risk and preserves existing implemented flows.
- Alternative: recreate app from scratch; rejected as unnecessary churn.

2. Introduce provider abstraction for AI calls

- Rationale: lets app switch between local Transformers.js and remote Hugging Face path without changing UI surface.
- Alternative: direct provider calls in UI; rejected for maintainability and testing complexity.

3. Use script-driven deployment via package scripts and Wrangler config

- Rationale: makes onboarding and CI flows deterministic.
- Alternative: manual Wrangler commands only; rejected due to repeatability risk.

### Sequence / Data Flow

1. Install and configure Tailwind + shadcn/ui.
2. Wire baseline UI component and confirm styling pipeline.
3. Add AI provider module with local and remote paths.
4. Add env access for Hugging Face token and model reference.
5. Add Wrangler config and package scripts.
6. Run verification (lint/tests/build and script checks).

## Risks / Trade-offs

- [Tailwind/shadcn version mismatch] -> Mitigation: pin compatible versions and verify build after each step.
- [Large Transformers.js runtime footprint] -> Mitigation: keep baseline inference path minimal and lazy-load where possible.
- [Missing or invalid Hugging Face env vars] -> Mitigation: add explicit env validation and fallback error states.
- [Deployment config drift] -> Mitigation: keep Wrangler config in repo and script all deploy steps.

## Migration Plan

1. Add dependencies and config files in small batches.
2. Verify app still builds after each batch.
3. Add scripts and run end-to-end setup checks.
4. Rollback by removing added dependencies and restoring pre-change configs if critical failures occur.

## Open Questions

- Which exact Hugging Face model IDs should be default in MVP?
- Should Wrangler target Workers static assets only or include server-side routing now?
