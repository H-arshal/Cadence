<div align="center">
  <img src="./cadence-lockup-dark.png" alt="Cadence for ChatGPT" width="400">
  <p><strong>A powerful Chrome extension for automating bulk image generation on ChatGPT / DALL-E 3</strong></p>
</div>

---

## 📖 Overview

Cadence is a Manifest V3 Chrome Extension that seamlessly injects into the ChatGPT web interface. It allows users to queue up dozens (or hundreds) of prompts, automatically executing them sequentially.

Instead of waiting for an image to generate before manually typing the next prompt, Cadence manages the entire workflow: **Type prompt → Send → Wait for completion → Auto-download image → Trigger next prompt.**

## ✨ Key Features

- **Native UI Integration**: A beautiful Shadow-DOM side-panel that flawlessly mimics ChatGPT's native aesthetic (dark/light mode, typography, interactive states).
- **Intelligent Prompt Parsing**:
  - **Editorial Visual Plans**: Supports multi-paragraph Markdown visual packages (e.g. `## Image N — Title`). Preserves full prompt units with placement notes, formatting, bullet points, and code blocks (`json`, `yaml`, etc.) intact without fragmentation.
  - **Standard Lists & JSON**: Strips out conversational filler and markers from simple bulleted lists, numbered lists, or JSON arrays.
  - **File Import**: Supports importing `.txt`, `.csv`, `.md`, and `.markdown` files directly.
- **Tab-Specific Queue Isolation**: Sessions and queues are isolated per browser tab (`sessionStorage` + namespaced `chrome.storage.local`), ensuring separate ChatGPT tabs don't interfere with each other.
- **Smart Completion Detection**: The extension doesn't rely on blind timers. It actively monitors the DOM to detect when ChatGPT has finished rendering a high-resolution image or if the prompt failed due to policy restrictions.
- **Auto-Download Support**: Optionally download generated images straight to your local machine the moment they complete.
- **Draggable Resizing**: The side-panel is fully resizable and smoothly squashes the ChatGPT chat window out of the way without breaking the React application layout.

## 🛠 Project Structure

The codebase is highly modular to survive ChatGPT's frequent A/B UI tests.

```text
cadence/
├── manifest.json
├── background.js          # Service worker (handles downloads)
└── content/
    ├── selectors.js       # Centralized file for ChatGPT DOM selectors
    ├── engine.js          # The automation logic (typing, sending, waiting)
    ├── panel.js           # Shadow-DOM UI, theming, dragging, AI parsing
    └── main.js            # State management, storage, and the run loop
```

For deeper architectural details, please see the [Documentation](/docs):

- [PRD.md](docs/PRD.md): Scope and requirements.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Component interactions and state models.
- [WORKFLOW.md](docs/WORKFLOW.md): Sequence mapping and error handling.
- [ROADMAP.md](docs/ROADMAP.md): Milestones and maintenance guides.

## 🚀 Installation & Setup (Developer Mode)

To run Cadence locally before it is published to the Chrome Web Store:

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing the `manifest.json`.
5. Open [chatgpt.com](https://chatgpt.com) and sign in.
6. Look for the floating **Cadence** button in the bottom-right corner!

## 💻 Usage Guide

1. **Queueing Prompts**:
   - **Single Prompt Mode**: Type or paste a prompt, then click **Add Prompt** (or press `Ctrl+Enter` / `Cmd+Enter`). You can repeat this to stack prompts one by one into the queue without worrying about line breaks getting fragmented.
   - **Bulk / Plan Mode**: Paste multi-prompt lists, editorial Markdown packages (`## Image N — Title`), or click **Import file** (`.txt`, `.csv`, `.md`, `.markdown`) to load dozens of prompts at once.
2. **Settings**:
   - **New chat for each prompt**: Keeps contexts clean (avoids DALL-E degrading image style over a long thread).
   - **Auto-download images**: Automatically saves images to your Chrome downloads folder.
   - **Delay between prompts**: Adds a human-like delay to avoid hitting rate limits instantly.
   - **Retry failed once**: Automatically retries a transient generation failure once.
3. **Execution**:
   - Review your queued prompts in the list (hover for full prompt tooltips or click `✕` to remove any item).
   - Click **Start** to run the queue. Cadence automatically processes each prompt sequentially and updates progress in real time. Pause at any time by clicking **Pause**.

## ⚠️ Disclaimer

Automating the ChatGPT web interface may conflict with OpenAI's terms of service. This tool is intended for educational and personal workflow optimization purposes. Use at your own risk, keep generation delays reasonable, and review OpenAI's terms before use.
