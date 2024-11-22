import { ParsedCommandLine, ScriptStatement } from "../../types";

/**
 * Parses a basic project command
 */
export function parseKnowledgeCommand(
  parsedCommandLine: ParsedCommandLine
): ScriptStatement {
  return new ScriptStatement({
    isCommand: true,
    command: "knowledge",
    prompt: parsedCommandLine.prompt.trim(),
  });
}
