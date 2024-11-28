/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/ScriptParser.ts
 */

import {
  Script,
  ScriptStatement,
  ParsedCommandLine as ParsedCommandText,
  StopCondition,
} from "../types";
import {
  getCommandMatches,
  getCommandOptionDefinitions,
  COMMAND_MAP,
  getFullCommand,
} from "./commands/CommandMap";
import { OptionType } from "./commands/BaseCommandInfo";
import { splitTextWithQuotes } from "./splitText";

export class ScriptParser {
  private static readonly COMMAND_PREFIX = "/";

  /**
   * Parses text into a Script object
   */
  public static parse(text: string): Script {
    const statements = this.parseStatements(text);
    return { statements };
  }

  /**
   * Splits text into statements while preserving quoted strings
   */
  private static parseStatements(text: string): ScriptStatement[] {
    const statements: ScriptStatement[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar: string | null = null;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Handle quoted text
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = null;
        current += char;
      }
      // Handle statement separators
      else if (char === ";" && !inQuotes) {
        if (current.trim()) {
          statements.push(this.parseStatement(current.trim()));
        }
        current = "";
      }
      // Collect characters
      else {
        current += char;
      }
    }

    // Handle final statement
    if (current.trim()) {
      statements.push(this.parseStatement(current.trim()));
    }

    const finalStatements: ScriptStatement[] = [];
    statements.forEach((statement) => {
      if (
        statement.command === "stop_if" ||
        statement.command === "stop_if_not"
      ) {
        const last = finalStatements[0];
        if (!last) {
          throw new Error("Stop statement without preceding prompt.");
        }

        last.addStopCondition({
          target: statement.prompt || "",
          type: statement.command === "stop_if" ? "if" : "if_not",
        });
      } else {
        finalStatements.push(statement);
      }
    });

    return finalStatements;
  }

  /**
   * Parses a single statement with stop conditions
   */
  private static parseStatement(text: string): ScriptStatement {
    const statementText = text.trim();
    if (statementText.startsWith(this.COMMAND_PREFIX)) {
      return this.parseCommandStatement(statementText);
    }
    return this.parsePromptStatement(statementText);
  }

  /**
   * Parses a prompt statement
   */
  private static parsePromptStatement(text: string): ScriptStatement {
    return new ScriptStatement({
      prompt: text,
      isCommand: false,
      command: null,
      options: {},
    });
  }

  /**
   * Parses a command statement
   */
  private static parseCommandStatement(text: string): ScriptStatement {
    const parsed = this.parseCommandText(text);

    // Try BaseCommandInfo's parse method
    const commandInfo = COMMAND_MAP[parsed.command];
    if (commandInfo) {
      let result = commandInfo.parse(parsed);
      if (result !== null) {
        return result;
      }
    }

    throw new Error(`Unhandled command: ${parsed.command}`);
  }

  /**
   * Parses a multi-line command text
   */
  private static parseCommandText(text: string): ParsedCommandText {
    if (!text.startsWith(this.COMMAND_PREFIX)) {
      throw new Error("Command must start with /");
    }

    // Extract command and remaining text
    const parts = splitTextWithQuotes(text);
    const rawCommand = parts[0];
    const commandName = rawCommand.substring(1);

    // Resolve command
    const matches = getCommandMatches(commandName);
    if (matches.length === 0) {
      throw new Error(`Unknown command: ${rawCommand}`);
    }
    if (matches.length > 1) {
      throw new Error(
        `Ambiguous command '${rawCommand}'. Could be: ${matches.join(", ")}`
      );
    }
    const resolvedCommand = matches[0].toString();

    // Parse options and content
    const options: Record<string, string> = {};
    let promptParts: string[] = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (part.startsWith(this.COMMAND_PREFIX)) {
        const definitions = getCommandOptionDefinitions(resolvedCommand);
        if (!definitions) {
          throw new Error(
            `invalid option: "${part}", command "${resolvedCommand}" has no options`
          );
        }

        // Parse option, handling abbreviations
        const optionKey = part.substring(1);
        let option: OptionType | undefined;
        let resolvedKey = optionKey;

        // Try to resolve abbreviated option
        if (!definitions[optionKey]) {
          const fullOptionName = Object.keys(definitions).find(
            (key) => key.startsWith(optionKey) || key[0] === optionKey
          );
          if (fullOptionName) {
            option = definitions[fullOptionName];
            resolvedKey = fullOptionName;
          }
        } else {
          option = definitions[optionKey];
        }

        if (!option) {
          throw new Error(
            `invalid option: "${part}", command "${rawCommand}" has options: ${JSON.stringify(
              Object.keys(definitions)
            )}`
          );
        }

        if (option === "with_arg") {
          i++;
          if (i < parts.length) {
            options[resolvedKey] = parts[i];
          } else {
            throw new Error(
              `Missing value for option: "${part}", command "${rawCommand}"`
            );
          }
        } else if (option === "with_prompt") {
          i++;
          let arg = "";
          while (i < parts.length) {
            const nextPart = parts[i];
            if (nextPart.startsWith(this.COMMAND_PREFIX)) {
              i--;
              break;
            }
            arg = (arg ? " " + arg : "") + parts[i];
            i++;
          }

          if (!arg) {
            throw new Error(
              `Missing value for option: "${part}", command "${rawCommand}"`
            );
          }
          options[resolvedKey] = arg;
        } else {
          options[resolvedKey] = "true";
        }
      } else {
        promptParts.push(part);
      }
    }

    return {
      command: resolvedCommand,
      rawCommand,
      options,
      prompt: promptParts.join(" "),
    };
  }
}
