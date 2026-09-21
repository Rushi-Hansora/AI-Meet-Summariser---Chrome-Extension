let isCapturing = false;
let observer = null;
let stabilityInterval = null;
let meetingTitle = "";
let startTime = null;

// Tracking state for active speaker turns
// Maps DOM elements to their turn data
const activeTurns = new Map();
let finalizedTranscript = [];

console.log("AI Meet Summariser content script injected.");

// Selectors for Google Meet Captions DOM (with semantic fallbacks)
const SELECTORS = {
  region: '[role="region"][aria-label="Captions"]',
  item: ".nMcdL",
  speaker: ".NWpY1d",
  text: ".ygicle",
  avatar: 'img[data-iml], img[src*="googleusercontent.com"]'
};

// --- Helper Functions ---

const normalize = (text = "") => text.replace(/\s+/g, " ").trim();

function getMeetingTitle() {
  const titleSelectors = [
    '[data-meeting-title]',
    'title',
    '[jsname="r4nke"]',
    '[data-call-title]',
    '.u6vdEc',
    'h1'
  ];

  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const val = el.textContent || el.innerText;
      if (val && val.trim() && !val.includes("Google Meet")) {
        meetingTitle = val.trim();
        break;
      }
    }
  }

  if (!meetingTitle || meetingTitle.includes("Google Meet")) {
    const pathname = window.location.pathname.replace(/^\//, "");
    meetingTitle = pathname ? `Meet ${pathname}` : `Google Meet - ${new Date().toLocaleDateString()}`;
  }
  return meetingTitle;
}

// Find the captions container
function getCaptionsRegion() {
  return (
    document.querySelector(SELECTORS.region) ||
    [...document.querySelectorAll('[role="region"][aria-label]')].find(
      (node) => normalize(node.getAttribute("aria-label")) === "Captions"
    ) ||
    null
  );
}

// Check if element is a caption block (item)
function isCaptionItem(node) {
  if (!node || node.nodeType !== 1) return false;
  return node.matches(SELECTORS.item) || !!node.querySelector(SELECTORS.avatar);
}

// Find all caption items inside the region
function getCaptionItems(region) {
  const itemsByClass = [...region.querySelectorAll(SELECTORS.item)];
  if (itemsByClass.length > 0) return itemsByClass;
  // Fallback to children containing avatar image
  return [...region.children].filter((el) => el.querySelector(SELECTORS.avatar));
}

// Walk up parent chain to find caption item
function getClosestCaptionItem(node) {
  let el = node.nodeType === 3 ? node.parentElement : node;
  while (el) {
    if (isCaptionItem(el)) return el;
    el = el.parentElement;
  }
  return null;
}

// Get speaker name from caption block
function getSpeakerName(item) {
  const el = item.querySelector(SELECTORS.speaker) || item.querySelector("span");
  return el ? normalize(el.textContent) : "Unknown Speaker";
}

// Get caption text from caption block
function getCaptionText(item) {
  const el = item.querySelector(SELECTORS.text) ||
    [...item.children].reverse().find((child) => child.tagName === "DIV" && !child.querySelector(SELECTORS.avatar));
  return el ? normalize(el.textContent) : "";
}

// --- Transcript Storage & Sync ---

function saveTranscriptState() {
  // Clone finalizedTranscript
  const combined = JSON.parse(JSON.stringify(finalizedTranscript));

  // Sort active turns by startTime
  const activeList = [...activeTurns.values()].sort((a, b) => a.startTime - b.startTime);

  for (const entry of activeList) {
    if (!entry.text) continue;
    const lastIndex = combined.length - 1;
    if (lastIndex >= 0 && combined[lastIndex].speaker === entry.speaker) {
      const prevTurn = combined[lastIndex];
      const text = entry.text;
      if (text === prevTurn.text || prevTurn.text.endsWith(text)) {
        // Ignore duplicate
      } else if (text.startsWith(prevTurn.text)) {
        prevTurn.text = text;
      } else {
        prevTurn.text += " " + text;
      }
    } else {
      combined.push({
        speaker: entry.speaker,
        text: entry.text,
        time: entry.time,
        elapsed: entry.elapsed,
        timestamp: entry.startTime
      });
    }
  }

  chrome.storage.local.set({
    meetTranscript: combined,
    meetingTitle: getMeetingTitle(),
    lastUpdated: Date.now()
  });
}

function notifyBackgroundStatus() {
  chrome.runtime.sendMessage({
    type: "STATUS_UPDATE",
    isCapturing: isCapturing
  }).catch((err) => console.log("Error notifying background:", err));
}

// Finalizes a turn and pushes it to the finalized list
function finalizeTurn(entry) {
  if (!entry.text) return;

  // Add to finalized list, merging consecutive inputs from the same speaker
  const lastIndex = finalizedTranscript.length - 1;
  if (lastIndex >= 0 && finalizedTranscript[lastIndex].speaker === entry.speaker) {
    const prevTurn = finalizedTranscript[lastIndex];
    // Check if new text is a continuation or duplicate
    if (entry.text === prevTurn.text || prevTurn.text.endsWith(entry.text)) {
      // Duplicate, ignore
    } else if (entry.text.startsWith(prevTurn.text)) {
      // Grew in place, update it
      prevTurn.text = entry.text;
    } else {
      // Append text
      prevTurn.text += " " + entry.text;
    }
  } else {
    finalizedTranscript.push({
      speaker: entry.speaker,
      text: entry.text,
      time: entry.time,
      elapsed: entry.elapsed,
      timestamp: entry.startTime
    });
  }

  saveTranscriptState();
}

