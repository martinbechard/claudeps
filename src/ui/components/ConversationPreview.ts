/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/ui/components/ConversationPreview.ts
 */

import type { ChatMessage, ChatMessageInput } from "../../types";
import { ContentPreview } from "./ContentPreview";

export class ConversationPreview {
  private dialog: HTMLElement = document.createElement("div");
  private content: HTMLElement = document.createElement("div");
  private messagesContainer: HTMLElement | null = null;
  private isOpen: boolean = false;
  private contentPreview: ContentPreview;

  constructor() {
    this.createDialog();
    this.contentPreview = new ContentPreview();
  }

  /**
   * Creates the dialog structure
   */
  private createDialog(): void {
    // Create floating container
    this.dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
      z-index: 1000003;
      pointer-events: auto;
    `;

    // Create dialog content container
    this.content.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      position: relative;
      margin: 20px;
      pointer-events: auto;
    `;

    this.dialog.appendChild(this.content);
    document.body.appendChild(this.dialog);

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Shows the preview dialog with conversation content
   */
  public show(
    title: string,
    messages: ChatMessage[],
    conversationUrl?: string,
    scrollToMessageId?: string
  ): void {
    // Reset content
    this.content.innerHTML = "";

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e5e5e5;
    `;

    const titleElement = document.createElement("h2");
    titleElement.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    `;

    // Make title a link if URL is provided
    if (conversationUrl) {
      const titleLink = document.createElement("a");
      titleLink.href = conversationUrl;
      titleLink.target = "_blank";
      titleLink.textContent = title;
      titleLink.style.cssText = `
        color: inherit;
        text-decoration: none;
        transition: color 0.2s ease;
      `;
      titleLink.addEventListener("mouseover", () => {
        titleLink.style.color = "#0066cc";
      });
      titleLink.addEventListener("mouseout", () => {
        titleLink.style.color = "#333";
      });
      titleElement.appendChild(titleLink);
    } else {
      titleElement.textContent = title;
    }

    // Count artifacts
    let artifactCount = 0;
    messages.forEach((message) => {
      message.content.forEach((item) => {
        if (item.type === "tool_use" && item.input) {
          artifactCount++;
        }
      });
    });

    const subtitle = document.createElement("div");
    subtitle.style.cssText = `
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    `;
    subtitle.textContent = `${messages.length} messages, ${artifactCount} artifacts in conversation`;

    header.appendChild(titleElement);
    header.appendChild(subtitle);

    // Create close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 24px;
      border: none;
      background: none;
      color: #666;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    `;
    closeButton.addEventListener("mouseover", () => {
      closeButton.style.backgroundColor = "#f0f0f0";
    });
    closeButton.addEventListener("mouseout", () => {
      closeButton.style.backgroundColor = "transparent";
    });
    closeButton.addEventListener("click", () => this.close());

    // Create messages container
    this.messagesContainer = document.createElement("div");
    this.messagesContainer.style.cssText = `
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      min-height: 200px;
      max-height: calc(80vh - 100px);
      scroll-behavior: smooth;
    `;

    // Add messages
    messages.forEach((message) => {
      if (this.messagesContainer) {
        this.messagesContainer.appendChild(this.createMessageBubble(message));
      }
    });

    // Assemble dialog
    this.content.appendChild(closeButton);
    this.content.appendChild(header);
    if (this.messagesContainer) {
      this.content.appendChild(this.messagesContainer);
    }

    // Show dialog with animation
    this.dialog.style.display = "flex";
    this.dialog.style.opacity = "0";
    setTimeout(() => {
      this.dialog.style.transition = "opacity 0.2s ease-out";
      this.dialog.style.opacity = "1";

      // Scroll to message if ID is provided
      if (scrollToMessageId && this.messagesContainer) {
        const messageElement = this.messagesContainer.querySelector(
          `#message-${scrollToMessageId}`
        );
        if (messageElement) {
          const htmlMessageElement = messageElement as HTMLElement;
          htmlMessageElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Highlight the message briefly
          htmlMessageElement.style.transition = "background-color 0.5s ease";
          htmlMessageElement.style.backgroundColor = "rgba(0, 102, 204, 0.1)";
          setTimeout(() => {
            htmlMessageElement.style.backgroundColor = "transparent";
          }, 1500);
        }
      } else {
        // Default: scroll to bottom of messages
        if (this.messagesContainer) {
          this.messagesContainer.scrollTop =
            this.messagesContainer.scrollHeight;
        }
      }
    }, 0);

    this.isOpen = true;
  }

  /**
   * Creates a message bubble element
   */
  private createMessageBubble(message: ChatMessage): HTMLElement {
    const isHuman = message.sender === "human";

    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: ${isHuman ? "flex-end" : "flex-start"};
      margin-bottom: 16px;
    `;
    container.id = `message-${message.uuid}`; // Add message ID

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width: 80%;
      padding: 8px 16px;
      border-radius: 12px;
      ${
        isHuman
          ? `
        background: #0066cc;
        color: white;
        border-bottom-right-radius: 4px;
      `
          : `
        background: #f0f0f0;
        color: #333;
        border-bottom-left-radius: 4px;
      `
      }
    `;

    // Add message content
    message.content.forEach((item) => {
      if (item.type === "text" && item.text) {
        const textDiv = document.createElement("div");
        textDiv.style.whiteSpace = "pre-wrap";
        textDiv.textContent = item.text;
        bubble.appendChild(textDiv);
      } else if (item.type === "tool_use" && item.input) {
        const artifactBubble = this.createArtifactBubble(item.input);
        bubble.appendChild(artifactBubble);
      }
    });

    container.appendChild(bubble);

    // Add timestamp
    const timestamp = document.createElement("div");
    timestamp.style.cssText = `
      font-size: 0.8em;
      color: #666;
      margin-top: 4px;
      ${isHuman ? "text-align: right;" : "text-align: left;"}
    `;

    const date = new Date(message.created_at);
    timestamp.textContent = date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    container.appendChild(timestamp);

    return container;
  }

  /**
   * Creates a summary of changes for update artifacts
   */
  private createChangesSummary(oldStr: string, newStr: string): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      margin-top: 8px;
      font-size: 0.9em;
      color: #666;
    `;

    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    const removed = oldLines.filter((line) => !newLines.includes(line)).length;
    const added = newLines.filter((line) => !oldLines.includes(line)).length;

    const summary = document.createElement("div");
    summary.style.cssText = `
      display: flex;
      gap: 16px;
      margin-top: 8px;
    `;

    if (added > 0) {
      const addedDiv = document.createElement("div");
      addedDiv.style.cssText = "color: #28a745;";
      addedDiv.textContent = `+${added} added`;
      summary.appendChild(addedDiv);
    }

    if (removed > 0) {
      const removedDiv = document.createElement("div");
      removedDiv.style.cssText = "color: #dc3545;";
      removedDiv.textContent = `${removed} removed`;
      summary.appendChild(removedDiv);
    }

    container.appendChild(summary);
    return container;
  }

  /**
   * Shows artifact content in a separate preview window
   */
  private showArtifactContent(input: ChatMessageInput): void {
    const isUpdate = input.command === "update";

    if (isUpdate) {
      // For updates, show a diff view
      const diffContent = this.createDiffDisplay(
        input.old_str || "",
        input.new_str || ""
      );
      const fileName = input.title
        ? input.title + " (Update)"
        : "artifact-update";

      this.contentPreview.show(fileName, diffContent, fileName + ".diff");
    } else if (input.content) {
      // For regular artifacts, show the content
      const extension = input.language
        ? this.getFileExtension(input.language)
        : ".txt";
      const fileName = input.title
        ? input.title.endsWith(extension)
          ? input.title
          : input.title + extension
        : "artifact" + extension;

      this.contentPreview.show(fileName, input.content, fileName);
    }
  }

  /**
   * Creates a diff display for update artifacts
   */
  private createDiffDisplay(oldStr: string, newStr: string): string {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    const diff: string[] = [];

    // Simple diff display
    diff.push("--- Previous version");
    diff.push("+++ New version");
    diff.push("");

    // Show removed lines
    oldLines.forEach((line) => {
      if (!newLines.includes(line)) {
        diff.push("- " + line);
      }
    });

    // Show added lines
    newLines.forEach((line) => {
      if (!oldLines.includes(line)) {
        diff.push("+ " + line);
      }
    });

    return diff.join("\n");
  }

  /**
   * Gets appropriate file extension based on language
   */
  private getFileExtension(language: string): string {
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
   * Creates an artifact bubble for messages
   */
  private createArtifactBubble(input: ChatMessageInput): HTMLElement {
    const artifactContainer = document.createElement("div");
    artifactContainer.style.cssText = `
      background: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    `;

    const title = document.createElement("div");
    title.style.cssText = `
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const isUpdate = input.command === "update";

    const titleText = document.createElement("span");
    titleText.textContent = `Artifact: ${input.title || "Untitled"}`;
    title.appendChild(titleText);

    if (isUpdate) {
      const updateBadge = document.createElement("span");
      updateBadge.style.cssText = `
        background: #0066cc;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8em;
      `;
      updateBadge.textContent = "UPDATE";
      title.appendChild(updateBadge);
    }

    artifactContainer.appendChild(title);

    if (input.language) {
      const language = document.createElement("div");
      language.style.cssText = `
        color: #666;
        font-size: 0.9em;
        margin-bottom: 8px;
      `;
      language.textContent = `Language: ${input.language}`;
      artifactContainer.appendChild(language);
    }

    // Create a button-like container for the artifact preview
    const previewButton = document.createElement("div");
    previewButton.style.cssText = `
      background: #eee;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.9em;
      color: #666;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid #ddd;
    `;

    // Add an icon
    const icon = document.createElement("span");
    icon.textContent = isUpdate ? "🔄" : "👁️"; // Update or eye icon
    icon.style.fontSize = "1.1em";
    previewButton.appendChild(icon);

    const text = document.createElement("span");
    text.textContent = isUpdate
      ? "Click to view changes"
      : "Click to view artifact content";
    previewButton.appendChild(text);

    // Add hover effect
    previewButton.addEventListener("mouseover", () => {
      previewButton.style.backgroundColor = "#e0e0e0";
      previewButton.style.transform = "translateY(-1px)";
    });
    previewButton.addEventListener("mouseout", () => {
      previewButton.style.backgroundColor = "#eee";
      previewButton.style.transform = "translateY(0)";
    });

    // Add click handler
    previewButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      this.showArtifactContent(input);
    });

    artifactContainer.appendChild(previewButton);

    // For updates, show a summary of changes
    if (isUpdate && input.old_str && input.new_str) {
      const changesSummary = this.createChangesSummary(
        input.old_str,
        input.new_str
      );
      artifactContainer.appendChild(changesSummary);
    }

    return artifactContainer;
  }

  /**
   * Closes the preview dialog
   */
  public close(): void {
    if (!this.isOpen) return;

    this.dialog.style.opacity = "0";
    setTimeout(() => {
      this.dialog.style.display = "none";
      this.content.innerHTML = "";
      this.messagesContainer = null;
    }, 200);

    this.isOpen = false;
  }

  /**
   * Cleans up the component
   */
  public destroy(): void {
    this.dialog.remove();
  }
}
