# Data Model: AI Element Explainer

**Date**: 2026-03-19
**Feature**: 001-ai-element-explainer

## Entities

### ElementContext

Represents the data captured from a UI element for AI analysis.
Sent to the backend proxy as the request payload.

| Field | Type | Constraints |
|-------|------|-------------|
| tagName | string | Lowercase HTML tag (e.g., "button", "a", "input") |
| textContent | string | Truncated to 200 characters |
| ariaLabel | string or null | Value of aria-label attribute |
| ariaRole | string or null | Value of role attribute |
| id | string or null | Element id attribute |
| className | string or null | Element class attribute |
| title | string or null | Element title attribute |
| placeholder | string or null | Element placeholder attribute (inputs) |
| parentSnippet | string | Outer HTML of parent element, truncated to 500 characters |
| pageTitle | string | document.title |
| pagePathname | string | window.location.pathname |

### ExplanationResponse

The structured AI response returned by the backend proxy.

| Field | Type | Constraints |
|-------|------|-------------|
| identity | string | What the element is (e.g., "Submit Button") |
| purpose | string | Primary action or function |
| useCases | string[] | List of possible use cases / outcomes |
| relatedElements | string[] or null | Optional list of related nearby elements |

### CacheEntry

A stored explanation keyed by a content hash in chrome.storage.local.

| Field | Type | Constraints |
|-------|------|-------------|
| contextHash | string | SHA-256 hex hash of (tagName + textContent + ariaLabel + ariaRole + pagePathname) |
| explanation | ExplanationResponse | The cached response |
| createdAt | number | Unix timestamp (ms) when cached |
| expiresAt | number | createdAt + 86400000 (24 hours in ms) |

**Validation**: On cache read, check `Date.now() < expiresAt`. If
expired, delete entry and return cache miss.

### Settings

Extension configuration state stored in chrome.storage.local.

| Field | Type | Constraints |
|-------|------|-------------|
| enabled | boolean | Default: true |
| triggerMode | "hover" \| "rightclick" \| "both" | Default: "both" |

## Relationships

```text
ElementContext ──sends-to──▶ Backend Proxy ──returns──▶ ExplanationResponse
                                                              │
                                                              ▼
                                                         CacheEntry
                                                     (stored locally)

Settings ──controls──▶ HoverDetector (enabled + triggerMode)
Settings ──controls──▶ ContextMenu (enabled + triggerMode)
```

## State Transitions

### Tooltip Lifecycle

```text
IDLE ──(hover 600ms or context menu click)──▶ LOADING
LOADING ──(cache hit)──▶ VISIBLE
LOADING ──(API response)──▶ VISIBLE
LOADING ──(error)──▶ ERROR_VISIBLE
VISIBLE ──(dismiss: Escape/click-outside/X)──▶ IDLE
ERROR_VISIBLE ──(dismiss)──▶ IDLE
```

### Extension State

```text
ENABLED ──(user toggles off)──▶ DISABLED
DISABLED ──(user toggles on)──▶ ENABLED
```
