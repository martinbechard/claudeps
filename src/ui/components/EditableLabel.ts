import { ThemeManager } from "../theme";

export class EditableLabel {
  private container: HTMLElement;
  private labelText: HTMLElement;
  private editor: HTMLElement | null = null;
  private currentLabel: string;
  private existingLabels: string[] = [];
  private onSave: (label: string) => void;
  private isInitializing: boolean = false;

  constructor(
    container: HTMLElement,
    initialLabel: string,
    existingLabels: string[],
    onSave: (label: string) => void
  ) {
    this.container = container;
    this.currentLabel = initialLabel;
    this.existingLabels = existingLabels;
    this.onSave = onSave;

    this.labelText = document.createElement("div");
    this.updateLabelText(initialLabel);
    this.container.appendChild(this.labelText);
  }

  private updateLabelText(label: string): void {
    const colors = ThemeManager.getColors();

    // Apply initial styles
    this.labelText.style.cssText = `
      font-size: 12px;
      color: ${colors.text};
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    this.labelText.textContent = label;
    this.labelText.title = "Click to edit label";

    // Remove old event listeners
    const newLabel = this.labelText.cloneNode(true) as HTMLElement;
    this.labelText.parentNode?.replaceChild(newLabel, this.labelText);
    this.labelText = newLabel;

    // Add theme change listener
    const updateStyles = () => {
      const colors = ThemeManager.getColors();
      this.labelText.style.color = colors.text;
    };
    ThemeManager.addThemeChangeListener(updateStyles);

    // Add hover events
    this.labelText.addEventListener("mouseover", () => {
      const colors = ThemeManager.getColors();
      this.labelText.style.backgroundColor = colors.headerBg;
    });
    this.labelText.addEventListener("mouseout", () => {
      this.labelText.style.backgroundColor = "transparent";
    });
    this.labelText.addEventListener("click", () => this.startEditing());
  }

  private async startEditing(): Promise<void> {
    if (this.editor) return;

    // Set initializing flag to prevent closing
    this.isInitializing = true;

    // Get the latest labels from StarService
    const StarService = (await import("../../services/StarService"))
      .StarService;
    this.existingLabels = await StarService.getAllLabels();

    const colors = ThemeManager.getColors();
    this.editor = document.createElement("div");
    this.editor.style.cssText = `
      position: absolute;
      background: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000004;
    `;

    // Create input for new label
    const input = document.createElement("input");
    input.type = "text";
    input.value = this.currentLabel;
    input.style.cssText = `
      width: 150px;
      padding: 4px 8px;
      border: none;
      border-bottom: 1px solid ${colors.border};
      outline: none;
      font-size: 12px;
      color: ${colors.text};
      background: ${colors.background};
    `;
    this.editor.appendChild(input);

    // Create list of existing labels
    const labelList = document.createElement("div");
    labelList.style.cssText = `
      max-height: 150px;
      overflow-y: auto;
    `;

    // Add theme change listener for editor
    const updateEditorStyles = () => {
      const colors = ThemeManager.getColors();
      this.editor!.style.background = colors.background;
      this.editor!.style.borderColor = colors.border;
      input.style.color = colors.text;
      input.style.background = colors.background;
      input.style.borderBottomColor = colors.border;
    };
    ThemeManager.addThemeChangeListener(updateEditorStyles);

    this.existingLabels.forEach((label) => {
      const labelOption = document.createElement("div");
      // Apply initial styles
      const updateLabelOptionStyles = () => {
        const colors = ThemeManager.getColors();
        labelOption.style.cssText = `
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
          color: ${colors.text};
        `;
      };
      updateLabelOptionStyles();
      ThemeManager.addThemeChangeListener(updateLabelOptionStyles);

      labelOption.textContent = label;

      labelOption.addEventListener("mouseover", () => {
        const colors = ThemeManager.getColors();
        labelOption.style.backgroundColor = colors.headerBg;
      });
      labelOption.addEventListener("mouseout", () => {
        labelOption.style.backgroundColor = "transparent";
      });
      labelOption.addEventListener("click", () => {
        this.saveLabel(label);
      });

      labelList.appendChild(labelOption);
    });

    this.editor.appendChild(labelList);

    // Position the editor below the label
    const rect = this.labelText.getBoundingClientRect();
    this.editor.style.top = `${rect.bottom + 4}px`;
    this.editor.style.left = `${rect.left}px`;

    // Handle input events
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.saveLabel(input.value.trim());
      } else if (e.key === "Escape") {
        this.closeEditor();
      }
    });

    // Handle clicks outside
    const closeHandler = (e: MouseEvent) => {
      if (
        !this.isInitializing &&
        this.editor &&
        !this.editor.contains(e.target as Node)
      ) {
        this.closeEditor();
        document.removeEventListener("click", closeHandler);
      }
    };

    // Add editor to DOM
    document.body.appendChild(this.editor);

    // Set up click handler
    document.addEventListener("click", closeHandler);

    // Focus and select input text
    input.focus();
    input.select();

    // Clear initializing flag after setup is complete
    setTimeout(() => {
      this.isInitializing = false;
    }, 0);
  }

  private saveLabel(label: string): void {
    if (label && label !== this.currentLabel) {
      this.currentLabel = label;
      this.updateLabelText(label);
      this.onSave(label);
    }
    this.closeEditor();
  }

  private closeEditor(): void {
    if (this.editor && !this.isInitializing) {
      this.editor.remove();
      this.editor = null;
    }
  }

  public getCurrentLabel(): string {
    return this.currentLabel;
  }

  public destroy(): void {
    this.closeEditor();
    this.container.remove();
  }
}
