---
name: ai-provider-integration
description: >-
  Use this skill when adding, modifying, or debugging AI provider integrations
  (Gemini, OpenAI, Hugging Face). Covers API endpoints, request/response formats,
  error handling, retry logic, model fallback chains, and the bundled prompt strategy.
---

# AI Provider Integration Guide

## Current Provider Architecture

All AI calls go through `callAIProvider()` in `popup.js` (line ~454). This is a unified function that:
1. Truncates the prompt to 32,000 chars
2. Routes to the correct API based on `provider` param
3. Retries up to 3 times with exponential backoff
4. Returns the generated text string

## API Endpoint Reference

### Google Gemini
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
Content-Type: application/json

{
  "contents": [{ "parts": [{ "text": "..." }] }],
  "generationConfig": { "temperature": 0.3 }
}

Response: data.candidates[0].content.parts[0].text
```

**Fallback chain on 404**: `gemini-1.5-flash` → `gemini-3.5-flash` → `gemini-3.1-flash-lite`

### OpenAI
```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "messages": [{ "role": "user", "content": "..." }],
  "temperature": 0.3
}

Response: data.choices[0].message.content
```

### Hugging Face
```
POST https://api-inference.huggingface.co/models/{model}
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  "inputs": "...",
  "parameters": { "max_new_tokens": 1200, "temperature": 0.3 }
}

Response: data[0].generated_text (strip prompt prefix for Llama models)
```

## Bundled Prompt Strategy

Instead of making 3 separate API calls, a single prompt is sent with delimiter tags:
```
[SUMMARY_START]...[SUMMARY_END]
[QA_START]...[QA_END]
[TASKS_START]...[TASKS_END]
```

Parsing is done via regex in `handleGenerateReports()`. If tags are missing, the full text falls back to Summary.

## Adding a New Provider

1. Add provider option to `options.html` `<select id="ai-provider">`.
2. Add config section in `options.html` (key input + model picker).
3. Update `options.js` — add storage keys to load/save.
4. Update `popup.js`:
   - Add to `chrome.storage.sync.get()` in DOMContentLoaded handler.
   - Add `else if (provider === "newprovider")` branch in `handleGenerateReports()`.
   - Add API call logic in `callAIProvider()`.
5. Test error scenarios: invalid key, rate limit, quota exceeded, model not found.

## Error Handling Patterns

| HTTP Status | Meaning | Action |
|---|---|---|
| 404 | Model not found | Try fallback model (Gemini only) |
| 429 | Rate limited | Retry with backoff, then show quota message |
| 503 | Service overloaded | Retry with backoff |
| 401 | Invalid API key | Show "check your API key" message |
| Other errors | Various | Surface `error.message` to user via `alert()` |

## Local Provider (Ollama via FastAPI)

### Endpoint
```
POST http://localhost:8000/summarize
Content-Type: application/json

{
  "transcript": "..."
}

Response: data.result (string containing the AI-generated text)
```

### Under the Hood (FastAPI → Ollama)
```
POST http://localhost:11434/api/chat
{
  "model": "qwen3:4b",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": false,
  "think": false
}
```

### Key Differences from Cloud Providers
| Aspect | Cloud | Local |
|---|---|---|
| API key required | Yes | No |
| Internet required | Yes | No |
| Privacy | Data sent externally | Data stays on machine |
| Speed | Fast (GPU servers) | Slower (CPU inference ~30-120s) |
| Cost | Per-token billing | Free |
| Availability | Depends on provider | Always available |

### popup.js Integration
```js
async function callLocalModel(transcript) {
  const response = await fetch("http://localhost:8000/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: transcript })
  });
  if (!response.ok) throw new Error(`Local AI server error: ${response.status}`);
  return await response.json();
}
```

### Manifest Requirement
```json
"host_permissions": [
  "*://meet.google.com/*",
  "http://localhost:8000/*"
]
```

