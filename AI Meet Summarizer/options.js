document.addEventListener("DOMContentLoaded", () => {
  const providerSelect = document.getElementById("ai-provider");
  const saveBtn = document.getElementById("save-button");
  const successMsg = document.getElementById("success-message");
  const testLocalBtn = document.getElementById("test-local-btn");
  const localStatusBadge = document.getElementById("local-status-badge");

  const sections = {
    gemini: document.getElementById("gemini-section"),
    openai: document.getElementById("openai-section"),
    huggingface: document.getElementById("huggingface-section"),
    local: document.getElementById("local-section")
  };

  const inputs = {
    geminiKey: document.getElementById("gemini-key"),
    geminiModel: document.getElementById("gemini-model"),
    openaiKey: document.getElementById("openai-key"),
    openaiModel: document.getElementById("openai-model"),
    hfKey: document.getElementById("hf-key"),
    hfModel: document.getElementById("hf-model"),
    localServerUrl: document.getElementById("local-server-url"),
    localModel: document.getElementById("local-model")
  };

  // Toggle sections based on active provider
  function updateVisibleSections(selectedProvider) {
    Object.keys(sections).forEach((key) => {
      if (sections[key]) {
        sections[key].style.display = key === selectedProvider ? "block" : "none";
      }
    });
  }

  providerSelect.addEventListener("change", (e) => {
    updateVisibleSections(e.target.value);
  });

  // Test local backend connection
  if (testLocalBtn) {
    testLocalBtn.addEventListener("click", async () => {
      const serverUrl = (inputs.localServerUrl.value.trim() || "http://localhost:8000").replace(/\/+$/, "");
      localStatusBadge.style.color = "#9ca3af";
      localStatusBadge.textContent = "⏳ Testing connection...";

      try {
        const response = await fetch(`${serverUrl}/health`, { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          if (data.ollama_status === "reachable") {
            localStatusBadge.style.color = "#10b981";
            localStatusBadge.textContent = `🟢 Connected! Ollama active (${data.model || "qwen3:1.7b"})`;
          } else {
            localStatusBadge.style.color = "#f59e0b";
            localStatusBadge.textContent = `🟡 Backend online, but Ollama is ${data.ollama_status || "offline"}`;
          }
        } else {
          localStatusBadge.style.color = "#ef4444";
          localStatusBadge.textContent = `🔴 Backend returned HTTP ${response.status}`;
        }
      } catch (err) {
        localStatusBadge.style.color = "#ef4444";
        localStatusBadge.textContent = "🔴 Cannot connect. Ensure FastAPI (localhost:8000) & Ollama are running.";
      }
    });
  }

  // Load configuration from storage
  chrome.storage.sync.get([
    "aiProvider",
    "geminiApiKey",
    "geminiModel",
    "openaiApiKey",
    "openaiModel",
    "huggingfaceApiKey",
    "huggingfaceModel",
    "localServerUrl",
    "localModel"
  ], (result) => {
    if (result.aiProvider) {
      providerSelect.value = result.aiProvider;
    }
    updateVisibleSections(providerSelect.value);

    if (result.geminiApiKey) inputs.geminiKey.value = result.geminiApiKey;
    if (result.geminiModel) inputs.geminiModel.value = result.geminiModel;
    if (result.openaiApiKey) inputs.openaiKey.value = result.openaiApiKey;
    if (result.openaiModel) inputs.openaiModel.value = result.openaiModel;
    if (result.huggingfaceApiKey) inputs.hfKey.value = result.huggingfaceApiKey;
    if (result.huggingfaceModel) inputs.hfModel.value = result.huggingfaceModel;
    if (result.localServerUrl) inputs.localServerUrl.value = result.localServerUrl;
    if (result.localModel) inputs.localModel.value = result.localModel;
  });

  // Save settings
  saveBtn.addEventListener("click", () => {
    const config = {
      aiProvider: providerSelect.value,
      geminiApiKey: inputs.geminiKey.value.trim(),
      geminiModel: inputs.geminiModel.value.trim() || "gemini-1.5-flash",
      openaiApiKey: inputs.openaiKey.value.trim(),
      openaiModel: inputs.openaiModel.value,
      huggingfaceApiKey: inputs.hfKey.value.trim(),
      huggingfaceModel: inputs.hfModel.value.trim(),
      localServerUrl: inputs.localServerUrl.value.trim() || "http://localhost:8000",
      localModel: inputs.localModel.value.trim() || "qwen3:1.7b"
    };

    chrome.storage.sync.set(config, () => {
      successMsg.style.display = "block";
      saveBtn.setAttribute("disabled", "true");

      setTimeout(() => {
        window.close();
        chrome.tabs.getCurrent((tab) => {
          if (tab) {
            chrome.tabs.remove(tab.id);
          }
        });
      }, 1200);
    });
  });
});
