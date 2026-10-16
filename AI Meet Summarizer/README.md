# AI Meet Summarizer — Chrome Extension

A real-time, privacy-first Manifest V3 Chrome Extension that captures Google Meet live closed captions and produces structured meeting intelligence (Executive Summary, Q&A pairs, and Task Checklists).

Includes native support for **Local AI (Ollama + Qwen3 via FastAPI)** for 100% offline, zero-data-exfiltration meeting analysis, as well as cloud providers (**Google Gemini**, **OpenAI**, and **Hugging Face**).

---

## 🌟 Key Highlights

* **No Virtual Bots**: Works silently without injecting bot accounts or disturbing meeting participants.
* **No Microphone Recording**: Never captures ambient audio streams or demands microphone permissions.
* **Real-Time DOM Scraping**: Ingests Google Meet's native closed captions (`CC`) character-by-character via an asynchronous `MutationObserver`.
* **Consecutive Turn Reconciliation**: Merges fragmented speech utterances from identical speakers into cohesive conversational paragraphs.
* **100% Private Offline Processing**: Local AI mode processes transcripts via Ollama on `localhost:8000` — zero external network transmission.

---

## ⚙️ AI Provider Options

### 1. Local AI (Ollama + FastAPI) — *Recommended & 100% Private*
* **Endpoint**: `http://localhost:8000`
* **Default Models**: `qwen3:1.7b` (fast, ~1.8 GB RAM) or `qwen3:4b` (~3.2 GB RAM)
* **Zero Cost**: No API keys required, no monthly subscription fees, and no rate limits.
* **Zero Data Exfiltration**: Meets strict enterprise compliance (GDPR, HIPAA, corporate NDAs).

### 2. Cloud AI Providers (Optional)
* **Google Gemini**: Models `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro` (via Google AI Studio).
* **OpenAI**: Models `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo` (via OpenAI Platform).
* **Hugging Face**: Llama 3, Mistral, and other open-weights models via HF Inference API.

---

## 🚀 Quick Start Guide

### Step 1: Run the Local AI Backend
If you want to use the offline Local AI model:
```bash
# 1. Start Ollama and pull Qwen3
ollama pull qwen3:1.7b

# 2. Start the FastAPI backend
cd ../backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```
Verify the health check at `http://localhost:8000/health`.

### Step 2: Install Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this folder (`AI Meet Summarizer`).
4. Pin the extension icon to your toolbar.

### Step 3: Configure Settings
1. Click the extension icon and click **⚙️ Settings**.
2. Under **Select AI Provider**, pick **Local AI (Ollama + FastAPI)**.
3. Verify the URL (`http://localhost:8000`) and Model (`qwen3:1.7b`).
4. Click **Test Connection** (you should see a green confirmation badge).
5. Click **Save Settings**.

---

## 📖 How to Use During a Meeting

1. Join any Google Meet call (`https://meet.google.com/...`).
2. Turn on Google Meet captions by clicking the **CC** button in the call controls.
3. Open the extension popup and click **Start Capturing** (badge displays `REC`).
4. Watch live spoken dialogue appear in the **Transcript** tab.
5. Click **Generate AI Reports** at any time to derive:
   - **Summary**: Concise executive summary and core discussion decisions.
   - **Q&A**: All questions asked and resolved during the call.
   - **Tasks**: Formatted checklist items (`Task | Owner | Deadline`).
6. Click **Copy** to copy text to clipboard or **Download** to save as a `.md` Markdown report.

---

## 🛡️ Privacy Guarantee
In Local AI mode, your transcript is sent exclusively to `http://localhost:8000` and `http://localhost:11434`. Not a single byte leaves your workstation.
