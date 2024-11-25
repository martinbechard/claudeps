/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/commands/simpleCommands.ts
 */

import { getOrganizationId, getProjectUuid } from "../getClaudeIds";

export interface SimpleCommand {
  label: string;
  command: string;
  className?: string;
  noAutoRun?: boolean;
  isVisible?: () => Promise<boolean>;
}

/**
 * Checks if current URL contains 'project'
 */
const isProjectUrl = (): boolean => {
  return window.location.pathname.includes("project/");
};

/**
 * Checks if current URL contains 'chat'
 */
const isChatUrl = (): boolean => {
  return window.location.pathname.includes("chat");
};

/**
 * Checks if project UUID is available in current context
 */
const hasProjectContext = async (): Promise<boolean> => {
  try {
    const orgId = getOrganizationId();
    await getProjectUuid(orgId);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if command should be visible in project context
 */
const validateProjectContext = async (): Promise<boolean> => {
  return isProjectUrl() || (isChatUrl() && (await hasProjectContext()));
};

// Export the simple commands as an array with the expected order
export const simpleCommands: SimpleCommand[] = [
  {
    label: "Search",
    command: "/search_project ",
    className: "search-button",
    noAutoRun: true,
    isVisible: validateProjectContext,
  },
  {
    label: "Project Chats",
    command: "/project",
    className: "project-button",
    isVisible: validateProjectContext,
  },
  {
    label: "Current Chat",
    command: "/chat",
    isVisible: async () => isChatUrl(),
  },
  {
    label: "Artifacts",
    command: "/artifacts",
    isVisible: async () => isChatUrl(),
  },
  {
    label: "Knowledge",
    command: "/knowledge",
    isVisible: validateProjectContext,
  },
];
