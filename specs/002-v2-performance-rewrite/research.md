# Research: SmartContextUI v2 — Performance-First Rewrite

**Date**: 2026-03-19

## R1: Context Menu Coordinate Problem in Manifest v3

**Decision**: Content script stores `contextmenu` event coordinates in module-level variables; background sends a "trigger" message; content script uses stored coordinates with `document.elementFromPoint()`.

**Rationale**: Manifest v3's `chrome.contextMenus.onClicked` callback does not provide page coordinates. The `contextmenu` DOM event fires before the native context menu appears, so coordinates are always available when "AI Help" is clicked. This approach keeps all DOM interaction in the content script and eliminates the need for `chrome.scripting` permission.

**Alternatives considered**:
- `chrome.scripting.executeScript` to inject a coord-grabber after menu click — adds `scripting` permission, extra roundtrip, more complexity.
- Using `info.frameId` from onClicked to target frames — doesn't solve the coordinate problem, adds frame complexity.

## R2: Shadow DOM for Tooltip Isolation

**Decision**: Use Shadow DOM (`attachShadow({ mode: 'closed' })`) for the tooltip. CSS defined as a JS template literal string in `tooltip-styles.ts`.

**Rationale**: Shadow DOM provides complete style isolation — host page CSS cannot break the tooltip, and tooltip styles cannot leak into the host page. Closed mode prevents host page scripts from accessing tooltip internals. CSS as a template literal avoids build-tool-specific CSS import mechanisms (`?inline`, CSS modules, extract plugins).

**Alternatives considered**:
- `<iframe>` for isolation — heavier, more complex positioning, CSP issues with some pages.
- CSS scoping with unique prefixes — fragile, doesn't protect against `!important` or `*` selectors from host page.
- Separate `.css` file with `?inline` Vite import — couples to build tool, may not work with all bundlers.

## R3: Backend Proxy vs Client-Side API Keys

**Decision**: Extension POSTs element context to a backend proxy endpoint. Backend handles API key management, provider selection, and rate limiting.

**Rationale**: Moves security-sensitive API key storage off the client. Simplifies extension UI (no key input, no provider dropdown). Enables server-side rate limiting, prompt engineering, and provider switching without extension updates. Aligns with v2 spec's explicit architecture.

**Alternatives considered**:
- Client-side API keys (v1 approach) — more UI complexity, keys in browser storage, each user manages their own key, no centralized rate limiting.
- Hybrid (user key with proxy fallback) — over-engineered for current requirements.

## R4: Cache Strategy

**Decision**: Cache in `chrome.storage.local` using djb2 hash of element context as key. TTL of 24 hours. Periodic cleanup via `chrome.alarms` (every 6 hours).

**Rationale**: `chrome.storage.local` is available in both content scripts and service workers, persists across browser restarts, and has a 10MB quota (ample for text explanations). djb2 is fast and produces good distribution for short strings. The existing v1 cache implementation (`src/shared/cache.ts`) already uses this approach and can be carried forward with minimal changes.

**Alternatives considered**:
- IndexedDB — more API surface, overkill for simple key-value text cache.
- Service worker `CacheStorage` — designed for HTTP responses, not arbitrary data.
- In-memory Map in service worker — lost on service worker termination (MV3 service workers are ephemeral).

## R5: Element Context Extraction Scope

**Decision**: Extract exactly 9 direct attributes from the clicked element: `tagName`, `textContent` (truncated to 200 chars), `aria-label`, `role`, `id`, `title`, `placeholder`, page `pathname`, page `title`. No DOM traversal.

**Rationale**: Spec requires extraction < 1ms. Direct attribute reads are O(1). Removing `parentElement.outerHTML` (from v1) and `className` eliminates the most expensive operations and provides cleaner context for the AI. The 9 attributes give the AI enough signal to identify and explain any interactive element.

**Alternatives considered**:
- Including `className` — often contains hashed/minified class names (e.g., `_3xK9a`) that are meaningless to the AI.
- Including parent context — adds DOM traversal cost, increases payload size, marginal value for explanations.
- Including computed styles — expensive, large payload, not useful for element understanding.

## R6: Content Script Bundle Size Target

**Decision**: Target < 15KB minified for content script bundle.

**Rationale**: Content script runs on every page. Smaller bundles mean faster injection and less memory. With only 4 small TypeScript files (index, extractor, tooltip, tooltip-styles) and zero runtime dependencies, 15KB is achievable. Vite's tree-shaking and minification handle the rest.

**Alternatives considered**:
- No size target — risks bloat as features are added.
- Splitting content script into lazy-loaded chunks — adds complexity, Manifest v3 content script chunk loading has edge cases.

## R7: @crxjs/vite-plugin for Build

**Decision**: Keep existing `@crxjs/vite-plugin` setup. It handles Manifest v3 entry points, HMR in dev, and output structure automatically.

**Rationale**: Already configured in v1. Handles service worker, content script, and popup entry points from `manifest.json`. No manual multi-entry Vite config needed. Copies `manifest.json` and `popup.html` to `dist/` automatically.

**Alternatives considered**:
- Manual Vite multi-entry config — more boilerplate, must manually handle manifest copying and content script injection format.
- webpack with crx plugin — heavier, slower builds, no advantage for this project size.
