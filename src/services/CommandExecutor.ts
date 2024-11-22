/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/services/CommandExecutor.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Handles execution of Claude extension commands
 * Note: One command handler to rule them all!
 */

import { DocumentRetrieval } from "./DocumentRetrieval";
import { ProjectRetrieval } from "./ProjectRetrieval";
import { ProjectSearchService } from "./ProjectSearchService";
import { ConversationRetrieval } from "./ConversationRetrieval";
import { PromptAll } from "./PromptAll";
import { AliasService } from "./AliasService";
import type { CommandOptions, Script, ScriptStatement } from "../types";
import type { StatusManager } from "../ui/components/StatusManager";
import { SettingsService } from "./SettingsService";

type LogFunction = (
  message: string,
  type?: "info" | "error" | "success"
) => void;

export class CommandExecutor {
  private readonly statusManager: StatusManager;
  private readonly handleLog: LogFunction;
  private readonly outputElement: HTMLElement;

  constructor(
    statusManager: StatusManager,
    handleLog: LogFunction,
    outputElement: HTMLElement
  ) {
    this.statusManager = statusManager;
    this.handleLog = handleLog;
    this.outputElement = outputElement;

    // Hook up the script's Cancel button to abort functionality
    this.statusManager.onCancel = () => {
      ProjectSearchService.abortSearch();
    };
  }

  /**
   * Handles the /knowledge command execution
   */
  public async handleKnowledgeCommand(): Promise<void> {
    try {
      this.outputElement.innerHTML = "";
      this.handleLog("Fetching documents...");
      const docs = await DocumentRetrieval.fetchDocuments();
      await DocumentRetrieval.displayDocuments(docs, this.outputElement);
      await this.statusManager.setStatus("ready", "Complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(`Error fetching documents: ${message}`, "error");
      await this.statusManager.setStatus("ready", "");
    }
  }

  /**
   * Handles the /project command execution
   */
  public async handleProjectCommand(): Promise<void> {
    try {
      this.outputElement.innerHTML = "";
      this.handleLog("Fetching project conversations...");
      await ProjectRetrieval.displayCurrentProject(this.outputElement);
      await this.statusManager.setStatus("ready", "Complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(
        `Error fetching project conversations: ${message}`,
        "error"
      );
      await this.statusManager.setStatus("error", message);
      setTimeout(() => this.statusManager.setStatus("ready"), 2000);
    }
  }

  /**
   * Handles the /search_project command execution
   */
  public async handleSearchProjectCommand(
    script: ScriptStatement
  ): Promise<void> {
    try {
      this.outputElement.innerHTML = "";

      this.handleLog(
        script.searchText
          ? `Searching projects for: ${script.searchText}`
          : "Retrieving project conversations..."
      );

      await ProjectSearchService.searchAndDisplayResults(
        script.searchText,
        this.outputElement
      );

      await this.statusManager.setStatus(
        "ready",
        script.searchText
          ? "Search completed successfully"
          : "Projects retrieved successfully"
      );

      this.handleLog(
        script.searchText
          ? "Search completed successfully"
          : "Projects retrieved successfully",
        "success"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(`Error during project search: ${message}`, "error");
      await this.statusManager.setStatus("error", message);
      setTimeout(() => this.statusManager.setStatus("ready"), 2000);
    }
  }

  public async handleSettingsCommand(script: ScriptStatement): Promise<void> {
    try {
      // Format: /settings api_key YOUR_KEY
      const parts = script.prompt ? script.prompt.trim().split(/\s+/) : [];

      if (parts.length < 2) {
        throw new Error(
          "Missing setting name. Format: /settings [setting_name] [value]"
        );
      }

      const settingName = parts[0];
      const value = parts.slice(1).join(" ");

      switch (settingName) {
        case "api_key":
          const error = SettingsService.validateApiKey(value);
          if (error) {
            throw new Error(`Invalid API key: ${error}`);
          }
          SettingsService.setSetting("anthropicApiKey", value);
          this.handleLog("API key updated successfully", "success");
          break;

        default:
          throw new Error(`Unknown setting: ${settingName}`);
      }

      await this.statusManager.setStatus("ready", "Settings updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(`Settings error: ${message}`, "error");
      await this.statusManager.setStatus("error", message);
      setTimeout(() => this.statusManager.setStatus("ready"), 2000);
    }
  }

  /**
   * Handles the /query_project command execution
   */
  public async handleQueryProjectCommand(
    script: ScriptStatement
  ): Promise<void> {
    try {
      this.outputElement.innerHTML = "";

      const prompt = script.prompt;
      if (!prompt || prompt.trim().length === 0) {
        throw new Error("No prompt provided for query_project command");
      }

      this.handleLog("Querying all conversations...");

      await PromptAll.queryAndDisplayResults(
        prompt,
        this.outputElement,
        async (status) => {
          await this.statusManager.setStatus("working", status);
          this.handleLog(status);
        }
      );

      await this.statusManager.setStatus(
        "ready",
        "Query completed successfully"
      );
      this.handleLog("Query completed successfully", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(`Error during project query: ${message}`, "error");
      await this.statusManager.setStatus("error", message);
      setTimeout(() => this.statusManager.setStatus("ready"), 2000);
    }
  }

  /**
   * Handles conversation-related commands execution
   */
  public async handleConversationCommand(
    options: CommandOptions
  ): Promise<void> {
    try {
      this.outputElement.innerHTML = "";
      this.handleLog("Retrieving conversation...");

      await ConversationRetrieval.displayCurrentConversation(
        options,
        this.outputElement
      );

      await this.statusManager.setStatus(
        "ready",
        "Conversation retrieved successfully"
      );
      this.handleLog("Conversation retrieved successfully", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(`Error retrieving conversation: ${message}`, "error");
      await this.statusManager.setStatus("error", message);
      setTimeout(() => this.statusManager.setStatus("ready"), 2000);
    }
  }

  /**
   * Handles alias command execution
   */
  public async handleAliasCommand(script: ScriptStatement): Promise<void> {
    if (!script.aliasCommand) {
      throw new Error("No alias command specified");
    }

    try {
      switch (script.aliasCommand.type) {
        case "alias":
          if (!script.aliasCommand.name || !script.aliasCommand.text) {
            throw new Error("Invalid alias command: missing name or text");
          }
          await AliasService.setAlias(
            script.aliasCommand.name,
            script.aliasCommand.text
          );
          this.handleLog(
            `Alias @${script.aliasCommand.name} created`,
            "success"
          );
          break;

        case "delete_alias":
          if (!script.aliasCommand.name) {
            throw new Error("Invalid delete alias command: missing name");
          }
          const deleted = await AliasService.deleteAlias(
            script.aliasCommand.name
          );
          if (deleted) {
            this.handleLog(
              `Alias @${script.aliasCommand.name} deleted`,
              "success"
            );
          } else {
            this.handleLog(
              `Alias @${script.aliasCommand.name} not found`,
              "error"
            );
          }
          break;

        case "list_alias":
          const aliases = await AliasService.getAliasList();
          if (aliases.length === 0) {
            this.handleLog("No aliases defined", "info");
          } else {
            this.outputElement.innerHTML = "";
            aliases.forEach((alias) => {
              const div = document.createElement("div");
              div.textContent = alias;
              this.outputElement.appendChild(div);
            });
          }
          break;

        default:
          throw new Error("Unknown alias command type");
      }

      await this.statusManager.setStatus("ready", "Complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.handleLog(`Alias command failed: ${message}`, "error");
      await this.statusManager.setStatus("error", message);
      setTimeout(() => this.statusManager.setStatus("ready"), 2000);
    }
  }
}
