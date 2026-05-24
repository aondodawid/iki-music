---
name: release-readiness
description: Prepare a feature for release with verification, risk checks, and deployment notes. Use before tagging, publishing, or handing off for QA.
license: MIT
metadata:
  author: iki-music
  version: "1.0.0"
---

# Release Readiness

Use this skill when finalizing work for merge or release.

## Release Gates

- All required tests pass
- Build artifacts generate correctly
- Manifest and static assets validated
- Critical UX flows checked on desktop and mobile
- Accessibility checks pass for changed views
- Documentation/changelog updated

## Workflow

1. Run test suite and production build.
2. Validate key runtime flows end-to-end.
3. Verify config and environment assumptions.
4. Confirm no debug code or temporary flags remain.
5. Summarize release notes: features, fixes, known issues.
6. Provide rollback or mitigation notes.

## Output Template

- What is shipping
- Validation performed
- Risks and mitigations
- Rollback plan
- Post-release watch items

## Guardrails

- No release without reproducible validation evidence.
- Surface unresolved risks explicitly.
- Keep release note language clear and user-focused.
