# AI Meet Summarizer — Chrome Extension

## Project Context
This is a **Manifest V3 Chrome Extension** that scrapes Google Meet's live closed captions from the DOM and generates AI-powered meeting reports (Summary, Q&A, Tasks). It supports multiple AI providers: Google Gemini, OpenAI, Hugging Face, and a **local AI backend** (Ollama + Qwen3 4B + FastAPI).

## Architecture Overview
- **content.js**: Content script injected into `meet.google.com/*`. Uses `MutationObserver` on the captions DOM region to track speaker turns character-by-character. Merges consecutive same-speaker turns. Saves to `chrome.storage.local`.
- **background.js**: Service worker. Manages "REC" badge, relays status messages between popup and content script.
- **popup.html / popup.js**: Main extension popup. 4-tab UI (Transcript, Summary, Q&A, Tasks). Polls `chrome.storage.local` every 1s. Calls AI APIs to generate reports. Handles copy/download.
- **options.html / options.js**: Settings page for AI provider selection, API key input, and model picker.
- **manifest.json**: MV3 config with `storage`, `activeTab`, `scripting` permissions and `*://meet.google.com/*` host permission.
- **backend/main.py** (planned): FastAPI local server that proxies to Ollama (Qwen3 4B) for private, offline AI summarization.

## Tech Stack
- **Pure vanilla JS** — no frameworks, no bundlers, no npm
- **Inline CSS** in both `popup.html` and `options.html` — dark glassmorphism theme with `Outfit` font from Google Fonts
- **Chrome Extension APIs**: `chrome.storage` (sync + local), `chrome.runtime`, `chrome.tabs`, `chrome.action`, `chrome.scripting`
- **AI APIs (Cloud)**: Gemini REST, OpenAI Chat Completions, Hugging Face Inference
- **AI APIs (Local)**: Ollama (`localhost:11434`) + Qwen3 4B via FastAPI (`localhost:8000`)
- **Backend**: Python 3, FastAPI, Uvicorn, Pydantic

## Critical DOM Selectors (Google Meet Captions)
These class-based selectors are fragile and may break when Google updates Meet:
```
region:  [role="region"][aria-label="Captions"]
item:    .nMcdL
speaker: .NWpY1d
text:    .ygicle
avatar:  img[data-iml], img[src*="googleusercontent.com"]
```

## Design System
- Background: `#0b0f19`
- Cards: `rgba(22, 28, 45, 0.65)` with `backdrop-filter: blur(12px)`
- Primary gradient: `linear-gradient(135deg, #4f46e5, #7c3aed)`
- Success: `#10b981`, Danger: `#ef4444`, Warning: `#f59e0b`, Accent: `#06b6d4`
- Font: `Outfit` (300–700)
- Popup dimensions: `580px` wide, `480px` min-height

## Code Style Rules
- Use vanilla JavaScript (ES6+). No TypeScript, no frameworks.
- All CSS is inlined inside `<style>` tags in HTML files. No external CSS files.
- Use CSS custom properties (`:root` variables) for all colors and design tokens.
- Escape all user-generated text with `escapeHtml()` before DOM injection to prevent XSS.
- Use `chrome.storage.sync` for settings, `chrome.storage.local` for runtime data.
- All inter-component communication uses `chrome.runtime.onMessage` / `chrome.tabs.sendMessage`.
- Prefer `async/await` for API calls; use exponential backoff for retries.
- Keep functions small and focused. Comment sections with `// --- Section Name ---` dividers.

## File Conventions
- No build step — files are loaded directly by the browser.
- All extension files live flat inside `AI Meet Summarizer/` directory (no subdirectories).
- Icon is a single `icon.png` used for all sizes (16, 48, 128).

## Testing Approach
- Load unpacked in `chrome://extensions/` with Developer Mode enabled.
- Test on a live Google Meet call with captions (CC) turned on.
- Check `chrome.storage.local` via DevTools Application tab for transcript data.
- Monitor service worker console via `chrome://extensions/` → "Inspect views: service worker".

## Known Limitations to Keep in Mind
1. DOM selectors are class-based and may break with Meet updates — always include semantic fallbacks.
2. Captions must be manually enabled by the user (CC button in Meet).
3. No tab-specific namespacing in storage — multi-tab Meet sessions will conflict.
4. AI prompt is truncated at 32,000 characters for long meetings.
5. No streaming AI — reports generated in a single synchronous API call.
