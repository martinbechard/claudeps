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
    });
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      params.outputElement.innerHTML = "";
      const docs = await DocumentRetrieval.fetchDocuments();
      await DocumentRetrieval.displayDocuments(docs, params.outputElement);
      return true;
    } catch (error) {
      console.error("Knowledge command execution failed:", error);
      return false;
    }
  }
}
