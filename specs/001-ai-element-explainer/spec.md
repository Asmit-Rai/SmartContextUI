# Feature Specification: AI Element Explainer

**Feature Branch**: `001-ai-element-explainer`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "AI-powered UI element explanation via hover and right-click context menu"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hover to Explain (Priority: P1)

A user visits a complex web application (e.g., NetSuite, Salesforce,
or any enterprise software). They see a button labeled "Post" but are
unsure what it does. They hover over the button and hold for about
600ms. The element gets a subtle highlight border indicating the
extension detected it. A small tooltip overlay appears near the element
showing a loading spinner. After a moment, the spinner is replaced
with a structured AI-generated explanation: what the element is, its
primary purpose, all its possible use cases, and optionally related
elements nearby.

**Why this priority**: Hover is the most natural and frictionless
discovery mechanism. It enables the core value proposition — instant
understanding of any UI element — with zero effort from the user.

**Independent Test**: Install the extension, visit any web page with
interactive elements, hover over a button or link for ~600ms, and
verify that a tooltip with a structured explanation appears.

**Acceptance Scenarios**:

1. **Given** the extension is installed and enabled, **When** the user
   hovers over an interactive element (button, link, input, dropdown,
   toggle, tab, icon) for ~600ms, **Then** the element receives a
   subtle highlight border and a tooltip overlay appears with a
   loading spinner followed by a structured explanation.

2. **Given** the tooltip is visible, **When** the user moves the mouse
   away from the element, **Then** the tooltip remains visible until
   the user explicitly dismisses it (click outside, press Escape, or
   click the X button).

3. **Given** the tooltip is visible, **When** the user presses Escape,
   clicks outside the tooltip, or clicks the X button, **Then** the
   tooltip fades out and the highlight border is removed.

4. **Given** the extension is installed but disabled via the popup
   toggle, **When** the user hovers over any element, **Then** no
   highlight or tooltip appears.

---

### User Story 2 - Right-Click Context Menu Explanation (Priority: P2)

A user encounters a UI element they want explained but prefers an
on-demand action rather than automatic hover detection. They
right-click the element. In the browser's context menu, they see a
custom item labeled "AI Help". They click it, and the same explanation
flow triggers — the element gets highlighted and the tooltip overlay
appears with the AI-generated breakdown.

**Why this priority**: Right-click provides an explicit, intentional
trigger that complements hover. It is essential for users who disable
hover mode or want to explain elements that are hard to hover over
(e.g., small icons, nested menus).

**Independent Test**: Install the extension, right-click any
interactive element on a web page, select "AI Help" from the context
menu, and verify the explanation tooltip appears.

**Acceptance Scenarios**:

1. **Given** the extension is installed and enabled (with right-click
   mode active), **When** the user right-clicks any element on the
   page, **Then** a context menu item labeled "AI Help" appears in the
   browser context menu.

2. **Given** the context menu is showing, **When** the user clicks
   "AI Help", **Then** the right-clicked element receives a highlight
   border and the tooltip overlay appears with a loading spinner
   followed by the structured explanation.

3. **Given** the extension is configured to "Right-Click Only" mode,
   **When** the user hovers over elements, **Then** no hover detection
   or tooltip triggers occur; only right-click works.

---

### User Story 3 - Extension Popup Controls (Priority: P3)

A user wants to configure how the extension behaves. They click the
extension icon in the browser toolbar. A minimal popup appears showing:
an on/off toggle to enable or disable the extension globally, a
trigger mode selector (Hover, Right-Click Only, or Both), and brief
usage instructions. Changes take effect immediately without requiring
a page reload.

**Why this priority**: The popup provides essential user control but
is not part of the core explanation flow. The extension delivers value
without the popup (defaults work out of the box), but the popup is
needed for customization and discoverability.

**Independent Test**: Click the extension icon, toggle the on/off
switch, change the trigger mode, and verify the changes take effect
on the active page without reloading.

**Acceptance Scenarios**:

1. **Given** the user clicks the extension toolbar icon, **When** the
   popup opens, **Then** it displays an on/off toggle (defaulting to
   on), a trigger mode selector (defaulting to "Both"), and brief
   usage instructions.

