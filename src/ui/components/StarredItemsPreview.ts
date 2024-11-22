/**
 * Component for displaying starred items from multiple conversations
 */

import type { ChatMessage, Conversation } from "../../types";
import { ContentPreview } from "./ContentPreview";
import { DraggableManager } from "./DraggableManager";
import { StarService } from "../../services/StarService";
import { ConversationRetrieval } from "../../services/ConversationRetrieval";
import { EditableLabel } from "./EditableLabel";
import { ThemeManager, ThemeColors } from "../theme";

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
  private colors: ThemeColors;
  private summarizeDialog: HTMLElement | null = null;

  constructor() {
    this.colors = ThemeManager.getColors();
    this.createDialog();
    this.setupHeader();
    this.contentPreview = new ContentPreview();
    this.draggableManager = new DraggableManager(this.dialog, this.header);

    // Listen for theme changes
    ThemeManager.addThemeChangeListener(() => {
      this.colors = ThemeManager.getColors();
      this.updateTheme();
    });
  }

  private updateTheme(): void {
    if (!this.isOpen) return;

    this.content.style.background = this.colors.background;
    this.header.style.borderBottom = `1px solid ${this.colors.border}`;

    // Update filter container
    if (this.filterContainer) {
      const label = this.filterContainer.querySelector("span");
      if (label) {
        label.style.color = this.colors.text;
      }

      const select = this.filterContainer.querySelector("select");
      if (select) {
        select.style.background = this.colors.inputBg;
        select.style.color = this.colors.text;
        select.style.borderColor = this.colors.border;
      }
    }

    // Update messages
    if (this.messagesContainer) {
      const messages =
        this.messagesContainer.querySelectorAll('[id^="message-"]');
      messages.forEach((message) => {
        const bubble = message.querySelector(
          'div[style*="border-radius: 12px"]'
        ) as HTMLElement;
        if (bubble) {
          const isHuman = bubble.style.background === this.colors.primary;
          if (isHuman) {
            bubble.style.background = this.colors.primary;
            bubble.style.color = "#fff";
          } else {
            bubble.style.background = this.colors.codeBg;
            bubble.style.color = this.colors.text;
          }

          // Update conversation link
          const link = bubble.querySelector("a");
          if (link) {
            link.style.color = isHuman ? "#fff" : this.colors.primary;
          }
        }

        // Update timestamp
        const timestamp = message.querySelector(
          'div[style*="font-size: 0.8em"]'
        ) as HTMLElement;
        if (timestamp) {
          timestamp.style.color = this.colors.text;
        }
      });
    }

    // Update title
    const title = this.header.querySelector("h2");
    if (title) {
      title.style.color = this.colors.text;
    }
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
      background: ${this.colors.background};
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

  private createSummarizeDialog(): void {
    if (this.summarizeDialog) {
      document.body.removeChild(this.summarizeDialog);
    }

    this.summarizeDialog = document.createElement("div");
    this.summarizeDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${this.colors.background};
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000004;
      width: 500px;
      display: none;
    `;

    const title = document.createElement("h3");
    title.textContent = "Summarize Messages";
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: ${this.colors.text};
      font-size: 18px;
    `;

    const textarea = document.createElement("textarea");
    textarea.value =
      "Create a markdown artifact  that presents the following messages from conversations between a human and an AI assistant, in a structured way, being careful not to omit any critical information:\n";
    textarea.style.cssText = `
      width: 100%;
      min-height: 100px;
      padding: 8px;
      margin-bottom: 16px;
      border: 1px solid ${this.colors.border};
      border-radius: 4px;
      background: ${this.colors.inputBg};
      color: ${this.colors.text};
      resize: vertical;
      font-family: inherit;
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    `;

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText = `
      padding: 8px 16px;
      border: 1px solid ${this.colors.border};
      border-radius: 4px;
      background: transparent;
      color: ${this.colors.text};
      cursor: pointer;
    `;

    const createButton = document.createElement("button");
    createButton.textContent = "Create Artifact";
    createButton.style.cssText = `
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: ${this.colors.primary};
      color: white;
      cursor: pointer;
    `;

    cancelButton.addEventListener("click", () => {
      if (this.summarizeDialog) {
        this.summarizeDialog.style.display = "none";
      }
    });

    createButton.addEventListener("click", async () => {
      if (!this.messagesContainer) return;

      let messages = "";
      const visibleMessages = Array.from(
        this.messagesContainer.children
      ).filter((m) => (m as HTMLElement).style.display !== "none");

      visibleMessages.forEach((messageEl) => {
        const bubble = messageEl.querySelector(
          'div[style*="border-radius: 12px"]'
        ) as HTMLElement;
        if (bubble) {
          const link = bubble.querySelector("a");
          if (link) {
            messages += `From conversation "${link.textContent}":\n`;
          }

          const textDivs = bubble.querySelectorAll("div");
          textDivs.forEach((div) => {
            if (div.textContent) {
              messages += div.textContent + "\n\n";
            }
          });
        }
      });

      const prompt = textarea.value + "\n\n" + messages.trim();
      await this.insertPrompt(prompt);
      await this.simulateEnterKey(await this.findInputElement());

      if (this.summarizeDialog) {
        this.summarizeDialog.style.display = "none";
      }
    });

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(createButton);

    this.summarizeDialog.appendChild(title);
    this.summarizeDialog.appendChild(textarea);
    this.summarizeDialog.appendChild(buttonContainer);

    document.body.appendChild(this.summarizeDialog);
  }

  private async setupHeader(): Promise<void> {
    this.header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid ${this.colors.border};
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
      border-bottom: 1px solid ${this.colors.border};
    `;

    const label = document.createElement("span");
    label.textContent = "Filter by label:";
    label.style.color = this.colors.text;

    const select = document.createElement("select");
    select.style.cssText = `
      padding: 4px 8px;
      border: 1px solid ${this.colors.border};
      border-radius: 4px;
      background: ${this.colors.inputBg};
      color: ${this.colors.text};
    `;

    // Add "All" option
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All";
    select.appendChild(allOption);

    // Add label options
    const labels = await StarService.getAllLabels();
    if (!labels.includes("Favorites")) {
      labels.unshift("Favorites");
    }
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

    // Create summarize button
    const summarizeButton = document.createElement("button");
    summarizeButton.textContent = "Summarize";
    summarizeButton.style.cssText = `
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: ${this.colors.primary};
      color: white;
      cursor: pointer;
      font-size: 14px;
      margin-left: auto;
    `;
    summarizeButton.addEventListener("click", () => {
      this.createSummarizeDialog();
      if (this.summarizeDialog) {
        this.summarizeDialog.style.display = "block";
      }
    });

    container.appendChild(label);
    container.appendChild(select);
    container.appendChild(summarizeButton);

    return container;
  }

  private async findInputElement(): Promise<Element> {
    const targetDiv = document.querySelector('div[enterkeyhint="enter"]');
    if (!targetDiv) {
      throw new Error("Input element not found");
    }
    return targetDiv;
  }

  private async insertPrompt(text: string): Promise<void> {
    const targetDiv = await this.findInputElement();
    const paragraphs = targetDiv.querySelectorAll("p");

    if (
      paragraphs.length === 1 &&
      paragraphs[0].hasAttribute("data-placeholder")
    ) {
      paragraphs[0].innerHTML = text;
    } else {
      const newP = document.createElement("p");
      newP.innerHTML = text;
      targetDiv.appendChild(newP);
    }

    (targetDiv as HTMLElement).focus();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private simulateEnterKey(element: Element): void {
    const events = [
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
      }),
      new KeyboardEvent("keypress", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
      }),
      new KeyboardEvent("keyup", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
      }),
    ];

    events.forEach((event) => element.dispatchEvent(event));
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
      color: ${this.colors.star};
      text-shadow: 0 0 2px ${this.colors.starShadow};
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
      color: ${this.colors.primary};
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
    if (!existingLabels.includes("Favorites")) {
      existingLabels.unshift("Favorites");
    }
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
          background: ${this.colors.primary};
          color: white;
          border-bottom-right-radius: 4px;
        `
          : `
          background: ${this.colors.codeBg};
          color: ${this.colors.text};
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
      color: ${isHuman ? "#fff" : this.colors.primary};
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
      color: ${this.colors.text};
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

  private createLoadingContent(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      min-height: 200px;
      color: ${this.colors.text};
    `;

    const loadingText = document.createElement("div");
    loadingText.textContent = "Loading starred messages...";
    loadingText.style.cssText = `
      font-size: 16px;
      margin-bottom: 16px;
    `;

    const spinner = document.createElement("div");
    spinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 3px solid ${this.colors.border};
      border-top-color: ${this.colors.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // Add keyframes for spinner animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    container.appendChild(loadingText);
    container.appendChild(spinner);

    return container;
  }

  public async show(): Promise<void> {
    // Reset content and show loading state immediately
    this.content.innerHTML = "";
    this.header.innerHTML = "";
    this.labelEditors.clear();

    // Create and show header
    const headerContent = document.createElement("div");
    headerContent.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
    `;

    const titleElement = document.createElement("h2");
    titleElement.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: ${this.colors.text};
    `;
    titleElement.textContent = "Starred Messages";

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: ${this.colors.text};
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
    `;
    closeButton.addEventListener("mouseover", () => {
      closeButton.style.backgroundColor = this.colors.hoverBg;
    });
    closeButton.addEventListener("mouseout", () => {
      closeButton.style.backgroundColor = "transparent";
    });
    closeButton.addEventListener("click", () => this.close());

    headerContent.appendChild(titleElement);
    headerContent.appendChild(closeButton);
    this.header.appendChild(headerContent);

    // Show loading content
    const loadingContent = this.createLoadingContent();

    // Assemble initial dialog
    this.content.appendChild(this.header);
    this.content.appendChild(loadingContent);

    // Show dialog with animation
    this.dialog.style.display = "block";
    this.dialog.style.opacity = "0";

    setTimeout(() => {
      this.dialog.style.transition = "opacity 0.2s ease-out";
      this.dialog.style.opacity = "1";
    }, 0);

    this.isOpen = true;

    // Start loading data
    try {
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

      // Replace loading content with actual content
      this.content.innerHTML = "";
      this.content.appendChild(this.header);

      if (this.filterContainer) {
        this.content.appendChild(this.filterContainer);
      }

      if (this.messagesContainer) {
        this.content.appendChild(this.messagesContainer);

        // Add messages
        for (const message of starredMessages) {
          const messageBubble = await this.createMessageBubble(message);
          this.messagesContainer.appendChild(messageBubble);
        }

        // Apply initial visibility based on filter
        this.updateMessagesVisibility();
      }
    } catch (error) {
      console.error("Error loading starred messages:", error);
      loadingContent.innerHTML = `
        <div style="color: ${this.colors.text}; text-align: center;">
          Error loading starred messages. Please try again.
        </div>
      `;
    }
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
    ThemeManager.removeThemeChangeListener(() => {
      this.colors = ThemeManager.getColors();
      this.updateTheme();
    });
    this.draggableManager.destroy();
    this.labelEditors.forEach((editor) => editor.destroy());
    this.labelEditors.clear();
    if (this.summarizeDialog) {
      document.body.removeChild(this.summarizeDialog);
    }
    this.dialog.remove();
  }
}
