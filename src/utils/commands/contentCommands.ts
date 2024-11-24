/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/contentCommands.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";
import { ConversationRetrieval } from "../../services/ConversationRetrieval";

export class ConversationCommand extends BaseCommandInfo {
  constructor() {
    super("conversation", "c", {
      artifacts: "no_arg",
    });
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "conversation",
      options: {
        includeConversation: true,
        includeArtifacts: parsedCommandLine.options["artifacts"] !== undefined,
      },
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      const outputElement = document.querySelector(
        ".output-container"
      ) as HTMLElement;
      if (!outputElement) {
        throw new Error("Output element not found");
      }

      outputElement.innerHTML = "";
      await ConversationRetrieval.displayCurrentConversation(
        params.statement.options || {},
        outputElement
      );
      return true;
    } catch (error) {
      console.error("Conversation command execution failed:", error);
      return false;
    }
  }
}

export class ArtifactsCommand extends BaseCommandInfo {
  constructor() {
    super("artifacts", "a");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "artifacts",
      options: {
        includeArtifacts: true,
      },
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      const outputElement = document.querySelector(
        ".output-container"
      ) as HTMLElement;
      if (!outputElement) {
        throw new Error("Output element not found");
      }

      outputElement.innerHTML = "";
      await ConversationRetrieval.displayCurrentConversation(
        params.statement.options || {},
        outputElement
      );
      return true;
    } catch (error) {
      console.error("Artifacts command execution failed:", error);
      return false;
    }
  }
}
