/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/knowledgeCommand.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";
import { DocumentRetrieval } from "../../services/DocumentRetrieval";

export class KnowledgeCommand extends BaseCommandInfo {
  constructor() {
    super("knowledge", "k");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    return new ScriptStatement({
      isCommand: true,
      command: "knowledge",
      prompt: parsedCommandLine.prompt.trim(),
      options: {},
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      params.handleLog("Fetching documents...");

      const docs = await DocumentRetrieval.fetchDocuments();
      await DocumentRetrieval.displayDocuments(docs, params.outputElement);

      params.handleLog(
        "Documents fetched and displayed successfully",
        "success"
      );
      await params.setStatus("ready", "Complete");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(
        `Knowledge command execution failed: ${message}`,
        "error"
      );
      await params.setStatus("error", message);
      return false;
    }
  }
}
