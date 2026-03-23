# Tasks: SmartContextUI v2 — Performance-First Rewrite

**Input**: Design documents from `/specs/002-v2-performance-rewrite/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in spec — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Clean v1 artifacts and prepare project structure for v2 rewrite

- [x] T001 Remove v1 files no longer needed: delete `src/content/hover-detector.ts`, `src/content/highlighter.ts`, `src/content/tooltip/tooltip-renderer.ts`, `src/content/tooltip/tooltip-manager.ts`, `src/background/context-menu.ts`, and the `src/content/tooltip/` directory
- [x] T002 Update `manifest.json` to v2 permissions: set permissions to `["contextMenus", "storage", "activeTab", "alarms"]`, verify content_scripts and background entries point to correct v2 paths

---

## Phase 2: Foundational (Shared Module Rewrite)

**Purpose**: Rewrite all shared modules that every user story depends on. MUST complete before any user story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Rewrite `src/shared/types.ts` — define `ElementContext` (9 fields per data-model.md), `ExplanationResponse` (elementIdentity, primaryPurpose, useCases, relatedElements?), `CacheEntry` (explanation + timestamp), `Settings` (enabled boolean only), `MessageType` enum (TRIGGER_FROM_CONTEXT_MENU, REQUEST_EXPLANATION, EXPLANATION_RESULT), and typed `Message` interfaces per contracts/messages.md. Remove all v1 types: `ApiProvider`, `TriggerMode`, v1 `Settings` fields, v1 message types.
- [x] T004 [P] Rewrite `src/shared/constants.ts` — export `API_ENDPOINT` (backend proxy URL), `CACHE_TTL_MS` (86400000 = 24h), `CACHE_PREFIX` ("cache_"), `CONTEXT_MENU_ID` ("smartcontextui-explain"), `FETCH_TIMEOUT_MS` (10000), `MAX_TEXT_LENGTH` (200). Remove all v1 constants: `DEBOUNCE_DELAY_MS`, `TOOLTIP_WIDTH`, `INTERACTIVE_SELECTORS`, `STORAGE_KEYS` for apiKey/provider/triggerMode.
- [x] T005 [P] Rewrite `src/shared/cache.ts` — keep existing djb2 hash function, keep `getCached(context: ElementContext)`, `setCached(context: ElementContext, explanation: ExplanationResponse)`, `clearExpired()`. Update imports to use new `types.ts`. Ensure cache key format is `cache_${djb2Hash(JSON.stringify(context))}` and expiration checks use `CACHE_TTL_MS`.
- [x] T006 [P] Rewrite `src/shared/settings.ts` — simplify to `getSettings(): Promise<Settings>` returning `{ enabled: true }` as default, `saveSettings(settings: Settings): Promise<void>`, `onSettingsChanged(callback: (settings: Settings) => void): void`. Remove all API key, provider, and trigger mode logic.

**Checkpoint**: All shared modules compile with new types. No v1 type references remain.

---

## Phase 3: User Story 1 — Right-Click Element Explanation (Priority: P1) 🎯 MVP

**Goal**: User right-clicks any element → selects "AI Help" → sees loading tooltip → sees structured AI explanation → dismisses tooltip with zero residual DOM.

**Independent Test**: Install extension, visit any web page, right-click any element, select "AI Help", verify loading tooltip appears instantly, then structured explanation replaces it. Press Escape to dismiss — no DOM artifacts remain.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `src/content/extractor.ts` — export `extractElementContext(element: Element): ElementContext` that reads 9 direct attributes per data-model.md: tagName, textContent (trimmed, truncated to MAX_TEXT_LENGTH), getAttribute('aria-label'), getAttribute('role'), id, title, getAttribute('placeholder') ?? '', location.pathname, document.title. No DOM traversal, no parentElement, no className. Replace existing `src/content/element-extractor.ts` (delete old file).
- [x] T008 [P] [US1] Create `src/content/tooltip-styles.ts` — export `const TOOLTIP_CSS: string` as a template literal containing all tooltip styles: container (position fixed, z-index 2147483647, max-width 360px, max-height 50vh with overflow-y auto, background white, border-radius 8px, box-shadow, padding 16px, font-family system-ui), close button (absolute top-right, cursor pointer), loading state (spinner keyframe animation, "Analyzing..." text), result sections (elementIdentity as heading, primaryPurpose paragraph, useCases as numbered list, relatedElements as bullet list), error state (red-tinted background, error message text). All styles scoped inside Shadow DOM — no prefixing needed.
- [x] T009 [US1] Create `src/content/tooltip.ts` — Shadow DOM tooltip class with methods: `create(x: number, y: number): void` (creates host div, attaches closed Shadow DOM, injects `<style>${TOOLTIP_CSS}</style>` + container markup, appends host to document.body, positions near x,y), `showLoading(): void` (sets container innerHTML to spinner + "Analyzing..."), `showResult(data: ExplanationResponse): void` (renders elementIdentity heading, primaryPurpose paragraph, useCases numbered list, optional relatedElements list with HTML escaping), `showError(message: string): void` (renders error-styled message), `hide(): void` (removes host element from document.body, removes Escape keydown + click-outside listeners), `position(x: number, y: number): void` (viewport edge detection — if x + width > viewport width, anchor left; if y + height > viewport height, anchor above). Register Escape key and click-outside dismiss listeners on create(). If a tooltip already exists when create() is called, call hide() first (edge case: rapid re-trigger).
- [x] T010 [P] [US1] Create `src/background/api-client.ts` — export `requestExplanation(context: ElementContext): Promise<ExplanationResponse>` that POSTs JSON to `API_ENDPOINT` + "/explain" with fetch timeout via AbortController (FETCH_TIMEOUT_MS). Export error classes: `NetworkError` (fetch failure / AbortError), `RateLimitError` (HTTP 429), `ServerError` (HTTP 500/502/503), `ParseError` (invalid JSON or missing required fields). Validate response has all required ExplanationResponse fields. Remove all v1 multi-provider logic, prompt building, and API key handling.
- [x] T011 [US1] Rewrite `src/background/service-worker.ts` — on `chrome.runtime.onInstalled`: create context menu item with id=CONTEXT_MENU_ID, title="AI Help", contexts=["all"]; create alarm for cache cleanup every 6 hours. On `chrome.contextMenus.onClicked` (matching CONTEXT_MENU_ID): get active tab, send TRIGGER_FROM_CONTEXT_MENU message via `chrome.tabs.sendMessage(tab.id, { type: MessageType.TRIGGER_FROM_CONTEXT_MENU })`. On `chrome.runtime.onMessage` (matching REQUEST_EXPLANATION): extract ElementContext from payload, call `getCached(context)` — if hit send EXPLANATION_RESULT with `{ success: true, data }` via `chrome.tabs.sendMessage`; if miss call `requestExplanation(context)`, on success call `setCached(context, result)` then send EXPLANATION_RESULT with `{ success: true, data: result }`; on error map error class to user-friendly message (NetworkError → "Could not connect — check your internet", RateLimitError → "Too many requests — try again shortly.", ServerError → "Service temporarily unavailable.", ParseError/other → "Could not analyze this element.") and send EXPLANATION_RESULT with `{ success: false, error: message }`. On `chrome.alarms.onAlarm`: call `clearExpired()`. Remove all v1 imports of context-menu.ts.
- [x] T012 [US1] Rewrite `src/content/index.ts` — module-level variables `let lastX = 0, lastY = 0`. Register one `document.addEventListener('contextmenu', (e) => { lastX = e.clientX; lastY = e.clientY; })`. Register `chrome.runtime.onMessage.addListener` that handles: TRIGGER_FROM_CONTEXT_MENU → call `document.elementFromPoint(lastX, lastY)`, if element exists call `extractElementContext(element)`, call `tooltip.create(lastX, lastY)` + `tooltip.showLoading()`, send REQUEST_EXPLANATION with context via `chrome.runtime.sendMessage`; EXPLANATION_RESULT → if `payload.success` call `tooltip.showResult(payload.data)` else call `tooltip.showError(payload.error)`. Remove all v1 imports (HoverDetector, highlighter, v1 tooltip). Remove all hover detection and settings-change logic.

**Checkpoint**: Core flow works end-to-end. Right-click → "AI Help" → loading tooltip → explanation (or error) → dismiss. Content script has exactly one DOM event listener. No residual DOM after dismiss.

---

## Phase 4: User Story 2 — Extension Toggle (Priority: P2)

**Goal**: User clicks toolbar icon → popup with on/off toggle → toggling off removes "AI Help" from context menu → toggling on restores it.

**Independent Test**: Click extension icon, verify toggle defaults to ON. Toggle OFF, right-click any page — "AI Help" should not appear. Toggle ON — "AI Help" reappears.

### Implementation for User Story 2

- [x] T013 [P] [US2] Rewrite `src/popup/popup.html` — minimal HTML: extension name heading, one toggle switch (checkbox styled as slider) with label "Enabled", one-line instruction text ("Right-click any element → AI Help"). Remove API key input, provider dropdown, trigger mode radio buttons. Link to popup.css and popup.ts.
- [x] T014 [P] [US2] Rewrite `src/popup/popup.css` — style the toggle switch (track + thumb, blue when on, gray when off), heading, instruction text. Remove all API key, provider, and trigger mode styles. Keep system font family and 300px width.
- [x] T015 [US2] Rewrite `src/popup/popup.ts` — on DOMContentLoaded: call `getSettings()`, set toggle checkbox state from `settings.enabled`. On toggle change: call `saveSettings({ enabled: checkbox.checked })`, send message to background to create/remove context menu. Remove all API key, provider, and trigger mode logic.
- [x] T016 [US2] Add toggle support to `src/background/service-worker.ts` — listen for settings change message from popup: if enabled=true, call `chrome.contextMenus.create(...)` (with try-catch for "already exists"); if enabled=false, call `chrome.contextMenus.remove(CONTEXT_MENU_ID)`. Also check `getSettings()` on service worker startup and only create menu if enabled.

**Checkpoint**: Toggle works. Extension can be disabled/enabled. Context menu appears/disappears correctly. No interference with US1 flow.

---

## Phase 5: User Story 3 — Graceful Error Handling (Priority: P3)

**Goal**: All failure modes display user-friendly inline error messages in the tooltip — no silent failures, no frozen spinners, no browser alerts.

**Independent Test**: Disconnect internet, trigger "AI Help", verify "Could not connect — check your internet" appears in tooltip within 5 seconds.

### Implementation for User Story 3

- [x] T017 [US3] Verify error mapping completeness in `src/background/service-worker.ts` — ensure all error classes from api-client.ts are caught and mapped: NetworkError → "Could not connect — check your internet", RateLimitError → "Too many requests — try again shortly.", ServerError → "Service temporarily unavailable.", ParseError → "Could not analyze this element.", unexpected errors → "Could not analyze this element." Ensure error result is always sent back (no unhandled promise rejections that would leave spinner frozen).
- [x] T018 [US3] Add fetch timeout handling in `src/background/api-client.ts` — verify AbortController timeout fires at FETCH_TIMEOUT_MS (10s), ensure AbortError is caught and thrown as NetworkError with appropriate message. Verify that malformed JSON responses (non-JSON body, missing required fields) throw ParseError.
- [x] T019 [US3] Add error state styling to `src/content/tooltip-styles.ts` — ensure error state has distinct visual treatment (e.g., light red/pink background tint, warning icon or colored border) so user can instantly distinguish errors from loading/results.
- [x] T020 [US3] Handle edge case in `src/content/index.ts` — if `document.elementFromPoint(lastX, lastY)` returns null (user right-clicked outside document or on a plugin area), show tooltip at click coords with error message "Could not identify element at this position" instead of silently failing.

**Checkpoint**: Every failure mode produces a visible, dismissible error in the tooltip. No code path leaves the spinner frozen or fails silently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, performance validation, and final cleanup

- [x] T021 [P] Handle viewport edge positioning in `src/content/tooltip.ts` — verify tooltip repositions correctly when right-clicking near all four viewport edges (top, bottom, left, right). Tooltip must never overflow the visible viewport (FR-007, SC-006).
- [x] T022 [P] Handle rapid re-trigger in `src/content/tooltip.ts` — verify that triggering "AI Help" while a previous tooltip is showing dismisses the old tooltip first and creates a new one (edge case from spec).
- [x] T023 [P] Handle long content scroll in `src/content/tooltip-styles.ts` — verify tooltip has max-height (50vh) with overflow-y auto so extremely long explanations (many use cases) scroll rather than overflowing (edge case from spec).
- [x] T024 Verify content bundle size — run `npm run build`, check that the content script output in `dist/` is under 15KB minified (FR-017, SC-007). If over, identify and remove unnecessary code.
- [x] T025 Manual integration test — load unpacked extension in Chrome, test on 3+ diverse pages (e.g., GitHub, Google Docs, a complex enterprise app). Verify: context menu appears, loading tooltip shows within one frame, explanation renders correctly, dismiss works (Escape, click-outside, X button), no console errors, no residual DOM after dismiss.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (v1 files removed, clean slate)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (shared modules must compile)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (needs shared/settings.ts). Can run in parallel with US1.
- **User Story 3 (Phase 5)**: Depends on Phase 3 (error handling builds on top of working US1 flow)
- **Polish (Phase 6)**: Depends on Phase 3 (core flow must work)

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational only. No dependencies on other stories.
- **User Story 2 (P2)**: Depends on Foundational only. Independent of US1. Can run in parallel with US1.
- **User Story 3 (P3)**: Depends on US1 completion (error handling extends the working explanation flow).

### Within Each User Story

- Content modules before index.ts (index.ts imports all content modules)
- api-client.ts before service-worker.ts (service-worker imports api-client)
- Parallel tasks ([P]) can run simultaneously within a phase

### Parallel Opportunities

**Phase 2** (all 4 tasks are parallel):
```
T003 (types.ts) ║ T004 (constants.ts) ║ T005 (cache.ts) ║ T006 (settings.ts)
```

**Phase 3** (partial parallelism):
```
T007 (extractor.ts) ║ T008 (tooltip-styles.ts) ║ T010 (api-client.ts)
        ↓                       ↓                        ↓
   T009 (tooltip.ts) ←── depends on T008          T011 (service-worker.ts)
        ↓                                                ↓
   T012 (index.ts) ←───── depends on T007, T009, T011
```

**Phase 4** (partial parallelism):
```
T013 (popup.html) ║ T014 (popup.css)
        ↓
T015 (popup.ts) → T016 (service-worker toggle)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (remove v1 files, update manifest)
2. Complete Phase 2: Foundational (rewrite all 4 shared modules)
3. Complete Phase 3: User Story 1 (core right-click → explain flow)
4. **STOP and VALIDATE**: Build, load in Chrome, test on real pages
5. If working — this is a deployable MVP

### Incremental Delivery

1. Setup + Foundational → Clean project with new types
2. User Story 1 → Core explanation flow works (MVP!)
3. User Story 2 → Toggle control works
4. User Story 3 → All error states handled gracefully
5. Polish → Edge cases, performance validation, integration test

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Content script must remain under 15KB minified throughout
- v1 files are deleted in Phase 1 — this is a rewrite, not an incremental refactor
