# Implementation Plan: SmartContextUI v2 — Performance-First Rewrite

**Branch**: `002-v2-performance-rewrite` | **Date**: 2026-03-19 | **Spec**: `specs/002-v2-performance-rewrite/spec.md`
**Input**: Feature specification from `/specs/002-v2-performance-rewrite/spec.md`

## Summary

Performance-first rewrite of SmartContextUI. Removes hover detection entirely. Single interaction path: right-click → "AI Help" → Shadow DOM tooltip with AI explanation. Zero DOM overhead when idle (one contextmenu coordinate tracker). Backend proxy replaces client-side API key management. Content bundle target < 15KB.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ES2020 target)
**Primary Dependencies**: Vite 6.x (build), @crxjs/vite-plugin 2.x (Manifest v3 Vite integration), @types/chrome (type definitions)
**Storage**: chrome.storage.local for settings and explanation cache
**Testing**: Manual testing (load unpacked in Chrome, test on real pages)
**Target Platform**: Chromium browsers (Chrome, Edge, Brave) — Manifest v3
**Project Type**: Browser extension
**Performance Goals**: Loading tooltip in ≤ 16ms (one frame), element extraction < 1ms, zero page load overhead
**Constraints**: Content script bundle < 15KB minified, zero runtime DOM overhead when not triggered
**Scale/Scope**: Single-user browser extension, works on any web page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Lightweight & Performant | ✅ PASS | Core design goal. One event listener, no main thread computation, < 15KB bundle. |
| II. Clean & Simple UI | ✅ PASS | Shadow DOM tooltip, plain language explanations, dismissible overlay. |
| III. User-Controlled AI Integration | ⚠️ JUSTIFIED VIOLATION | Constitution requires user-provided API keys. V2 spec explicitly delegates API key management to a separate backend proxy service. See Complexity Tracking. |
| IV. Security-First | ✅ PASS | No API keys stored in extension. All calls via HTTPS to backend proxy. No user data collection. CSP enforced via Manifest v3. |
| V. Code Quality & Maintainability | ✅ PASS | TypeScript strict mode, single-responsibility modules, no dead code. |
| VI. Modular Architecture | ⚠️ JUSTIFIED VIOLATION | Constitution requires AI adapter interface for swapping providers. V2 delegates provider selection to backend — extension has single api-client.ts that POSTs to one endpoint. No adapter needed. See Complexity Tracking. |
| VII. Simplicity (KISS / YAGNI) | ✅ PASS | Minimal dependencies, no frameworks, no premature abstractions. |

## Project Structure

### Documentation (this feature)

```text
specs/002-v2-performance-rewrite/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── index.ts              # Entry — contextmenu coord capture + message listeners
│   ├── extractor.ts          # extractElementContext() — 9 direct attributes, no traversal
│   ├── tooltip.ts            # Shadow DOM tooltip — create/show/hide/position
│   └── tooltip-styles.ts     # CSS as template literal string
├── background/
│   ├── service-worker.ts     # Context menu registration, message routing, cache orchestration
│   └── api-client.ts         # POST to backend proxy, error classes
├── popup/
│   ├── popup.html            # Toggle switch + usage instruction
│   ├── popup.ts              # Read/write enabled boolean
│   └── popup.css             # Minimal styling
└── shared/
    ├── types.ts              # ElementContext, ExplanationResponse, Settings, MessageType enum
    ├── constants.ts          # API_ENDPOINT, CACHE_TTL_MS, CACHE_PREFIX, CONTEXT_MENU_ID
    ├── cache.ts              # djb2 hash, getCached(), setCached(), clearExpired()
    └── settings.ts           # getSettings(), saveSettings(), onSettingsChanged()
```

**Structure Decision**: Single-project browser extension. Reuses the existing `src/` layout from v1 but removes hover-detection modules (`hover-detector.ts`, `highlighter.ts`), collapses `tooltip/` subdirectory into single files, and strips API key/provider management from popup.

### Files removed from v1

- `src/content/hover-detector.ts` — hover detection removed entirely
- `src/content/highlighter.ts` — element highlighting removed
- `src/content/tooltip/tooltip-renderer.ts` — collapsed into `tooltip.ts`
- `src/content/tooltip/tooltip-manager.ts` — collapsed into `tooltip.ts`
- `src/background/context-menu.ts` — merged into `service-worker.ts`

### Files significantly rewritten from v1

