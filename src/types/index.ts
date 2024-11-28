/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/types/index.ts
 */

import { CommandName } from "../utils/commands/CommandMap";

export interface SimpleCommand {
  label: string;
  command: string;
  className?: string;
  noAutoRun?: boolean;
  isVisible?: () => Promise<boolean>;
}

export interface SearchResultInfo {
  conversationId: string;
  messageId: string;
  matchReason: string;
  relevantSnippet: string;
}

export interface StopCondition {
  target: string;
  type: "if" | "if_not";
}

export interface ParsedCommandLine {
  command: CommandName;
  rawCommand: string;
  options: { [key: string]: string };
  prompt: string;
}

export interface ScriptStatementProps {
  prompt: string;
  isCommand: boolean;
  command?: CommandName | null;
  options: CommandOptions;
  searchText?: string;
  aliasCommand?: AliasCommand;
}

export class ScriptStatement {
  public readonly isCommand: boolean;
  public readonly command?: CommandName | null;
  public readonly options: CommandOptions;
  public readonly prompt: string;
  public readonly searchText?: string;
  public readonly aliasCommand?: AliasCommand;

  constructor(props: ScriptStatementProps) {
    this.isCommand = props.isCommand;
    this.command = props.command;
    this.options = props.options || {};
    this.prompt = props.prompt || "";
    this.searchText = props.searchText;
    this.aliasCommand = props.aliasCommand;
  }

  public addStopCondition(stopCondition: StopCondition) {
    let conditions = this.options.stopConditions || [];
    if (!Array.isArray(conditions)) {
      conditions = [];
    }
    this.options.stopConditions = conditions;
    conditions.push(stopCondition);
  }
}

export interface CommandOptions {
  includeArtifacts?: boolean;
  includeConversation?: boolean;
  downloadMultiple?: boolean;
  maxTries?: number;
  stopConditions?: StopCondition[];
  numResults?: string;
  path?: string;
  [key: string]: any;
}

export interface AliasCommand {
  type: "alias" | "delete_alias" | "list_alias";
  name?: string;
  text?: string;
}

export interface Script {
  statements: ScriptStatement[];
}

export type ContentCallback = (docInfo: DocumentInfo) => Promise<string>;

export interface DocumentInfo {
  fileName: string;
  filePath: string;
  content: string;
  isSelected?: boolean;
  metadata?: Record<string, any>;
  contentCallback?: ContentCallback;
  searchResult?: SearchResultInfo;
}

export type StatusState = "ready" | "working" | "error";

export interface StatusConfig {
  text: string;
  class: string;
}

export interface StatusElements {
  statusElement: HTMLElement;
  statusText: HTMLElement;
  statusDetails: HTMLElement;
  scriptInput: HTMLTextAreaElement;
  runButton: HTMLButtonElement;
}

export interface FloatingWindowElements {
  window: HTMLElement;
  status: HTMLElement;
  statusText: HTMLElement;
  statusDetails: HTMLElement;
  scriptText: HTMLTextAreaElement;
  runButton: HTMLButtonElement;
  output: HTMLElement;
  helpButton: HTMLButtonElement;
  starredButton: HTMLButtonElement;
  minimizeButton: HTMLButtonElement;
  collapseButton: HTMLElement;
  modeToggleButton: HTMLButtonElement;
  scriptModeContainer: HTMLElement;
  simpleModeContainer: HTMLElement;
}

export interface ConversationSettings {
  preview_feature_uses_artifacts: boolean;
  preview_feature_uses_latex: boolean;
  enabled_artifacts_attachments: boolean;
}

export interface Project {
  uuid: string;
  name: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  extracted_content?: string;
  created_at?: string;
}

export interface FileV2 extends Attachment {}

export interface ChatMessageContent {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  name?: string;
  input?: ChatMessageInput;
  content?: any[];
  is_error?: boolean;
}

export interface ChatMessageInput {
  command: "create" | "update";
  id: string;
  type?: "text" | "application/vnd.ant.code" | "text/markdown";
  title?: string;
  content?: string;
  language?: string;
  version_uuid?: string;
  old_str?: string;
  new_str?: string;
}

export interface ChatMessage {
  uuid: string;
  text: string;
  content: ChatMessageContent[];
  sender: "human" | "assistant";
  index: number;
  created_at: string;
  updated_at: string;
  truncated: boolean;
  stop_reason?: string;
  attachments: Attachment[];
  files: Attachment[];
  files_v2: FileV2[];
  sync_sources: any[];
  parent_message_uuid: string;
}

export interface ProjectConversation {
  uuid: string;
  name: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Conversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  settings: ConversationSettings;
  is_starred: boolean;
  project_uuid: string;
  project?: Project;
  current_leaf_message_uuid: string;
  chat_messages: ChatMessage[];
}

export interface ConversationArtifact {
  id: string;
  title: string;
  language?: string;
  content?: string;
  delta?: { old: string; new: string };
  filePath?: string;
  created_at: string;
  updated_at: string;
}

export interface CompletionResponse {
  completion: string;
  stop_reason: string;
  model: string;
  stop: string | null;
  log_id: string;
  messageLimit: {
    type: string;
    remaining: number;
  };
}
