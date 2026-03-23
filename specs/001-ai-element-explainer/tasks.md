# Tasks: AI Element Explainer

**Input**: Design documents from `/specs/001-ai-element-explainer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/backend-api.md

**Tests**: Not explicitly requested in the spec. Test tasks in Phase 8 are manual E2E verification tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- Browser extension with Manifest v3, Vite build to `dist/`

---

## Phase 1: Setup

**Purpose**: Project initialization, build pipeline, and shared modules

- [x] T001 [P] Create package.json with dependencies (vite, typescript, @crxjs/vite-plugin) and scripts (dev, build) in package.json
- [x] T002 [P] Create tsconfig.json with strict mode, ES2020 target, moduleResolution bundler, and path aliases in tsconfig.json
- [x] T003 [P] Create manifest.json with Manifest v3 config: permissions (contextMenus, storage, activeTab), background service worker (src/background/service-worker.ts), content script (src/content/index.ts matching <all_urls>), popup (src/popup/popup.html), icons (16, 48, 128) in manifest.json
- [x] T004 [P] Create shared types: ElementContext, ExplanationResponse, Settings, CacheEntry interfaces and MessageType enum with typed message payloads in src/shared/types.ts
- [x] T005 [P] Create shared constants: API_ENDPOINT, DEBOUNCE_DELAY_MS (600), CACHE_TTL_MS (86400000), TOOLTIP_MAX_WIDTH (360), TEXT_CONTENT_MAX_LENGTH (200), PARENT_SNIPPET_MAX_LENGTH (500), INTERACTIVE_SELECTORS in src/shared/constants.ts
- [x] T006 [P] Add placeholder extension icons (16x16, 48x48, 128x128 PNG) in src/assets/icon-16.png, src/assets/icon-48.png, src/assets/icon-128.png
- [x] T007 Create vite.config.ts configured with @crxjs/vite-plugin for Manifest v3 output to dist/ in vite.config.ts (depends on T001, T003)
- [x] T008 Create settings module with getSettings() (defaults: enabled true, triggerMode 'both'), saveSettings(), and onSettingsChanged() using chrome.storage.local in src/shared/settings.ts (depends on T004)

**Checkpoint**: Run `npm install && npm run build` — should produce dist/ folder with manifest.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core content script infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 [P] Create element extractor: extractElementContext(element) returns ElementContext with tagName, textContent (truncated 200 chars), ariaLabel, ariaRole, id, className, title, placeholder, parentSnippet (parent outerHTML truncated 500 chars), pageTitle, pagePathname in src/content/element-extractor.ts (depends on T004, T005)
- [x] T010 [P] Create highlighter: highlightElement() adds 2px solid rgba(59,130,246,0.7) outline + subtle background tint via inline styles storing originals, removeHighlight() restores originals, removeAllHighlights() cleans all — use outline not border to avoid reflow in src/content/highlighter.ts
- [x] T011 [P] Create tooltip CSS: max-width 360px, white bg, border-radius 8px, box-shadow, padding 16px, system-ui font, close button (X) absolute top-right, CSS-only loading spinner, section styles (.identity bold, .purpose paragraph, .use-cases numbered list, .related italic muted), error state (orange text), fade-in opacity 0→1 over 150ms in src/content/tooltip/tooltip.css
- [x] T012 [P] Create tooltip renderer: renderLoading() returns HTML with spinner + "Analyzing element...", renderExplanation(ExplanationResponse) returns HTML with Identity header + Purpose paragraph + Use Cases numbered list + Related Elements (if present), renderError(message) returns HTML with error icon + friendly message — all return plain HTML strings in src/content/tooltip/tooltip-renderer.ts (depends on T004)
- [x] T013 Create tooltip manager (singleton): createTooltip() creates div + attaches Shadow DOM + injects tooltip.css, show(targetElement, contentHTML) positions near element using getBoundingClientRect() with viewport-aware flipping, updateContent(contentHTML) swaps inner HTML in-place, hide() removes with fade-out, isVisible() returns boolean, registers dismiss listeners (click outside → hide, Escape → hide, X button → hide) in src/content/tooltip/tooltip-manager.ts (depends on T011, T012)
- [x] T014 [P] Create API client: requestExplanation(ElementContext) sends POST to API_ENDPOINT with JSON body, validates response shape (identity, purpose, useCases fields), handles errors — 429 → RateLimitError ("Too many requests — try again shortly"), 5xx → ServerError ("Service temporarily unavailable"), network failure → NetworkError ("Could not connect — check your internet"), malformed response → ParseError ("Could not analyze this element"). Define ApiError base class with userMessage property in src/background/api-client.ts (depends on T004, T005)
- [x] T015 Create background service worker: register chrome.runtime.onMessage listener, on REQUEST_EXPLANATION message call apiClient.requestExplanation() with ElementContext payload, send EXPLANATION_RESULT message back to sender tab with explanation or error userMessage string in src/background/service-worker.ts (depends on T004, T014)

**Checkpoint**: Build succeeds with all foundational modules. Service worker loads without errors in chrome://extensions.

---

## Phase 3: User Story 1 — Hover to Explain (Priority: P1) MVP

**Goal**: User hovers over any interactive element for 600ms and sees an AI-generated explanation tooltip

**Independent Test**: Install extension, visit any web page, hover over a button for 600ms, verify tooltip appears with structured explanation

### Implementation for User Story 1

- [x] T016 [US1] Create hover detector: HoverDetector class with start() adding mouseover/mouseout listeners on document (event delegation), mouseover checks target against INTERACTIVE_SELECTORS + starts 600ms debounce timer, mouseout clears timer + removes highlight + hides tooltip. After debounce: highlight element, extract context, show tooltip with loading state, send REQUEST_EXPLANATION to background. Listen for EXPLANATION_RESULT: update tooltip with rendered explanation or error. stop() removes all listeners. Respects settings.enabled and settings.triggerMode (skip if mode is 'rightclick') in src/content/hover-detector.ts (depends on T005, T008, T009, T010, T013)
- [x] T017 [US1] Create content script entry: import and initialize TooltipManager and HoverDetector, read initial settings via getSettings(), start HoverDetector if enabled, listen for settings changes via onSettingsChanged to start/stop HoverDetector accordingly in src/content/index.ts (depends on T008, T013, T016)

**Checkpoint**: Load extension, hover over a button on any page for 600ms — highlight appears, loading spinner shows in tooltip, explanation displays (or error if backend unavailable), tooltip dismisses on Escape/click-outside/X

---

## Phase 4: User Story 2 — Right-Click Context Menu (Priority: P2)

**Goal**: User right-clicks any element, selects "AI Help" from context menu, sees explanation tooltip

**Independent Test**: Right-click any element, select "AI Help", verify tooltip appears with explanation

### Implementation for User Story 2

- [x] T018 [P] [US2] Create context menu module: registerContextMenu() calls chrome.contextMenus.create with title "AI Help", contexts ["all"], id "smartcontextui-explain". handleContextMenuClick(info, tab) sends TRIGGER_FROM_CONTEXT_MENU message to content script in clicked tab in src/background/context-menu.ts (depends on T004)
- [x] T019 [US2] Wire context menu into service worker: import context-menu.ts, call registerContextMenu() on chrome.runtime.onInstalled, register chrome.contextMenus.onClicked listener pointing to handleContextMenuClick() in src/background/service-worker.ts (depends on T015, T018)
- [x] T020 [US2] Add context menu handler to content script: listen for TRIGGER_FROM_CONTEXT_MENU message from background, use document.elementFromPoint() to find target element at click coordinates, run same explanation flow as hover (highlight → extract → show loading tooltip → request explanation → render result) in src/content/index.ts (depends on T017, T019)

**Checkpoint**: Right-click any element → "AI Help" in context menu → click → explanation tooltip appears. Works when trigger mode is "Right-Click Only" and hover is disabled.

---

## Phase 5: User Story 3 — Extension Popup Controls (Priority: P3)

**Goal**: User opens popup from toolbar icon to toggle extension on/off and select trigger mode

**Independent Test**: Click extension icon, toggle off, verify hover stops working. Change mode to "Right-Click Only", verify only context menu works.

### Implementation for User Story 3

- [x] T021 [P] [US3] Create popup HTML: extension name header, toggle switch for on/off (checkbox styled as toggle), radio buttons for trigger mode (Hover / Right-Click Only / Both), brief usage instructions paragraph, link popup.css and popup.ts in src/popup/popup.html
- [x] T022 [P] [US3] Create popup CSS: system-ui font, width ~300px, comfortable padding, styled toggle switch (CSS only), styled radio buttons, muted instruction text, consistent with tooltip design language in src/popup/popup.css
- [x] T023 [US3] Create popup script: on DOMContentLoaded load settings via getSettings() and populate controls, toggle change handler calls saveSettings({enabled}), trigger mode change handler calls saveSettings({triggerMode}), settings propagate to content script automatically via existing onSettingsChanged listener in src/popup/popup.ts (depends on T004, T008, T021)

**Checkpoint**: Click extension icon → popup shows toggle + mode selector. Toggle off → hover stops. Change to "Hover" → context menu item hidden. Change to "Right-Click Only" → hover disabled.

---

## Phase 6: User Story 4 — Cached Explanations (Priority: P4)

**Goal**: Repeated hover/right-click on same element shows cached explanation instantly without API call

**Independent Test**: Hover over element, get explanation, dismiss, hover again — second time loads instantly with no spinner

### Implementation for User Story 4

- [x] T024 [US4] Create cache module: generateContextHash(ElementContext) using djb2 hash of tagName+textContent+ariaLabel+ariaRole+pagePathname, getCachedExplanation(context) checks chrome.storage.local by hash key + validates TTL (returns null if expired), setCachedExplanation(context, explanation) stores CacheEntry with timestamp, clearExpiredCache() iterates and removes expired entries in src/shared/cache.ts (depends on T004, T005)
- [x] T025 [US4] Integrate cache into service worker: on REQUEST_EXPLANATION check cache first via getCachedExplanation() — if hit return immediately without API call, if miss call API then store via setCachedExplanation() before returning. Register chrome.alarms for clearExpiredCache() every 6 hours. Add "alarms" permission to manifest.json in src/background/service-worker.ts and manifest.json (depends on T015, T024)

**Checkpoint**: Hover over same element twice — second time tooltip appears instantly (no loading spinner, no network request in DevTools). After 24hrs (mock via timestamp), cache miss triggers fresh API call.

---

## Phase 7: User Story 5 — Graceful Error Handling (Priority: P5)

**Goal**: All error states show clear, friendly messages in the tooltip — never silent failures or browser alerts

**Independent Test**: Disconnect internet, hover over element, verify "Could not connect" message in tooltip within 5 seconds

### Implementation for User Story 5

- [x] T026 [US5] Add fetch timeout (10 seconds) to API client using AbortController, abort → throw NetworkError with "Service temporarily unavailable" message in src/background/api-client.ts (depends on T014)
- [x] T027 [US5] Verify all error paths render correctly: ensure service worker catches all ApiError subtypes and sends userMessage string back to content script, ensure content script passes error message to tooltipRenderer.renderError(), ensure tooltip shows error state — no code paths lead to silent failure, frozen spinner, or browser alert. Fix any gaps found in src/background/service-worker.ts and src/content/hover-detector.ts (depends on T015, T016)

**Checkpoint**: Test all error states — network disconnect ("Could not connect"), 429 ("Too many requests"), 500 ("Service temporarily unavailable"), malformed response ("Could not analyze this element"). All show friendly messages in tooltip.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification and final adjustments

- [ ] T028 [P] End-to-end hover flow verification (MANUAL): load extension in Chrome, navigate to complex pages (GitHub, Amazon, Gmail), hover over buttons/links/inputs, verify highlight after 600ms, loading spinner, structured explanation (Identity + Purpose + Use Cases), tooltip dismiss (Escape/click-outside/X), mouseout clears highlight, fix viewport edge positioning issues
- [ ] T029 [P] End-to-end context menu verification (MANUAL): right-click various elements (interactive and non-interactive), verify "AI Help" appears, click it, verify explanation tooltip, test with "Right-Click Only" mode, verify hover is disabled in that mode
- [ ] T030 Error handling verification (MANUAL): test with backend unreachable, simulated 429, simulated 500, malformed response — verify each shows correct friendly error message in tooltip, verify no silent failures anywhere
- [ ] T031 Cache verification (MANUAL): hover same element twice — second loads instantly (no spinner), verify cache expiry after 24hr (mock timestamp), verify different elements get separate cache entries, verify same element pattern on different pages with same pathname shares cache
- [ ] T032 Popup verification (MANUAL): toggle on/off works immediately without reload, all three trigger modes work correctly, settings persist across browser restarts
- [ ] T033 Performance check (MANUAL): verify extension adds <50ms to page load time, verify debounce prevents rapid-fire API calls, verify tooltip never overflows viewport

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 types/constants (T004, T005) — BLOCKS all user stories
- **US1 Hover (Phase 3)**: Depends on Phase 2 completion
- **US2 Context Menu (Phase 4)**: Depends on Phase 2 + US1 content script entry (T017)
- **US3 Popup (Phase 5)**: Depends on Phase 1 settings (T008) only — can run parallel with US1/US2
- **US4 Caching (Phase 6)**: Depends on Phase 2 service worker (T015)
- **US5 Error Handling (Phase 7)**: Depends on Phase 2 API client + service worker (T014, T015)
- **Polish (Phase 8)**: Depends on all prior phases

### Parallel Opportunities

**Within Phase 1** (5 tasks can run simultaneously):
```
T001 (package.json) ──┐
T002 (tsconfig.json) ─┤
T003 (manifest.json) ─┼── all parallel, then T007 (vite.config) + T008 (settings)
T004 (types.ts) ──────┤
T005 (constants.ts) ──┤
T006 (icons) ─────────┘
```

**Within Phase 2** (4 tasks can run simultaneously):
```
T009 (extractor) ─────┐
T010 (highlighter) ───┤── parallel
T011 (tooltip.css) ───┼── then T013 (tooltip-manager)
T012 (renderer) ──────┤── then T015 (service-worker)
T014 (api-client) ────┘
```

**Cross-phase parallelism**:
```
Phase 3 (US1) ─────┐
Phase 5 (US3) ─────┼── can run in parallel after Phase 2
Phase 6 (US4) ─────┤
Phase 7 (US5) ─────┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Hover to Explain
4. **STOP and VALIDATE**: Test hover flow end-to-end
5. Deploy/demo if ready — this alone delivers the core value proposition

### Incremental Delivery

1. Setup + Foundational → Build pipeline + all shared modules ready
2. Add US1 (Hover) → Core experience works → Demo-ready MVP
3. Add US2 (Context Menu) → Alternative trigger method → More accessible
4. Add US3 (Popup) → User customization → Complete settings UI
5. Add US4 (Caching) → Performance improvement → Reduced API load
6. Add US5 (Error Handling) → Polish → Production-ready
7. Polish phase → Final verification → Ship

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Critical path: Phase 1 → Phase 2 → Phase 3 → Phase 8
