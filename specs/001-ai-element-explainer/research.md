# Research: AI Element Explainer

**Date**: 2026-03-19
**Feature**: 001-ai-element-explainer

## R1: Manifest v3 Vite Plugin

**Decision**: Use `@crxjs/vite-plugin` for building the Manifest v3
extension with Vite.

**Rationale**: CRXJS is the most mature and widely adopted Vite plugin
for Chrome extension development. It supports Manifest v3, handles
content script injection, service worker bundling, HMR during
development, and auto-generates the dist/ folder structure from
manifest.json declarations.

**Alternatives considered**:
- `vite-plugin-web-extension`: Less mature, smaller community.
- `rollup-plugin-chrome-extension`: Rollup-only, no Vite HMR.
- Manual Vite config with multiple entry points: More setup, no
  extension-specific features (HMR, manifest parsing).

## R2: Shadow DOM for Tooltip Isolation

**Decision**: Render the tooltip inside a Shadow DOM attached to a
custom host element injected into the page.

**Rationale**: Shadow DOM provides complete CSS isolation from the host
page. Enterprise web apps (NetSuite, Salesforce) have aggressive CSS
that would break tooltip styles. Shadow DOM prevents both directions
of style leakage (host → tooltip and tooltip → host).

**Alternatives considered**:
- iframe: Heavier, cross-origin messaging complexity, slower rendering.
- CSS specificity with high-specificity selectors: Fragile, can still
  be overridden by `!important` rules on the host page.
- Inline styles only: Verbose, hard to maintain, no pseudo-elements.

## R3: Element Context Hashing for Cache Keys

**Decision**: Use the Web Crypto API (`crypto.subtle.digest('SHA-256',
...)`) to hash the element context string for cache keys.

**Rationale**: SHA-256 is built into the browser (no dependency),
collision-resistant, and produces consistent 64-char hex keys suitable
for chrome.storage.local. The hash input is a concatenation of:
tagName + textContent (truncated 200 chars) + ariaLabel + role +
pagePathname.

**Alternatives considered**:
- Simple string concatenation as key: Too long for storage keys,
  could exceed chrome.storage.local key limits.
- MD5: Not available natively in browsers, requires a library.
- CRC32: Higher collision risk, not suitable for cache integrity.

## R4: Content Script ↔ Background Communication

**Decision**: Use `chrome.runtime.sendMessage` / `onMessage` for
content script to background service worker communication.

**Rationale**: In Manifest v3, content scripts cannot make cross-origin
fetch calls to the backend proxy. The background service worker has
host permissions and can make the API call. Message passing is the
standard Manifest v3 pattern for this.

**Alternatives considered**:
- `chrome.runtime.connect` (long-lived port): Overkill for
  request/response pattern. Ports add complexity and must handle
  disconnection.
- Shared worker: Not supported in Manifest v3 extension context.

## R5: Context Menu Registration

**Decision**: Register the "AI Help" context menu item via
`chrome.contextMenus.create` in the service worker's `onInstalled`
event. Use `chrome.contextMenus.onClicked` to handle clicks and send
a message to the active tab's content script.

**Rationale**: This is the standard Manifest v3 approach. The context
menu item persists across browser sessions. The `onClicked` handler
receives the clicked element info and tab ID, enabling targeted
message passing to the correct content script instance.

**Alternatives considered**:
- Content script event listener for `contextmenu` event + custom DOM
  menu: Interferes with native context menu, poor UX, accessibility
  issues.

## R6: Vite Build Configuration

**Decision**: Configure Vite with three entry points (content script,
service worker, popup) outputting to dist/. Use @crxjs/vite-plugin to
handle manifest.json processing and extension structure.

**Rationale**: Vite provides fast builds, TypeScript support out of
the box, and the CRXJS plugin automates the extension-specific build
concerns (content script injection, service worker registration,
asset copying).

**Alternatives considered**:
- webpack + `webpack-chrome-extension-reloader`: Slower builds, more
  configuration boilerplate.
- esbuild directly: Fast but no extension-specific plugin ecosystem,
  manual manifest handling.
- No build tool (plain JS): Loses TypeScript, module bundling, and
  tree-shaking benefits.
