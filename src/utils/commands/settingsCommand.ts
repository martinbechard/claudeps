/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/settingsCommand.ts
 */

import { BaseCommandInfo, ExecuteParams, ParseParams } from "./BaseCommandInfo";
import { SettingsService } from "../../services/SettingsService";
import { ScriptStatement } from "../../types";

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

  public parse(params: ParseParams): ScriptStatement {
    const { options } = params;

    // Initialize command options with any provided settings
    const commandOptions: Record<string, string> = {};

    // Copy over any provided options
    Object.keys(options).forEach((key) => {
      commandOptions[key] = options[key];
    });

    return new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: commandOptions,
      prompt: "",
    });
  }

  async execute(params: ExecuteParams): Promise<boolean> {
    const { statement, outputElement, handleLog, setStatus } = params;
    const options = statement.options as { [key: string]: string };

    try {
      if (Object.keys(options).length === 0) {
        handleLog("Retrieving settings...");
        await setStatus("working", "Retrieving settings");

        // If no options provided, display current settings
        const settings = await SettingsService.getSettings();
        outputElement.textContent = `Current Settings:
anthropicApiKey: ${settings.anthropicApiKey}
model: ${settings.model}
theme: ${settings.theme}
enableAnthropicApi: ${settings.enableAnthropicApi}
debugTraceRequests: ${settings.debugTraceRequests}
debugWindowEvents: ${settings.debugWindowEvents}`;

        await setStatus("ready", "Settings retrieved");
        handleLog("Settings retrieved successfully", "success");
        return true;
      }

      handleLog("Updating settings...");
      await setStatus("working", "Updating settings");

      // Update settings based on provided options
      if ("enable_api" in options) {
        await SettingsService.setSetting(
          "enableAnthropicApi",
          options.enable_api === "true"
        );
        handleLog(
          `API ${options.enable_api === "true" ? "enabled" : "disabled"}`
        );
      }
      if ("api_key" in options) {
        const error = SettingsService.validateApiKey(options.api_key);
        if (error) {
          outputElement.textContent = `Invalid API key: ${error}`;
          handleLog(`Invalid API key: ${error}`, "error");
          await setStatus("error", "Invalid API key");
          return false;
        }
        await SettingsService.setSetting("anthropicApiKey", options.api_key);
        handleLog("API key updated");
      }
      if ("model" in options) {
        const error = SettingsService.validateModel(options.model);
        if (error) {
          outputElement.textContent = `Invalid model: ${error}`;
          handleLog(`Invalid model: ${error}`, "error");
          await setStatus("error", "Invalid model");
          return false;
        }
        await SettingsService.setSetting("model", options.model);
        handleLog(`Model updated to ${options.model}`);
      }
      if ("theme" in options) {
        const error = SettingsService.validateTheme(options.theme);
        if (error) {
          outputElement.textContent = `Invalid theme: ${error}`;
          handleLog(`Invalid theme: ${error}`, "error");
          await setStatus("error", "Invalid theme");
          return false;
        }
        const theme = options.theme as "light" | "dark";
        await SettingsService.setSetting("theme", theme);
        handleLog(`Theme updated to ${theme}`);

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
        handleLog(
          `Debug trace ${
            options.debug_trace === "true" ? "enabled" : "disabled"
          }`
        );
      }
      if ("debug_window" in options) {
        await SettingsService.setSetting(
          "debugWindowEvents",
          options.debug_window === "true"
        );
        handleLog(
          `Debug window ${
            options.debug_window === "true" ? "enabled" : "disabled"
          }`
        );
      }

      outputElement.textContent = "Settings updated successfully";
      handleLog("Settings updated successfully", "success");
      await setStatus("ready", "Settings updated");
      return true;
    } catch (err) {
      const error = err as Error;
      outputElement.textContent = `Failed to update settings: ${error.message}`;
      handleLog(`Failed to update settings: ${error.message}`, "error");
      await setStatus("error", "Failed to update settings");
      return false;
    }
  }
}
