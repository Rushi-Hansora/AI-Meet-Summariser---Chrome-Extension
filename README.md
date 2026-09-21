# Chrome Extensions Collection

A collection of AI-powered Google Chrome extensions built with support for multiple AI providers (Google Gemini, OpenAI, and Hugging Face). These extensions run entirely in the browser, offering secure, localized, and fast assistance for everyday web tasks.

---

### 1. [AI Meet Summarizer](./AI%20Meet%20Summarizer/)
A real-time meeting transcription and note-taking assistant designed for Google Meet calls.

*   **Usecase**: Perfect for remote teams, product managers, and educators who want to automate transcription, trace decisions, and log deliverables without using external bots or cloud services.
*   **Key Features**:
    *   **Local DOM Transcription**: Real-time closed captions observation that requires no device microphone permissions or recording audio streams.
    *   **Real-Time Dynamic Captures**: Appends spoken words character-by-character and merges speaker blocks dynamically in real-time, capturing 100% of spoken paragraphs.
    *   **AI Report Suite**: Generates a general Executive Summary, isolates Question-and-Answer (Q&A) pairs, and extracts checklist tasks.
    *   **Markdown Reports**: Download full meeting reports (including transcript, summary, Q&As, and tasks) as a single `.md` file.
*   **Folder Location**: [`./AI Meet Summarizer`](./AI%20Meet%20Summarizer/)

---

## Global Setup & Installation

All extensions are structured as standard Manifest V3 configurations and can be easily loaded into any Chromium browser (Google Chrome, Microsoft Edge, Brave, etc.) on **macOS**, **Windows**, or **Linux**.

### Step 1: Clone the Repository


### Step 2: Load the Extensions in Chrome
1.  Open Chrome and navigate to `chrome://extensions/` in the address bar.
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click the **Load unpacked** button in the top-left corner.
4.  Navigate to the repository folder and select either:
    *   `AI Meet Summarizer` folder
5.  The extension icon will now appear in your browser's toolbar.

### Step 3: Get and Configure your API Key
Both extensions utilize your own API key to perform content processing.
1.  Go to your chosen dashboard:
    *   [Google AI Studio](https://aistudio.google.com/) for Gemini API Keys.
    *   [OpenAI Platform](https://platform.openai.com/api-keys) for OpenAI API Keys.
    *   [Hugging Face Portal](https://huggingface.co/settings/tokens) for Hugging Face User Access Tokens.
2.  Open the extension settings (or options page):
    *   For **AI Meet Summarizer**: Click the extension icon -> click **⚙️ API Key** in the header.
3.  Choose your provider, enter your key/token, select your model, and click **Save Settings**.