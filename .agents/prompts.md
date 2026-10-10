# AI Meet Summarizer — Assisted Development & Prompt Management

This document tracks all user instructions, maintains the prompt ledger, and specifies context window boundaries and rules for AI-assisted development.

---

## 1. User Prompt Ledger (History & Tracking)

| # | Date / Time (IST) | User Prompt / Request | Key Intent & Scope | Status | Result / Output |
|---|---|---|---|---|---|
| **1** | 2026-08-27 | *"first of all understand my project then make files needed to for your memroy ok"* | Full project scan and architecture mapping for agent memory. | ✅ Completed | Generated knowledge base and initial skill foundations. |
| **2** | 2026-08-27 | *"also create .agent file in which manage promet what i give like maintain promet list set context windows of project and what ever required with at assited development"* | Track user prompts, manage context windows, and setup AI-assisted development protocols in `.agents`. | ✅ Completed | Created `.agents/prompts.md` with prompt log, token budgeting, and assisted dev guidelines. |
| **3** | 2026-08-27 | *"/context."* | Context ingestion and project state verification. | ✅ Completed | Verified manifest, content scripts, popup, options, and background worker. |
| **4** | 2026-08-27 | *"ok so this is my source file i want to understand each file so for this give me answer like that where to start and importnant interview question may ask based on this project ok give me step by step process with minimam solution no redundancy ok"* | Step-by-step file walkthrough, execution flow, interview questions, and placement prep. | ✅ Completed | Created `interview-prep/SKILL.md` with 15+ Q&As, 1-minute pitch, execution flow breakdown. |
| **5** | 2026-09-27 22:17 | *"make .env file add neceesary file"* | Environment variable configuration and supporting backend infrastructure. | ✅ Completed | Created root `.env`, `.env.example`, `.gitignore`, `backend/main.py`, `requirements.txt`, `backend/.env.example`, and `backend/README.md`. |
| **6** | 2026-09-27 22:22 | *"error in main.py file also maintain proment file in .agent folder"* | Fix missing import errors in `main.py` and maintain user prompt tracking file in `.agents`. | ✅ Completed | Installed dependencies for Python 3.11, created `.agents/prompts.md`. |
| **7** | 2026-09-27 22:25 | *"Cannot find module \`pydantic\`"* | Resolve IDE Python 3.14 environment missing `pydantic` and `fastapi`. | ✅ Completed | Installed packages in active Python 3.14 environment (`C:\Users\Dell\AppData\Local\Python\pythoncore-3.14-64`). Verified `pydantic` v2.13.5 and `fastapi` v0.141.1 load cleanly. |


---

## 2. Context Window & Token Budget Guidelines

When operating within LLM context windows (e.g. Gemini, OpenAI, Claude, local Ollama):

### A. Context Budget Allocation

| Layer | Max Context / Limit | Strategy |
|---|---|---|
| **Live Meet Captions** | 32,000 characters (~8,000 tokens) | Truncate oldest turns if meeting exceeds character limit. Focus on final 45 mins. |
| **Popup UI Display** | 200 items in transcript list | Virtualize or cap DOM nodes to prevent memory bloat in Chrome popup. |
| **Local LLM (Qwen3 4B)** | 4,096 to 8,192 tokens | Prompt asks for 4 concise sections: `SUMMARY`, `KEY_POINTS`, `QA`, `ACTION_ITEMS`. Disable thinking mode (`"think": false`) for speed. |
| **Cloud AI (Gemini / OpenAI)** | Bundled single-turn prompt | Generate Summary, Q&A, and Tasks in a single API call to save latency and token costs. |

### B. Core Architectural Invariants (DO NOT VIOLATE)

1. **Pure Vanilla JavaScript (ES6+)**: No frameworks (React/Vue), no bundlers (Webpack/Vite), no npm dependencies for the Chrome Extension.
2. **Inlined CSS**: Popup and Options pages use CSS inside `<style>` tags with `:root` CSS variables and Google Fonts (`Outfit`).
3. **Flat Extension Directory**: All extension files stay in `AI Meet Summarizer/` without subdirectories.
4. **Local AI Privacy**: FastAPI backend (`localhost:8000`) communicates with local Ollama (`localhost:11434`), sending zero audio or transcripts to the cloud when Local AI is selected.
5. **Security & XSS Prevention**: Always sanitize and escape user/DOM-injected strings with `escapeHtml()`.

---

## 3. Assisted Development Protocols

When executing any future user prompt:

1. **Log the Prompt**: Append the incoming prompt to Section 1 above with timestamp, intent, and target outcome.
2. **Check Relevant Skills**: Review `.agents/skills/` before touching corresponding components:
   - `chrome-ext-dev` for extension lifecycle & `chrome.*` APIs
   - `caption-scraping` for Google Meet DOM & `MutationObserver`
   - `local-ai-backend` for FastAPI & Ollama configuration
   - `ui-design-system` for glassmorphism styles & animations
   - `ai-provider-integration` for Gemini, OpenAI, and Hugging Face APIs
   - `interview-prep` for Viva and Kenexai placement Q&As
3. **Verify Imports & Syntax**: Always run syntax check or dependency verification before reporting completion.
4. **Keep Solutions Minimal**: No unnecessary code bloat, maintain clean comments and modular functions.