- `src/content/index.ts` — stripped of hover logic, simplified to coord capture + messaging
- `src/content/element-extractor.ts` → `extractor.ts` — renamed, removed parentElement/className
- `src/background/api-client.ts` — removed multi-provider logic, now POSTs to single proxy endpoint
- `src/background/service-worker.ts` — absorbed context-menu.ts, simplified message handling
- `src/popup/popup.html` — removed API key input, provider dropdown, trigger mode selector
- `src/popup/popup.ts` — reduced to single toggle read/write
- `src/popup/popup.css` — simplified for toggle-only UI
- `src/shared/types.ts` — removed ApiProvider, simplified Settings, new MessageType enum
- `src/shared/constants.ts` — removed hover/debounce constants, added CONTEXT_MENU_ID
- `src/shared/settings.ts` — removed API key/provider/trigger mode

### New files in v2

- `src/content/tooltip-styles.ts` — CSS as JS template literal (no build plugin needed)

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle III: No user-provided API keys | V2 spec explicitly delegates API key management to a separate backend proxy service. This simplifies the extension (no key storage, no provider selection UI, no key validation) and improves security (keys never touch the browser). | Keeping client-side API keys would add UI complexity, security surface, and violate the v2 spec's explicit architecture decision. |
| Principle VI: No AI adapter interface | Extension talks to exactly one backend endpoint. The backend handles provider selection/swapping. An adapter interface in the extension would be dead abstraction with zero consumers. | Building an adapter for one implementation violates Principle VII (YAGNI). If the backend endpoint changes, a single constant update suffices. |

## Architecture Flow

```
User right-clicks element
       │
       ▼
Content: contextmenu event → store (clientX, clientY)
       │
       ▼
Browser shows native context menu with "AI Help"
       │
       ▼
User clicks "AI Help"
       │
       ▼
Background: contextMenus.onClicked → sends TRIGGER to content tab
       │
       ▼
Content: receives TRIGGER → elementFromPoint(lastX, lastY)
       → extractElementContext(element)
       → tooltip.create() + tooltip.showLoading()
       → sendMessage(REQUEST_EXPLANATION, context)
       │
       ▼
Background: receives REQUEST_EXPLANATION
       → cache check (getCached)
       → IF hit: send EXPLANATION_RESULT (cached)
       → IF miss: api-client.requestExplanation(context)
         → setCached(result) → send EXPLANATION_RESULT
       │
       ▼
Content: receives EXPLANATION_RESULT
       → tooltip.showResult(explanation) OR tooltip.showError(message)
       │
       ▼
User dismisses (Escape / click outside / X button)
       → tooltip.hide() → Shadow DOM host removed entirely
```

## Communication Pattern

- Content → Background: `chrome.runtime.sendMessage` (REQUEST_EXPLANATION)
- Background → Content: `chrome.tabs.sendMessage` (TRIGGER_FROM_CONTEXT_MENU, EXPLANATION_RESULT)
- No long-lived connections. No ports. Fire-and-forget messages.

## Manifest v3 Permissions

- `contextMenus` — register "AI Help" menu item
- `storage` — settings + explanation cache
- `activeTab` — access current tab for messaging
- `alarms` — periodic cache cleanup

## Implementation Phases

### Phase 1 — Shared Foundation
Files: `types.ts`, `constants.ts`, `cache.ts`, `settings.ts`
All parallelizable. No inter-dependencies.

### Phase 2 — Content Script
Files: `extractor.ts`, `tooltip-styles.ts`, `tooltip.ts`, `index.ts`
- `extractor.ts` + `tooltip-styles.ts` are parallel
- `tooltip.ts` depends on `tooltip-styles.ts`
- `index.ts` depends on all three

### Phase 3 — Background (parallel with Phase 2)
Files: `api-client.ts`, `service-worker.ts`
- `api-client.ts` first
- `service-worker.ts` depends on `api-client.ts`

### Phase 4 — Popup (independent, anytime)
Files: `popup.html`, `popup.css`, `popup.ts`
All parallelizable. `popup.ts` imports from `shared/settings.ts`.

### Phase 5 — Build & Integration
- Update `manifest.json` (remove v1-specific config if needed)
- `vite.config.ts` already configured with @crxjs/vite-plugin
- Build, load unpacked in Chrome, test on real pages

**Critical Path**: Phase 1 → Phase 2 + Phase 3 (parallel) → Phase 5
