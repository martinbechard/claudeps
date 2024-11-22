/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/ui/components/ConversationPreview.ts
 */

import type { ChatMessage, ChatMessageInput } from "../../types";
import { ContentPreview } from "./ContentPreview";
import { DraggableManager } from "./DraggableManager";
import { SearchResultPreview } from "./SearchResultPreview";
import { StarService } from "../../services/StarService";
import { EditableLabel } from "./EditableLabel";
import { ConversationRetrieval } from "../../services/ConversationRetrieval";

export class ConversationPreview {
  private dialog: HTMLElement = document.createElement("div");
  private content: HTMLElement = document.createElement("div");
  private header: HTMLElement = document.createElement("div");
  private messagesContainer: HTMLElement | null = null;
  private isOpen: boolean = false;
  private contentPreview: ContentPreview;
  private draggableManager: DraggableManager;
  private searchResultPreview: SearchResultPreview | null = null;
  private showArtifactsOnly: boolean = false;
  private currentConversationId: string = "";
  private labelEditors: Map<string, EditableLabel> = new Map();

  constructor() {
    this.createDialog();
    this.setupHeader();
    this.contentPreview = new ContentPreview();
    this.draggableManager = new DraggableManager(this.dialog, this.header);
  }

  private async findInputElement(): Promise<Element | null> {
    return document.querySelector('div[enterkeyhint="enter"]');
  }

