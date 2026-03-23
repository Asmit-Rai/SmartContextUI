# Quickstart: AI Element Explainer

## Prerequisites

- Node.js 18+ and npm
- A Chromium-based browser (Chrome, Edge, or Brave)

## Setup

```bash
# Clone and install
cd SmartContextUI
npm install

# Build the extension
npm run build
```

## Load the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `dist/` folder from the project root
5. The SmartContextUI icon appears in the toolbar

## Usage

### Hover Mode (default)

1. Navigate to any web page
2. Hover over any interactive element (button, link, input, etc.)
3. Hold for ~600ms — the element gets a subtle highlight
4. A tooltip appears with the AI-generated explanation
5. Dismiss by clicking outside, pressing Escape, or clicking X

### Right-Click Mode

1. Right-click any element on a web page
2. Select "AI Help" from the context menu
3. The tooltip appears with the explanation

### Settings

1. Click the SmartContextUI icon in the toolbar
2. Toggle the extension on/off
3. Choose trigger mode: Hover, Right-Click Only, or Both

## Development

```bash
# Start dev server with HMR
npm run dev

# Load the extension from dist/ as above
# Changes will hot-reload automatically
```

## Verification Checklist

- [ ] Extension icon appears in toolbar after loading
- [ ] Hovering over a button for 600ms shows a tooltip
- [ ] Right-clicking and selecting "AI Help" shows a tooltip
- [ ] Tooltip displays Identity, Purpose, and Use Cases sections
- [ ] Tooltip dismisses on Escape / click outside / X button
- [ ] Popup opens with on/off toggle and mode selector
- [ ] Toggling off disables all hover and context menu behavior
- [ ] Cached explanations load instantly on repeat hover
