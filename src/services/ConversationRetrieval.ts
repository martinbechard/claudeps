/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /src/services/ConversationRetrieval.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Service for managing Claude conversations and artifacts
 * Note: Making conversation history easier to browse and analyze!
 */

import type {
  Conversation,
  ChatMessage,
  ChatMessageInput,
  CommandOptions,
  ConversationArtifact,
  DocumentInfo,
} from "../types";
import { ClaudeCache } from "./ClaudeCache";
import { DownloadTable } from "../ui/components/DownloadTable";
import { getOrganizationId as getOrgId } from "../utils/getClaudeIds";
import { extractRelPath } from "../utils/PathExtractor";
import { ProjectRetrieval } from "./ProjectRetrieval";

/**
 * Represents an extracted artifact for markdown rendering
 */
interface MarkdownArtifact {
  title: string;
  language?: string;
  content?: string;
}

/**
 * Type definition for message filter callback
 */
export type MessageFilterCallback = (message: ChatMessage) => boolean;

/**
 * Service for managing Claude conversations and artifacts
 */
export class ConversationRetrieval {
  private static readonly API_URL = "https://api.claude.ai/api/organizations";

  /**
   * Gets the conversation ID from the current URL
   * @returns Conversation ID if found
   * @throws Error if not on a conversation page
   */
  public static getConversationIdFromUrl(): string {
    const match = window.location.pathname.match(/\/chat\/([^\/]+)/);
    if (!match) {
      throw new Error(
        "Please navigate to a Claude chat page before using conversation commands"
      );
    }
    return match[1];
  }

  /**
   * Gets the organization ID from cookies
   * @throws Error if organization ID is not found or invalid
   */
  public static getOrganizationId(): string {
    return getOrgId();
  }

  /**
   * Retrieves a conversation by ID with caching and validation
   * @param orgId - Organization ID
   * @param conversationId - Conversation ID to retrieve
   * @returns Promise resolving to conversation data
   * @throws Error if retrieval fails
   */
  public static async getConversation(
    orgId: string,
    conversationId: string
  ): Promise<Conversation> {
    const url = `${this.API_URL}/${orgId}/chat_conversations/${conversationId}?tree=True&rendering_mode=messages&render_all_tools=true`;

    try {
      // Get the cached conversation - use NO_TIMEOUT since we validate with updated_at
      const conversation = await ClaudeCache.fetchWithCache<Conversation>(url, {
        timeoutMs: ClaudeCache.NO_TIMEOUT,
      });

      // Get project conversations to validate against
      const projectConversations =
        await ProjectRetrieval.getProjectConversations(true);
      const projectConversation = projectConversations.find(
        (c) => c?.uuid === conversationId
      );

      // If conversation not found in project or dates don't match, invalidate cache and refetch
      if (
        !projectConversation ||
        projectConversation.updated_at !== conversation.updated_at
      ) {
        await ClaudeCache.removeCached(url);
        return await ClaudeCache.fetchWithCache<Conversation>(url, {
          timeoutMs: ClaudeCache.NO_TIMEOUT,
        });
      }

      return conversation;
    } catch (error) {
      throw new Error(
        `Error retrieving conversation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gets appropriate file extension based on language
   * @param language - Programming language or file type
   * @returns File extension including dot
   */
  private static getFileExtension(language?: string): string {
    if (!language) return ".txt";

    const extensionMap: Record<string, string> = {
      typescript: ".ts",
      javascript: ".js",
      python: ".py",
      java: ".java",
      "text/markdown": ".md",
      "application/json": ".json",
      html: ".html",
      css: ".css",
      "text/html": ".html",
      "application/vnd.ant.code": ".txt",
      "application/vnd.ant.react": ".tsx",
      "application/vnd.ant.mermaid": ".mmd",
      "image/svg+xml": ".svg",
    };

    return extensionMap[language.toLowerCase()] || ".txt";
  }

  /**
   * Extracts artifacts from a conversation
   * @param conversation - Conversation to extract artifacts from
   * @returns Array of artifacts
   */
  private static extractArtifacts(
    conversation: Conversation
  ): ConversationArtifact[] {
    const artifacts: ConversationArtifact[] = [];

    conversation.chat_messages.forEach((message) => {
      message.content.forEach((item) => {
        if (item.type === "tool_use" && item.input) {
          const content = item.input.content;

          // Extract path from content
          let filePath = content ? extractRelPath(content) : "";

          // If no path found, use title as filename without forcing extension
          if (!filePath && item.input.title) {
            filePath = item.input.title;
          }

          // Process directory names to kabob case but keep filename as is
          const processedPath = !filePath
            ? ""
            : filePath
                .split("/")
                .map((part, index, arr) => {
                  // Keep filename (last part) as is
                  if (index === arr.length - 1) return part;
                  // Transform directory names to kabob case
                  return part.replace(/\s+/g, "-").toLowerCase();
                })
                .join("/");

          artifacts.push({
            id: item.input.id,
            title:
              filePath?.split("/")?.pop() || item.input.title || "Untitled",
            language: item.input.language,
            content: content,
            delta:
              item.input.new_str || item.input.old_str
                ? {
                    old: item.input.old_str || "",
                    new: item.input.new_str || "",
                  }
                : undefined,
            filePath: processedPath,
            // Add the dates from the containing message
            created_at: message.created_at,
            updated_at: message.updated_at,
          });
        }
      });
    });

    return artifacts;
  }

  /**
   * Extracts file path from artifact content if present
   * @param content - Artifact content to search
   * @returns File path if found, undefined otherwise
   */
  private static extractFilePath(content: string): string | undefined {
    const filePathMatch = extractRelPath(content);
    return filePathMatch;
  }

  /**
   * Converts artifacts to DocumentInfo format for DownloadTable
   * @param artifacts - Array of conversation artifacts
   * @returns Array of DocumentInfo objects
   */
  private static convertArtifactsToDocumentInfo(
    artifacts: ConversationArtifact[]
  ): DocumentInfo[] {
    const unique = new Map<string, ConversationArtifact>();

    // Keep only the latest version of each artifact
    artifacts.forEach((artifact) => {
      if (artifact.content) {
        unique.set(artifact.id, artifact);
      }
    });

    return Array.from(unique.values()).map((artifact) => ({
      fileName: artifact.title,
      filePath: artifact.filePath || artifact.title,
      content: artifact.content || "",
      isSelected: true,
      metadata: {
        language: artifact.language,
        id: artifact.id,
        // Pass through the dates from the artifact
        created_at: artifact.created_at,
        updated_at: artifact.updated_at,
      },
    }));
  }

  /**
   * Displays conversation elements in the output element
   * @param docs - Documents to display
   * @param outputElement - Element to display documents in
   */
  public static async displayConversation(
    docs: DocumentInfo[],
    outputElement: HTMLElement
  ): Promise<void> {
    // Create a dedicated container for the table
    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container";
    outputElement.appendChild(tableContainer);

    // Create and render the table in the dedicated container
    const table = new DownloadTable(tableContainer, docs);
    table.render();
  }

  /**
   * Retrieves and displays the current conversation based on command options
   * @param options - Command options for the export
   * @param outputElement - Element to display the conversation in
   * @returns Promise that resolves when display is complete
   */
  public static async displayCurrentConversation(
    options: CommandOptions,
    outputElement: HTMLElement
  ): Promise<void> {
    try {
      const orgId = this.getOrganizationId();
      const conversationId = this.getConversationIdFromUrl();
      const conversation = await this.getConversation(orgId, conversationId);

      // Extract and process artifacts if requested
      if (options?.includeArtifacts) {
        const artifacts = this.extractArtifacts(conversation);
        const docs = this.convertArtifactsToDocumentInfo(artifacts);

        if (docs.length === 0) {
          throw new Error("No artifacts found in conversation");
        }

        await this.displayConversation(docs, outputElement);
      } else {
        // Display conversation with metadata for preview
        const docs: DocumentInfo[] = [
          {
            fileName: conversation.name,
            filePath: `conversations/${conversation.name}.md`,
            content: "", // Empty initial content, will be loaded by callback
            isSelected: true,
            metadata: {
              conversationId: conversation.uuid,
              url: `https://claude.ai/chat/${conversation.uuid}`,
              created_at: conversation.created_at,
              updated_at: conversation.updated_at,
            },
            contentCallback: async () => {
              const conv = await this.getConversation(orgId, conversationId);
              return this.conversationToMarkdown(conv);
            },
          },
        ];

