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
      params.handleLog("Retrieving conversation...");
      await params.setStatus("working", "Retrieving conversation");

      await ConversationRetrieval.displayCurrentConversation(
        params.statement.options || {},
        params.outputElement
      );

      await params.setStatus("ready", "Conversation retrieved successfully");
      params.handleLog("Conversation retrieved successfully", "success");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(`Chat command execution failed: ${message}`, "error");
      await params.setStatus("error", message);
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
      params.handleLog("Retrieving artifacts...");
      await params.setStatus("working", "Retrieving artifacts");

      await ConversationRetrieval.displayCurrentConversation(
        params.statement.options || {},
        params.outputElement
      );

      await params.setStatus("ready", "Artifacts retrieved successfully");
      params.handleLog("Artifacts retrieved successfully", "success");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(
        `Artifacts command execution failed: ${message}`,
        "error"
      );
      await params.setStatus("error", message);
      return false;
    }
  }
}
