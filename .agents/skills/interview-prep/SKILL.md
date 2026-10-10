---
name: interview-prep
description: >-
  Use this skill when the user asks about interview preparation, project
  explanation practice, viva questions, or needs to understand the project
  execution flow for explaining to others. Contains the step-by-step learning
  order, key interview Q&As, and the one-minute project pitch.
---

# Interview Preparation — AI Meet Summarizer

## File Learning Order (Don't Jump Around)

```
1.  manifest.json          ← What the extension IS
2.  popup.html             ← What the user SEES
3.  popup.js               ← Controller (UI + Storage + AI)
4.  content.js             ← Core logic (DOM scraping) ⭐⭐⭐⭐⭐
5.  background.js          ← Badge + message relay
6.  options.html           ← Settings UI
7.  options.js             ← Settings logic
8.  AI API flow (popup.js) ← Provider integration
9.  Storage flow           ← sync vs local
10. Complete execution flow ← End-to-end
```

## One-Minute Project Pitch

> "I developed an AI-powered Chrome extension for Google Meet that captures
> native closed captions directly from the Meet DOM using a content script
> and MutationObserver. The captured captions are maintained as active and
> finalized speaker turns and stored using Chrome local storage. The popup
> communicates with the content script through Chrome messaging APIs. For
> AI processing, I implemented a unified provider layer supporting Gemini,
> OpenAI and Hugging Face, with retry and exponential backoff handling for
> temporary API failures. The generated response is separated into Summary,
> Q&A and Tasks using structured tags, and the final report can be copied
> or exported as a Markdown file."

### Extended Version (with Local AI)

> "Instead of sending meeting transcripts to external AI APIs, I also
> built a locally hosted pipeline using Qwen3 4B instruction-tuned model
> through Ollama. The Chrome extension captures the transcript, sends it
> to a local FastAPI service, and the FastAPI service invokes the local
> LLM to generate the meeting summary, Q&A, and action items. This gives
> the project a clear privacy + local AI + LLM + Chrome extension +
> backend story."

## Complete Execution Flow Diagram

```
Google Meet (CC ON)
       │
       ▼  content.js injected via manifest
   MutationObserver watches captions DOM
       │
       ▼  trackCaptionItem() / updateCaptionItem()
   activeTurns (Map: DOM element → turn data)
       │
       ▼  Caption removed → finalizeTurn()
   finalizedTranscript (Array)
       │
       ▼  saveTranscriptState()
   chrome.storage.local.meetTranscript
       │
       ▼  pollTranscript() every 1 second
   popup.js reads storage → renders Transcript tab
       │
       ▼  User clicks "Generate AI Reports"
   handleGenerateReports()
       │
       ▼  callAIProvider() or callLocalModel()
   AI API (Gemini/OpenAI/HF) or localhost:8000 → Ollama
       │
       ▼  Regex parse [SUMMARY_START]...[SUMMARY_END] etc.
   chrome.storage.local.meetSummary / meetQA / meetTasks
       │
       ▼  pollTranscript() renders to tabs
   Summary | Q&A | Tasks tabs
       │
       ├── Copy → clipboard
       └── Download → Markdown .md file
```

## 15 Most Important Interview Questions

### Architecture (Q1-Q3)

**Q1. Explain your project architecture.**
> The project has 4 main components: a content script injected into Google
> Meet that observes captions via MutationObserver, a popup UI with 4 tabs,
> a background service worker for badge management, and an AI processing
> layer supporting multiple providers. Data flows from DOM → storage → popup
> → AI API → storage → popup UI.

**Q2. Why Chrome Extension instead of a standalone web app?**
> A Chrome extension can inject scripts directly into Google Meet's page
> DOM to observe captions. A standalone web app cannot access another
> website's DOM due to the same-origin policy.

**Q3. Explain the complete flow from captions to AI report.**
> Content script finds the captions region → MutationObserver tracks
> added/removed/changed caption elements → speaker turns are tracked in a
> Map and finalized to an array → saved to chrome.storage.local → popup
> polls storage every 1s → user clicks Generate → transcript is sent to
> AI API → response is parsed with delimiter tags → stored and rendered
> in tabs.

### Chrome Extension (Q4-Q8)

**Q4. What is Manifest V3?**
> Chrome's modern extension architecture. Uses service workers instead of
> persistent background pages. Better security and performance.

