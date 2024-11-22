/**
 * Component for displaying starred items from multiple conversations
 */

import type { ChatMessage, Conversation } from "../../types";
import { ContentPreview } from "./ContentPreview";
import { DraggableManager } from "./DraggableManager";
import { StarService } from "../../services/StarService";
import { ConversationRetrieval } from "../../services/ConversationRetrieval";
import { EditableLabel } from "./EditableLabel";

interface StarredMessage extends ChatMessage {
  conversationTitle: string;
  conversationUrl: string;
  conversationId: string;
  label: string;
}

export class StarredItemsPreview {
  private dialog: HTMLElement = document.createElement("div");
  private content: HTMLElement = document.createElement("div");
  private header: HTMLElement = document.createElement("div");
  private messagesContainer: HTMLElement | null = null;
  private filterContainer: HTMLElement | null = null;
  private isOpen: boolean = false;
  private contentPreview: ContentPreview;
  private draggableManager: DraggableManager;
  private labelEditors: Map<string, EditableLabel> = new Map();
  private labelFilter: string = "";

  constructor() {
    this.createDialog();
    this.setupHeader();
    this.contentPreview = new ContentPreview();
    this.draggableManager = new DraggableManager(this.dialog, this.header);
  }

  private createDialog(): void {
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

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

  private async createLabelFilter(): Promise<HTMLElement> {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e5e5;
    `;

    const label = document.createElement("span");
    label.textContent = "Filter by label:";
    label.style.color = "#666";

    const select = document.createElement("select");
    select.style.cssText = `
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    `;

    // Add "All" option
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All";
    select.appendChild(allOption);

    // Add label options
    const labels = await StarService.getAllLabels();
    labels.forEach((labelText) => {
      const option = document.createElement("option");
      option.value = labelText;
      option.textContent = labelText;
      select.appendChild(option);
    });

    select.value = this.labelFilter;
    select.addEventListener("change", () => {
      this.labelFilter = select.value;
      this.updateMessagesVisibility();
    });

    container.appendChild(label);
    container.appendChild(select);

    return container;
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

  private async createStarButton(
    messageId: string,
    conversationId: string,
    message: StarredMessage
  ): Promise<HTMLElement> {
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
    starButton.title = "Remove from Favorites";
    starButton.style.cssText = `
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
      padding: 4px;
      border-radius: 4px;
      color: #ffd700;
      text-shadow: 0 0 2px #b38f00;
    `;

    starButton.addEventListener("click", async () => {
      await StarService.toggleStar(messageId, conversationId);
      // Remove the message from view
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.remove();
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

    sendButton.addEventListener("click", async () => {
      let content = "";

      // Add message content
      message.content.forEach((item) => {
        if (item.type === "text" && item.text) {
          content += item.text + "\n";
        } else if (item.type === "tool_result" && item.content) {
          item.content.forEach((c) => {
            if (typeof c === "string") {
              content += c + "\n";
            }
          });
        }
      });

      // Add artifacts if any
      if (message.files && message.files.length > 0) {
        content += "\nAttachments:\n";
        message.files.forEach((file) => {
          if (file.extracted_content) {
            content += `\n${file.file_name}:\n${file.extracted_content}\n`;
          }
        });
      }

      await this.insertPrompt(content.trim());
    });

    buttonsContainer.appendChild(starButton);
    buttonsContainer.appendChild(sendButton);
    container.appendChild(buttonsContainer);

    // Add label editor
    const existingLabels = await StarService.getAllLabels();
    const label = await StarService.getMessageLabel(messageId, conversationId);
    this.createLabelEditor(
      container,
      messageId,
      conversationId,
      label,
      existingLabels
    );

    return container;
  }

  private createLabelEditor(
    container: HTMLElement,
    messageId: string,
    conversationId: string,
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
        await StarService.setMessageLabel(messageId, conversationId, newLabel);
        this.updateMessagesVisibility();
      }
    );

    this.labelEditors.set(messageId, editor);
    container.appendChild(labelContainer);
  }

  private updateMessagesVisibility(): void {
    if (!this.messagesContainer) return;

    const messages = this.messagesContainer.children;
    for (const message of Array.from(messages)) {
      const labelEditor = this.labelEditors.get(
        message.id.replace("message-", "")
      );
      const messageLabel = labelEditor?.getCurrentLabel() || "Favorites";

      if (this.labelFilter && messageLabel !== this.labelFilter) {
        (message as HTMLElement).style.display = "none";
      } else {
        (message as HTMLElement).style.display = "flex";
      }
    }
  }

  private async createMessageBubble(
    message: StarredMessage
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
      width: 100%;
    `;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      flex: 1;
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

    // Add conversation link
    const conversationLink = document.createElement("a");
    conversationLink.href = message.conversationUrl;
    conversationLink.target = "_blank";
    conversationLink.style.cssText = `
      display: block;
      color: ${isHuman ? "#fff" : "#0066cc"};
      text-decoration: none;
      font-weight: 500;
      margin-bottom: 8px;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    `;
    conversationLink.textContent = message.conversationTitle;
    conversationLink.addEventListener("mouseover", () => {
      conversationLink.style.opacity = "1";
    });
    conversationLink.addEventListener("mouseout", () => {
      conversationLink.style.opacity = "0.8";
    });
    bubble.appendChild(conversationLink);

    // Add message content
    message.content.forEach((item) => {
      if (item.type === "text" && item.text) {
        const textDiv = document.createElement("div");
        textDiv.style.whiteSpace = "pre-wrap";
        textDiv.textContent = item.text;
        bubble.appendChild(textDiv);
      }
    });

    bubbleRow.appendChild(bubble);

    // Add star button
    const starButton = await this.createStarButton(
      message.uuid,
      message.conversationId,
      message
    );
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

  public async show(): Promise<void> {
    // Reset content
    this.content.innerHTML = "";
    this.header.innerHTML = "";
    this.labelEditors.clear();

    // Create header content
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
    titleElement.textContent = "Starred Messages";

    headerContent.appendChild(titleElement);
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

    // Create filter container
    this.filterContainer = await this.createLabelFilter();

    // Create messages container
    this.messagesContainer = document.createElement("div");
    this.messagesContainer.style.cssText = `
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      min-height: 200px;
      max-height: calc(80vh - 160px);
    `;

    // Get starred messages
    const starredItems = await StarService.getStarred();
    const starredMessages: StarredMessage[] = [];

    // Fetch conversations and extract messages
    for (const item of starredItems) {
      try {
        const conversation = await ConversationRetrieval.getConversation(
          ConversationRetrieval.getOrganizationId(),
          item.conversationId
        );

        const message = conversation.chat_messages.find(
          (m) => m.uuid === item.messageId
        );
        if (message) {
          starredMessages.push({
            ...message,
            conversationTitle: conversation.name,
            conversationUrl: `https://claude.ai/chat/${conversation.uuid}`,
            conversationId: conversation.uuid,
            label: item.label,
          });
        }
      } catch (error) {
        console.error(
          `Error fetching conversation ${item.conversationId}:`,
          error
        );
      }
    }

    // Sort messages by date
    starredMessages.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Add messages
    for (const message of starredMessages) {
      const messageBubble = await this.createMessageBubble(message);
      if (this.messagesContainer) {
        this.messagesContainer.appendChild(messageBubble);
      }
    }

    // Apply initial visibility based on filter
    this.updateMessagesVisibility();

    // Assemble dialog
    this.content.appendChild(closeButton);
    this.content.appendChild(this.header);
    if (this.filterContainer) {
      this.content.appendChild(this.filterContainer);
    }
    if (this.messagesContainer) {
      this.content.appendChild(this.messagesContainer);
    }

    // Show dialog with animation
    this.dialog.style.display = "block";
    this.dialog.style.opacity = "0";

    setTimeout(() => {
      this.dialog.style.transition = "opacity 0.2s ease-out";
      this.dialog.style.opacity = "1";
    }, 0);

    this.isOpen = true;
  }

  public close(): void {
    if (!this.isOpen) return;

    this.dialog.style.opacity = "0";
    setTimeout(() => {
      this.dialog.style.display = "none";
      this.content.innerHTML = "";
      this.messagesContainer = null;
      this.filterContainer = null;
      this.labelEditors.clear();
    }, 200);

    this.isOpen = false;
  }

  public destroy(): void {
    this.draggableManager.destroy();
    this.labelEditors.forEach((editor) => editor.destroy());
    this.labelEditors.clear();
    this.dialog.remove();
  }
}
