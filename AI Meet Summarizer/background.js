// background.js - AI Meet Summariser Background Service Worker

// Keep track of active meet capturing tabs
let activeMeetTabs = {};

// Listen for messages from content scripts and popups
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === "STATUS_UPDATE") {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      if (message.isCapturing) {
        activeMeetTabs[tabId] = true;
        chrome.action.setBadgeText({ text: "REC", tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: "#EA4335", tabId: tabId });
      } else {
        delete activeMeetTabs[tabId];
        chrome.action.setBadgeText({ text: "", tabId: tabId });
      }
    }
    sendResponse({ success: true });
  }

  // Handle when popup requests status from active tab
  if (message.type === "GET_ACTIVE_MEET_STATUS") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes("meet.google.com")) {
        const activeTabId = tabs[0].id;
        chrome.tabs.sendMessage(activeTabId, { type: "CHECK_STATUS" }, (response) => {
          if (chrome.runtime.lastError) {
            // Content script not loaded yet
            sendResponse({ isLoaded: false, isCapturing: false });
          } else {
            sendResponse({ isLoaded: true, ...response });
          }
        });
      } else {
        sendResponse({ isLoaded: false, notOnMeet: true });
      }
    });
    return true; // Keep channel open for async response
  }
});

// Remove badge on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeMeetTabs[tabId]) {
    delete activeMeetTabs[tabId];
  }
});
