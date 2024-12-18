/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/BaseCommandInfo.ts
 */

import { ScriptRunner } from "@/services/ScriptRunner";
import {
  CommandOptions,
  ParsedCommandLine,
  ScriptStatement,
} from "../../types";
import type { StatusManager } from "../../ui/components/StatusManager";

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
 * Type for log function
 */
export type LogFunction = (
  message: string,
  type?: "info" | "error" | "success"
) => void;

/**
 * Parameters for execute method
 */
export type ExecuteParams = {
  statement: ScriptStatement;
  outputElement: HTMLElement;
  handleLog: LogFunction;
  setStatus: StatusManager["setStatus"];
  scriptRunner?: ScriptRunner;
};

/**
 * Type for validation callback
 */
export type ValidationCallback = () => Promise<boolean>;

/**
 * Base command info class
 */
export class BaseCommandInfo {
  private validationCallback?: ValidationCallback;

  constructor(
    public readonly full: string,
    public readonly abbreviation: string,
    public readonly options?: CommandOptionDefinitions
  ) {}

  /**
   * Set a validation callback that determines if the command should be available
   * @param callback The validation function that returns a promise resolving to boolean
   */
  public setValidationCallback(callback: ValidationCallback) {
    this.validationCallback = callback;
  }

  /**
   * Check if the command is valid/available based on the validation callback
   * @returns Promise resolving to true if valid, false otherwise
   */
  public async isValid(): Promise<boolean> {
    if (this.validationCallback) {
      return await this.validationCallback();
    }
    return true;
  }

  /**
   * Helper method to get options from a statement, initializing if needed
   */
  protected getOptions(statement: ScriptStatement): CommandOptions {
    const mutableStatement = statement as { options?: CommandOptions };
    if (!mutableStatement.options) {
      mutableStatement.options = {};
    }
    return mutableStatement.options;
  }

  /**
   * Helper method to create a script statement with minimal fields
   */
  protected createStatement(
    command: string,
    additionalProps: Partial<ScriptStatement> = {}
  ): ScriptStatement {
    const props: any = {
      isCommand: true,
      command,
      ...additionalProps,
    };
    return new ScriptStatement(props);
  }

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
   * @param params Execution parameters containing the script statement and output element
   * @returns Promise resolving to true if execution successful, false otherwise
   */
  public async execute(params: ExecuteParams): Promise<boolean> {
    return false;
  }
}
