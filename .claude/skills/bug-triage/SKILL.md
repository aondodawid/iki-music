---
name: bug-triage
description: Reproduce, isolate, and resolve defects with fast hypothesis loops and minimal-change fixes. Use when users report runtime errors, broken flows, or inconsistent behavior.
license: MIT
metadata:
  author: iki-music
  version: "1.0.0"
---

# Bug Triage

Use this skill for incident-like debugging and defect fixes.

## Triage Goals

- Reproduce reliably
- Find smallest failing surface
- Identify root cause
- Deliver minimal safe fix
- Verify and prevent regression

## Workflow

1. Capture exact symptom and environment.
2. Reproduce with deterministic steps.
3. Narrow scope (feature flag, mode, route, component, service).
4. Form 2-3 hypotheses and test quickly.
5. Implement smallest fix that removes root cause.
6. Add/adjust tests for regression protection.
7. Re-run build/tests and re-check scenario.

## Debug Checklist

- Input validation and defaults
- Async race conditions and loading states
- Error boundaries and fallback paths
- Cache/service worker effects
- Persisted local storage / old schema handling

## Guardrails

- Never hide errors silently unless user-safe telemetry remains.
- Avoid broad rewrites during triage.
- Document known limitations if full fix is deferred.
