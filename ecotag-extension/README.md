# ecotag-extension — Vite + React (Manifest V3) base

This repository now contains a minimal base for a Chrome extension built with Vite + React and Manifest V3.

Files added (minimal base):

- `package.json` — scripts and deps for Vite + React.
- `vite.config.js` — build config (popup.html entry).
- `manifest.json` — Manifest V3 base.
- `popup.html` — extension popup that loads the Vite React app.
- `src-react/main.jsx`, `src-react/App.jsx` — React entry and component.
- `background.js` — minimal service worker file referenced by the manifest.

How to use

1. Install dependencies:

```bash
cd ecotag-extension
npm install
```

2. Run development server (Vite):

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

After `npm run build` the `dist` folder will contain `popup.html`, the built JS/CSS assets and should be usable as the extension output (copy `manifest.json` and `background.js` into `dist` if your build process doesn't). You may need to copy the manifest into `dist` or adapt the build pipeline to include it.

Notes / next steps

- I left the existing `src/popup.html` and `src/popup.js` (if any) untouched. Decide if you want to remove or integrate those.
- For extension icons, add `icon16.png`, `icon48.png`, `icon128.png` at root or update `manifest.json` icons.
