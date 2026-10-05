# Cadence for ChatGPT

A Chrome (Manifest V3) extension that lets you paste many image prompts once and have them run on
chatgpt.com one after another — type prompt → send → wait for the image → next prompt.

## Documentation

| Doc | What it answers |
|---|---|
| [docs/PRD.md](docs/PRD.md) | What are we building, for whom, and what is in/out of scope? |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How is it structured? Components, data model, state machine, storage |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | What happens at runtime? Sequence, completion detection, error handling |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Build order, milestones, test plan, selector-maintenance guide, publishing checklist |

## Project structure

```
cadence/
├── README.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── WORKFLOW.md
│   └── ROADMAP.md
├── manifest.json
├── background.js          # service worker: downloads only
└── content/
        ├── selectors.js       # every ChatGPT selector lives here
        ├── engine.js          # type → send → wait for image
        ├── panel.js           # Shadow-DOM UI styled like ChatGPT
        └── main.js            # queue state, storage, run loop
```

## Run it locally

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the folder containing `manifest.json`.
3. Open https://chatgpt.com and sign in.
4. Click the **Cadence** button (bottom-right), paste prompts (one per line), press **Start**.
5. After editing code, press the reload icon on the extension card and refresh the ChatGPT tab.

## Status

v0.1 is live! The DOM-agnostic engine handles ChatGPT layout changes gracefully, and the UI layout flexes natively within ChatGPT.

## Disclaimer

Automating the ChatGPT web UI may conflict with OpenAI's terms of use. Use at your own risk, keep delays
reasonable, and review the terms before publishing or monetising. See the risk section in the PRD.
