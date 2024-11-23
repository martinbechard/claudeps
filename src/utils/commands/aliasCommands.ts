/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/aliasCommands.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";
import { BaseCommandInfo } from "./BaseCommandInfo";

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

    return new ScriptStatement({
      isCommand: true,
      command: "alias",
      aliasCommand: {
        type: "alias",
        name: aliasName,
        text: aliasText,
      },
    });
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

    return new ScriptStatement({
      isCommand: true,
      command: "delete_alias",
      aliasCommand: {
        type: "delete_alias",
        name: deleteName,
      },
    });
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

    return new ScriptStatement({
      isCommand: true,
      command: "list_alias",
      aliasCommand: {
        type: "list_alias",
      },
    });
  }
}
