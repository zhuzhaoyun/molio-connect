# Molio Web Clipper

> [中文](README.md) | **English**

Molio Web Clipper is the official browser extension for [Molio](https://molio.cn/) — a companion tool that saves web content to your Molio knowledge base with a single click.

## Installation

👉 [Install from Chrome Web Store](https://chromewebstore.google.com/detail/molio/pjdacbbkjpegfkogoieejajljplngbik)

## Features

- **One-click web clipping**: Save any web page as Markdown into your Molio knowledge base via shortcut or toolbar icon
- **Highlight & annotate**: Select text to highlight; highlights sync to Molio automatically
- **Custom templates**: Fine-tune saved content and format with templates, variables, and filters
- **Reader view**: Distilled article extraction for distraction-free reading
- **Zero configuration**: Automatically connects to the local Molio daemon and saves to your currently active vault — no manual setup required

## How it works

The extension communicates with the Molio desktop app through the local daemon (default `http://localhost:3100`). When you save, the clip is written directly to Molio's active knowledge base, and the Molio desktop app opens the file automatically.

Make sure the Molio desktop app is running.

## Credits

This project is built on top of [obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper). Many thanks to the Obsidian team for sharing this excellent web clipping solution under the MIT License.

We reuse its defuddle content extraction engine, template system, highlighting feature, and i18n translations — adapting the save target to Molio's knowledge base.

## Development

```bash
npm install
npm run build        # Build for all three browsers (Chrome / Firefox / Safari)
npm run build:chrome # Chrome only
npm test             # Run tests
```

Build outputs:
- `dist/` — Chrome
- `dist_firefox/` — Firefox
- `dist_safari/` — Safari

### Local install

**Chromium browsers** (Chrome, Brave, Edge, Arc):
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**, select the `dist` directory

**Firefox**:
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from the `dist_firefox` directory

## Third-party libraries

- [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) — cross-browser API compatibility
- [defuddle](https://github.com/kepano/defuddle) — content extraction & Markdown conversion
- [dayjs](https://github.com/iamkun/dayjs) — date parsing
- [lz-string](https://github.com/pieroxy/lz-string) — template compression
- [lucide](https://github.com/lucide-icons/lucide) — icons
- [dompurify](https://github.com/cure53/DOMPurify) — HTML sanitization

## License

Source code is open source under the MIT License, originally from [obsidian-clipper](https://github.com/obsidianmd/obsidian-clipper). All Obsidian-related trademarks, icons, and marketing assets remain the property of Obsidian.
