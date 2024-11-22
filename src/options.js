import { StorageService } from "./services/StorageService";
import { SettingsService } from "./services/SettingsService";

const STORAGE_KEY = "anthropic_api_settings";

// Load saved settings
async function loadSettings() {
  try {
    const settings = await SettingsService.getSettings();
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
  const error = SettingsService.validateApiKey(apiKey);

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

    const apiKeyError = SettingsService.validateApiKey(apiKey);
    const modelError = SettingsService.validateModel(model);

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
      // Save settings using SettingsService
      await SettingsService.setSetting("anthropicApiKey", apiKey);
      await SettingsService.setSetting("model", model);

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
