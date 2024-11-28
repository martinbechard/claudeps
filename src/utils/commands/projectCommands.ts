/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/projectCommands.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";
import { ProjectRetrieval } from "../../services/ProjectRetrieval";
import { ProjectSearchService } from "../../services/ProjectSearchService";
import { PromptAll } from "../../services/PromptAll";

export class ProjectCommand extends BaseCommandInfo {
  constructor() {
    super("project", "p");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "project",
      options: {},
      prompt: "",
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      params.handleLog("Fetching project conversations...");
      await params.setStatus("working", "Fetching project conversations");

      await ProjectRetrieval.displayCurrentProject(params.outputElement);

      await params.setStatus("ready", "Complete");
      params.handleLog(
        "Project conversations retrieved successfully",
        "success"
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(`Display failed: ${message}`, "error");
      await params.setStatus("error", message);
      return true; // Return true since we handled the error
    }
  }
}

export class SearchProjectCommand extends BaseCommandInfo {
  constructor() {
    super("search_project", "sp");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const searchText = parsedCommandLine.prompt.trim();
    if (!searchText) {
      throw new Error("Search project command requires search text");
    }

    return new ScriptStatement({
      isCommand: true,
      command: "search_project",
      options: {},
      prompt: searchText,
      searchText: searchText,
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      if (!params.statement.searchText?.trim()) {
        throw new Error("No search text provided for search command");
      }

      params.outputElement.innerHTML = "";
      params.handleLog(
        `Searching projects for: ${params.statement.searchText}`
      );
      await params.setStatus("working", "Searching projects");

      await ProjectSearchService.searchAndDisplayResults(
        params.statement.searchText,
        params.outputElement
      );

      await params.setStatus("ready", "Search complete");
      params.handleLog("Search completed successfully", "success");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(`Search failed: ${message}`, "error");
      await params.setStatus("error", message);
      return true; // Return true since we handled the error
    }
  }
}

export class QueryProjectCommand extends BaseCommandInfo {
  constructor() {
    super("query_project", "qp");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const prompt = parsedCommandLine.prompt.trim();
    if (!prompt) {
      throw new Error("Query project command requires a prompt");
    }

    return new ScriptStatement({
      isCommand: true,
      command: "query_project",
      options: {},
      prompt: prompt,
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      if (!params.statement.prompt?.trim()) {
        throw new Error("No prompt provided for query command");
      }

      params.outputElement.innerHTML = "";
      params.handleLog("Querying all conversations...");
      await params.setStatus("working", "Querying conversations");

      await PromptAll.queryAndDisplayResults(
        params.statement.prompt,
        params.outputElement,
        async (status) => {
          await params.setStatus("working", status);
          params.handleLog(status);
        }
      );

      await params.setStatus("ready", "Query complete");
      params.handleLog("Query completed successfully", "success");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(`Query failed: ${message}`, "error");
      await params.setStatus("error", message);
      return true; // Return true since we handled the error
    }
  }
}
