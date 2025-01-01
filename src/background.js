// src/background.js
import { StorageService } from "./services/StorageService";
import { SettingsService } from "./services/SettingsService";

const API_URL = "https://api.anthropic.com/v1/messages";

// Debug logging helper
function debugLog(message, data) {
  console.log(`[Background] ${message}`, data || "");
}

// Common headers for all Anthropic API requests
function getAnthropicHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog("Received message:", request);

  // Handle storage operations
  if (request.type === "storage_get") {
    const value = localStorage.getItem(request.key);
    // Return parsed value directly, not wrapped in an object
    sendResponse(value ? JSON.parse(value) : undefined);
    return true;
  }

  if (request.type === "storage_set") {
    localStorage.setItem(request.key, JSON.stringify(request.value));
    sendResponse(true);
    return true;
  }

  if (request.type === "storage_remove") {
    localStorage.removeItem(request.key);
    sendResponse(true);
    return true;
  }

  if (request.type === "storage_clear") {
    localStorage.clear();
    sendResponse(true);
    return true;
  }

  // Handle downloads
  if (request.type === "download") {
    chrome.downloads.download(
      {
        url: request.url,
        filename: request.filename,
        saveAs: true,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          const response = {
            success: false,
            error: chrome.runtime.lastError.message,
          };
          debugLog("Download failed:", response);
          sendResponse(response);
        } else {
          const response = { success: true, downloadId };
          debugLog("Download succeeded:", response);
          sendResponse(response);
        }
      }
    );
    return true; // Keep the message channel open for async response
  }

  if (request.type === "anthropic_test") {
    debugLog("Testing Anthropic API key");

    // Get settings to use the configured model for testing
    (async () => {
      try {
        const settings = await SettingsService.getSettings();
        const model = settings.model || "claude-3-5-sonnet-20241022";

        // Make a minimal request to test the API key
        const response = await fetch(API_URL, {
          method: "POST",
          headers: getAnthropicHeaders(request.apiKey),
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 1,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          let errorMessage;
          try {
            const errorJson = JSON.parse(text);
            errorMessage =
              errorJson.error?.message ||
              `API request failed with status ${response.status}`;
          } catch {
            errorMessage = `API request failed with status ${response.status}`;
          }
          debugLog("Anthropic API test error response:", {
            status: response.status,
            text: text,
            errorMessage,
          });

          // For 401, likely an invalid API key
          if (response.status === 401) {
            return sendResponse({
              error:
                "Invalid API key. Please check your API key in the extension settings.",
            });
          }

          return sendResponse({
            error: errorMessage,
          });
        }

        const data = await response.json();
        if (data && !data.error) {
          debugLog("Anthropic API test succeeded:", data);
          sendResponse({
            model: data.model,
            success: true,
          });
        }
      } catch (error) {
        debugLog("Anthropic API test error:", error);
        sendResponse({
          error: "Failed to test API key. Please try again.",
        });
      }
    })();

    return true; // Keep the message channel open for async response
  }

  if (request.type === "anthropic_complete") {
    debugLog("Making Anthropic API request:", request.body);

    const messages = request.body["messages"]?.map((msg) => ({
      ...msg,
      role: msg["role"] === "assistant" ? "assistant" : "user",
    }));

    fetch(API_URL, {
      method: "POST",
      headers: getAnthropicHeaders(request.apiKey),
      body: JSON.stringify({ ...request.body, messages }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          let errorMessage;
          try {
            const errorJson = JSON.parse(text);
            errorMessage =
              errorJson.error?.message ||
              `API request failed with status ${response.status}`;
          } catch {
            errorMessage = `API request failed with status ${response.status}`;
          }
          debugLog("Anthropic API error response:", {
            status: response.status,
            text: text,
            errorMessage,
          });

          // For 401, likely an invalid API key
          if (response.status === 401) {
            return sendResponse({
              error:
                "Invalid API key. Please check your API key in the extension settings.",
            });
          }

          return sendResponse({
            error: errorMessage,
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data && !data.error) {
          debugLog("Anthropic API success response:", data);
          sendResponse(data);
        }
      })
      .catch((error) => {
        debugLog("Anthropic API error:", error);
        sendResponse({
          error: "Failed to complete the request. Please try again.",
        });
      });

    return true; // Keep the message channel open for async response
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    (async () => {
      const urlPatterns = (await StorageService.get("urlPatterns", true)) || [];
      const urlMatches = urlPatterns.some((pattern) =>
        tab.url.includes(pattern)
      );

      if (urlMatches) {
        debugLog("Injecting content script for tab:", tabId);
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"],
        });
      }
    })();
  }
});

// Log when the background script is loaded
debugLog("Background script loaded");
