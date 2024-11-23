/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/projectCommands.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo } from "./BaseCommandInfo";

/**
 * Base class for project-related commands
 */
abstract class ProjectCommandBase extends BaseCommandInfo {
  constructor(full: string, abbreviation: string) {
    super(full, abbreviation);
  }
}

export class ProjectCommand extends ProjectCommandBase {
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
}

export class SearchProjectCommand extends ProjectCommandBase {
  constructor() {
    super("search_project", "sp");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { prompt, options } = parsedCommandLine;

    if (!prompt.trim()) {
      throw new Error("Search project command requires search text");
    }

    return new ScriptStatement({
      isCommand: true,
      command: "search_project",
      searchText: prompt.trim(),
      options: {
        numResults: options.numResults || "5", // Default to 5 results if not specified
      },
    });
  }
}

export class QueryProjectCommand extends ProjectCommandBase {
  constructor() {
    super("query_project", "qp");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { prompt } = parsedCommandLine;

    if (!prompt.trim()) {
      throw new Error("Query project command requires a prompt");
    }

    return new ScriptStatement({
      isCommand: true,
      command: "query_project",
      options: {},
      prompt: prompt.trim(),
    });
  }
}
