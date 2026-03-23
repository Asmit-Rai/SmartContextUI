# Feature Specification: SmartContextUI v2 — Performance-First Rewrite

**Feature Branch**: `002-v2-performance-rewrite`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Performance-first rewrite — right-click only, zero DOM overhead"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Right-Click Element Explanation (Priority: P1)

A user is working in a complex enterprise web application and
encounters a UI element they do not understand. They right-click the
element. In the browser's context menu they see an "AI Help" option.
They click it. A small tooltip appears instantly next to the element
showing "Analyzing..." with a spinner. After a moment the spinner is
replaced with a structured explanation: what the element is, what it
does, all its possible use cases, and optionally related nearby
elements. The user reads the explanation and dismisses the tooltip by
pressing Escape, clicking outside, or clicking the X button.

**Why this priority**: This is the entire core product. A single,
zero-overhead interaction path that delivers AI-powered element
understanding with no setup and no performance cost.

**Independent Test**: Install the extension, visit any web page,
right-click any element, select "AI Help", verify a structured
explanation tooltip appears.

**Acceptance Scenarios**:

1. **Given** the extension is installed and enabled, **When** the user
   right-clicks any element and selects "AI Help", **Then** a tooltip
   appears next to the element with a loading spinner and
   "Analyzing..." text within 16ms of the click.

2. **Given** the loading tooltip is visible, **When** the AI response
   arrives, **Then** the tooltip content updates in-place to show a
   structured explanation with Element Identity, Primary Purpose, Use
   Cases, and optionally Related Elements.

3. **Given** a tooltip is visible, **When** the user presses Escape,
   clicks outside the tooltip, or clicks the X button, **Then** the
   tooltip is removed from the page and no residual DOM remains.

4. **Given** the extension is installed, **When** the user navigates
   to any web page without triggering "AI Help", **Then** zero event
   listeners are active on the page except one lightweight contextmenu
   coordinate tracker, and no visible UI is injected.

5. **Given** the user previously explained this exact element on this
   page, **When** they right-click and select "AI Help" again, **Then**
   the cached explanation appears instantly with no loading spinner
   and no network request.

---

### User Story 2 - Extension Toggle (Priority: P2)

A user wants to temporarily disable the extension without uninstalling
it. They click the extension icon in the toolbar. A minimal popup
appears with an on/off toggle and a one-line usage instruction. They
toggle it off. The "AI Help" context menu item no longer appears when
they right-click. They toggle it back on and the context menu item
returns.

**Why this priority**: Users need basic control over the extension,
but the core explanation flow must work first.

**Independent Test**: Click extension icon, toggle off, right-click
on a page and verify "AI Help" does not appear. Toggle on, verify it
reappears.

**Acceptance Scenarios**:

1. **Given** the user clicks the extension toolbar icon, **When** the
   popup opens, **Then** it displays an on/off toggle (defaulting to
   on) and a brief usage instruction.

2. **Given** the extension is enabled, **When** the user toggles it
   off, **Then** the "AI Help" context menu item no longer appears on
   right-click on any tab.

3. **Given** the extension is disabled, **When** the user toggles it
   on, **Then** the "AI Help" context menu item reappears on
   right-click.

---

### User Story 3 - Graceful Error Handling (Priority: P3)

A user triggers "AI Help" but something goes wrong — they have no
internet, the backend is down, or the response is invalid. Instead of
a silent failure, frozen spinner, or browser alert, the tooltip shows
a clear, friendly error message inline. The user always knows what
happened and is never left in a broken state.

**Why this priority**: Essential for a polished experience but the
core explanation flow must work first.

**Independent Test**: Disconnect from the internet, trigger "AI Help",
verify a friendly error message appears in the tooltip.

**Acceptance Scenarios**:

1. **Given** the user has no internet connection, **When** they
   trigger "AI Help", **Then** the tooltip shows "Could not connect
   — check your internet" within 5 seconds.

2. **Given** the backend returns a rate-limit response, **When** the
   user triggers "AI Help", **Then** the tooltip shows "Too many
   requests — try again shortly."

3. **Given** the backend is unreachable or returns a server error,
   **When** the user triggers "AI Help", **Then** the tooltip shows
   "Service temporarily unavailable."

4. **Given** the backend returns an empty or malformed response,
   **When** the user triggers "AI Help", **Then** the tooltip shows
   "Could not analyze this element."

---

### Edge Cases

- What happens when the user right-clicks an element near the bottom
  of the viewport? The tooltip repositions itself above the element
  to stay fully visible.

- What happens when the user right-clicks a very small element (1px
  icon, hidden span)? The tooltip still appears anchored to the click
  coordinates and displays whatever context can be extracted.

