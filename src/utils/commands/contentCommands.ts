/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/contentCommands.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";
import { ConversationRetrieval } from "../../services/ConversationRetrieval";

export class ChatCommand extends BaseCommandInfo {
  constructor() {
    super("chat", "c", {
      artifacts: "no_arg",
    });
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "chat",
      prompt: "",
      options: {
        includeConversation: true,
        includeArtifacts: parsedCommandLine.options["artifacts"] !== undefined,
      },
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      await ConversationRetrieval.displayCurrentConversation(
        params.statement.options || {},
        params.outputElement
      );
      return true;
    } catch (error) {
      console.error("Chat command execution failed:", error);
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
      prompt: "",
      options: {
        includeArtifacts: true,
      },
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      await ConversationRetrieval.displayCurrentConversation(
        params.statement.options || {},
        params.outputElement
      );
      return true;
    } catch (error) {
      console.error("Artifacts command execution failed:", error);
      return false;
    }
  }
}
