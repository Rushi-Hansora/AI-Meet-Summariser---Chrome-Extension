---
name: local-ai-backend
description: >-
  Use this skill when setting up, modifying, or debugging the local AI backend
  pipeline (Ollama + Qwen3 4B + FastAPI). Covers installation, configuration,
  API endpoints, CORS, prompt format, Chrome Extension integration, and the
  complete localhost development workflow.
---

# Local AI Backend — Ollama + Qwen3 4B + FastAPI

## Architecture

```
Chrome Extension (popup.js)
        │
        │ HTTP POST /summarize
        ▼
┌──────────────────┐
│   FastAPI         │  ← localhost:8000
│   Local Backend   │
└────────┬─────────┘
         │
         │ POST /api/chat
         ▼
┌──────────────────┐
│   Ollama          │  ← localhost:11434
│   LLM Runtime     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Qwen3 4B        │  ← ~2.5 GB, Q4_K_M quantization
│   Local LLM       │
└──────────────────┘
```

## Hardware Requirements (User's Machine)

- **RAM**: 16 GB total (~6.3 GB available)
- **Model**: Qwen3 4B (2.5 GB) — chosen over 8B for comfort on 16 GB RAM
- **GPU**: Optional (CPU inference works)
- **Storage**: ~6–10 GB free needed

## Project Directory Structure

```
AI-Meet-Summariser/
│
├── extension/                 ← Chrome Extension (existing)
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── options.html
│   ├── options.js
│   └── icon.png
│
└── backend/                   ← FastAPI Local AI Server (new)
    ├── main.py
    ├── requirements.txt
    └── venv/
```

## Setup Steps (In Order)

### Step 1: Install Ollama
- Download from https://ollama.com/download/windows
- Verify: `ollama --version`

### Step 2: Pull Qwen3 4B
```powershell
ollama pull qwen3:4b
ollama list          # Should show qwen3:4b ~2.5 GB
```

### Step 3: Test Model
```powershell
ollama run qwen3:4b
# Type a prompt, verify response, exit with /bye
```

### Step 4: Verify Ollama API
```powershell
curl http://localhost:11434/api/tags
```

### Step 5: Create FastAPI Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn requests
```

### Step 6: Start Backend
```powershell
uvicorn main:app --reload --port 8000
```

### Step 7: Test via Swagger
- Open http://localhost:8000/docs
- POST /summarize with test transcript

## FastAPI Server (`backend/main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="AI Meet Summariser Local AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen3:4b"

class TranscriptRequest(BaseModel):
    transcript: str

@app.get("/")
def root():
    return {"status": "running", "service": "AI Meet Summariser Local AI", "model": MODEL}

@app.post("/summarize")
def summarize(request: TranscriptRequest):
    prompt = f"""You are an AI meeting assistant. Analyze the meeting transcript below.
Return the result using exactly these sections:

SUMMARY: Write a concise summary of the meeting.

KEY_POINTS:
- Point 1
- Point 2

QA:
Q: Question
A: Answer

ACTION_ITEMS:
- Task | Owner | Deadline

Do not invent information not present in the transcript.

Meeting Transcript:
{request.transcript}"""

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are a professional meeting summarization assistant. Be concise and factual."},
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "think": False      # Skip reasoning chain for speed
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=300)
    response.raise_for_status()
    data = response.json()
    return {"model": MODEL, "result": data["message"]["content"]}
```

## Chrome Extension Integration

### Manifest Update
Add to `host_permissions`:
```json
"host_permissions": [
  "*://meet.google.com/*",
  "http://localhost:8000/*"
]
```

### popup.js — Local Model Caller
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

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `think: false` | Skip Qwen3 reasoning mode — meeting summaries don't need chain-of-thought |
| `stream: false` | Simpler integration — get complete response in one shot |
| `timeout: 300` | 5-minute timeout for long transcripts on CPU inference |
| CORS `allow_origins=["*"]` | Dev convenience — restrict to extension origin in production |
| Qwen3 4B over 8B | Comfortable on 16 GB RAM with other apps running |

## Running Both Services

```
Terminal 1: Ollama (usually auto-runs in background after install)
  ollama list

Terminal 2: FastAPI
  cd backend
  .\venv\Scripts\Activate.ps1
  uvicorn main:app --reload --port 8000

Then: Chrome Extension connects to localhost:8000
```

## Implementation Milestones

```
STEP 1  → Install Ollama                    ✅
STEP 2  → Pull qwen3:4b                     ✅
STEP 3  → Test ollama run qwen3:4b           ✅
STEP 4  → Test Ollama API                    ✅
STEP 5  → Create FastAPI backend             ⬅️
STEP 6  → Test /docs                         ⬅️
STEP 7  → Test /summarize                    ⬅️
STEP 8  → Connect popup.js                   ⬅️
STEP 9  → Generate Summary                   ⬅️
STEP 10 → Add Q&A                            ⬅️
STEP 11 → Add Action Items                   ⬅️
STEP 12 → Remove external AI dependency      ⬅️
```

## Ideal JSON Output Format (Future Enhancement)

```json
{
  "summary": "The team discussed backend deployment and testing.",
  "key_points": [
    "Backend deployment planned for Friday.",
    "API testing will be completed tomorrow."
  ],
  "qa": [
    { "question": "When will backend be deployed?", "answer": "Friday." }
  ],
  "action_items": [
    { "task": "Complete API testing", "owner": "Ayush", "deadline": "Tomorrow" },
    { "task": "Deploy backend", "owner": "Rushi", "deadline": "Friday" }
  ]
}
```