- What happens when the user triggers "AI Help" on a page with
  aggressive Content Security Policy? The tooltip uses inline styles
  within an isolated container so CSP restrictions on external
  stylesheets do not affect it.

- What happens when the user triggers "AI Help" while a previous
  tooltip is still showing? The existing tooltip is dismissed and
  replaced with the new one.

- What happens on a page with no interactive elements (blank page,
  image-only page)? The extension still works — context menu appears
  on any element, and the AI analyzes whatever element is at the
  click coordinates.

- What happens when the tooltip content is extremely long (many use
  cases)? The tooltip has a maximum height with scroll, capped at a
  reasonable viewport percentage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST add a context menu item labeled
  "AI Help" that appears when the user right-clicks any element on
  any web page.

- **FR-002**: Clicking "AI Help" MUST display a tooltip next to the
  right-clicked element showing a loading indicator within 16ms.

- **FR-003**: The tooltip MUST update in-place with a structured AI
  explanation containing: Element Identity, Primary Purpose, Use
  Cases (numbered list), and Related Elements (optional).

- **FR-004**: The tooltip MUST be dismissible by pressing Escape,
  clicking outside the tooltip, or clicking the close button.

- **FR-005**: When dismissed, the tooltip MUST be fully removed from
  the page — no residual elements, event listeners, or styles.

- **FR-006**: The tooltip MUST be visually isolated from the host
  page so that host page styles cannot break the tooltip and tooltip
  styles cannot affect the host page.

- **FR-007**: The tooltip MUST never overflow the viewport — it MUST
  reposition when near screen edges.

- **FR-008**: The extension MUST have zero runtime DOM overhead when
  not triggered — no persistent event listeners on the page except
  one contextmenu coordinate tracker.

- **FR-009**: Element context extraction MUST complete in under 1ms
  — read only direct attributes of the clicked element with no DOM
  traversal.

- **FR-010**: The extension MUST send element context to a backend
  service for AI analysis and receive a structured response.

- **FR-011**: The extension MUST cache AI explanations so that
  repeated requests for the same element on the same page return
  instantly without a network request.

- **FR-012**: Cached explanations MUST expire after 24 hours.

- **FR-013**: The extension MUST display user-friendly inline error
  messages in the tooltip for all failure modes — never silent
  failures, frozen spinners, or browser alerts.

- **FR-014**: The extension MUST provide a popup with an on/off
  toggle and brief usage instructions.

- **FR-015**: The on/off toggle MUST take effect immediately — when
  disabled, the "AI Help" context menu item MUST NOT appear.

- **FR-016**: The extension MUST default to enabled on first install
  with zero configuration required.

- **FR-017**: The total size of code injected into web pages MUST be
  under 15KB minified.

### Key Entities

- **Element Context**: Data captured from a right-clicked element.
  Key attributes: tag name, text content (max 200 chars), aria-label,
  role, id, title, placeholder, page pathname, page title.

- **Explanation**: Structured AI response. Key attributes: element
  identity label, primary purpose description, list of use cases,
  optional related elements list.

- **Cache Entry**: Stored explanation keyed by content hash. Key
  attributes: hash key, explanation data, creation timestamp,
  expiration time.

- **User Settings**: Extension state. Key attributes: enabled/disabled
  flag.

## Assumptions

- The backend service for AI analysis is maintained separately from
  the extension. The extension treats it as an external service.

- The backend handles AI provider selection, API key management, and
  rate limiting. The extension is not responsible for these concerns.

- The extension targets Chromium-based browsers (Chrome, Edge, Brave).
  Firefox and Safari are not in scope.

- The contextmenu event for coordinate tracking fires before the
  browser's native context menu appears, so coordinates are always
  available when "AI Help" is clicked.

- Users who previously installed v1 may need to reload the extension
  to get the v2 behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The extension adds zero measurable page load time
  overhead — no difference in load metrics with or without the
  extension installed.

- **SC-002**: The loading tooltip appears within 16ms of clicking
  "AI Help" (one animation frame).

- **SC-003**: Cached explanations display instantly with no visible
  loading state.

- **SC-004**: 95% of AI explanation requests return a valid structured
  response within 3 seconds.

- **SC-005**: Error states display a user-friendly message within 5
  seconds — no silent failures or frozen spinners.

- **SC-006**: The tooltip never overflows the visible viewport
  regardless of element position.

- **SC-007**: Total content injected into web pages is under 15KB
  minified.

- **SC-008**: The extension works correctly on heavy pages (100+
  interactive elements) with no lag, no crashes, and no performance
  degradation.
