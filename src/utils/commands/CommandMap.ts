/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/CommandMap.ts
 */

import { BaseCommandInfo, OptionType } from "./BaseCommandInfo";
import { KnowledgeCommand } from "./knowledgeCommand";
import { RepeatCommand } from "./repeatCommand";
import {
  SetAliasCommand,
  DeleteAliasCommand,
  ListAliasCommand,
} from "./aliasCommands";
import { ChatCommand, ArtifactsCommand } from "./contentCommands";
import {
  ProjectCommand,
  SearchProjectCommand,
  QueryProjectCommand,
} from "./projectCommands";
import { StopIfCommand, StopIfNotCommand } from "./stopConditionCommands";
import { SettingsCommand } from "./settingsCommand";

/**
 * Maps command names to their full names, abbreviations and allowed options
 */
export const COMMAND_MAP: { [key: string]: BaseCommandInfo } = {
  // Basic commands
  repeat: new RepeatCommand(),
  settings: new SettingsCommand(),

  // Content commands
  chat: new ChatCommand(),
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

  // Handle command abbreviations
  switch (abbr.toLowerCase()) {
    case "c":
      return "chat";
    case "a":
      return "artifacts";
    case "p":
      return "project";
    case "sp":
      return "search_project";
    case "qp":
      return "query_project";
    case "s":
      return "settings";
    default:
      const entry = Object.entries(COMMAND_MAP).find(
        ([_, info]) => info.abbreviation === abbr.toLowerCase()
      );
      return entry?.[0];
  }
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

  // Remove leading slash if present
  const cleanPartial = partial.startsWith("/") ? partial.substring(1) : partial;

  // Handle command abbreviations
  const fullCommand = getFullCommand(cleanPartial);
  if (fullCommand) {
    return [fullCommand as CommandName];
  }

  const search = cleanPartial.toLowerCase();
  return Object.entries(COMMAND_MAP)
    .filter(([command, info]) => {
      return info.full === search || info.abbreviation === search;
    })
    .map(([command]) => command as CommandName);
}

/**
 * Gets the option requirements for a command
 */
export function getCommandOptionDefinitions(
  command: string
): { [key: string]: OptionType } | undefined {
  // Remove leading slash if present
  const cleanCommand = command.startsWith("/") ? command.substring(1) : command;

  const commands = getCommandMatches(cleanCommand);
  if (commands.length === 0) return undefined;

  return COMMAND_MAP[commands[0] as CommandName]?.options;
}
