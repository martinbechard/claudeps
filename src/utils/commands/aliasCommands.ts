/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/aliasCommands.ts
 */

import { AliasService } from "../../services/AliasService";
import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo, ExecuteParams } from "./BaseCommandInfo";

/**
 * Validates alias command argument format
 */
function isValidAliasName(name: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

/**
 * Base class for alias-related commands
 */
abstract class AliasCommandBase extends BaseCommandInfo {
  constructor(full: string, abbreviation: string) {
    super(full, abbreviation);
  }

  public override async execute(params: ExecuteParams): Promise<boolean> {
    try {
      const command = params.statement.aliasCommand;
      if (!command) return false;

      switch (command.type) {
        case "alias":
          if (!command.name || !command.text) {
            throw new Error("Invalid alias command: missing name or text");
          }
          await AliasService.setAlias(command.name, command.text);
          params.handleLog(`Alias @${command.name} created`, "success");
          break;

        case "delete_alias":
          if (!command.name) {
            throw new Error("Invalid delete alias command: missing name");
          }
          const deleted = await AliasService.deleteAlias(command.name);
          if (deleted) {
            params.handleLog(`Alias @${command.name} deleted`, "success");
          } else {
            params.handleLog(`Alias @${command.name} not found`, "error");
            return false;
          }
          break;

        case "list_alias":
          const aliases = AliasService.getAliasList(); // Removed await since getAliasList is synchronous
          if (aliases.length === 0) {
            params.outputElement.textContent = "No aliases defined";
            params.handleLog("No aliases defined", "info");
          } else {
            aliases.forEach((alias) => {
              const div = document.createElement("div");
              div.textContent = alias;
              params.outputElement.appendChild(div);
            });
            params.handleLog("Aliases listed successfully", "success");
          }
          break;

        default:
          return false;
      }

      await params.setStatus("ready", "Complete");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      params.handleLog(`Alias command failed: ${message}`, "error");
      await params.setStatus("error", message);
      return false;
    }
  }
}

export class SetAliasCommand extends AliasCommandBase {
  constructor() {
    super("alias", "@+");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { prompt } = parsedCommandLine;

    // Expect format: /alias @name text
    const aliasArgs = prompt.trim().split(/\s+/);
    if (aliasArgs.length < 2 || !aliasArgs[0].startsWith("@")) {
      throw new Error("Invalid alias syntax. Use: /alias @name text");
    }

    const aliasName = aliasArgs[0].substring(1);
    const aliasText = aliasArgs.slice(1).join(" ");

    if (!isValidAliasName(aliasName)) {
      throw new Error(
        "Invalid alias name. Only alphanumeric characters and underscores are allowed."
      );
    }

    // Only include required fields
    const props = {
      isCommand: true,
      command: "alias",
      aliasCommand: {
        type: "alias",
        name: aliasName,
        text: aliasText,
      },
    };

    return new ScriptStatement(props as any);
  }
}

export class DeleteAliasCommand extends AliasCommandBase {
  constructor() {
    super("delete_alias", "@-");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { prompt } = parsedCommandLine;

    // Expect format: /delete_alias @name
    const deleteArgs = prompt.trim().split(/\s+/);
    if (deleteArgs.length !== 1 || !deleteArgs[0].startsWith("@")) {
      throw new Error("Invalid delete alias syntax. Use: /delete_alias @name");
    }

    const deleteName = deleteArgs[0].substring(1);
    if (!isValidAliasName(deleteName)) {
      throw new Error(
        "Invalid alias name. Only alphanumeric characters and underscores are allowed."
      );
    }

    // Only include required fields
    const props = {
      isCommand: true,
      command: "delete_alias",
      aliasCommand: {
        type: "delete_alias",
        name: deleteName,
      },
    };

    return new ScriptStatement(props as any);
  }
}

export class ListAliasCommand extends AliasCommandBase {
  constructor() {
    super("list_alias", "@?");
  }

  public parse(parsedCommandLine: ParsedCommandLine): ScriptStatement {
    const { prompt } = parsedCommandLine;

    // Expect format: /list_alias (no arguments)
    if (prompt.trim().length > 0) {
      throw new Error(
        "List alias command takes no arguments. Use: /list_alias"
      );
    }

    // Only include required fields
    const props = {
      isCommand: true,
      command: "list_alias",
      aliasCommand: {
        type: "list_alias",
      },
    };

    return new ScriptStatement(props as any);
  }
}
