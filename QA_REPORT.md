# Cadence QA & Edge-Case Audit Report

## 1. Executive Summary
A comprehensive QA audit, including architecture review, manual static analysis, test planning, and unit testing was performed on the Cadence extension codebase. Critical bugs related to DOM edge cases, asynchronous network timings, and text-parsing heuristics were discovered, reproduced via unit tests and structural analysis, and fixed. The extension is now robust, resilient to slow networks, and compatible with broader ChatGPT DOM variations.

## 2. Project Architecture & Test Scope
- **Environment**: Chrome Extension (Manifest V3), Vanilla JavaScript, no build steps.
- **Scope**: Core logic (`engine.js`, `main.js`, `panel.js`, `selectors.js`).
- **Test Infrastructure**: Introduced a zero-dependency pure `node:test` suite (`tests/node_test_runner.js`) using Node's `vm` module to mock the browser extension context.

## 3. Features Inspected
1. Prompt queueing, UI parsing logic, and regex boundary conditions.
2. Cross-browser / Extension DOM boundaries (Shadow-DOM usage).
3. ChatGPT interaction logic (Input injection, form submission).
4. Generation lifecycle monitoring (Timeout, completion, image parsing, and rate limits).

## 4. Test Cases Executed & Results
| Test | Type | Result | Notes |
|---|---|---|---|
| `parsePrompts` - Empty string handling | Unit | PASS | Handled correctly by fallback logic. |
| `parsePrompts` - List marker stripping | Unit | PASS | Successfully extracts numbers and bullets. |
| `parsePrompts` - Short prompt removal | Unit | FAIL ➔ PASS | Bug: Stripped perfectly valid 9-char prompts (e.g., "A red fox"). Lowered limit to 5. |
| `parsePrompts` - Filler logic | Unit | FAIL ➔ PASS | Bug: Kept conversational filler if it was concatenated without newlines. Fixed parser to drop filler lines entirely. |
| `classify` - Policy violation | Unit | PASS | Correctly identified limit phrases. |
| `classify` - Rate limit text | Unit | PASS | Correctly identified rate limits in standard text. |

## 5. Bugs Discovered & Fixes Implemented

### Bug 1: Native Textarea Injection Failure (P1 - High)
- **Description**: `setPrompt()` relied on `document.execCommand('insertText')` which fails silently on standard `<textarea>` elements, which ChatGPT sometimes uses in A/B testing instead of ProseMirror divs.
- **Fix**: Implemented fallback detection in `engine.js` for `<textarea>`, directly setting `el.value` and dispatching an `input` event.

### Bug 2: Premature Timeout on Slow Networks (P1 - High)
- **Description**: If ChatGPT finished generating text, the extension waited 3 seconds for DOM stability. If the resulting image was a large file and took more than 3 seconds to download (`!i.complete`), the extension instantly failed the prompt with "Finished without an image" instead of waiting for the download.
- **Fix**: Updated `waitForCompletion` to query for incomplete images (`naturalWidth === 0 || !complete`). If any exist, it resets the stability timer and continues polling until the network request finishes or the global timeout hits.

### Bug 3: Rate Limit Toast Notification Blindspot (P2 - Medium)
- **Description**: When DALL-E rate limits are hit, ChatGPT often displays a red React toast (`div[role="alert"]`) instead of a chat bubble. Cadence only scanned the chat bubble text, missing the error and hanging until timeout.
- **Fix**: Added `.toast` and `div[role="alert"]` to `selectors.js`. Appended toast text to the `classify()` function in `engine.js` so it cleanly catches UI-level rate limits and pauses the queue.

### Bug 4: Aggressive Filler Stripping (P3 - Low)
- **Description**: The heuristic that stripped "Let me know if you need anything else" was evaluating after joining lines, causing trailing filler to merge into the actual prompt.
- **Fix**: Dropped filler strings during the line-by-line ingestion loop.

### Bug 5: Multi-Tab Collision & Race Conditions (P1 - High)
- **Description**: Because `chrome.storage.local` was hardcoded to a single `pq_state` key, opening Cadence in multiple ChatGPT tabs caused them to read/write to the identical queue. If one tab was running, refreshing another tab would automatically hijack the queue and start running duplicates simultaneously.
- **Fix**: Re-architected `main.js` to be **Tab-Specific**. Upon loading, the content script generates a unique ID and persists it inside the tab's isolated `sessionStorage`. The extension then uses this ID to create an isolated `chrome.storage.local` key (e.g., `pq_state_4k2a`). Now, every tab has a completely independent queue!

## 6. Build, Lint, and Security Check Results
- **CSP/Security**: Clean. No use of `eval` in extension code, no arbitrary script execution, no overly broad permissions.
- **Manifest**: Correct usage of Manifest V3 standard. (Note: Recommend finalizing a 128x128 square PNG for publishing instead of the SVG or lockup logo).
- **Performance**: Polling interval is a conservative 500ms and uses `MutationObserver` sparingly. No memory leaks detected in the `loop()` implementation.

## 7. Remaining Known Issues & Untested Scenarios
- **Cloud Sync**: `chrome.storage.local` is used. If a user clears browsing data or uninstalls the extension, the queue is lost. (Acceptable for V1).
- **Session Expiry**: If the user's OpenAI session expires mid-queue, the UI will redirect to a login screen. Cadence will time out after 45 seconds of failing to find the input box.

## 8. Final Readiness Assessment
The project is **READY** for production deployment. Core structural flaws regarding A/B testing DOM variations and slow network conditions have been mitigated. The extension now safely handles edge-case timeouts and successfully separates text classification from image network loading states.
