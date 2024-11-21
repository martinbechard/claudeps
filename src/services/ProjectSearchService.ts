/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/services/ProjectSearchService.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Service for searching through project conversations using semantic search with batching
 * Note: Finding needles in conversational haystacks, one batch at a time!
 */

import { ProjectRetrieval } from "./ProjectRetrieval";
import { ConversationRetrieval } from "./ConversationRetrieval";
import { requestCompletion } from "../utils/requestCompletion";
import { getOrganizationId } from "../utils/getClaudeIds";
import { getHeaders } from "../utils/getHeaders";
import { DownloadTable } from "../ui/components/DownloadTable";
import type {
  SearchResultInfo,
  DocumentInfo,
  ProjectConversation,
  Conversation,
  ChatMessage,
} from "../types";
import { AnthropicService } from "./AnthropicService";

export class ProjectSearchService {
  private static readonly API_URL = "https://api.claude.ai/api/organizations";
  private static readonly MAX_MESSAGE_LENGTH = 5000;
  private static currentAbortController: AbortController | null = null;
  private static isCancelling: boolean = false;
  private static currentTable: DownloadTable | null = null;

  /**
   * Makes a completion request to Anthropic
   */
  private static async makeCompletionRequest(
    prompt: string,
    signal: AbortSignal
  ): Promise<string | null> {
    console.log(
      "[ProjectSearchService] Making completion request with prompt:",
      prompt
    );

    const messages = [
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    const result = await AnthropicService.complete(messages, {
      temperature: 0.7,
      maxTokens: 2000,
      signal,
    });

    if (!result.success) {
      if (result.cancelled) {
        console.log("[ProjectSearchService] Request cancelled");
        return null;
      }
      console.error(
        "[ProjectSearchService] Completion request failed:",
        result.error
      );
      throw new Error(result.error);
    }

    return result.text || null;
  }

  /**
   * Creates a DocumentInfo object for a conversation
   */
  private static createDocumentInfo(
    conversation: ProjectConversation
  ): DocumentInfo {
    return {
      fileName: conversation.name,
      filePath: `${conversation.name.replace(/\s+/g, "-")}.md`,
      content: conversation.summary || "",
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

          // Define message filter callback
          const filterLongMessages = (message: ChatMessage) => {
            const content = this.formatMessageContent(message);
            return content.length <= this.MAX_MESSAGE_LENGTH;
          };

          return ConversationRetrieval.conversationToMarkdown(
            conv,
            filterLongMessages
          );
        } catch (error) {
          console.error(
            "[ProjectSearchService] Failed to get conversation:",
            error
          );
          throw error;
        }
      },
    };
  }

  /**
   * Aborts the current search operation if one is in progress
   */
  public static abortSearch(): void {
    if (
      this.currentAbortController &&
      !this.currentAbortController.signal.aborted
    ) {
      console.log("[ProjectSearchService] Aborting search...");
      this.isCancelling = true;
      this.currentAbortController.abort();

      // Update UI to show cancelling state for unprocessed rows
      if (this.currentTable) {
        const rows = document.querySelectorAll("tr[data-conversation-id]");
        rows.forEach((row) => {
          const id = row.getAttribute("data-conversation-id");
          if (
            id &&
            this.currentTable &&
            !this.currentTable.isRowProcessed(id)
          ) {
            this.currentTable.updateSearchResult(
              id,
              undefined,
              "Search cancelled"
            );
          }
        });
      }
    }
  }

  /**
   * Searches project conversations and displays results progressively
   */
  public static async searchAndDisplayResults(
    searchText: string | undefined,
    outputElement: HTMLElement,
    conversations?: ProjectConversation[]
  ): Promise<void> {
    let table: DownloadTable | null = null;
    try {
      // Reset cancelling state and create new abort controller
      this.isCancelling = false;
      this.currentAbortController = new AbortController();
      const signal = this.currentAbortController.signal;

      console.log(
        "[ProjectSearchService] Starting search with text:",
        searchText
      );

      // Get project conversations if not provided
      if (!conversations) {
        console.log("[ProjectSearchService] Fetching project conversations...");
        conversations = await ProjectRetrieval.getProjectConversations(true);
      }

      // Initialize table with just headers, passing false to disable Cancel button
      table = new DownloadTable(outputElement, true, false);
      this.currentTable = table;

      // Add each conversation as a row
      for (const conv of conversations) {
        const docInfo = this.createDocumentInfo(conv);
        table.addRow(docInfo);
      }

      // If search text provided, process each conversation
      if (searchText) {
        console.log(
          "[ProjectSearchService] Starting conversation processing..."
        );
        const orgId = getOrganizationId();

        for (const conv of conversations) {
          try {
            // Check if search was aborted
            if (signal.aborted) {
              console.log("[ProjectSearchService] Search aborted");
              break;
            }

            // Set working status
            table.updateSearchResult(conv.uuid, undefined, "Working...");

            // Get detailed conversation
            const conversation = await ConversationRetrieval.getConversation(
              orgId,
              conv.uuid,
              true
            );

            // Check again for abort after conversation retrieval
            if (signal.aborted) {
              console.log(
                "[ProjectSearchService] Search aborted after conversation retrieval"
              );
              break;
            }

            // Process messages
            const messages = conversation.chat_messages
              .filter((msg) => {
                const content = this.formatMessageContent(msg);
                return (
                  content.trim().length > 0 &&
                  content.length <= this.MAX_MESSAGE_LENGTH
                );
              })
              .map((msg) => ({
                id: msg.uuid,
                sender: msg.sender,
                content: this.formatMessageContent(msg),
              }));

            // Create search prompt for this conversation
            const prompt = `Here is a conversation. Please find if it contains information satisfying this search criteria and output a SearchResultInfo object: 
            <Criteria>${searchText}</Criteria>

${JSON.stringify(
  {
    id: conversation.uuid,
    name: conversation.name,
    messages: messages,
  },
  null,
  2
)}

If the conversation matches, return a SearchResultInfo object with this TypeScript type:
interface SearchResultInfo {
  conversationId: string;     // ID of the matching conversation
  messageId: string;          // UUID of the specific message that matches
  matchReason: string;        // Clear explanation of why this conversation matches
  relevantSnippet: string;    // The specific text snippet that matches (max 200 chars)
}

If the conversation does not match, return null. Return ONLY the JSON object or null, with no additional text or explanation.`;

            // Check for abort before making completion request
            if (signal.aborted) {
              console.log(
                "[ProjectSearchService] Search aborted before completion request"
              );
              break;
            }

            try {
              // Make request and process response
              const responseText = await this.makeCompletionRequest(
                prompt,
                signal
              );

              // If request was cancelled
              if (signal.aborted) {
                console.log(
                  "[ProjectSearchService] Search aborted during completion request"
                );
                break;
              }

              if (!responseText) {
                if (this.isCancelling) {
                  break;
                }
                table.updateSearchResult(
                  conv.uuid,
                  undefined,
                  "Failed to get response from API"
                );
                continue;
              }

              console.log(
                `[ProjectSearchService] Processing response for conversation ${conv.uuid}`
              );

              try {
                const result = JSON.parse(responseText);
                if (result && result.conversationId) {
                  // Valid result found, update the table and select the row
                  table.updateSearchResult(conv.uuid, result, undefined, true);
                } else {
                  // No match, clear any existing result and don't select
                  table.updateSearchResult(
                    conv.uuid,
                    undefined,
                    "No match found"
                  );
                }
              } catch (error) {
                const errorMessage = `Failed to parse search results: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`;
                console.error(
                  `[ProjectSearchService] ${errorMessage} for conversation ${conv.uuid}`
                );
                table.updateSearchResult(conv.uuid, undefined, errorMessage);
                continue;
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to get response from API";
              console.error(
                `[ProjectSearchService] API request failed for conversation ${conv.uuid}:`,
                error
              );
              table.updateSearchResult(conv.uuid, undefined, errorMessage);
              continue;
            }
          } catch (error) {
            const errorMessage = `Failed to process conversation: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
            console.error(
              `[ProjectSearchService] ${errorMessage} for conversation ${conv.uuid}:`,
              error
            );
            table.updateSearchResult(conv.uuid, undefined, errorMessage);
            continue;
          }
        }

        // If search was cancelled, update any remaining unprocessed rows
        if (signal.aborted) {
          for (const conv of conversations) {
            if (!table.isRowProcessed(conv.uuid)) {
              table.updateSearchResult(
                conv.uuid,
                undefined,
                "Search cancelled"
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("[ProjectSearchService] Search failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Search failed";
      // Update all conversations with error status
      if (conversations && table) {
        for (const conv of conversations) {
          table.updateSearchResult(conv.uuid, undefined, errorMessage);
        }
      }
    } finally {
      this.currentAbortController = null;
      this.isCancelling = false;
      this.currentTable = null;
    }
  }

  /**
   * Filters and formats message content
   */
  private static formatMessageContent(message: ChatMessage): string {
    return message.content
      .filter((content) => {
        // Only include text content, exclude tools and artifacts
        return (
          content.type === "text" &&
          content.text &&
          !content.text.includes("antml:function_calls") &&
          !content.text.includes("antArtifact")
        );
      })
      .map((content) => content.text)
      .join("\n");
  }
}
