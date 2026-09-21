
let currentActiveTabId = null;
let apiKey = null;
let currentMeetingTitle = "Google Meet";
let finalizedTranscript = [];

// DOM Elements
const openSettingsBtn = document.getElementById("open-settings");
const configureKeyLink = document.getElementById("configure-key");
const toggleCaptureBtn = document.getElementById("toggle-capture-btn");
const clearBtn = document.getElementById("clear-btn");
const generateReportsBtn = document.getElementById("generate-reports-btn");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");

const apiKeyAlert = document.getElementById("api-key-alert");
const notMeetAlert = document.getElementById("not-meet-alert");
const captionsAlert = document.getElementById("captions-alert");

const meetTitleEl = document.getElementById("meet-title");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const captureStatusPill = document.getElementById("capture-status");

const transcriptContainer = document.getElementById("transcript-container");
const summaryContainer = document.getElementById("summary-container");
const qaContainer = document.getElementById("qa-container");
const tasksContainer = document.getElementById("tasks-container");

// Initialize Popup
document.addEventListener("DOMContentLoaded", async () => {
  // Load Settings Options link click
  openSettingsBtn.addEventListener("click", openOptionsPage);
  configureKeyLink.addEventListener("click", openOptionsPage);

  // Setup tabs toggling
  initTabs();

  // Load API Configuration
  chrome.storage.sync.get([
    "aiProvider",
    "geminiApiKey",
    "openaiApiKey",
    "openaiModel",
    "huggingfaceApiKey",
    "huggingfaceModel"
  ], (result) => {
    const provider = result.aiProvider || "gemini";
    let activeKey = "";

    if (provider === "gemini") activeKey = result.geminiApiKey;
    else if (provider === "openai") activeKey = result.openaiApiKey;
    else if (provider === "huggingface") activeKey = result.huggingfaceApiKey;

    if (activeKey) {
      apiKeyAlert.style.display = "none";
      generateReportsBtn.removeAttribute("disabled");
    } else {
      apiKeyAlert.style.display = "block";
      apiKeyAlert.innerHTML = `API key not found for selected provider (${provider.toUpperCase()}). Please <a href="#" id="configure-key-inner">configure your API key</a> to enable summaries.`;
      const configLink = document.getElementById("configure-key-inner");
      if (configLink) configLink.addEventListener("click", openOptionsPage);
      generateReportsBtn.setAttribute("disabled", "true");
    }
  });

  // Verify Tab context
  checkCurrentTab();

  // Start polling transcript updates
  setInterval(pollTranscript, 1000);

  // Setup Actions Click listeners
  toggleCaptureBtn.addEventListener("click", handleToggleCapture);
  clearBtn.addEventListener("click", handleClearTranscript);
  generateReportsBtn.addEventListener("click", handleGenerateReports);
  copyBtn.addEventListener("click", handleCopyActiveTab);
  downloadBtn.addEventListener("click", handleDownloadReport);
});

// Tab navigation handler
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Deactivate all tabs
      document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      // Activate clicked tab
      tab.classList.add("active");
      const panelId = tab.getAttribute("data-tab");
      document.getElementById(panelId).classList.add("active");
    });
  });
}

function openOptionsPage(e) {
  if (e) e.preventDefault();
  chrome.runtime.openOptionsPage();
}

// Check if active tab is Google Meet
function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const tab = tabs[0];

    if (tab.url && tab.url.includes("meet.google.com")) {
      currentActiveTabId = tab.id;
      notMeetAlert.style.display = "none";
      toggleCaptureBtn.removeAttribute("disabled");

      // Query content script status
      chrome.tabs.sendMessage(tab.id, { type: "CHECK_STATUS" }, (response) => {
        if (chrome.runtime.lastError) {
          updateUIState(false, false);
        } else if (response) {
          updateUIState(response.isCapturing, response.captionsEnabled);
          if (response.title) {
            currentMeetingTitle = response.title;
            meetTitleEl.textContent = response.title;
          }
        }
      });
    } else {
      notMeetAlert.style.display = "block";
      toggleCaptureBtn.setAttribute("disabled", "true");
      meetTitleEl.textContent = "Not in a Google Meet";
      updateUIState(false, false);
    }
  });
}

