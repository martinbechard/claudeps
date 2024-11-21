import { ParsedCommandLine, ScriptStatement } from "../../types";

/**
 * Parses a basic project command
 */
export function parseDocsCommand(
  parsedCommandLine: ParsedCommandLine
): ScriptStatement {
  return new ScriptStatement({
    isCommand: true,
    command: "docs",
    prompt: parsedCommandLine.prompt.trim(),
  });
}
