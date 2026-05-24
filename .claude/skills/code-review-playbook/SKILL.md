---
name: code-review-playbook
description: Review code with a bug-first mindset and provide prioritized findings, risks, and missing tests. Use when asked for review or pre-merge quality assessment.
license: MIT
metadata:
  author: iki-music
  version: "1.0.0"
---

# Code Review Playbook

Use this skill when reviewing a branch, PR, or local diff.

## Review Priorities

1. Correctness and regressions
2. Security and data safety
3. Accessibility and UX breaks
4. Performance and reliability
5. Test coverage gaps
6. Maintainability concerns

## Review Workflow

1. Understand intent and changed files.
2. Trace execution paths and edge cases.
3. Validate error handling and fallback behavior.
4. Check state transitions and side effects.
5. Check tests that should fail if bug exists.
6. Report findings ordered by severity.

## Response Format

- Findings first, ordered by severity
- Each finding includes: impact, location, and fix suggestion
- Open questions / assumptions
- Brief summary only after findings

## Guardrails

- Do not block on style-only issues unless they hide real risk.
- Prefer actionable fixes over abstract critique.
- If no findings, state residual risks and untested areas.