// Update Controls UI
function updateUIState(isCapturing, captionsEnabled) {
  if (isCapturing) {
    statusDot.className = "recording-dot";
    statusText.textContent = "Capturing";
    captureStatusPill.className = "status-pill status-capturing";

    toggleCaptureBtn.className = "btn-danger";
    toggleCaptureBtn.innerHTML = "<span>■</span> Stop Capturing";
    clearBtn.setAttribute("disabled", "true");
  } else {
    statusDot.className = "";
    statusText.textContent = "Inactive";
    captureStatusPill.className = "status-pill";

    toggleCaptureBtn.className = "btn-primary";
    toggleCaptureBtn.innerHTML = "<span>▶</span> Start Capturing";
  }

  // Handle caption indicator warnings
  if (currentActiveTabId) {
    if (!captionsEnabled) {
      captionsAlert.style.display = "block";
    } else {
      captionsAlert.style.display = "none";
    }
  } else {
    captionsAlert.style.display = "none";
  }
}

// Toggle capturing state
function handleToggleCapture() {
  if (!currentActiveTabId) return;

  chrome.tabs.sendMessage(currentActiveTabId, { type: "CHECK_STATUS" }, (status) => {
    if (chrome.runtime.lastError) {
      alert("Please refresh the Google Meet page to initialize the caption observer.");
      return;
    }

    if (status && status.isCapturing) {
      // Stop Capturing
      chrome.tabs.sendMessage(currentActiveTabId, { type: "STOP_CAPTURE" }, (res) => {
        updateUIState(false, status.captionsEnabled);
        pollTranscript();
      });
    } else {
      // Start Capturing
      // Check if captions are enabled first as a reminder, but allow starting anyway
      chrome.tabs.sendMessage(currentActiveTabId, { type: "START_CAPTURE" }, (res) => {
        if (res && res.success) {
          updateUIState(true, status.captionsEnabled);
        } else {
          alert("Could not start capture. Please verify that closed captions (CC) are enabled in Google Meet.");
        }
        pollTranscript();
      });
    }
  });
}

// Clear Transcript handler
function handleClearTranscript() {
  if (confirm("Are you sure you want to clear the current meeting transcript and AI reports?")) {
    if (currentActiveTabId) {
      chrome.tabs.sendMessage(currentActiveTabId, { type: "CLEAR_TRANSCRIPT" }, (res) => {
        chrome.storage.local.set({
          meetTranscript: [],
          liveCaption: null,
          meetSummary: null,
          meetQA: null,
          meetTasks: null
        }, () => {
          pollTranscript();
        });
      });
    } else {
      chrome.storage.local.set({
        meetTranscript: [],
        liveCaption: null,
        meetSummary: null,
        meetQA: null,
        meetTasks: null
      }, () => {
        pollTranscript();
      });
    }
  }
}

// Poll transcript from chrome storage
function pollTranscript() {
  chrome.storage.local.get(
    ["meetTranscript", "liveCaption", "isCapturing", "meetingTitle", "meetSummary", "meetQA", "meetTasks"],
    (data) => {
      // Update capturing state
      if (data.isCapturing !== undefined && currentActiveTabId) {
        // Query captions setting again
        chrome.tabs.sendMessage(currentActiveTabId, { type: "CHECK_STATUS" }, (response) => {
          if (!chrome.runtime.lastError && response) {
            updateUIState(data.isCapturing, response.captionsEnabled);
            if (response.title) {
              currentMeetingTitle = response.title;
              meetTitleEl.textContent = response.title;
            }
          }
        });
      }

      // Update Transcript UI
      finalizedTranscript = data.meetTranscript || [];
      const liveCaption = data.liveCaption;

      if (finalizedTranscript.length === 0 && !liveCaption) {
        transcriptContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>No transcript recorded yet.</p>
            <p style="font-size: 11px; opacity: 0.8;">Start capturing during a Google Meet call with captions turned on.</p>
          </div>`;
        clearBtn.setAttribute("disabled", "true");
        copyBtn.setAttribute("disabled", "true");
        downloadBtn.setAttribute("disabled", "true");
      } else {
        clearBtn.removeAttribute("disabled");
        copyBtn.removeAttribute("disabled");
        downloadBtn.removeAttribute("disabled");

        let html = '<div class="transcript-list">';

        finalizedTranscript.forEach((turn) => {
          html += `
            <div class="transcript-item">
              <div class="speaker-header">
                <span class="speaker-name">${escapeHtml(turn.speaker)}</span>
                <span class="speaker-time">[${turn.elapsed || turn.time}]</span>
              </div>
              <p class="speaker-text">${escapeHtml(turn.text)}</p>
            </div>`;
        });

        // Show live unfinalized speaker text
        if (liveCaption && liveCaption.text) {
          html += `
            <div class="transcript-item live-item">
              <div class="speaker-header">
                <span class="speaker-name">
                  <div class="live-pulse"></div>
                  ${escapeHtml(liveCaption.speaker)}
                </span>
                <span class="speaker-time">Speaking Live</span>
              </div>
              <p class="speaker-text">${escapeHtml(liveCaption.text)}</p>
            </div>`;
        }

        html += '</div>';

        // Only update HTML if changed to prevent screen flicker and cursor reset
        if (transcriptContainer.innerHTML !== html) {
          const isAtBottom = transcriptContainer.scrollHeight - transcriptContainer.clientHeight <= transcriptContainer.scrollTop + 40;
          transcriptContainer.innerHTML = html;
          if (isAtBottom) {
            transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
          }
        }
      }

      // Update Summary UI
      if (data.meetSummary) {
        summaryContainer.innerHTML = renderMarkdownToHtml(data.meetSummary);
      } else {
        summaryContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>No summary generated.</p>
            <p style="font-size: 11px; opacity: 0.8;">Click 'Generate AI Reports' below to summarize the meeting.</p>
          </div>`;
      }

      // Update Q&A UI
      if (data.meetQA) {
        qaContainer.innerHTML = renderMarkdownToHtml(data.meetQA);
      } else {
        qaContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">❓</div>
            <p>No Q&A pairs generated.</p>
            <p style="font-size: 11px; opacity: 0.8;">Click 'Generate AI Reports' below to extract questions and answers.</p>
          </div>`;
      }

      // Update Tasks UI
      if (data.meetTasks) {
        tasksContainer.innerHTML = renderMarkdownToHtml(data.meetTasks);
      } else {
        tasksContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p>No action items extracted.</p>
            <p style="font-size: 11px; opacity: 0.8;">Click 'Generate AI Reports' below to find tasks and action items.</p>
          </div>`;
      }
    }
  );
}