2. **Given** the popup is open with the extension enabled, **When**
   the user toggles it off, **Then** hover detection and context menu
   items are immediately disabled on all tabs.

3. **Given** the popup is open, **When** the user selects "Hover" as
   the trigger mode, **Then** only hover-based explanations are active
   and the context menu item does not appear.

4. **Given** the popup is open, **When** the user selects "Right-Click
   Only", **Then** only context menu explanations are active and hover
   detection is disabled.

---

### User Story 4 - Cached Explanations (Priority: P4)

A user hovers over the same "Save" button they explained earlier
during this session. Instead of waiting for another AI request, the
tooltip appears instantly with the cached explanation. This makes
repeated interactions feel fast and reduces unnecessary load.

**Why this priority**: Caching improves perceived performance and
reduces backend costs. However, the core experience works without
caching (just slower on repeated queries), so this is an enhancement.

**Independent Test**: Hover over an element to get an explanation,
dismiss the tooltip, then hover over the same element again and
verify the explanation appears instantly without a loading spinner.

**Acceptance Scenarios**:

1. **Given** the user previously received an explanation for an
   element, **When** they hover over or right-click the same element
   (same tag, text, aria attributes, role, and page path), **Then**
   the cached explanation is shown instantly without a loading spinner
   or network request.

2. **Given** a cached explanation is older than 24 hours, **When**
   the user triggers an explanation for that element, **Then** a fresh
   explanation is fetched from the backend and the cache is updated.

---

### User Story 5 - Graceful Error Handling (Priority: P5)

A user hovers over a button while their internet is disconnected. The
tooltip appears with the loading spinner, then shows a clear,
friendly error message: "Could not connect — check your internet."
The user is never left with a silent failure, a frozen spinner, or a
browser alert.

**Why this priority**: Error handling is essential for a polished user
experience but the core explanation flow must work first.

**Independent Test**: Disconnect from the internet, hover over an
element, and verify a user-friendly error message appears in the
tooltip within a reasonable time.

**Acceptance Scenarios**:

1. **Given** the user has no internet connection, **When** they
   trigger an explanation, **Then** the tooltip shows "Could not
   connect — check your internet" within 5 seconds.

2. **Given** the backend returns a rate-limit response, **When** the
   user triggers an explanation, **Then** the tooltip shows "Too many
   requests — try again shortly."

3. **Given** the backend is down or unreachable, **When** the user
   triggers an explanation, **Then** the tooltip shows "Service
   temporarily unavailable."

4. **Given** the backend returns an empty or malformed response,
   **When** the user triggers an explanation, **Then** the tooltip
   shows "Could not analyze this element."

---

### Edge Cases

- What happens when the user hovers over a non-interactive element
  (e.g., a plain paragraph of text)? The extension ignores it — only
  interactive elements (buttons, links, inputs, selects, elements
  with click handlers, elements with role attributes like "button",
  "tab", "menuitem") trigger the hover explanation flow. However, the
  right-click "AI Help" context menu works on any element since the
  user has explicitly chosen to request an explanation.

- What happens when the user hovers over an element inside an iframe?
  The extension does not reach into cross-origin iframes due to
  browser security restrictions. Same-origin iframes are supported.

- What happens on dynamically loaded content (SPA navigation, lazy-
  loaded components)? The extension detects new elements as they
  appear so explanations work on dynamically rendered content.

- What happens when the tooltip would overflow the viewport (element
  near edge of screen)? The tooltip repositions itself to stay fully
  visible within the viewport.

- What happens when multiple elements are nested (e.g., an icon
  inside a button)? The extension targets the nearest interactive
  ancestor element to avoid redundant explanations.

- What happens when the page has many interactive elements and the
  user moves the mouse quickly across them? Hover detection is
  debounced (~600ms steady hover required), so rapid mouse movement
  does not trigger multiple simultaneous requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST detect interactive UI elements
  (button, a, input, select, textarea, elements with role attributes
  such as button/tab/menuitem/link, and elements with click event
  listeners) on any web page.

- **FR-002**: The extension MUST highlight a detected element with a
  subtle border when the user hovers over it for ~600ms (debounced).

