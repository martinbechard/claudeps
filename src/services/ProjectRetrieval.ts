// Copyright (c) 2024 Martin Bechard martin.bechard@DevConsult.ca
// This software is licensed under the MIT License.
// File: src/services/ProjectRetrieval.ts
// Service for retrieving and managing Claude project data
// Note: The project manager that keeps your conversations organized!

import type { DocumentInfo, ProjectConversation } from "../types";
import { getOrganizationId, getProjectUuid } from "../utils/getClaudeIds";
import { DownloadTable } from "../ui/components/DownloadTable";
import { ConversationRetrieval } from "./ConversationRetrieval";
import { ClaudeCache } from "./ClaudeCache";

/**
 * Service for managing Claude projects and their conversations
 */
export class ProjectRetrieval {
  private static readonly API_URL = "https://api.claude.ai/api/organizations";

  /**
   * Retrieves all conversations in the current project with caching
   * @param forceRefresh Force refresh from API instead of cache
   * @returns Promise resolving to array of project conversations
   * @throws Error if retrieval fails
   */
  public static async getProjectConversations(
    forceRefresh: boolean = false
  ): Promise<ProjectConversation[]> {
    try {
      const orgId = getOrganizationId();
      const projectId = await getProjectUuid(orgId);
      const url = `${this.API_URL}/${orgId}/projects/${projectId}/conversations`;

      return await ClaudeCache.fetchWithCache<ProjectConversation[]>(url, {
        timeoutMs: 120000, // Cache project conversations for 2 minutes
        forceRefresh,
      });
    } catch (error) {
      throw new Error(
        `Error retrieving project conversations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Converts conversations to DocumentInfo format for DownloadTable
   * @param conversations - Array of project conversations
   * @returns Array of DocumentInfo objects
   */
  private static convertConversationsToDocumentInfo(
    conversations: ProjectConversation[]
  ): DocumentInfo[] {
    return conversations.map((conversation) => ({
      fileName: conversation.name,
      filePath: `${conversation.name.replace(/\s+/g, "-")}.md`,
      content: this.createConversationSummary(conversation),
      isSelected: false,
      metadata: {
        conversationId: conversation.uuid,
        url: `https://claude.ai/chat/${conversation.uuid}`,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      },
      contentCallback: async (doc: DocumentInfo) => {
        const orgId = getOrganizationId();
        try {
          const conv = await ConversationRetrieval.getConversation(
            orgId,
            conversation.uuid,
            true
          );
          return ConversationRetrieval.conversationToMarkdown(conv);
        } catch (error) {
          console.error("Failed to get conversation:", error);
          throw error;
        }
      },
    }));
  }
  /**
   * Creates a markdown summary of a conversation
   * @param conversation - Conversation to summarize
   * @returns Markdown formatted summary
   */
  private static createConversationSummary(
    conversation: ProjectConversation
  ): string {
    const sections: string[] = [];

    sections.push(`# ${conversation.name}\n`);
    sections.push(`UUID: ${conversation.uuid}`);
    sections.push(
      `Created: ${new Date(conversation.created_at).toLocaleString()}`
    );
    sections.push(
      `Updated: ${new Date(conversation.updated_at).toLocaleString()}`
    );
    sections.push(`\nMessage Count: ${conversation.message_count}`);

    if (conversation.summary) {
      sections.push(`\n## Summary\n${conversation.summary}`);
    }

    return sections.join("\n");
  }

  /**
   * Displays project conversations in the output element
   * @param docs - Documents to display
   * @param outputElement - Element to display documents in
   */
  public static async displayConversations(
    docs: DocumentInfo[],
    outputElement: HTMLElement
  ): Promise<void> {
    outputElement.innerHTML = "";
    const table = new DownloadTable(outputElement, docs);
    table.render();
  }

  /**
   * Retrieves and displays conversations in the current project
   * @param outputElement - Element to display the conversations in
   * @param forceRefresh Force refresh from API instead of cache
   * @returns Promise that resolves when display is complete
   */
  public static async displayCurrentProject(
    outputElement: HTMLElement,
    forceRefresh: boolean = false
  ): Promise<void> {
    try {
      const conversations = await this.getProjectConversations(forceRefresh);
      const docs = this.convertConversationsToDocumentInfo(conversations);

      if (docs.length === 0) {
        throw new Error("No conversations found in project");
      }

      await this.displayConversations(docs, outputElement);
    } catch (error) {
      throw new Error(
        `Failed to display project conversations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
