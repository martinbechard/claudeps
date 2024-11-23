/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/contentCommands.ts
 */

import {
  ParsedCommandLine,
  ScriptStatement,
  CommandOptions,
} from "../../types";
import { BaseCommandInfo } from "./BaseCommandInfo";

/**
 * Base class for content-related commands
 */
abstract class ContentCommandBase extends BaseCommandInfo {
  constructor(
    full: string,
    abbreviation: string,
    options?: { [key: string]: "no_arg" }
  ) {
    super(full, abbreviation, options);
  }

  protected processContentOptions(
    options: Record<string, string>
  ): CommandOptions {
    const commandOptions: CommandOptions = {};

    // Process options
    for (const [key, _] of Object.entries(options)) {
      switch (key.toLowerCase()) {
        case "artifacts":
        case "a":
          commandOptions.includeArtifacts = true;
          break;
        case "multiple":
        case "m":
          commandOptions.downloadMultiple = true;
          break;
        default:
          throw new Error(`Unknown option: /${key}`);
      }
    }

    return commandOptions;
  }
}

export class ConversationCommand extends ContentCommandBase {
  constructor() {
    super("conversation", "c", {
      artifacts: "no_arg", // Flag only
      a: "no_arg", // Flag only
      multiple: "no_arg", // Flag only
      m: "no_arg", // Flag only
    });
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { options } = parsedCommandLine;
    const commandOptions = this.processContentOptions(options);

    // Conversation specific defaults
    commandOptions.includeConversation = true;

    // Validate options
    if (commandOptions.downloadMultiple && !commandOptions.includeArtifacts) {
      throw new Error("/multiple can only be used with /artifacts option");
    }

    return new ScriptStatement({
      isCommand: true,
      command: "conversation",
      options: commandOptions,
      prompt: parsedCommandLine.prompt.trim(),
    });
  }
}

export class ArtifactsCommand extends ContentCommandBase {
  constructor() {
    super("artifacts", "a", {
      multiple: "no_arg", // Flag only
    });
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { options } = parsedCommandLine;
    const commandOptions = this.processContentOptions(options);

    // Artifacts command always includes artifacts
    commandOptions.includeArtifacts = true;
    commandOptions.includeConversation = false;

    return new ScriptStatement({
      isCommand: true,
      command: "artifacts",
      options: commandOptions,
      prompt: parsedCommandLine.prompt.trim(),
    });
  }
}