  private async insertPrompt(text: string): Promise<void> {
    const targetDiv = await this.findInputElement();
    if (!targetDiv) {
      console.error("Input element not found");
      return;
    }

    const paragraphs = targetDiv.querySelectorAll("p");

    if (
      paragraphs.length === 1 &&
      paragraphs[0].hasAttribute("data-placeholder")
    ) {
      // Empty state - replace content
      paragraphs[0].innerHTML = text;
    } else {
      // Has content - append new paragraph
      const newP = document.createElement("p");
      newP.innerHTML = text;
      targetDiv.appendChild(newP);
    }

    (targetDiv as HTMLElement).focus();
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
      width: 800px;
      max-width: 45vw;
    `;

    // Create dialog content container
    this.content.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      position: relative;
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
   * Sets up the header element
   */
  private async setupHeader(): Promise<void> {
    this.header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e5e5e5;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
  }

  /**
   * Sets the associated SearchResultPreview instance
   */
  public setSearchResultPreview(preview: SearchResultPreview): void {
    this.searchResultPreview = preview;
  }

  /**
   * Position the window side-by-side with SearchResultPreview
   */
  private positionSideBySide(): void {
    if (!this.searchResultPreview) return;

    const searchPos = this.searchResultPreview.getPosition();
    const searchDim = this.searchResultPreview.getDimensions();

    // Position to the right of search results with some spacing
    const gap = 20; // Gap between windows
    this.dialog.style.transform = "none";
    this.dialog.style.top = `${searchPos.y}px`;
    this.dialog.style.left = `${searchPos.x + searchDim.width + gap}px`;
  }

  private async createStarButton(messageId: string): Promise<HTMLElement> {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    `;

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    const starButton = document.createElement("div");
    starButton.className = "star-button";
    starButton.innerHTML = "★";
    starButton.title = "Add to Favorites";
    starButton.style.cssText = `
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
      padding: 4px;
      border-radius: 4px;
    `;

    const isStarred = await StarService.isStarred(
      messageId,
      this.currentConversationId
    );
    this.updateStarStyle(starButton, isStarred);

    starButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      const isNowStarred = await StarService.toggleStar(
        messageId,
        this.currentConversationId
      );
      this.updateStarStyle(starButton, isNowStarred);

      // Update label visibility
      if (isNowStarred) {
        const existingLabels = await StarService.getAllLabels();
        this.createLabelEditor(
          container,
          messageId,
          "Favorites",
          existingLabels
        );
      } else {
        // Remove label editor if exists
        this.labelEditors.get(messageId)?.destroy();
        this.labelEditors.delete(messageId);
      }
    });

    const sendButton = document.createElement("div");
    sendButton.innerHTML = "➤";
    sendButton.title = "Send to Input";
    sendButton.style.cssText = `
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
      padding: 4px;
      border-radius: 4px;
      color: #0066cc;
    `;

    sendButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        const textContent = Array.from(
          messageElement.querySelectorAll('div[style*="white-space: pre-wrap"]')
        )
          .map((el) => el.textContent)
          .filter((text) => text)
          .join("\n");

        if (textContent) {
          await this.insertPrompt(textContent.trim());
        }
      }
    });

    buttonsContainer.appendChild(starButton);
    buttonsContainer.appendChild(sendButton);
    container.appendChild(buttonsContainer);

    // Add label if starred
    if (isStarred) {
      const existingLabels = await StarService.getAllLabels();
      const label = await StarService.getMessageLabel(
        messageId,
        this.currentConversationId
      );
      this.createLabelEditor(
        container,
        messageId,
        label || "Favorites",
        existingLabels
      );
    }

    return container;
  }

  private createLabelEditor(
    container: HTMLElement,
    messageId: string,
    initialLabel: string,
    existingLabels: string[]
  ): void {
    const labelContainer = document.createElement("div");
    labelContainer.style.position = "relative";

    const editor = new EditableLabel(
      labelContainer,
      initialLabel,
      existingLabels,
      async (newLabel: string) => {
        await StarService.setMessageLabel(
          messageId,
          this.currentConversationId,
          newLabel
        );
      }
    );

    this.labelEditors.set(messageId, editor);
    container.appendChild(labelContainer);
  }

  private updateStarStyle(starButton: HTMLElement, isStarred: boolean): void {
    starButton.style.color = isStarred ? "#ffd700" : "#e0e0e0";
    starButton.style.textShadow = isStarred ? "0 0 2px #b38f00" : "none";
    starButton.title = isStarred ? "Remove from Favorites" : "Add to Favorites";
  }

  private updateMessagesVisibility(): void {
    if (!this.messagesContainer) return;

    const messages = this.messagesContainer.children;
    for (const message of Array.from(messages)) {
      const artifacts = message.querySelectorAll(".artifact-container");
      const hasArtifacts = artifacts.length > 0;

      if (this.showArtifactsOnly) {
        (message as HTMLElement).style.display = hasArtifacts ? "flex" : "none";
      } else {
        (message as HTMLElement).style.display = "flex";
      }
    }
  }

  /**
   * Shows the preview dialog with conversation content
   */
  public async show(
    title: string,
    messages: ChatMessage[],
    conversationUrl?: string,
    scrollToMessageId?: string,
    conversationId?: string
  ): Promise<void> {
    this.currentConversationId = conversationId || "";

    // Reset content
    this.content.innerHTML = "";
    this.header.innerHTML = "";
    this.labelEditors.clear();

    // Count artifacts
    let artifactCount = 0;
    messages.forEach((message) => {
      message.content.forEach((item) => {
        if (item.type === "tool_use" && item.input) {
          artifactCount++;
        }
      });
    });

    const headerContent = document.createElement("div");
    headerContent.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
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

    const subtitle = document.createElement("div");
    subtitle.style.cssText = `
      font-size: 14px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    subtitle.textContent = `${messages.length} messages, `;

    const artifactInfo = document.createElement("span");
    artifactInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    artifactInfo.innerHTML = `📄 ${artifactCount} artifacts`;

    const filterButton = document.createElement("button");
    filterButton.style.cssText = `
      background: ${this.showArtifactsOnly ? "#e0e0e0" : "transparent"};
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
      cursor: pointer;
      color: #666;
      transition: all 0.2s ease;
      margin-left: 4px;
    `;
    filterButton.textContent = "Filter";
    filterButton.title = "Show artifacts only";

    filterButton.addEventListener("mouseover", () => {
      filterButton.style.backgroundColor = this.showArtifactsOnly
        ? "#d0d0d0"
        : "#f0f0f0";
    });
    filterButton.addEventListener("mouseout", () => {
      filterButton.style.backgroundColor = this.showArtifactsOnly
        ? "#e0e0e0"
        : "transparent";
    });

    filterButton.addEventListener("click", () => {
      this.showArtifactsOnly = !this.showArtifactsOnly;
      filterButton.style.backgroundColor = this.showArtifactsOnly
        ? "#e0e0e0"
        : "transparent";
      this.updateMessagesVisibility();
    });

    artifactInfo.appendChild(filterButton);
    subtitle.appendChild(artifactInfo);

    headerContent.appendChild(titleElement);
    headerContent.appendChild(subtitle);
    this.header.appendChild(headerContent);

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
    for (const message of messages) {
      if (this.messagesContainer) {
        const messageBubble = await this.createMessageBubble(message);
        this.messagesContainer.appendChild(messageBubble);
      }
    }

    // Apply initial visibility based on filter
    this.updateMessagesVisibility();

    // Assemble dialog
    this.content.appendChild(closeButton);
    this.content.appendChild(this.header);
    if (this.messagesContainer) {
      this.content.appendChild(this.messagesContainer);
    }

    // Position side-by-side with search results before showing
    this.positionSideBySide();

    // Show dialog with animation
    this.dialog.style.display = "block";
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
  private async createMessageBubble(
    message: ChatMessage
  ): Promise<HTMLElement> {
    const isHuman = message.sender === "human";

    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: ${isHuman ? "flex-end" : "flex-start"};
      margin-bottom: 16px;
    `;
    container.id = `message-${message.uuid}`;

    const bubbleRow = document.createElement("div");
    bubbleRow.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex-direction: ${isHuman ? "row-reverse" : "row"};
    `;

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

    bubbleRow.appendChild(bubble);

    // Add star button
    const starButton = await this.createStarButton(message.uuid);
    bubbleRow.appendChild(starButton);

    container.appendChild(bubbleRow);

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
      const isMarkdown =
        input.language === "markdown" ||
        input.type === "text/markdown" ||
        input.language === "text/markdown";

      const extension = isMarkdown
        ? ".md"
        : input.language
        ? ConversationRetrieval["getFileExtension"](input.language)
        : ".txt";

      const fileName = input.title
        ? input.title.endsWith(extension)
          ? input.title
          : input.title + extension
        : "artifact" + extension;

      // Create a markdown-formatted version of the content if it's markdown
      let displayContent = input.content;
      if (isMarkdown) {
        displayContent = [
          `# ${input.title || "Untitled"}`,
          "",
          input.content,
        ].join("\n");
      }

      this.contentPreview.show(fileName, displayContent, fileName);
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
   * Creates an artifact bubble for messages
   */
  private createArtifactBubble(input: ChatMessageInput): HTMLElement {
    const artifactContainer = document.createElement("div");
    artifactContainer.className = "artifact-container"; // Add class for filtering
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
      this.labelEditors.clear();
    }, 200);

    this.isOpen = false;
  }

  /**
   * Cleans up the component
   */
  public destroy(): void {
    this.draggableManager.destroy();
    this.labelEditors.forEach((editor) => editor.destroy());
    this.labelEditors.clear();
    this.dialog.remove();
  }
}
