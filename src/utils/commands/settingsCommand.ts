/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/settingsCommand.ts
 */

import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";
import { SettingsService } from "../../services/SettingsService";

export class SettingsCommand extends BaseCommandInfo {
  constructor() {
    super("settings", "s", {
      enable_api: "with_arg",
      api_key: "with_arg",
      model: "with_arg",
      theme: "with_arg",
      debug_trace: "with_arg",
      debug_window: "with_arg",
    });
  }

  async execute(params: ExecuteParams): Promise<boolean> {
    const { statement, outputElement } = params;
    const options = statement.options as { [key: string]: string };

    try {
      if (Object.keys(options).length === 0) {
        // If no options provided, display current settings
        const settings = await SettingsService.getSettings();
        outputElement.textContent = `Current Settings:
- Anthropic API: ${settings.enableAnthropicApi ? "Enabled" : "Disabled"}
- API Key: ${settings.anthropicApiKey ? "********" : "Not Set"}
- Model: ${settings.model || "Not Set"}
- Theme: ${settings.theme || "Not Set"}
- Debug Trace Requests: ${settings.debugTraceRequests ? "Enabled" : "Disabled"}
- Debug Window Events: ${settings.debugWindowEvents ? "Enabled" : "Disabled"}`;
        return true;
      }

      // Update settings based on provided options
      if ("enable_api" in options) {
        await SettingsService.setSetting(
          "enableAnthropicApi",
          options.enable_api === "true"
        );
      }
      if ("api_key" in options) {
        const error = SettingsService.validateApiKey(options.api_key);
        if (error) {
          outputElement.textContent = `Invalid API key: ${error}`;
          return false;
        }
        await SettingsService.setSetting("anthropicApiKey", options.api_key);
      }
      if ("model" in options) {
        const error = SettingsService.validateModel(options.model);
        if (error) {
          outputElement.textContent = `Invalid model: ${error}`;
          return false;
        }
        await SettingsService.setSetting("model", options.model);
      }
      if ("theme" in options) {
        const error = SettingsService.validateTheme(options.theme);
        if (error) {
          outputElement.textContent = `Invalid theme: ${error}`;
          return false;
        }
        const theme = options.theme as "light" | "dark";
        await SettingsService.setSetting("theme", theme);

        // Notify content script of theme change
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              try {
                chrome.tabs.sendMessage(
                  tab.id,
                  { type: "theme_changed", theme },
                  () => {
                    if (chrome.runtime.lastError) {
                      console.debug(
                        `Could not send theme update to tab ${tab.id}: ${chrome.runtime.lastError.message}`
                      );
                    }
                  }
                );
              } catch (err) {
                const error = err as Error;
                console.debug(
                  `Error sending theme update to tab ${tab.id}: ${error.message}`
                );
              }
            }
          });
        });
      }
      if ("debug_trace" in options) {
        await SettingsService.setSetting(
          "debugTraceRequests",
          options.debug_trace === "true"
        );
      }
      if ("debug_window" in options) {
        await SettingsService.setSetting(
          "debugWindowEvents",
          options.debug_window === "true"
        );
      }

      outputElement.textContent = "Settings updated successfully";
      return true;
    } catch (err) {
      const error = err as Error;
      outputElement.textContent = `Failed to update settings: ${error.message}`;
      return false;
    }
  }
}
