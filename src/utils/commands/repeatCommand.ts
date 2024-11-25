/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/repeatCommand.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo } from "./BaseCommandInfo";

const DEFAULT_MAX_TRIES = 10;

export class RepeatCommand extends BaseCommandInfo {
  constructor() {
    super("repeat", "r", {
      max: "with_arg", // Requires number argument
      stop_if: "with_prompt", // Requires condition text
      stop_if_not: "with_prompt", // Requires condition text
    });
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { options, prompt } = parsedCommandLine;

    // Extract options
    const maxTries = options.max
      ? parseInt(options.max, 10)
      : DEFAULT_MAX_TRIES;
    if (isNaN(maxTries)) {
      throw new Error("Invalid /max value - must be a number");
    }

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("No prompt provided after /repeat command");
    }

    // Handle stop conditions
    const stopIfCondition = options["stop_if"];
    const stopIfNotCondition = options["stop_if_not"];

    if (stopIfCondition && stopIfNotCondition) {
      throw new Error(
        "Cannot use both /stop_if and /stop_if_not options together"
      );
    }

    // Initialize command options
    const commandOptions = {
      maxTries,
    };

    const statement = new ScriptStatement({
      isCommand: true,
      command: "repeat",
      options: commandOptions,
      prompt: prompt.trim(),
    });

    // Add stop conditions to options if present
    if (stopIfCondition || stopIfNotCondition) {
      statement.addStopCondition({
        target: stopIfCondition || stopIfNotCondition,
        type: stopIfCondition ? "if" : "if_not",
      });
    }

    return statement;
  }
}
