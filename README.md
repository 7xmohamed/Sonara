<div align="center">
  <img src="icon.png" width="128" height="128" alt="Sonara Logo">
  <h1>Sonara</h1>
  <p><strong>Professional audio amplification and gain control for web browsers.</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/Version-1.0.0-purple.svg)](manifest.json)
  [![Platform](https://img.shields.io/badge/Platform-Chrome%20|%20Edge-cyan.svg)](#)
</div>

---

## Overview

Sonara is a high-performance browser extension designed for precision audio control. It allows users to amplify volume levels on any localized browser tab up to 600%. Built on the native Web Audio API, the extension provides artifact-free amplification while maintaining a minimalistic, neon-themed user interface optimized for modern dark modes.

## Key Features

- **High-Gain Boost**: Amplify audio output by up to 600 percent on any active browser tab.
- **Natural Gain Scaling**: Utilizes a square-root power curve (x^0.5) to provide a more intuitive and responsive listening experience in the 0-100% range.
- **Tab-Specific States**: Settings are maintained independently per tab, ensuring volume levels do not spill over into unrelated audio contexts.
- **Status Persistence**: Intelligently handles Muted, Reduced, Normal, and Boosted volume states with real-time HUD feedback.
- **Minimal Resource Footprint**: Engineered with a low-overhead service worker and zero background latency.

## Getting Started

### Local Installation (Developer Mode)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/7xmohamed/Sonara
    ```
2.  **Access Extension Management**:
    Open the browser and enter `chrome://extensions/` in the address bar.
3.  **Enable Developer Mode**:
    Toggle the Developer Mode switch in the top-right corner.
4.  **Load Unpacked Extension**:
    Select the **Load unpacked** button and navigate to the local project directory.

## Project Structure

- **manifest.json**: Configuration and security permissions for Manifest V3.
- **background.js**: Service worker managing extension lifecycle and installation.
- **content.js**: Audio engine utilizing the Web Audio API for safe tab-level gain injection.
- **ui/**: Minimalistic CSS/HTML popup interface with neon aesthetic.
- **icon.png**: Transparent spectrum logo optimized for high DPI displays.

## Guidelines for Use

1. Click the Sonara icon within the browser toolbar to access the control panel.
2. Adjust the Slider to set the desired gain level in real-time.
3. Utilize the Preset buttons for instant amplification transitions (100%, 200%, 400%, MAX).
4. The toolbar icon and status indicator will reflect the tab's active volume state.

## Contributing

Contributions to Sonara are welcome. Please ensure that all pull requests follow the project's minimalistic design standards and maintain the emoji-free documentation style.

## License

This project is licensed under the terms of the **MIT License**. See the [LICENSE](LICENSE) file for more information.

---
<div align="center">
  <sub>Precision audio control for power users. Built with the Web Audio Engine by 7xmohamed.</sub>
</div>
