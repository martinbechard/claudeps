/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/CommandMap.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Defines commands and their options
 */

import { BaseCommandInfo, OptionType } from "./BaseCommandInfo";
import { KnowledgeCommand } from "./knowledgeCommand";
import { RepeatCommand } from "./repeatCommand";
import {
  SetAliasCommand,
  DeleteAliasCommand,
  ListAliasCommand,
} from "./aliasCommands";
import { ConversationCommand, ArtifactsCommand } from "./contentCommands";
import {
  ProjectCommand,
  SearchProjectCommand,
  QueryProjectCommand,
} from "./projectCommands";
import { StopIfCommand, StopIfNotCommand } from "./stopConditionCommands";

/**
 * Maps command names to their full names, abbreviations and allowed options
 */
export const COMMAND_MAP: { [key: string]: BaseCommandInfo } = {
  // Basic commands
  repeat: new RepeatCommand(),
  prompt: new BaseCommandInfo("prompt", "", {
    stop_if: "with_prompt", // Requires condition text
    stop_if_not: "with_prompt", // Requires condition text
  }),

  // Content commands
  conversation: new ConversationCommand(),
  artifacts: new ArtifactsCommand(),

  // Stop condition commands
  stop_if: new StopIfCommand(),
  stop_if_not: new StopIfNotCommand(),

  // Project commands
  project: new ProjectCommand(),
  search_project: new SearchProjectCommand(),
  query_project: new QueryProjectCommand(),
  knowledge: new KnowledgeCommand(),

  // Alias commands
  alias: new SetAliasCommand(),
  list_alias: new ListAliasCommand(),
  delete_alias: new DeleteAliasCommand(),
} as const;

export type CommandName = keyof typeof COMMAND_MAP;

/**
 * Gets the full command name for an abbreviation
 */
export function getFullCommand(abbr: string): string | undefined {
  // Handle the special case where alias command starts with @
  if (abbr.startsWith("@")) {
    switch (abbr) {
      case "@+":
        return "alias";
      case "@-":
        return "delete_alias";
      case "@?":
        return "list_alias";
      default:
        return undefined;
    }
  }

  const entry = Object.entries(COMMAND_MAP).find(
    ([_, info]) => info.abbreviation === abbr.toLowerCase()
  );
  return entry?.[0];
}

/**
 * Gets all possible command matches for a partial string
 */
export function getCommandMatches(partial: string): CommandName[] {
  // Handle special alias abbreviations
  if (partial.startsWith("@")) {
    switch (partial) {
      case "@+":
        return ["alias"];
      case "@-":
        return ["delete_alias"];
      case "@?":
        return ["list_alias"];
    }
  }

  const search = partial.toLowerCase();
  return Object.entries(COMMAND_MAP)
    .filter(([command, info]) => {
      return info.full === search || info.abbreviation.toLowerCase() === search;
    })
    .map(([command]) => command as CommandName);
}

/**
 * Gets the option requirements for a command
 */
export function getCommandOptionDefinitions(
  command: string
): { [key: string]: OptionType } | undefined {
  const commands = getCommandMatches(command);

  return COMMAND_MAP[commands[0] as CommandName]?.options;
}