// --- Tracking Active Captions ---

function trackCaptionItem(el) {
  if (activeTurns.has(el)) return;

  const speaker = getSpeakerName(el);
  const text = getCaptionText(el);
  const startTimeVal = Date.now();

  const timestamp = new Date(startTimeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const elapsedMs = startTimeVal - startTime;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const timeLabel = `${elapsedMin}:${elapsedSec.toString().padStart(2, "0")}`;

  activeTurns.set(el, {
    speaker,
    text,
    startTime: startTimeVal,
    time: timestamp,
    elapsed: timeLabel
  });

  saveTranscriptState();
}

function updateCaptionItem(el) {
  const entry = activeTurns.get(el);
  if (!entry) return;

  const currentText = getCaptionText(el);
  if (entry.text !== currentText) {
    entry.text = currentText;

    // Save live caption state for popup
    chrome.storage.local.set({
      liveCaption: {
        speaker: entry.speaker,
        text: currentText
      }
    });

    saveTranscriptState();
  }
}

// --- Capture Control ---

function startCapture() {
  if (isCapturing) return true;

  const region = getCaptionsRegion();
  if (!region) {
    console.warn("Captions container not found! Make sure closed captions are turned on.");
    return false;
  }

  console.log("Starting Google Meet caption capture...");
  isCapturing = true;
  startTime = startTime || Date.now();
  notifyBackgroundStatus();

  // Load existing transcript from storage if any
  chrome.storage.local.get(["meetTranscript"], (data) => {
    if (data.meetTranscript) {
      finalizedTranscript = data.meetTranscript;
    }
  });

  // 1. Observe Caption additions/removals
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Track new elements
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (isCaptionItem(node)) {
          trackCaptionItem(node);
        } else {
          node.querySelectorAll?.(SELECTORS.item).forEach(trackCaptionItem);
        }
      }

      // Finalize elements when removed
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== 1) continue;
        const items = isCaptionItem(node) ? [node] : [...(node.querySelectorAll?.(SELECTORS.item) ?? [])];
        for (const item of items) {
          const entry = activeTurns.get(item);
          if (entry) {
            finalizeTurn(entry);
            activeTurns.delete(item);
          }
        }
      }

      // Update text in active elements
      if (mutation.type === "characterData" || mutation.type === "childList") {
        const item = getClosestCaptionItem(mutation.target);
        if (item) {
          trackCaptionItem(item); // Ensure it's tracked
          updateCaptionItem(item);
        }
      }
    }
  });

  observer.observe(region, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Track existing caption blocks
  getCaptionItems(region).forEach(trackCaptionItem);

  // 2. Poll every 1 second for stability/live checks
  stabilityInterval = setInterval(() => {
    for (const el of activeTurns.keys()) {
      updateCaptionItem(el);
    }

    // Clear live caption in storage if no active turns
    if (activeTurns.size === 0) {
      chrome.storage.local.set({ liveCaption: null });
    }
  }, 1000);

  chrome.storage.local.set({ isCapturing: true });
  return true;
}

function stopCapture() {
  if (!isCapturing) return;

  console.log("Stopping Google Meet caption capture...");
  isCapturing = false;
  notifyBackgroundStatus();

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (stabilityInterval) {
    clearInterval(stabilityInterval);
    stabilityInterval = null;
  }

  // Finalize all remaining active turns
  for (const entry of activeTurns.values()) {
    finalizeTurn(entry);
  }
  activeTurns.clear();

  chrome.storage.local.set({
    isCapturing: false,
    liveCaption: null
  });
}

// --- Message Listener ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);

  if (message.type === "START_CAPTURE") {
    const success = startCapture();
    sendResponse({ success });
  } else if (message.type === "STOP_CAPTURE") {
    stopCapture();
    sendResponse({ success: true });
  } else if (message.type === "CHECK_STATUS") {
    const region = getCaptionsRegion();
    sendResponse({
      isCapturing,
      captionsEnabled: !!region,
      transcriptCount: finalizedTranscript.length,
      title: getMeetingTitle()
    });
  } else if (message.type === "CLEAR_TRANSCRIPT") {
    finalizedTranscript = [];
    activeTurns.clear();
    saveTranscriptState();
    chrome.storage.local.set({ liveCaption: null });
    sendResponse({ success: true });
  }
});

// Auto-resume capture on page load if storage says isCapturing is true
chrome.storage.local.get(["isCapturing"], (data) => {
  if (data.isCapturing) {
    console.log("Resuming capture from saved state...");
    // Wait for DOM and captions region to load
    let checkRegionInterval = setInterval(() => {
      const region = getCaptionsRegion();
      if (region) {
        clearInterval(checkRegionInterval);
        startCapture();
      }
    }, 2000);
    // Timeout after 30 seconds
    setTimeout(() => clearInterval(checkRegionInterval), 30000);
  }
});