- **FR-003**: The extension MUST display a tooltip overlay near the
  highlighted element containing a structured AI-generated explanation
  with sections: Element Identity, Primary Purpose, All Use Cases,
  and Related Elements (optional).

- **FR-004**: The extension MUST send element context data (tag name,
  text content, aria-labels, role, surrounding DOM snippet, page
  title, URL pathname) to a shared backend proxy endpoint for AI
  processing.

- **FR-005**: The extension MUST render the tooltip via Shadow DOM to
  isolate its styles from the host page.

- **FR-006**: The tooltip MUST be dismissible by clicking outside it,
  pressing Escape, or clicking the X button.

- **FR-007**: The tooltip MUST have a fixed max-width of ~360px, a
  smooth fade-in animation, a subtle shadow, and clear section
  headers.

- **FR-008**: The tooltip MUST never overflow the viewport — it MUST
  reposition itself when near screen edges.

- **FR-009**: The extension MUST add a context menu item labeled
  "AI Help" when the user right-clicks any element on the page.

- **FR-010**: Clicking "AI Help" in the context menu MUST trigger the
  same explanation flow as hover (highlight + tooltip).

- **FR-011**: The extension MUST provide a popup (toolbar icon) with
  an on/off toggle, a trigger mode selector (Hover / Right-Click Only
  / Both), and brief usage instructions.

- **FR-012**: The on/off toggle and trigger mode selector MUST take
  effect immediately without requiring a page reload.

- **FR-013**: The extension MUST cache AI explanations keyed by a
  hash of the element context (tag + text + aria + role + page
  pathname).

- **FR-014**: Cached explanations MUST expire after 24 hours.

- **FR-015**: The extension MUST display user-friendly inline error
  messages in the tooltip for: network failures, rate limits, backend
  downtime, and empty/malformed responses.

- **FR-016**: The extension MUST NOT produce silent failures or
  browser alert dialogs.

- **FR-017**: The extension MUST default to "Both" trigger mode
  (hover and right-click) and "enabled" state on first install.

- **FR-018**: All AI requests MUST go through the shared backend
  proxy — the extension MUST NOT make direct calls to AI provider
  APIs.

### Key Entities

- **Element Context**: Represents the data captured from a UI element
  for AI analysis. Key attributes: tag name, text content, aria
  labels, role attribute, surrounding DOM snippet (parent and sibling
  context), page title, URL pathname.

- **Explanation**: The structured AI response for an element. Key
  attributes: element identity label, primary purpose description,
  list of use cases, optional related elements list, timestamp.

- **Cache Entry**: A stored explanation keyed by a content hash. Key
  attributes: context hash, explanation data, creation timestamp,
  expiration time (24 hours from creation).

- **User Settings**: Extension configuration state. Key attributes:
  enabled/disabled flag, trigger mode (hover/right-click/both).

## Assumptions

- The shared backend proxy endpoint is available and maintained
  separately from the extension codebase. The extension treats it as
  an external service with a defined contract.

- The backend proxy handles AI provider selection, API key management,
  rate limiting, and billing. The extension is not responsible for
  these concerns.

- The extension targets Chromium-based browsers (Chrome, Edge, Brave)
  using Manifest v3. Firefox and Safari support are not in scope for
  this initial feature.

- The surrounding DOM snippet sent to the backend is limited in size
  (e.g., parent element + immediate siblings) to avoid sending
  excessive page data.

- The "AI Help" context menu item appears for all elements on the
  page, not just interactive ones, since the user has explicitly
  chosen to request an explanation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive an AI-generated explanation within 3
  seconds of triggering (hover completion or context menu click),
  excluding first-time cold starts.

- **SC-002**: Cached explanations display in under 200ms with no
  visible loading spinner.

- **SC-003**: The extension adds less than 50ms to page load time on
  a standard web page with 100+ interactive elements.

- **SC-004**: 95% of triggered explanations return a valid, structured
  response (Identity + Purpose + Use Cases sections all present).

- **SC-005**: Error states display a user-friendly message within 5
  seconds — no silent failures, frozen spinners, or browser alerts.

- **SC-006**: The tooltip never overflows the visible viewport
  regardless of element position.

- **SC-007**: The extension popup loads in under 1 second and setting
  changes take effect immediately without page reload.