// Generate Summaries via AI
async function handleGenerateReports() {
  chrome.storage.sync.get([
    "aiProvider",
    "geminiApiKey",
    "geminiModel",
    "openaiApiKey",
    "openaiModel",
    "huggingfaceApiKey",
    "huggingfaceModel"
  ], async (result) => {
    const provider = result.aiProvider || "gemini";
    let activeKey = "";
    let activeModel = "";

    if (provider === "gemini") {
      activeKey = result.geminiApiKey;
      activeModel = result.geminiModel || "gemini-1.5-flash";
    } else if (provider === "openai") {
      activeKey = result.openaiApiKey;
      activeModel = result.openaiModel || "gpt-4o-mini";
    } else if (provider === "huggingface") {
      activeKey = result.huggingfaceApiKey;
      activeModel = result.huggingfaceModel || "meta-llama/Meta-Llama-3-8B-Instruct";
    }

    if (!activeKey) {
      alert(`Please set your API key/token for ${provider.toUpperCase()} in the extension options.`);
      openOptionsPage();
      return;
    }

    if (finalizedTranscript.length === 0) {
      alert("The transcript is empty. Capture some captions before generating summaries.");
      return;
    }

    // Set loading states
    generateReportsBtn.setAttribute("disabled", "true");
    generateReportsBtn.innerHTML = "✨ Generating reports...";

    summaryContainer.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:180px;"><div style="border: 3px solid rgba(255,255,255,0.05); border-top: 3px solid #7c3aed; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div></div>';
    qaContainer.innerHTML = summaryContainer.innerHTML;
    tasksContainer.innerHTML = summaryContainer.innerHTML;

    // Append spinning style if not already in document
    if (!document.getElementById("loading-spin-style")) {
      const style = document.createElement("style");
      style.id = "loading-spin-style";
      style.innerHTML = "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }

    // Compile full plain-text transcript
    const transcriptText = finalizedTranscript
      .map((turn) => `[${turn.elapsed || turn.time}] ${turn.speaker}: ${turn.text}`)
      .join("\n");

    try {
      // Generate all reports in a single bundled API request
      const bundledPrompt = `Analyze the following meeting transcript and provide three distinct sections: SUMMARY, Q&A, and TASKS. Use the exact tags [SUMMARY_START], [SUMMARY_END], [QA_START], [QA_END], [TASKS_START], and [TASKS_END] to separate these sections. Do not use codeblocks or surrounding markdown backticks.

Here are the guidelines for each section:
1. SUMMARY: Provide a structured summary of the meeting. Begin with a 2-3 sentence Executive Summary, followed by bullet points of the main discussion topics and decisions made.
2. Q&A: Identify all questions asked and their corresponding answers. Format them clearly as Q&A pairs (e.g. **Q: [Question]** asked by [Name]\n**A: [Answer]** answered by [Name]). If a question was not answered, note it as "Answer not found in meeting". If no questions were asked, write "No questions detected in this meeting."
3. TASKS: Extract all tasks, action items, next steps, and todo items. Specify who is assigned (if mentioned) and what needs to be done. Format them as a Markdown checklist (- [ ] Task - Assigned to: [Name]). If no tasks were discussed, write "No action items or tasks detected."

Transcript:
${transcriptText}`;

      const combinedText = await callAIProvider(bundledPrompt, provider, activeKey, activeModel);

      // Parse the sections using regex
      const summaryMatch = combinedText.match(/\[SUMMARY_START\]([\s\S]*?)\[SUMMARY_END\]/);
      const qaMatch = combinedText.match(/\[QA_START\]([\s\S]*?)\[QA_END\]/);
      const tasksMatch = combinedText.match(/\[TASKS_START\]([\s\S]*?)\[TASKS_END\]/);

      const summary = summaryMatch ? summaryMatch[1].trim() : "Failed to extract summary section from AI response.";
      const qa = qaMatch ? qaMatch[1].trim() : "Failed to extract Q&A section from AI response.";
      const tasks = tasksMatch ? tasksMatch[1].trim() : "Failed to extract tasks section from AI response.";

      // Fallback if AI didn't use the tags properly
      if (!summaryMatch && !qaMatch && !tasksMatch) {
        console.warn("AI response did not contain parsing tags, saving full text to Summary.");
        chrome.storage.local.set({
          meetSummary: combinedText,
          meetQA: "Please try again.",
          meetTasks: "Please try again."
        });
      } else {
        chrome.storage.local.set({
          meetSummary: summary,
          meetQA: qa,
          meetTasks: tasks
        });
      }

      // Force tab update
      pollTranscript();
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(`Failed to generate AI summaries: ${error.message}`);
      pollTranscript();
    } finally {
      generateReportsBtn.removeAttribute("disabled");
      generateReportsBtn.innerHTML = "✨ Generate AI Reports";
    }
  });
}

// Unified API call selector for Meet Summaries
async function callAIProvider(prompt, provider, apiKey, model, retries = 3, delay = 1000) {
  const maxChars = 32000;
  const truncatedPrompt = prompt.length > maxChars ? prompt.substring(0, maxChars) + "..." : prompt;

  for (let i = 0; i < retries; i++) {
    try {

      // Gemini
      if (provider === "gemini") {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: truncatedPrompt }] }],
              generationConfig: { temperature: 0.3 }
            })
          }
        );

        if (res.status === 503) {
          console.warn(`Gemini experiencing high demand, retrying in ${delay}ms...`);
          if (i === retries - 1) {
            throw new Error("Gemini is currently experiencing high demand. Please try again in a few minutes.");
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 404) {
            let fallbackModel = "";
            if (model === "gemini-1.5-flash" || model === "gemini-1.5-flash-latest") {
              fallbackModel = "gemini-3.5-flash";
            } else if (model === "gemini-3.5-flash") {
              fallbackModel = "gemini-3.1-flash-lite";
            }
            if (fallbackModel) {
              console.warn(`${model} not found, falling back to ${fallbackModel}...`);
              return await callAIProvider(prompt, provider, apiKey, fallbackModel, retries, delay);
            }
          }
          let errorMsg = errorData.error?.message || "Gemini API request failed";
          if (res.status === 429 || errorMsg.toLowerCase().includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
            errorMsg = "Quota exceeded or no credits available on your Gemini account. Please check your billing or rate limits in Google AI Studio.";
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No report generated.";

      }

      // OpenAI
      else if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: [{ role: "user", content: truncatedPrompt }],
            temperature: 0.3
          })
        });

        if (res.status === 429 || res.status === 503) {
          console.warn(`OpenAI status ${res.status}, retrying in ${delay}ms...`);
          if (i === retries - 1) {
            throw new Error("OpenAI is currently experiencing high load or rate limits. Please try again.");
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        if (!res.ok) {
          const errorData = await res.json();
          let errorMsg = errorData.error?.message || "OpenAI API request failed";
          if (res.status === 429 || errorData.error?.code === "insufficient_quota" || errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("billing")) {
            errorMsg = "You exceeded your OpenAI quota or have no credits available. Please check your OpenAI billing plan.";
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || "No report generated.";

      }

      // Hugging-face
      else if (provider === "huggingface") {
        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            inputs: truncatedPrompt,
            parameters: { max_new_tokens: 1200, temperature: 0.3 }
          })
        });

        if (res.status === 503 || res.status === 429) {
          console.warn(`Hugging Face status ${res.status}, retrying in ${delay}ms...`);
          if (i === retries - 1) {
            throw new Error("Hugging Face is currently experiencing high load or rate limits. Please try again.");
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        if (!res.ok) {
          const errorText = await res.text();
          let errorMsg = errorText || "Hugging Face API request failed";
          try {
            const errorObj = JSON.parse(errorMsg);
            errorMsg = errorObj.error || errorMsg;
          } catch (e) { }
          if (res.status === 429 || errorMsg.toLowerCase().includes("limit") || errorMsg.toLowerCase().includes("credits") || errorMsg.toLowerCase().includes("rate") || errorMsg.toLowerCase().includes("too many requests")) {
            errorMsg = "Hugging Face API limit reached or token has no credits. Please check your Hugging Face plan.";
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        let resultText = "";
        if (Array.isArray(data) && data[0]) {
          resultText = data[0].generated_text || data[0].summary_text || JSON.stringify(data);
        } else {
          resultText = data.generated_text || JSON.stringify(data);
        }

        // Clean up Llama output if it repeats the prompt
        if (resultText.startsWith(truncatedPrompt)) {
          resultText = resultText.substring(truncatedPrompt.length).trim();
        }
        return resultText || "No report generated.";
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Attempt ${i + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("API request failed after maximum retries.");
}

// Copy active tab content
function handleCopyActiveTab() {
  const activeTabBtn = document.querySelector(".tab-btn.active");
  if (!activeTabBtn) return;

  const tabId = activeTabBtn.getAttribute("data-tab");
  let text = "";

  if (tabId === "tab-transcript") {
    text = finalizedTranscript
      .map((turn) => `[${turn.elapsed || turn.time}] ${turn.speaker}: ${turn.text}`)
      .join("\n");
  } else if (tabId === "tab-summary") {
    text = summaryContainer.innerText;
  } else if (tabId === "tab-qa") {
    text = qaContainer.innerText;
  } else if (tabId === "tab-tasks") {
    text = tasksContainer.innerText;
  }

  if (text.trim() === "") {
    alert("Tab content is empty. Nothing to copy.");
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = "Copied!";
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  }).catch((err) => {
    console.error("Copy failed:", err);
  });
}

// Download full report as Markdown file
function handleDownloadReport() {
  chrome.storage.local.get(["meetTranscript", "meetSummary", "meetQA", "meetTasks"], (data) => {
    const summary = data.meetSummary || "No summary generated.";
    const qa = data.meetQA || "No Q&A pairs generated.";
    const tasks = data.meetTasks || "No tasks extracted.";
    const transcriptText = (data.meetTranscript || [])
      .map((turn) => `## ${turn.speaker} [${turn.elapsed || turn.time}]\n\n${turn.text}\n`)
      .join("\n");

    const markdownContent = `# Meeting Report: ${currentMeetingTitle}
Date: ${new Date().toLocaleString()}

---

## Executive Summary
${summary}

---

## Questions & Answers
${qa}

---

## Action Items & Tasks
${tasks}

---

## Full Transcript
${transcriptText || "_No transcript text available._"}
`;

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Formatting title filename
    const safeTitle = currentMeetingTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    link.href = url;
    link.download = `meeting-report-${safeTitle || "gmeet"}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

// Escaping text to prevent DOM injection
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Simple Markdown to HTML Renderer
function renderMarkdownToHtml(mdText) {
  if (!mdText) return "";

  // Escape raw HTML tags
  let html = escapeHtml(mdText);

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Checkboxes (- [ ] or - [x])
  html = html.replace(/- \[\s\]\s(.*?)(?=\n|$)/g, "<div><input type='checkbox' disabled> $1</div>");
  html = html.replace(/- \[x\]\s(.*?)(?=\n|$)/g, "<div><input type='checkbox' checked disabled> $1</div>");

  // Headings (### heading)
  html = html.replace(/### (.*?)(?=\n|$)/g, "<h3>$1</h3>");
  html = html.replace(/## (.*?)(?=\n|$)/g, "<h2>$1</h2>");
  html = html.replace(/# (.*?)(?=\n|$)/g, "<h1>$1</h1>");

  // Bullet Points (- item)
  html = html.replace(/^- (.*?)(?=\n|$)/gm, "<li>$1</li>");

  // Wrap li groups in ul (approximate)
  html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
  // Clean redundant nested uls
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // Line breaks
  html = html.replace(/\n/g, "<br>");

  return html;
}
