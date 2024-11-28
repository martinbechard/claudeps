/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/stopConditionCommands.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo } from "./BaseCommandInfo";

/**
 * Base class for stop condition commands
 */
abstract class StopConditionCommandBase extends BaseCommandInfo {
  protected abstract type: "if" | "if_not";

  constructor(full: string, abbreviation: string) {
    super(full, abbreviation);
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const target = parsedCommandLine.prompt;

    // Create ScriptStatement without prompt field to avoid empty string initialization
    const props = {
      isCommand: true,
      command: parsedCommandLine.command,
      options: { stopConditions: [{ target, type: this.type }] },
    };

    // Use type assertion to bypass TypeScript's strict property checks
    return new ScriptStatement(props as any);
  }

  /**
   * Stop condition commands do not need execute() implementations because they are
   * processed during script parsing and execution is handled by the RepeatCommand.
   *
   * The processing occurs in:
   * 1. ScriptParser.ts - parseStatements() merges stop conditions into the preceding statement
   * 2. RepeatCommand.ts - execute() checks these conditions during each iteration
   */
}

export class StopIfCommand extends StopConditionCommandBase {
  protected type: "if" | "if_not" = "if";

  constructor() {
    super("stop_if", "");
  }
}

export class StopIfNotCommand extends StopConditionCommandBase {
  protected type: "if" | "if_not" = "if_not";

  constructor() {
    super("stop_if_not", "");
  }
}
