# 🎙️ AI Meet Summarizer — Chrome Extension & Local AI

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Ollama](https://img.shields.io/badge/Local%20AI-Ollama-black.svg)](https://ollama.ai)
[![Model](https://img.shields.io/badge/Default%20Model-Qwen3%201.7B%20%2F%204B-orange.svg)](https://ollama.ai/library/qwen3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A real-time, privacy-first **Google Chrome Extension (Manifest V3)** that captures live closed captions from Google Meet calls and generates AI-powered meeting summaries, Q&A pairs, and action item checklists.

Features a **100% Private Local AI Pipeline** powered by **Ollama + Qwen3** and a local **FastAPI** backend, alongside multi-provider cloud support for **Google Gemini**, **OpenAI**, and **Hugging Face**.

---

## 🌟 Why AI Meet Summarizer?

Most commercial meeting assistants (e.g., Otter.ai, Fireflies.ai) require intrusive virtual participant bots that join your call, record ambient microphone audio, and upload entire conversations to external cloud databases.

**AI Meet Summarizer takes a fundamentally different approach:**
- 🚫 **No Virtual Bots**: 100% invisible to other call participants.
- 🔇 **Zero Audio Recording**: Never touches your device microphone or system audio.
- ⚡ **Direct DOM Scraping**: Ingests Google Meet's native closed captions (`CC`) character-by-character via an asynchronous `MutationObserver`.
- 🔒 **100% Private Offline Inference**: When using the **Local AI (Ollama)** option, meeting transcripts **never leave your computer**.

---

## 🚀 Key Features

* **Real-Time Captions Scraping**: Character-level DOM observation that reconciles streaming words and automatically merges consecutive utterances from the same speaker.
* **Dual-Inference Architecture**:
  * **Local AI (Offline & Private)**: Local FastAPI bridge to **Ollama** running **Qwen3 (1.7B / 4B)**. Zero API fees, zero quota limits, 100% data sovereignty.
  * **Cloud AI**: Native client-side REST integrations for **Google Gemini (1.5 Flash / 2.0 Flash / Pro)**, **OpenAI (GPT-4o / GPT-4o-mini)**, and **Hugging Face Inference**.
* **4-Tab Synchronized Dashboard**:
  * 📜 **Transcript Tab**: Chronological conversation log with speaker names, timestamps, and real-time live speaker indicators.
  * 📋 **Summary Tab**: Structured Executive Summary, key discussion points, and critical decisions.
  * ❓ **Q&A Tab**: Questions asked during the meeting isolated alongside their answered resolutions.
  * ✅ **Tasks Tab**: Action items formatted as interactive checklists with owner and deadline attribution (`Owner | Deadline`).
* **Dark Glassmorphic UI**: Premium, high-contrast dark theme (`#0b0f19`) featuring backdrop blur, subtle micro-animations, and Google Fonts `Outfit`.
* **State Persistence**: Cached in `chrome.storage.local` to prevent data loss if the popup is closed or reopened.
* **One-Click Export**: Copy active sections or download full reports as structured `.md` (Markdown) documents.

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    GOOGLE MEET TAB                                    |
|                                                                                       |
|   Google Meet Live Closed Captions (ASR)                                              |
|            |                                                                          |
|            v DOM Mutations                                                            |
|   content.js (MutationObserver Engine)                                                |
|     - Tracks active caption cards (.nMcdL)                                            |
|     - Reconciles streaming characters (.ygicle)                                       |
|     - Merges consecutive same-speaker turns (.NWpY1d)                                 |
|     - Syncs state to chrome.storage.local                                             |
+------------------------------------------|--------------------------------------------+
                                           |
                                           v Reads Transcript
+---------------------------------------------------------------------------------------+
|                       POPUP GUI & EXTENSION RUNTIME (popup.js)                        |
|                                                                                       |
|   - 1-Second Storage Polling (Anti-flicker Virtual DOM Diffing)                       |
|   - 4 Tabs: [Transcript] [Summary] [Q&A] [Tasks]                                      |
+------------------------------------------|--------------------------------------------+
                                           |
                       +-------------------+-------------------+
                       |                                       |
                       v Mode A: Local AI                      v Mode B: Cloud AI
+----------------------------------------------+   +------------------------------------+
| LOCAL FASTAPI PROXY (localhost:8000)         |   | PUBLIC CLOUD REST APIS             |
|  - Uvicorn ASGI Server (`backend/main.py`)    |   |  - Google Gemini REST API          |
|  - Validates request payload via Pydantic    |   |  - OpenAI Chat Completions API     |
|  - Dispatches to Ollama (`localhost:11434`)   |   |  - Hugging Face Inference API      |
|  - Default Model: `qwen3:1.7b` or `qwen3:4b` |   |  - Automatic 3-tier backoff        |
|  - 100% Offline & Private                    |   +------------------------------------+
+----------------------------------------------+
```

---

## 💻 Local AI Model Setup (Recommended: 100% Private)

The Local AI mode runs entirely on your local machine using **Ollama** and a lightweight **FastAPI** microservice.

### Step 1: Install Ollama
Download and install Ollama for your operating system:
* **Windows**: [Download Ollama for Windows](https://ollama.com/download/windows)
* **macOS / Linux**: [Download Ollama](https://ollama.com/download)

Verify installation in your terminal:
```bash
ollama --version
```

### Step 2: Pull the Qwen3 Model
Pull the recommended high-efficiency model (`qwen3:1.7b` for fast inference on consumer laptops, or `qwen3:4b` for enhanced reasoning):

```bash
# Recommended lightweight model (Fast, ~1.8 GB RAM):
ollama pull qwen3:1.7b

# Higher reasoning capability (~3.2 GB RAM):
ollama pull qwen3:4b
```

Verify that the model is ready:
```bash
ollama list
```

### Step 3: Start the Local FastAPI Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (optional — defaults work out of the box):
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```
   *Default `.env` configuration:*
   ```ini
   OLLAMA_URL=http://localhost:11434/api/chat
   OLLAMA_MODEL=qwen3:1.7b
   ALLOWED_ORIGINS=*
   INFERENCE_TIMEOUT_SECONDS=300
   BACKEND_PORT=8000
   ```

5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

6. Verify the server is running:
   * Open `http://localhost:8000/health` in your browser.
   * You should see: `{"status":"healthy","ollama_status":"reachable","model":"qwen3:1.7b",...}`
   * Interactive API docs are available at `http://localhost:8000/docs`.

---

## 🧩 Extension Installation (Chrome / Edge / Brave)

1. Open your browser and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the `AI Meet Summarizer` folder inside this repository:
   ```
   d:\Project2\Chrome-Extensions\AI Meet Summarizer
   ```
5. Pin the **AI Meet Summariser** extension to your toolbar.

---

## ⚙️ Extension Configuration

1. Click the extension icon in your browser toolbar.
2. Click the **⚙️ Settings** button in the header.
3. **Select AI Provider**:
   * **Local AI (Ollama + FastAPI)** *(Default & Recommended)*:
     * Local Server URL: `http://localhost:8000`
     * Local Model: `qwen3:1.7b` (or `qwen3:4b`, `llama3.2`)
     * Click **Test Connection** — you will see a green badge: `Connected! Ollama active (qwen3:1.7b)`.
   * **Google Gemini**:
     * Enter your Gemini API key from [Google AI Studio](https://aistudio.google.com/).
     * Select model (e.g., `gemini-1.5-flash`).
   * **OpenAI**:
     * Enter your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys).
     * Select model (e.g., `gpt-4o-mini`).
   * **Hugging Face**:
     * Enter your HF User Access Token.
4. Click **Save Settings**.

---

## 📖 How to Use

1. **Join Google Meet**: Open any active Google Meet call (`https://meet.google.com/...`).
2. **Turn On Captions**: Click the native **CC** (Closed Captions) button in the Meet bottom bar. (*Captions must be on so the DOM stream is active.*)
3. **Start Capturing**:
   * Click the **AI Meet Summariser** extension icon.
   * Click **Start Capturing**. The extension badge will turn red with the text `REC`.
4. **View Live Transcript**:
   * Spoken dialogue appears character-by-character in the **Transcript** tab with speaker names and timestamps.
5. **Generate AI Reports**:
   * Click **Generate AI Reports** at any time.
   * Switch between tabs to review:
     * **Summary**: Executive overview and core decisions.
     * **Q&A**: Questions raised alongside answers.
     * **Tasks**: Extracted action items with designated owners and due dates.
6. **Export & Save**:
   * Click **Copy** to copy the current tab to your clipboard.
   * Click **Download** to export a complete `.md` meeting report.

---

## 📊 Local vs Cloud Performance Comparison

| Metric | Local AI (`qwen3:1.7b`) | Local AI (`qwen3:4b`) | Google Gemini (`1.5-flash`) | OpenAI (`gpt-4o-mini`) |
|---|---|---|---|---|
| **Privacy / Exfiltration** | **0 KB (100% Offline)** | **0 KB (100% Offline)** | Transmitted to Google | Transmitted to OpenAI |
| **API Key Required** | **None (Free forever)** | **None (Free forever)** | Yes | Yes |
| **Turnaround Latency** | **~4.2 seconds** | **~8.1 seconds** | ~1.8 seconds | ~2.4 seconds |
| **Memory Footprint** | **~1.8 GB RAM** | **~3.2 GB RAM** | Negligible (Browser) | Negligible (Browser) |
| **GPU Requirement** | **Optional (Runs on CPU)** | Recommended | None | None |

---

## 📁 Repository Structure

```
Chrome-Extensions/
├── AI Meet Summarizer/               # Chrome Extension (Manifest V3)
│   ├── manifest.json                 # Extension manifest & permissions
│   ├── content.js                    # DOM MutationObserver & turn merging engine
│   ├── background.js                 # Service worker & badge manager ("REC")
│   ├── popup.html                    # 4-tab glassmorphic user interface
│   ├── popup.js                      # UI logic, AI dispatcher, markdown renderer
│   ├── options.html                  # Provider & model configuration interface
│   ├── options.js                    # Settings sync to chrome.storage.sync
│   └── icon.png                      # Extension brand icon
│
├── backend/                          # Local AI Proxy Microservice
│   ├── main.py                       # FastAPI application & Ollama bridge
│   ├── requirements.txt              # Python dependencies (FastAPI, uvicorn, requests)
│   ├── .env.example                  # Environment template
│   └── README.md                     # Backend specific setup notes
│
├── report_assets/                    # Documentation figures & DDU university logo
├── AI_Meet_Summarizer_Project_Report.docx  # Full Academic B.Tech Project Report
├── Project_Report_AI_Meet_Summarizer.md    # Markdown master dissertation report
├── generate_word_report.py           # Automated docx report compilation script
└── README.md                         # Project documentation (this file)
```

---

## 🛠️ Troubleshooting & FAQ

#### 1. Why does the Transcript tab say "Captions are not active"?
Make sure you turned on Google Meet's native closed captions by clicking the **CC** button in the call control bar. The extension scrapes the rendered caption nodes from the DOM.

#### 2. Local AI shows "Cannot connect to local server at http://localhost:8000"
* Ensure your FastAPI server is running: `uvicorn main:app --reload --port 8000`.
* Verify that Ollama is running in the background (`ollama list`).
* Check `http://localhost:8000/health` in your browser.

#### 3. How do I switch Ollama models?
Run `ollama pull <model_name>` (e.g., `ollama pull llama3.2` or `ollama pull qwen3:4b`). Then, in the extension **Settings** page, set **Local Model** to your desired model name and click **Save Settings**.

#### 4. Can other participants see that I am transcribing?
**No.** The extension runs entirely on your local browser. There are no virtual bots, no recording icons in Meet's participant list, and no notification is broadcast to other attendees.

---

## 📜 License
This project is licensed under the [MIT License](./LICENSE).