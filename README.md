<div align="center">
  <img src="icon.png" width="128" height="128" alt="Sonara Logo">
  <h1>Sonara</h1>
  <p><strong>Audio booster for browser tabs.</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/Version-1.0.0-purple.svg)](manifest.json)
  [![Platform](https://img.shields.io/badge/Platform-Chrome%20|%20Edge-cyan.svg)](#)
</div>

---

## Overview

Sonara is a browser extension that lets you amplify audio on any tab up to 600%, built on the Web Audio API. The popup features a clean, minimal dark UI with a real-time slider, quick presets, and per-tab volume persistence.

## Features

- **Up to 600% volume boost** on any active tab.
- **Natural gain curve** using a square-root scale (x^0.5) for a smooth, intuitive feel below 100%.
- **Per-tab state** with independent volume tracking and Muted, Reduced, Normal, and Boosted indicators.
- **Cross-browser slider** fully styled for Chrome, Edge, and Firefox.
- **Low overhead** lightweight service worker with no background latency.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/7xmohamed/Sonara
   ```
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer Mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.

## Usage

1. Click the Sonara icon in the toolbar to open the popup.
2. Drag the slider to set your desired volume level in real-time.
3. Use the preset buttons for quick jumps: Reset, 2×, 4×, Max.

## Project Structure

| File | Description |
|---|---|
| `manifest.json` | MV3 configuration and permissions |
| `background.js` | Service worker that manages tab capture and offscreen messaging |
| `content.js` | Web Audio API engine injected into each tab |
| `offscreen.js` | Offscreen document for audio stream processing |
| `popup.html/css/js` | Extension popup UI |

## Contributing

Pull requests are welcome. Please keep changes minimal and maintain the emoji-free documentation style.

## License

MIT, see [LICENSE](LICENSE) for details.

---
