# Quickstart: SmartContextUI v2

## Prerequisites

- Node.js 18+
- Chromium browser (Chrome, Edge, or Brave)

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts Vite dev server with HMR via @crxjs/vite-plugin.

### Load in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` directory
5. The extension icon appears in the toolbar

### Test

1. Navigate to any web page
2. Right-click any element
3. Select "AI Help" from the context menu
4. A tooltip should appear with a loading state, then an explanation

## Production Build

```bash
npm run build
```

Output is in `dist/`. Load as unpacked extension or package as `.crx`.

## Project Structure

```
src/
├── content/          # Injected into web pages (< 15KB target)
│   ├── index.ts      # Coord capture + message routing
│   ├── extractor.ts  # Element context extraction
│   ├── tooltip.ts    # Shadow DOM tooltip
│   └── tooltip-styles.ts  # CSS template literal
├── background/       # Service worker (not injected into pages)
│   ├── service-worker.ts  # Menu registration, caching, message routing
│   └── api-client.ts      # Backend proxy communication
├── popup/            # Extension toolbar popup
│   ├── popup.html
│   ├── popup.ts
│   └── popup.css
└── shared/           # Shared types and utilities
    ├── types.ts
    ├── constants.ts
    ├── cache.ts
    └── settings.ts
```
