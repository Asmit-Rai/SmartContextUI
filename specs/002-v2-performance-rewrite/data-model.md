# Data Model: SmartContextUI v2

**Date**: 2026-03-19

## Entities

### ElementContext

Captured from the right-clicked element. Sent to background for AI analysis.

| Field | Type | Constraints | Source |
|-------|------|-------------|--------|
| tagName | string | Required, uppercase (e.g., "BUTTON") | `element.tagName` |
| textContent | string | Truncated to 200 chars, trimmed | `element.textContent` |
| ariaLabel | string \| null | null if not present | `element.getAttribute('aria-label')` |
| role | string \| null | null if not present | `element.getAttribute('role')` |
| id | string | Empty string if not present | `element.id` |
| title | string | Empty string if not present | `element.title` |
| placeholder | string | Empty string if not present | `element.getAttribute('placeholder')` |
| pagePathname | string | Required | `window.location.pathname` |
| pageTitle | string | Required | `document.title` |

### ExplanationResponse

Structured AI response displayed in the tooltip.

| Field | Type | Constraints |
|-------|------|-------------|
| elementIdentity | string | Required, short label (e.g., "Submit Button") |
| primaryPurpose | string | Required, 1-2 sentence description |
| useCases | string[] | Required, non-empty array, numbered in display |
| relatedElements | string[] \| undefined | Optional, may be omitted |

### CacheEntry

Stored in `chrome.storage.local` under key `cache_{hash}`.

| Field | Type | Constraints |
|-------|------|-------------|
| explanation | ExplanationResponse | Required |
| timestamp | number | Required, `Date.now()` at creation |

**Expiration**: Entry is stale when `Date.now() - timestamp > CACHE_TTL_MS` (24 hours).
**Key format**: `cache_${djb2Hash(JSON.stringify(elementContext))}`

### Settings

Stored in `chrome.storage.local` under key `settings`.

| Field | Type | Default | Constraints |
|-------|------|---------|-------------|
| enabled | boolean | true | Required |

### MessageType (enum)

| Value | Direction | Payload |
|-------|-----------|---------|
| TRIGGER_FROM_CONTEXT_MENU | Background → Content | `{ x: number, y: number }` |
| REQUEST_EXPLANATION | Content → Background | `ElementContext` |
| EXPLANATION_RESULT | Background → Content | `{ success: true, data: ExplanationResponse }` or `{ success: false, error: string }` |

## State Transitions

### Tooltip Lifecycle

```
[No tooltip] → TRIGGER received → [Loading] → RESULT received → [Showing explanation]
                                                                         │
[No tooltip] ← dismiss (Esc/click-outside/X) ←─────────────────────────┘

[No tooltip] → TRIGGER received → [Loading] → ERROR received → [Showing error]
                                                                       │
[No tooltip] ← dismiss (Esc/click-outside/X) ←───────────────────────┘

[Any tooltip state] → new TRIGGER → [dismiss old] → [Loading for new element]
```

### Extension State

```
[Enabled] → user toggles off → [Disabled] → context menu removed
[Disabled] → user toggles on → [Enabled] → context menu re-created
```

## Relationships

```
Settings ──controls──▶ Context Menu visibility
ElementContext ──hashed to──▶ CacheEntry key
ElementContext ──sent to──▶ Backend Proxy ──returns──▶ ExplanationResponse
ExplanationResponse ──stored as──▶ CacheEntry
ExplanationResponse ──rendered in──▶ Tooltip
```
