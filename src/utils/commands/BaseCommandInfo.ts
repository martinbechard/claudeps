/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/BaseCommandInfo.ts
 */

import { ParsedCommandLine, ScriptStatement } from "../../types";

/**
 * Type of argument required for an option
 */
export type OptionType = "no_arg" | "with_arg" | "with_prompt";

/**
 * Option format:
 * key: option name
 * value: OptionType indicating argument requirement
 */
export type CommandOptionDefinitions = { [key: string]: OptionType };

/**
 * Parameters for parse method
 */
export type ParseParams = ParsedCommandLine;

/**
 * Parameters for execute method
 */
export type ExecuteParams = {
  statement: ScriptStatement;
};

/**
 * Base command info class
 */
export class BaseCommandInfo {
  constructor(
    public readonly full: string,
    public readonly abbreviation: string,
    public readonly options?: CommandOptionDefinitions
  ) {}

  /**
   * Parse the command line into a script statement
   * Default implementation returns null
   */
  public parse(params: ParseParams): ScriptStatement | null {
    return null;
  }

  /**
   * Execute the command
   * Default implementation returns false
   * @param params Execution parameters containing the script statement
   * @returns Promise resolving to true if execution successful, false otherwise
   */
  public async execute(params: ExecuteParams): Promise<boolean> {
    return false;
  }
}
