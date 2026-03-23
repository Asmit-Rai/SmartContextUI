# Implementation Plan: AI Element Explainer

**Branch**: `001-ai-element-explainer` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-element-explainer/spec.md`

## Summary

Build a Manifest v3 browser extension that explains UI elements via
AI-generated tooltips. Two trigger modes: hover (600ms debounce) and
right-click context menu ("AI Help"). The extension sends element
context to a shared backend proxy, receives a structured explanation
(Identity, Purpose, Use Cases, Related Elements), and displays it in
a Shadow DOM tooltip. Includes a popup for settings (on/off toggle,
trigger mode selector) and a local cache with 24-hour TTL.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Vite (build), @crxjs/vite-plugin (Manifest v3 Vite plugin)
**Storage**: chrome.storage.local (settings + explanation cache)
**Testing**: Vitest (unit tests for shared modules)
**Target Platform**: Chromium-based browsers (Chrome, Edge, Brave) — Manifest v3
**Project Type**: Browser extension
**Performance Goals**: <50ms added page load time, <3s explanation delivery, <200ms cached display
**Constraints**: Minimal bundle size, no heavy frameworks, non-blocking DOM interactions, Shadow DOM isolation
**Scale/Scope**: Any web page, any number of interactive elements per page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Lightweight & Performant | PASS | Debounced hover (600ms), no heavy frameworks, vanilla TS + Shadow DOM, background SW for API calls |
| II. Clean & Simple UI | PASS | Tooltip: max-width 360px, fade-in animation, clear section headers, dismissible (Escape/click-outside/X) |
| III. User-Controlled AI Integration | VIOLATION | Spec uses shared backend proxy instead of per-user API keys — see Complexity Tracking |
| IV. Security-First | PASS | No API keys in extension code, HTTPS only, no user data collection, CSP via Manifest v3 |
| V. Code Quality & Maintainability | PASS | Modular file structure, single-responsibility modules, ESLint enforced |
| VI. Modular Architecture | PASS | Content script / background SW / popup / shared — loosely coupled via message passing |
| VII. Simplicity (KISS/YAGNI) | PASS | No MutationObserver v1, no AI SDK bundled, plain fetch, no UI framework |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-element-explainer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── backend-api.md   # Backend proxy API contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── index.ts                 # Content script entry — initializes hover detector, context menu listener, tooltip manager
│   ├── hover-detector.ts        # Detects hover on interactive elements, debounces 600ms, triggers explanation flow
│   ├── element-extractor.ts     # Extracts element context payload (tag, text, aria, role, DOM snippet, page info)
│   ├── highlighter.ts           # Adds/removes subtle highlight border on target elements
│   └── tooltip/
│       ├── tooltip-manager.ts   # Creates/positions/shows/hides tooltip — manages Shadow DOM container
│       ├── tooltip-renderer.ts  # Renders structured explanation HTML inside Shadow DOM
│       └── tooltip.css          # Tooltip styles — scoped inside Shadow DOM
├── background/
│   ├── service-worker.ts        # Background SW entry — registers context menu, handles messages
│   ├── context-menu.ts          # Creates "AI Help" context menu item, handles click events
│   └── api-client.ts            # Sends element context to backend proxy, returns structured explanation
├── popup/
│   ├── popup.html               # Popup HTML — toggle, mode selector, instructions
│   ├── popup.ts                 # Popup logic — reads/writes settings via chrome.storage.local
│   └── popup.css                # Popup styles
├── shared/
│   ├── types.ts                 # Shared types — ElementContext, ExplanationResponse, Settings, CacheEntry
│   ├── cache.ts                 # Cache module — get/set/hash/expire via chrome.storage.local, 24hr TTL
│   ├── settings.ts              # Settings module — read/write enabled + triggerMode
│   └── constants.ts             # Shared constants — API URL, debounce delay, cache TTL, max tooltip width
└── assets/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png

manifest.json                    # Manifest v3 config
tsconfig.json                    # TypeScript config
vite.config.ts                   # Vite build config
package.json                     # Dependencies
dist/                            # Build output — loadable as unpacked extension
```

**Structure Decision**: Single project (browser extension). Content
script, background service worker, and popup are separate entry points
built by Vite into dist/. Shared module contains types, cache, settings,
and constants used across all entry points. No monorepo needed — the
extension is a single deliverable.

## Complexity Tracking

> **Constitution Principle III Violation**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Shared backend proxy instead of per-user API keys (Principle III) | Zero-setup user experience — install and use immediately. Per-user API keys create friction: users must obtain keys, manage billing, understand provider differences. This is a consumer extension, not a developer tool. | Per-user keys rejected because: (1) target audience is non-technical enterprise users, (2) onboarding friction would kill adoption, (3) API key management in a browser extension creates security surface area (keys in local storage). Constitution Principle III should be amended to reflect the shared-backend model. |