        await this.displayConversation(docs, outputElement);
      }
    } catch (error) {
      throw new Error(
        `Failed to display conversation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Converts a conversation to markdown format
   * @param conversation - Conversation to convert
   * @param filterCallback - Optional callback to filter messages
   * @returns Markdown string of the conversation
   */
  public static conversationToMarkdown(
    conversation: Conversation,
    filterCallback?: MessageFilterCallback
  ): string {
    const sections: string[] = [];
    sections.push(`# ${conversation.name}\n`);

    // Add conversation metadata
    const createdDate = new Date(conversation.created_at);
    const updatedDate = new Date(conversation.updated_at);

    sections.push("## Conversation Details");
    sections.push(
      `- Created: ${createdDate.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })}`
    );
    sections.push(
      `- Last Updated: ${updatedDate.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })}`
    );
    sections.push("\n---\n");

    const filteredMessages = filterCallback
      ? conversation.chat_messages.filter(filterCallback)
      : conversation.chat_messages;

    filteredMessages.forEach((message, index) => {
      // Add message header with timestamp
      const messageDate = new Date(message.created_at);
      const formattedDate = messageDate.toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

      sections.push(
        `## ${
          message.sender === "human" ? "Human" : "Assistant"
        } _(${formattedDate})_\n`
      );

      message.content.forEach((item) => {
        if (item.type === "text") {
          sections.push(item.text || "");
        } else if (item.type === "tool_use" && item.input) {
          // Handle artifacts
          const artifact = this.extractSingleArtifact(item.input);
          if (artifact) {
            sections.push(`\n**Artifact: ${artifact.title}**`);
            if (artifact.content) {
              sections.push("\n```" + (artifact.language || ""));
              sections.push(artifact.content);
              sections.push("```\n");
            }
          }
        }
      });

      if (index < filteredMessages.length - 1) {
        sections.push("\n---\n");
      }
    });

    return sections.join("\n");
  }

  /**
   * Extracts a single artifact from message input
   * @param input - Message input containing artifact data
   * @returns Artifact information for markdown or null if invalid
   */
  private static extractSingleArtifact(
    input: ChatMessageInput
  ): MarkdownArtifact | null {
    if (!input.title) return null;

    return {
      title: input.title,
      language: input.language,
      content: input.content,
    };
  }

  /**
   * Gets current conversation details including latest message ID
   * @returns Promise resolving to { conversationId, parentMessageUuid }
   * @throws Error if conversation details cannot be retrieved
   */
  public static async getCurrentConversationDetails(): Promise<{
    conversationId: string;
    parentMessageUuid: string;
  }> {
    // Get conversation ID from URL
    const conversationId = this.getConversationIdFromUrl();
    const orgId = this.getOrganizationId();

    try {
      // Get conversation details
      const conversation = await this.getConversation(orgId, conversationId);

      return {
        conversationId,
        parentMessageUuid: conversation.current_leaf_message_uuid,
      };
    } catch (error) {
      throw new Error(
        `Failed to get conversation details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
