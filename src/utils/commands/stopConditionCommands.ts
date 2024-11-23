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

    return new ScriptStatement({
      isCommand: true,
      command: parsedCommandLine.command,
      options: { stopConditions: [{ target, type: this.type }] },
    });
  }
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
