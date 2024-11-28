/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/rootCommand.ts
 */

import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";
import { SettingsService } from "../../services/SettingsService";
import { ParsedCommandLine, ScriptStatement } from "../../types";

/**
 * Command for managing the download root path
 * Usage:
 * /root - Display current download root path
 * /root <path> - Set download root path for all files
 * /root clear - Clear download root path
 */
export class RootCommand extends BaseCommandInfo {
  constructor() {
    super("root", "r", {
      path: "with_arg",
    });
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { options } = parsedCommandLine;

    // Initialize command options
    const commandOptions: Record<string, string> = {};

    // Handle path option if present
    if ("path" in options) {
      commandOptions.path = options.path;
    }

    return new ScriptStatement({
      isCommand: true,
      command: "root",
      options: commandOptions,
      prompt: "",
    });
  }

  async execute(params: ExecuteParams): Promise<boolean> {
    const { statement, outputElement, handleLog, setStatus } = params;
    const options = statement.options || {};

    try {
      // If no path option provided, display current root
      if (!("path" in options)) {
        handleLog("Retrieving current download root...");
        await setStatus("working", "Retrieving download root");

        const root = await SettingsService.getSetting("downloadRoot");
        outputElement.textContent = `Current download root: ${
          root || "not set"
        }`;

        handleLog("Download root retrieved successfully", "success");
        await setStatus("ready", "Download root retrieved");
        return true;
      }

      // Update root based on provided path
      handleLog("Updating download root...");
      await setStatus("working", "Updating download root");

      if (options.path === "clear") {
        await SettingsService.setSetting("downloadRoot", undefined);
        outputElement.textContent = "Download root cleared";
        handleLog("Download root cleared successfully", "success");
      } else {
        await SettingsService.setSetting("downloadRoot", options.path);
        outputElement.textContent = `Download root updated to: ${options.path}`;
        handleLog(`Download root updated to: ${options.path}`, "success");
      }

      await setStatus("ready", "Download root updated");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      outputElement.textContent = `Failed to update download root: ${message}`;
      handleLog(`Download root command failed: ${message}`, "error");
      await setStatus("error", message);
      return false;
    }
  }
}
