// Copyright (c) 2024 Martin Bechard martin.bechard@DevConsult.ca
// This software is licensed under the MIT License.
// File: src/services/DocumentRetrieval.ts
// Service for retrieving Claude-generated documents
// Note: Like a librarian for your AI's creative works!

import type { DocumentInfo } from "../types";
import { DownloadTable } from "../ui/components/DownloadTable";
import { getOrganizationId, getProjectUuid } from "../utils/getClaudeIds";
import { ClaudeCache } from "./ClaudeCache";
import { extractRelPath } from "../utils/PathExtractor";

export class DocumentRetrieval {
  private static readonly API_URL = "https://api.claude.ai/api/organizations";

  /**
   * Fetches available documents from the API with caching
   * @throws Error if documents cannot be retrieved
   */
  public static async fetchDocuments(): Promise<DocumentInfo[]> {
    try {
      const organizationId = getOrganizationId();
      const projectUuid = await getProjectUuid(organizationId);

      const url = `${this.API_URL}/${organizationId}/projects/${projectUuid}/docs`;

      const data = await ClaudeCache.fetchWithCache<any[]>(url, {
        timeoutMs: 300000, // Cache documents for 5 minutes
      });

      return this.processDocuments(data);
    } catch (error) {
      throw new Error(
        `Error fetching documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Displays documents in the provided output element
   * @param docs - Documents to display
   * @param outputElement - Element to display documents in
   */
  public static async displayDocuments(
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
   * Processes raw document data into DocumentInfo objects
   * @param data - Raw document data from API
   * @returns Processed document information
   */
  private static processDocuments(data: any[]): DocumentInfo[] {
    return data.map((doc) => {
      // Extract path from content, without forcing an extension
      const filePathMatch = extractRelPath(doc.content);
      const filePath = filePathMatch || doc.file_name;

      // Convert directory separators to kabob case but keep filename as is
      const processedPath = filePath
        .split("/")
        .map((part, index, arr) => {
          // Don't transform the filename (last part)
          if (index === arr.length - 1) return part;
          // Transform directory names to kabob case
          return part.replace(/\s+/g, "-").toLowerCase();
        })
        .join("/");

      return {
        fileName: doc.file_name,
        filePath: processedPath,
        content: doc.content || "",
        isSelected: doc.content?.includes(
          "This was generated by Claude Sonnet"
        ),
        metadata: {
          created_at: doc.created_at,
          updated_at: doc.updated_at || doc.created_at, // Fallback to created_at if updated_at not available
        },
      };
    });
  }
}
