<!--
  Sync Impact Report
  ==================================================
  Version change: 0.0.0 (template) → 1.0.0
  Modified principles: N/A (initial population)
  Added sections:
    - 7 Core Principles (new)
    - Tech Stack Constraints (new)
    - Development Workflow & Quality Gates (new)
    - Governance (populated)
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed
    - .specify/templates/spec-template.md ✅ no changes needed
    - .specify/templates/tasks-template.md ✅ no changes needed
  Follow-up TODOs: None
  ==================================================
-->

# SmartContextUI Constitution

## Core Principles

### I. Lightweight & Performant

- The extension MUST NOT degrade browser performance.
- All DOM interactions MUST be non-blocking and throttled
  where necessary.
- The extension MUST avoid heavy computation on the main
  thread; use background scripts or web workers.
- Bundle size MUST be kept minimal — no unnecessary
  dependencies.
- AI API calls MUST be debounced to prevent excessive
  network requests during hover interactions.

### II. Clean & Simple UI

- Every tooltip, popup, or overlay MUST be immediately
  understandable by a non-technical user.
- UI elements MUST follow a consistent visual style with
  clear typography, spacing, and contrast.
- The extension MUST NOT clutter the host page — overlays
  MUST be dismissible and non-intrusive.
- Explanations MUST use plain language; avoid jargon unless
  the user has opted into advanced mode.

### III. User-Controlled AI Integration

- Users MUST provide their own API key (OpenAI, Google, or
  other supported provider).
- The extension MUST NOT bundle or default to any API key.
- Users MUST be able to switch between AI providers without
  data loss.
- The extension MUST gracefully handle missing, invalid, or
  expired API keys with clear user-facing error messages.

### IV. Security-First

- API keys MUST be stored exclusively in the user's local
  browser storage (chrome.storage.local or equivalent).
- API keys MUST NEVER be transmitted to any server other
  than the chosen AI provider's API endpoint.
- The extension MUST NOT collect, track, or transmit user
  data without explicit consent.
- All external API calls MUST use HTTPS.
- Content Security Policy MUST be enforced via Manifest v3
  declarations.

### V. Code Quality & Maintainability

- All code MUST be readable and self-documenting.
- Follow DRY: extract shared logic into reusable modules
  when duplication occurs across two or more locations.
- Every module MUST have a single, clear responsibility.
- No unused code, dead imports, or commented-out blocks
  MUST remain in the codebase.
- Linting MUST pass before any code is merged.

### VI. Modular Architecture

- The extension MUST be structured into independent,
  loosely-coupled modules (e.g., content script, background
  service worker, popup UI, AI service adapter).
- Each module MUST be independently testable.
- AI provider integrations MUST sit behind an adapter
  interface so providers can be swapped without changing
  consuming code.
- Shared types and utilities MUST live in a dedicated
  shared module, not duplicated across layers.

### VII. Simplicity (KISS / YAGNI)

- Start with the simplest implementation that solves the
  current requirement.
- Do NOT build abstractions, configurations, or features
  for hypothetical future needs.
- Three lines of straightforward code are preferred over a
  premature abstraction.
- If a feature is not explicitly required, it MUST NOT be
  built.

## Tech Stack Constraints

- **Platform**: Browser Extension (Manifest v3)
- **Language**: TypeScript (preferred) or JavaScript
- **AI Integration**: OpenAI API, Google AI API, or any
  user-provided compatible API key
- **Storage**: `chrome.storage.local` for settings and API
  keys; IndexedDB for cached explanations if needed
- **Frameworks**: No heavy frameworks unless justified by a
  concrete, documented need. Vanilla JS/TS or lightweight
  libraries are preferred.
- **Build**: Standard extension bundler (e.g., Vite, webpack,
  or rollup) — chosen tool MUST support Manifest v3 output.

## Development Workflow & Quality Gates

### Workflow

1. **Specification** — Every feature MUST have a written spec
   before any code is written.
2. **Plan** — A plan MUST be produced from the spec, covering
   architecture, file structure, and task breakdown.
3. **Tasks** — Tasks MUST be generated from the plan with
   clear dependencies and parallel opportunities.
4. **Implementation** — Code MUST follow the task list; no
   ad-hoc feature work outside the plan.

### Quality Gates

- All code MUST pass linting (ESLint or equivalent) with
  zero errors before merge.
- Code MUST be human-readable — reviewer comprehension is
  a gate.
- No hardcoded secrets, API keys, or credentials MUST exist
  in the codebase.
- No unused variables, imports, or dead code MUST remain
  after a task is complete.

## Governance

- This constitution supersedes all other development
  practices for SmartContextUI.
- Any change to this constitution MUST be reviewed and
  documented before applying.
- MAJOR changes (principle removals or redefinitions) MUST
  receive explicit approval before merge.
- Principles MUST NOT change frequently — stability of
  governance is itself a principle.
- If a rule must change: update this constitution first,
  then update code to comply.
- All PRs and code reviews MUST verify compliance with
  these principles.
- Version follows semantic versioning: MAJOR for breaking
  governance changes, MINOR for new principles or sections,
  PATCH for clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-03-19 | **Last Amended**: 2026-03-19
