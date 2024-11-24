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
    if (settings.theme) {
      document.getElementById("theme").value = settings.theme;
    }

    const enableApi = settings.enableAnthropicApi ?? false;
    document.getElementById("enableAnthropicApi").checked = enableApi;
    updateApiFieldsVisibility(enableApi);

    // Load debug trace settings
    const debugTrace = settings.debugTraceRequests ?? false;
    document.getElementById("debugTraceRequests").checked = debugTrace;

    const debugWindow = settings.debugWindowEvents ?? false;
    document.getElementById("debugWindowEvents").checked = debugWindow;
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

function updateApiFieldsVisibility(enabled) {
  const apiKeyGroup = document.getElementById("apiKeyGroup");
  const modelGroup = document.getElementById("modelGroup");
  const testApiKeyButton = document.getElementById("testApiKey");

  apiKeyGroup.style.display = enabled ? "block" : "none";
  modelGroup.style.display = enabled ? "block" : "none";
  testApiKeyButton.style.display = enabled ? "inline-block" : "none";
}

// Add ripple effect to buttons
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement("span");
  const rect = button.getBoundingClientRect();

  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - radius}px`;
  ripple.style.top = `${event.clientY - rect.top - radius}px`;

  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  // Add ripple effect to all buttons
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("click", createRipple);
  });
});

// Handle API toggle
document
  .getElementById("enableAnthropicApi")
  .addEventListener("change", (e) => {
    const enabled = e.target.checked;
    updateApiFieldsVisibility(enabled);
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

function showSuccessMessage(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success";
  successDiv.textContent = message;
  successDiv.style.position = "fixed";
  successDiv.style.top = "20px";
  successDiv.style.left = "50%";
  successDiv.style.transform = "translateX(-50%)";
  successDiv.style.zIndex = "1000";
  successDiv.style.padding = "12px 24px";
  successDiv.style.borderRadius = "4px";
  successDiv.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.style.opacity = "0";
    successDiv.style.transform = "translateX(-50%) translateY(-20px)";
    setTimeout(() => successDiv.remove(), 300);
  }, 2000);
}

document
  .getElementById("settingsForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const enableApi = document.getElementById("enableAnthropicApi").checked;
    const apiKey = document.getElementById("apiKey").value.trim();
    const model = document.getElementById("model").value.trim();
    const theme = document.getElementById("theme").value;
    const debugTrace = document.getElementById("debugTraceRequests").checked;
    const debugWindow = document.getElementById("debugWindowEvents").checked;

    const apiKeyErrorDiv = document.getElementById("apiKeyError");
    const modelErrorDiv = document.getElementById("modelError");
    const themeErrorDiv = document.getElementById("themeError");

    // Reset messages
    apiKeyErrorDiv.style.display = "none";
    modelErrorDiv.style.display = "none";
    themeErrorDiv.style.display = "none";

    let hasErrors = false;

    // Only validate API fields if API is enabled
    if (enableApi) {
      const apiKeyError = SettingsService.validateApiKey(apiKey);
      const modelError = SettingsService.validateModel(model);

      if (apiKeyError) {
        apiKeyErrorDiv.textContent = apiKeyError;
        apiKeyErrorDiv.style.display = "block";
        hasErrors = true;
      }

      if (modelError) {
        modelErrorDiv.textContent = modelError;
        modelErrorDiv.style.display = "block";
        hasErrors = true;
      }
    }

    const themeError = SettingsService.validateTheme(theme);
    if (themeError) {
      themeErrorDiv.textContent = themeError;
      themeErrorDiv.style.display = "block";
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    try {
      // Save settings using SettingsService
      await SettingsService.setSetting("enableAnthropicApi", enableApi);
      await SettingsService.setSetting("debugTraceRequests", debugTrace);
      await SettingsService.setSetting("debugWindowEvents", debugWindow);
      if (enableApi) {
        await SettingsService.setSetting("anthropicApiKey", apiKey);
        await SettingsService.setSetting("model", model);
      } else {
        // Clear API-related settings when disabled
        await SettingsService.setSetting("anthropicApiKey", "");
        await SettingsService.setSetting("model", "");
      }
      await SettingsService.setSetting("theme", theme);

      // Keep the form values
      document.getElementById("apiKey").value = enableApi ? apiKey : "";
      document.getElementById("model").value = enableApi ? model : "";
      document.getElementById("theme").value = theme;
      document.getElementById("enableAnthropicApi").checked = enableApi;
      document.getElementById("debugTraceRequests").checked = debugTrace;
      document.getElementById("debugWindowEvents").checked = debugWindow;

      // Show success message
      showSuccessMessage("Settings saved successfully");

      // Notify content script of theme change with proper error handling
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          try {
            chrome.tabs.sendMessage(
              tab.id,
              { type: "theme_changed", theme },
              (response) => {
                if (chrome.runtime.lastError) {
                  // Ignore errors from tabs that can't receive messages
                  console.debug(
                    `Could not send theme update to tab ${tab.id}: ${chrome.runtime.lastError.message}`
                  );
                }
              }
            );
          } catch (error) {
            console.debug(
              `Error sending theme update to tab ${tab.id}: ${error.message}`
            );
          }
        });
      });
    } catch (error) {
      apiKeyErrorDiv.textContent = "Failed to save settings: " + error.message;
      apiKeyErrorDiv.style.display = "block";
    }
  });
