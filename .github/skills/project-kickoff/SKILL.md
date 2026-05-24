---
name: project-kickoff
description: Plan and bootstrap implementation for a feature from idea to first executable milestone. Use when starting a new feature or repo contribution and you want concrete next steps.
license: MIT
metadata:
  author: iki-music
  version: "1.0.0"
---

# Project Kickoff

Use this skill when a contributor asks "where do I start?" or wants a practical implementation plan.

## Outcomes

- Clear scope and acceptance criteria
- Minimal implementation plan with ordered tasks
- First vertical slice identified
- Verification commands prepared

## Workflow

1. Confirm scope in one paragraph.
2. Identify impacted areas (UI, domain logic, APIs, tests, docs, deployment).
3. Define a vertical slice that can be built and validated quickly.
4. Produce a task list in small, testable increments.
5. Define verification commands (`npm test`, `npm run build`, manual checks).
6. Call out risks and assumptions early.

## Output Template

- Goal
- In-scope / out-of-scope
- Files likely to change
- Step-by-step implementation tasks
- Validation checklist
- Follow-up improvements

## Guardrails

- Prefer smallest shippable increment first.
- Avoid large refactors in kickoff phase unless required.
- Keep API and UX decisions explicit and documented.
