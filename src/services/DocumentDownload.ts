/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/services/DocumentDownload.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Service for handling document downloads with support for dynamic content retrieval
 * Note: Your friendly neighborhood file downloader!
 */

import type { DocumentInfo } from "../types";

export class DocumentDownload {
  /**
   * Creates markdown content from multiple documents
   * @param docs - Array of documents to combine
   * @returns Promise resolving to markdown string
   */
  private static async createMarkdownContent(
    docs: DocumentInfo[]
  ): Promise<string> {
    const sections: string[] = [];
    sections.push("# src\n");

    // Process files in their original order
    for (const doc of docs) {
      const extension = doc.filePath.split(".").pop() || "";
      const language = this.getLanguageFromExtension(extension);

      sections.push(`## ${doc.filePath}\n`);
      sections.push("```" + language);

      // Use contentCallback if available, otherwise use static content
      const content = doc.contentCallback
        ? await doc.contentCallback(doc)
        : doc.content;

      sections.push(content);
      sections.push("```\n");
    }

    return sections.join("\n");
  }

  /**
   * Maps file extensions to language identifiers for syntax highlighting
   * @param extension - File extension without dot
   * @returns Language identifier string
   */
  private static getLanguageFromExtension(extension: string): string {
    const languageMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      jsx: "jsx",
      tsx: "tsx",
      css: "css",
      scss: "scss",
      html: "html",
      json: "json",
      md: "markdown",
      py: "python",
      rb: "ruby",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      go: "go",
      rs: "rust",
      php: "php",
      sql: "sql",
      yaml: "yaml",
      yml: "yaml",
      xml: "xml",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      swift: "swift",
    };

    return languageMap[extension.toLowerCase()] || "";
  }

  /**
   * Initiates file download through Chrome extension
   * @param content - Content to download
   * @param filePath - Name for downloaded file
   * @param isBundled - Whether the content is a markdown bundle
   */
  private static downloadContent(
    content: string,
    filePath: string,
    isBundled: boolean = false
  ): void {
    const extension = filePath.split(".").pop() || "";
    const language = isBundled
      ? ""
      : this.getLanguageFromExtension(extension) || "plain";

    const mimeType = isBundled ? "text/markdown" : `text/${language}`;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    try {
      chrome.runtime.sendMessage(
        {
          type: "download",
          url: url,
          filename: filePath,
        },
        (response) => {
          if (!response.success) {
            console.error("Download failed:", response.error);
            alert("Failed to start download. Please try again.");
          }
        }
      );
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /**
   * Downloads selected documents as a single markdown file
   * @param selectedDocs - Array of documents to download
   * @throws Error if no documents selected or download fails
   */
  public static async handleSingleDownload(
    selectedDocs: DocumentInfo[]
  ): Promise<void> {
    if (selectedDocs.length === 0) {
      throw new Error("No documents selected for export");
    }

    try {
      const markdownContent = await this.createMarkdownContent(selectedDocs);
      const timestamp = new Date()
        .toISOString()
        .replace(/[:]/g, "-")
        .split(".")[0];
      const filename = `claude-export-${timestamp}.md`;
      this.downloadContent(markdownContent, filename, true);
    } catch (error) {
      throw new Error(
        `Failed to export document bundle: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Downloads each selected document as a separate file
   * @param selectedDocs - Array of documents to download
   * @throws Error if no documents selected or download fails
   */
  public static async handleMultipleDownload(
    selectedDocs: DocumentInfo[]
  ): Promise<void> {
    if (selectedDocs.length === 0) {
      throw new Error("No documents selected for export");
    }

    try {
      // Process documents in their original order
      for (const doc of selectedDocs) {
        const content = doc.contentCallback
          ? await doc.contentCallback(doc)
          : doc.content;

        // Use the full path if available, otherwise fallback to filename
        const filePath = doc.filePath || doc.fileName;

        this.downloadContent(content, filePath, false);
      }
    } catch (error) {
      throw new Error(
        `Failed to export individual documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
