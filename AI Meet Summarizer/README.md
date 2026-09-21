# AI Meet Summarizer

## Usecase
AI Meet Summarizer is built to capture live closed captions from Google Meet calls and generate structured summaries, Q&A pairs, and action items. It is ideal for students, professionals, project managers, and remote teams who want to automate note-taking, capture important follow-up questions, and track deliverables from online meetings without manual effort.

## Problem Statement
In online meetings, participants often struggle to stay fully engaged while simultaneously taking detailed notes. Crucial action items get forgotten, questions that were asked and answered are lost in conversation, and summarizing a 1-hour call manually is tedious and time-consuming. Additionally, cloud recording and transcription tools are often expensive, require calendar integrations, or run intrusive bots that join calls, which can raise privacy concerns.

## Features
- **Real-Time Captions Scraping**: Local transcription by observing Google Meet's native closed captions DOM tree without calendar bot integrations or server-side dependencies.
- **Real-Time Dynamic Capturing**: Character-by-character updates that automatically merge consecutive turns from the same speaker, capturing 100% of spoken paragraphs without speech truncation.
- **Multi-Provider AI support**: Choose between Google Gemini, OpenAI, or Hugging Face.
- **Dropdown Model Picker**: Select from stable production models (e.g. `gemini-1.5-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gpt-4o-mini`, `Meta-Llama-3-8B-Instruct`) inside the options page.
- **AI-Powered Meeting Summary**: Generates a structured executive summary alongside main talking points and decisions.
- **Separated Q&A Tracker**: Automatically parses the dialogue to identify all questions asked and their corresponding answers, listing them in clear Q&A pairs.
- **Action Items & Checklist Extraction**: Extracts todos and next steps with assigned owners formatted as a markdown checklist.
- **Persistent Local Caching**: Keeps transcript and generated summaries cached locally so you do not lose data if you accidentally close the extension popup.
- **Markdown Reports Export**: Download the compiled meeting transcript, summary, Q&As, and tasks as a single Markdown (`.md`) file.

## How to Use
1. **Set up API Key**: 
   - Click the extension icon and select **API Key** (or open the Options page).
   - Choose your provider (Gemini, OpenAI, or Hugging Face), enter your API key, select your model from the dropdown, and click **Save Settings**.
2. **Start Capture**:
   - Join a Google Meet call.
   - Click the built-in **CC** button in the Google Meet call controls to turn captions ON (this is required for transcription).
   - Click the extension icon and click **Start Capturing**. The extension badge will change to `REC`.
3. **Generate & View Reports**:
   - While capturing or after stopping, click **Generate AI Reports** in the popup to compile summaries, Q&As, and tasks.
   - Navigate the tabs (Transcript, Summary, Q&A, Tasks) to view the details.
   - Use the **Copy** button to copy active tab text, or click **Download** to save the full report as a Markdown file.
