const STORAGE_KEY = "anthropic_api_settings";

// Load saved settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const settings = result[STORAGE_KEY] || {};
    if (settings.anthropicApiKey) {
      document.getElementById("apiKey").value = settings.anthropicApiKey;
    }
    if (settings.model) {
      document.getElementById("model").value = settings.model;
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
});

function validateApiKey(key) {
  if (!key) {
    return "API key is required";
  }
  if (!key.startsWith("sk-ant-")) {
    return 'Invalid API key format. Must start with "sk-ant-"';
  }
  if (key.length < 32) {
    return "API key appears too short";
  }
  return null;
}

function validateModel(model) {
  if (!model) {
    return "Model is required";
  }
  if (!model.startsWith("claude-")) {
    return 'Invalid model format. Must start with "claude-"';
  }
  return null;
}

async function testApiKey(apiKey) {
  const statusDiv = document.getElementById("apiKeyStatus");
  const testButton = document.getElementById("testApiKey");

  // Reset status
  statusDiv.className = "status testing";
  statusDiv.textContent = "Testing API key...";
  testButton.disabled = true;

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "anthropic_test",
          apiKey,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response.error) {
      statusDiv.className = "status error";
      statusDiv.textContent = `API key test failed: ${response.error}`;
    } else {
      statusDiv.className = "status success";
      statusDiv.textContent = `API key is valid! Using model: ${response.model}`;
    }
  } catch (error) {
    statusDiv.className = "status error";
    statusDiv.textContent = `Error testing API key: ${error.message}`;
  } finally {
    testButton.disabled = false;
  }
}

document.getElementById("testApiKey").addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  const error = validateApiKey(apiKey);

  if (error) {
    const statusDiv = document.getElementById("apiKeyStatus");
    statusDiv.className = "status error";
    statusDiv.textContent = error;
    return;
  }

  await testApiKey(apiKey);
});

document
  .getElementById("settingsForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiKey = document.getElementById("apiKey").value.trim();
    const model = document.getElementById("model").value.trim();
    const apiKeyErrorDiv = document.getElementById("apiKeyError");
    const modelErrorDiv = document.getElementById("modelError");
    const apiKeySuccessDiv = document.getElementById("apiKeySuccess");
    const modelSuccessDiv = document.getElementById("modelSuccess");

    // Reset messages
    apiKeyErrorDiv.style.display = "none";
    modelErrorDiv.style.display = "none";
    apiKeySuccessDiv.style.display = "none";
    modelSuccessDiv.style.display = "none";

    const apiKeyError = validateApiKey(apiKey);
    const modelError = validateModel(model);

    if (apiKeyError) {
      apiKeyErrorDiv.textContent = apiKeyError;
      apiKeyErrorDiv.style.display = "block";
      return;
    }

    if (modelError) {
      modelErrorDiv.textContent = modelError;
      modelErrorDiv.style.display = "block";
      return;
    }

    try {
      // Save settings
      await chrome.storage.sync.set({
        [STORAGE_KEY]: {
          anthropicApiKey: apiKey,
          model: model,
        },
      });

      // In dev mode, also save to localStorage
      if (process.env.NODE_ENV === "development") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            anthropicApiKey: apiKey,
            model: model,
          })
        );
      }

      // Keep the form values
      document.getElementById("apiKey").value = apiKey;
      document.getElementById("model").value = model;

      apiKeySuccessDiv.textContent = "Settings saved successfully";
      apiKeySuccessDiv.style.display = "block";
      setTimeout(() => {
        apiKeySuccessDiv.style.display = "none";
      }, 3000);
    } catch (error) {
      apiKeyErrorDiv.textContent = "Failed to save settings: " + error.message;
      apiKeyErrorDiv.style.display = "block";
    }
  });
