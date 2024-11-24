/**
 * Configuration for simple mode command buttons
 */
export interface SimpleCommand {
  label: string;
  command: string;
  className?: string;
  noAutoRun?: boolean;
}

export const simpleCommands: SimpleCommand[] = [
  {
    label: "Search",
    command: "/search_project ",
    className: "search-button",
    noAutoRun: true,
  },
  {
    label: "Project",
    command: "/project",
    className: "project-button",
  },
  {
    label: "Conversation",
    command: "/conversation",
  },
  {
    label: "Artifacts",
    command: "/artifacts",
  },
  {
    label: "Knowledge",
    command: "/knowledge",
  },
];
