/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/repeatCommand.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { requestCompletion } from "../requestCompletion";
import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";

const DEFAULT_MAX_TRIES = 10;

export class RepeatCommand extends BaseCommandInfo {
  constructor() {
    super("repeat", "rp", {
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

  private checkStopConditions(
    response: string,
    stopConditions: Array<any>
  ): boolean {
    for (const condition of stopConditions) {
      const containsTarget = response.includes(condition.target);
      if (
        (condition.type === "if" && containsTarget) ||
        (condition.type === "if_not" && !containsTarget)
      ) {
        return true;
      }
    }
    return false;
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    const maxTries = params.statement.options?.maxTries || DEFAULT_MAX_TRIES;
    const stopConditions = params.statement.options?.stopConditions || [];
    const prompt = params.statement.prompt;

    if (!prompt) {
      throw new Error("No prompt provided for repeat command");
    }

    let currentTry = 1;
    while (currentTry <= maxTries) {
      // Update output for each attempt
      params.outputElement.innerHTML = "";
      params.outputElement.textContent = `Attempt ${currentTry}/${maxTries}...\n`;

      try {
        // Request completion from LLM
        const response = await requestCompletion({
          prompt,
          stream: true,
        });

        // Check if response meets stop conditions
        if (this.checkStopConditions(response.completion, stopConditions)) {
          return true;
        }

        // If this was the last try and conditions weren't met
        if (currentTry === maxTries) {
          params.outputElement.textContent +=
            "\nMax attempts reached without meeting stop condition";
          return true;
        }

        currentTry++;
      } catch (error) {
        console.error(`Attempt ${currentTry} failed:`, error);
        // Continue with next attempt despite error
        currentTry++;
      }
    }
    console.log("failed to match");
    return true;
  }
}