**Q5. What is a content script?**
> A JavaScript file injected into matching web pages to interact with the
> page DOM. It runs in an isolated world but shares the DOM.

**Q6. What is a service worker in Chrome extensions?**
> Replaces the old persistent background page. It activates on events and
> goes idle when not needed. Used for badge management and message relay.

**Q7. Why do you need host_permissions?**
> To allow the extension to inject content scripts and access Google Meet
> URLs. Without it, Chrome blocks DOM access to external sites.

**Q8. How do popup.js and content.js communicate?**
> Using Chrome messaging APIs — `chrome.tabs.sendMessage()` from popup to
> content script, and `chrome.runtime.sendMessage()` from content script to
> the extension runtime. Messages include types like START_CAPTURE,
> STOP_CAPTURE, CHECK_STATUS, CLEAR_TRANSCRIPT.

### Google Meet / DOM (Q9-Q12)

**Q9. How are you capturing Google Meet captions?**
> I inject a content script that locates the native captions DOM elements
> using CSS selectors and observes changes using MutationObserver. No
> microphone access or audio recording is needed.

**Q10. Why MutationObserver?** ⭐
> Google Meet renders captions character-by-character. MutationObserver
> lets me watch for `childList` (new/removed caption blocks), `subtree`
> (nested changes), and `characterData` (text content updates) in real
> time. It's more efficient than polling the DOM.

**Q11. How do you handle character-by-character updates?**
> Each active caption is tracked in a Map keyed by its DOM element. When
> `characterData` mutations fire, I update the turn's text. A 1-second
> stability poll also catches any missed updates.

**Q12. How do you merge consecutive speaker turns?**
> When a new turn has the same speaker as the previous one, I check: if
> texts are identical → skip (duplicate). If new text starts with old →
> replace (grew in place). Otherwise → append with space.

### AI Integration (Q13-Q15)

**Q13. How did you implement multiple AI providers?** ⭐
> I created a unified `callAIProvider()` function that receives provider,
> API key, model and prompt. Based on the provider, it constructs the
> appropriate HTTP request format and parses the provider-specific response.

**Q14. How do you handle API failures and rate limits?**
> I retry up to 3 times with exponential backoff (1s → 2s → 4s). For
> Gemini, I also have a model fallback chain (1.5-flash → 3.5-flash →
> 3.1-flash-lite) on 404 errors. Quota errors get user-friendly messages.

**Q15. How do you parse the AI response?** ⭐
> I instruct the AI to wrap sections in delimiter tags like
> `[SUMMARY_START]...[SUMMARY_END]`. I parse these with regex. If tags
> are missing, the full response falls back to the Summary section.

## Additional Technical Questions

**Q. Why Map instead of Object for activeTurns?**
> Map allows DOM elements as keys. Regular objects only support string keys.
> This lets me associate each caption DOM element directly with its turn data.

**Q. Why chrome.storage instead of localStorage?**
> Chrome extension storage is shared between popup, content script, and
> service worker. localStorage is origin-scoped and not accessible across
> extension components.

**Q. How did you implement the download without a backend?**
> I generate Markdown content in the browser, create a Blob, generate an
> object URL with `URL.createObjectURL()`, and trigger download through a
> temporary anchor element with the `download` attribute.

**Q. Why escapeHtml()?**
> Transcript and AI-generated content is dynamically inserted into the DOM.
> I escape HTML-sensitive characters (`& < > " '`) before insertion to
> prevent XSS / HTML injection.

**Q. What is exponential backoff?**
> A retry strategy where the wait time doubles after each failed attempt.
> My code uses 1s → 2s → 4s. This avoids overwhelming an overloaded API.

## Campus Placement Context

- **Target Company**: Kenexai Pvt. Ltd. (Data Engineering, Cloud, BI, AI/ML)
- **Role**: Data Engineer / AIML – Intern (6 months)
- **Selection Process**: MCQs (Aptitude + Python + SQL) → Programming Assessment → Technical Interview → Technical & Managerial Interview
- **Key Skills to Highlight**: Python, SQL, Chrome Extension APIs, REST APIs, AI/ML integration, MutationObserver, DOM manipulation
- **Stipend**: ₹10,000–₹15,000/month (BTech), CTC after confirmation: ₹5,60,000 LPA
