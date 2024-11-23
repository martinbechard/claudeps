/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/knowledgeCommand.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo } from "./BaseCommandInfo";

export class KnowledgeCommand extends BaseCommandInfo {
  constructor() {
    super("knowledge", "k");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "knowledge",
      prompt: parsedCommandLine.prompt.trim(),
    });
  }
}
