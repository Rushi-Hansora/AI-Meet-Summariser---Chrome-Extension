
document.addEventListener("DOMContentLoaded", () => {
  const providerSelect = document.getElementById("ai-provider");
  const saveBtn = document.getElementById("save-button");
  const successMsg = document.getElementById("success-message");

  const sections = {
    gemini: document.getElementById("gemini-section"),
    openai: document.getElementById("openai-section"),
    huggingface: document.getElementById("huggingface-section")
  };

  const inputs = {
    geminiKey: document.getElementById("gemini-key"),
    geminiModel: document.getElementById("gemini-model"),
    openaiKey: document.getElementById("openai-key"),
    openaiModel: document.getElementById("openai-model"),
    hfKey: document.getElementById("hf-key"),
    hfModel: document.getElementById("hf-model")
  };

  // Toggle sections based on active provider
  function updateVisibleSections(selectedProvider) {
    Object.keys(sections).forEach((key) => {
      if (key === selectedProvider) {
        sections[key].style.display = "block";
      } else {
        sections[key].style.display = "none";
      }
    });
  }

  providerSelect.addEventListener("change", (e) => {
    updateVisibleSections(e.target.value);
  });

  // Load configuration from storage
  chrome.storage.sync.get([
    "aiProvider",
    "geminiApiKey",
    "geminiModel",
    "openaiApiKey",
    "openaiModel",
    "huggingfaceApiKey",
    "huggingfaceModel"
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
      huggingfaceModel: inputs.hfModel.value.trim()
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
