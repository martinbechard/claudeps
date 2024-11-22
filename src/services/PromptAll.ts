/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/services/PromptAll.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Service for submitting prompts to multiple conversations sequentially
 * Note: Like a patient teacher - asking the same question to each student one at a time!
 */

import { ProjectRetrieval } from "./ProjectRetrieval";
import { DownloadTable } from "../ui/components/DownloadTable";
import { requestCompletion } from "../utils/requestCompletion";
import { getOrganizationId } from "../utils/getClaudeIds";
import type { DocumentInfo, ProjectConversation } from "../types";

/**
 * Additional result information for prompt responses
 */
interface PromptResultInfo {
  conversationId: string;
  prompt: string;
  response: string;
  error?: string;
  status?: string;
}

/**
 * Service for managing prompts across multiple conversations
 */
export class PromptAll {
  /**
   * Submits a prompt to a specific conversation
   * @param conversationId - ID of conversation to query
   * @param prompt - Prompt to submit
   * @returns Promise resolving to completion response
   */
  private static async submitPrompt(
    conversationId: string,
    prompt: string
  ): Promise<string> {
    try {
      const response = await requestCompletion({
        prompt,
        conversationId,
        renderingMode: "json",
        stream: true,
      });
      return response.completion;
    } catch (error) {
      throw new Error(
        `Failed to submit prompt to conversation ${conversationId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Creates document info objects for display
   * @param conversations - Original conversations
   * @param results - Prompt results
   * @returns Array of document info objects
   */
  private static createDocumentInfo(
    conversations: ProjectConversation[],
    results: PromptResultInfo[]
  ): DocumentInfo[] {
    // Create a map for quick result lookup
    const resultMap = new Map(
      results.map((result) => [result.conversationId, result])
    );

    return conversations.map((conv) => {
      const result = resultMap.get(conv.uuid);
      return {
        fileName: conv.name,
        filePath: `${conv.name.replace(/\s+/g, "-")}.md`,
        content: conv.summary || "",
        isSelected: false,
        metadata: {
          conversationId: conv.uuid,
          url: `https://claude.ai/chat/${conv.uuid}`,
        },
        searchResult: result
          ? {
              conversationId: conv.uuid,
              messageId: "", // No specific message ID for prompt responses
              matchReason:
                result.error || result.status || "Prompt response received",
              relevantSnippet: result.response,
            }
          : {
              conversationId: conv.uuid,
              messageId: "",
              matchReason: "Pending...",
              relevantSnippet: "Waiting to process this conversation",
            },
      };
    });
  }

  /**
   * Queries all conversations with a prompt and displays results progressively
   * @param prompt - Prompt to submit to all conversations
   * @param outputElement - Element to display results in
   * @param statusCallback - Optional callback for status updates
   */
  public static async queryAndDisplayResults(
    prompt: string,
    outputElement: HTMLElement,
    statusCallback?: (message: string) => void
  ): Promise<void> {
    try {
      console.log("Fetching project conversations...");
      const conversations = await ProjectRetrieval.getProjectConversations();

      if (conversations.length === 0) {
        throw new Error("No conversations found in project");
      }

      // Initialize results array
      const allResults: PromptResultInfo[] = conversations.map((conv) => ({
        conversationId: conv.uuid,
        prompt,
        response: "",
        status: "Pending",
      }));

      // Initialize table with pending status for all conversations
      const docs = this.createDocumentInfo(conversations, allResults);
      const table = new DownloadTable(outputElement, true);
      table.render();

      // Process each conversation sequentially
      for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];
        const progressMsg = `Processing conversation ${i + 1}/${
          conversations.length
        }: ${conv.name}`;

        if (statusCallback) {
          statusCallback(progressMsg);
        }
        console.log(progressMsg);

        try {
          const response = await this.submitPrompt(conv.uuid, prompt);
          allResults[i] = {
            conversationId: conv.uuid,
            prompt,
            response,
            status: "Completed",
          };
        } catch (error) {
          allResults[i] = {
            conversationId: conv.uuid,
            prompt,
            response: "",
            error: error instanceof Error ? error.message : "Unknown error",
            status: "Error",
          };
          console.error(`Error processing conversation ${conv.uuid}:`, error);
        }

        // Update UI after each conversation
        const updatedDocs = this.createDocumentInfo(conversations, allResults);
        table.updateItems(updatedDocs);
      }

      if (statusCallback) {
        statusCallback("All conversations processed");
      }
    } catch (error) {
      throw new Error(
        `Query failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
