---
name: chrome-ext-dev
description: >-
  Use this skill for all Chrome Extension development tasks in this project.
  Covers Manifest V3 best practices, content script patterns, service worker
  lifecycle, popup/options page development, and chrome.* API usage specific
  to this AI Meet Summarizer extension.
---

# Chrome Extension Development — AI Meet Summarizer

## Message Flow Reference

```
┌─────────┐    START_CAPTURE     ┌─────────────┐
│  Popup  │ ──────────────────►  │  Content.js  │
│ (popup  │    STOP_CAPTURE      │  (meet.google│
│  .js)   │ ──────────────────►  │   .com)      │
│         │    CHECK_STATUS      │              │
│         │ ──────────────────►  │              │
│         │    CLEAR_TRANSCRIPT  │              │
│         │ ──────────────────►  │              │
│         │                      │              │
│         │ ◄── response ─────  │              │
└────┬────┘                      └──────┬───────┘
     │                                   │
     │  GET_ACTIVE_MEET_STATUS          │ STATUS_UPDATE
     │                                   │
     ▼                                   ▼
┌──────────────────────────────────────────────┐
│              Background.js                    │
│         (Service Worker)                      │
│  - Badge management (REC / clear)            │
│  - Tab tracking (activeMeetTabs)             │
│  - Status relay (popup ↔ content)            │
└──────────────────────────────────────────────┘
```

## Storage Keys Quick Reference

### chrome.storage.sync (Settings)
| Key | Values |
|-----|--------|
| `aiProvider` | `"gemini"` / `"openai"` / `"huggingface"` |
| `geminiApiKey` | string |
| `geminiModel` | `"gemini-1.5-flash"` / `"gemini-3.5-flash"` / `"gemini-3.1-flash-lite"` |
| `openaiApiKey` | string |
| `openaiModel` | `"gpt-4o-mini"` / `"gpt-4o"` / `"gpt-3.5-turbo"` |
| `huggingfaceApiKey` | string |
| `huggingfaceModel` | string (e.g., `"meta-llama/Meta-Llama-3-8B-Instruct"`) |

### chrome.storage.local (Runtime)
| Key | Type |
|-----|------|
| `meetTranscript` | `Array<{ speaker, text, time, elapsed, timestamp }>` |
| `meetingTitle` | string |
| `lastUpdated` | number |
| `isCapturing` | boolean |
| `liveCaption` | `{ speaker, text } | null` |
| `meetSummary` | string |
| `meetQA` | string |
| `meetTasks` | string |

## Adding New Features Checklist

When adding a new feature:
1. **Does it need a new permission?** → Update `manifest.json` permissions array.
2. **Does it need page access?** → Update `host_permissions` in manifest.
3. **Does it need a new message type?** → Add handler in `content.js` listener AND update the sender (popup.js or background.js).
4. **Does it store data?** → Decide sync vs local. Add to storage.local.set/get calls. Update `handleClearTranscript()` to include new keys.
5. **Does it add UI?** → Follow existing glassmorphism theme. Use CSS variables. Add to popup.html inline styles.
6. **Does it call an API?** → Add to `callAIProvider()` with proper error handling, retries, and quota messages.

## Debugging Tips

- **Content script not injecting**: Check `manifest.json` matches pattern. Refresh the Meet tab. Check `chrome://extensions/` for errors.
- **Messages failing**: `chrome.runtime.lastError` must be checked. Service worker may have gone idle — it wakes on message.
- **Storage not updating**: Use DevTools → Application → Storage → chrome.storage.local to inspect live values.
- **Badge not showing**: Service worker may have restarted. Check `activeMeetTabs` state.

## Common Pitfalls

1. **Never use `innerHTML` with user content** without `escapeHtml()` first.
2. **Always return `true`** from `onMessage` listeners when using `sendResponse` asynchronously.
3. **MutationObserver** must be disconnected on stop — memory leak otherwise.
4. **Service worker idle timeout** — don't store state in global variables that needs to persist (use `chrome.storage`).
5. **Popup closes** when user clicks away — all state must be in storage, not in popup.js variables.
