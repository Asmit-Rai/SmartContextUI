# Message Contracts: SmartContextUI v2

Defines the message protocol between content script and background service worker.

## Message Envelope

All messages use this shape:

```typescript
interface Message {
  type: MessageType;
  payload: unknown;
}
```

## Messages

### TRIGGER_FROM_CONTEXT_MENU

**Direction**: Background → Content Script
**When**: User clicks "AI Help" in context menu
**Transport**: `chrome.tabs.sendMessage(tabId, message)`

```typescript
{
  type: "TRIGGER_FROM_CONTEXT_MENU",
  payload: {
    x: number,  // Not used — content script uses its own stored coords
    y: number   // Included for future flexibility
  }
}
```

**Content script behavior**: On receipt, uses stored `lastX`/`lastY` from the most recent `contextmenu` DOM event (not the payload coords). Calls `document.elementFromPoint(lastX, lastY)`, extracts context, shows loading tooltip, sends `REQUEST_EXPLANATION`.

### REQUEST_EXPLANATION

**Direction**: Content Script → Background
**When**: Content script has extracted element context and needs AI explanation
**Transport**: `chrome.runtime.sendMessage(message)`

```typescript
{
  type: "REQUEST_EXPLANATION",
  payload: {
    tagName: string,
    textContent: string,
    ariaLabel: string | null,
    role: string | null,
    id: string,
    title: string,
    placeholder: string,
    pagePathname: string,
    pageTitle: string
  }
}
```

**Background behavior**: Checks cache. On hit, sends `EXPLANATION_RESULT` with cached data. On miss, calls backend proxy, caches result, sends `EXPLANATION_RESULT`.

### EXPLANATION_RESULT

**Direction**: Background → Content Script
**When**: Explanation is ready (from cache or API) or an error occurred
**Transport**: `chrome.tabs.sendMessage(tabId, message)`

**Success**:
```typescript
{
  type: "EXPLANATION_RESULT",
  payload: {
    success: true,
    data: {
      elementIdentity: string,
      primaryPurpose: string,
      useCases: string[],
      relatedElements?: string[]
    }
  }
}
```

**Error**:
```typescript
{
  type: "EXPLANATION_RESULT",
  payload: {
    success: false,
    error: string  // User-friendly error message
  }
}
```

**Error messages by type**:
- Network error: `"Could not connect — check your internet"`
- Rate limit: `"Too many requests — try again shortly."`
- Server error: `"Service temporarily unavailable."`
- Parse/invalid response: `"Could not analyze this element."`

## Backend Proxy API

### POST /explain

**Request**:
```typescript
{
  tagName: string,
  textContent: string,
  ariaLabel: string | null,
  role: string | null,
  id: string,
  title: string,
  placeholder: string,
  pagePathname: string,
  pageTitle: string
}
```

**Response (200)**:
```typescript
{
  elementIdentity: string,
  primaryPurpose: string,
  useCases: string[],
  relatedElements?: string[]
}
```

**Error responses**:
- `429` — Rate limited
- `500` / `502` / `503` — Server error
- `400` — Malformed request
