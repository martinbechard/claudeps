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
      prompt: parsedCommandLine.prompt.trim(),
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      await ProjectRetrieval.displayCurrentProject(params.outputElement);
      return true;
    } catch (error) {
      console.error("Project command execution failed:", error);
      return false;
    }
  }
}

export class SearchProjectCommand extends BaseCommandInfo {
  constructor() {
    super("search_project", "sp");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "search_project",
      searchText: parsedCommandLine.prompt.trim(),
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      await ProjectSearchService.searchAndDisplayResults(
        params.statement.searchText,
        params.outputElement
      );
      return true;
    } catch (error) {
      console.error("Search project command execution failed:", error);
      return false;
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
      prompt: prompt,
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      if (
        !params.statement.prompt ||
        params.statement.prompt.trim().length === 0
      ) {
        throw new Error("No prompt provided for query_project command");
      }

      params.outputElement.innerHTML = "";
      await PromptAll.queryAndDisplayResults(
        params.statement.prompt,
        params.outputElement,
        async (status) => {
          // Status updates would be handled by the UI
          console.log(status);
        }
      );
      return true;
    } catch (error) {
      console.error("Query project command execution failed:", error);
      return false;
    }
  }
}
