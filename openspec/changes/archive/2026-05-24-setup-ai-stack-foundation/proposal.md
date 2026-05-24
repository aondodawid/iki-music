## Why

The app was scaffolded with baseline React + TypeScript, but the intended stack (Tailwind CSS, shadcn/ui, Transformers.js, Hugging Face integration, Wrangler deployment) is not yet installed or configured. This change defines and executes a repeatable setup baseline so future feature work can build on the correct foundation.

## What Changes

- Add project-level setup for Tailwind CSS and baseline utility-driven styling.
- Add shadcn/ui initialization and at least one reusable UI component wired into the app.
- Add AI provider integration baseline with Transformers.js and Hugging Face API client setup.
- Add Wrangler configuration and deployment scripts for the app runtime path.
- Add verification and rollback steps for dependency and config changes.

## Capabilities

### New Capabilities

- `frontend-stack-bootstrap`: Setup and verify Tailwind CSS + shadcn/ui in the existing React TypeScript app.
- `ai-provider-bootstrap`: Setup and verify Transformers.js + Hugging Face integration baseline.
- `wrangler-deployment-bootstrap`: Setup and verify Wrangler configuration and deployment scripts.

### Modified Capabilities

- None.

## Impact

- Affected code: app build config, styles, UI composition, environment config, deployment scripts.
- Affected teams/users: frontend, AI integration, and devops contributors.
- Dependencies: Tailwind CSS toolchain, shadcn/ui packages, Transformers.js runtime, Hugging Face SDK/API access, Wrangler CLI.
- Rollback plan: remove added dependencies and restore previous config/scripts if bootstrap breaks build or deployment.
