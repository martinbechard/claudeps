/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/ui/components/DownloadWidgets.ts
 */

import type { SearchResultInfo } from "../../types";
import { EditableCell } from "./EditableCell";
import { ProjectSearchService } from "../../services/ProjectSearchService";
import { SearchResultPreview } from "./SearchResultPreview";
import { ThemeManager } from "../theme";

// Base styles that don't depend on theme
const baseStyles = {
  spacing: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  borderRadius: "4px",
  fontSize: {
    sm: "12px",
    md: "14px",
    lg: "16px",
  },
};

// Get fresh theme colors
function getThemeColors() {
  const colors = ThemeManager.getColors();
  const isDark = ThemeManager.getCurrentTheme() === "dark";
  return {
    primary: isDark ? "#66b3ff" : colors.primary, // Brighter blue for dark mode
    primaryHover: "#0052a3",
    border: colors.border,
    text: colors.text,
    background: colors.background,
    headerBg: colors.headerBg,
    error: "#dc3545",
    errorBackground: "#f8d7da",
    warning: "#ffc107",
    warningBackground: "#fff3cd",
  };
}

/**
 * Creates a styled table cell
 */
export function createTableCell(isHeader = false): HTMLTableCellElement {
  const colors = getThemeColors();
  const cell = document.createElement(isHeader ? "th" : "td");

  const updateStyles = () => {
    const colors = getThemeColors();
    cell.style.cssText = `
      padding: ${baseStyles.spacing.md};
      border: 1px solid ${colors.border};
      font-size: ${baseStyles.fontSize.sm};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: ${colors.text};
      ${isHeader ? `background-color: ${colors.headerBg};` : ""}
      ${isHeader ? "font-weight: 600;" : ""}
    `;
  };

  updateStyles();
  ThemeManager.addThemeChangeListener(() => updateStyles());

  return cell;
}

/**
 * Creates a checkbox cell with consistent styling
 */
export function createCheckboxCell(
  isSelected: boolean = false
): HTMLTableCellElement {
  const cell = createTableCell();
  cell.style.textAlign = "center";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isSelected;

  cell.appendChild(checkbox);
  return cell;
}

/**
 * Creates a styled empty state message
 */
export function createEmptyState(message: string): HTMLDivElement {
  const colors = getThemeColors();
  const container = document.createElement("div");

  const updateStyles = () => {
    const colors = getThemeColors();
    container.style.cssText = `
      text-align: center;
      padding: ${baseStyles.spacing.xl};
      color: ${colors.text};
      background-color: ${colors.background};
      border: 1px solid ${colors.border};
      border-radius: ${baseStyles.borderRadius};
      margin-top: ${baseStyles.spacing.lg};
    `;
  };

  updateStyles();
  ThemeManager.addThemeChangeListener(() => updateStyles());

  container.textContent = message;
  return container;
}

/**
 * Creates a styled link element
 */
export function createLink(text: string, url: string): HTMLAnchorElement {
  const colors = getThemeColors();
  const link = document.createElement("a");
  link.href = url;
  link.textContent = text;
  link.target = "_blank";

  // Apply initial styles immediately
  link.style.cssText = `
    color: ${colors.primary};
    text-decoration: none;
    margin-right: ${baseStyles.spacing.md};
    font-size: ${baseStyles.fontSize.md};
  `;

  const updateStyles = () => {
    const colors = getThemeColors();
    link.style.cssText = `
      color: ${colors.primary};
      text-decoration: none;
      margin-right: ${baseStyles.spacing.md};
      font-size: ${baseStyles.fontSize.md};
    `;
  };

  ThemeManager.addThemeChangeListener(() => updateStyles());

  link.addEventListener("mouseover", () => {
    link.style.textDecoration = "underline";
  });

  link.addEventListener("mouseout", () => {
    link.style.textDecoration = "none";
  });

  return link;
}

/**
 * Creates a styled button element
 */
export function createButton(
  text: string,
  onClick: () => void,
  options: { variant?: "primary" | "secondary" | "icon" | "danger" } = {}
): HTMLButtonElement {
  const colors = getThemeColors();
  const button = document.createElement("button");
  button.textContent = text;

  const buttonBaseStyles = `
    cursor: pointer;
    border: none;
    font-size: ${baseStyles.fontSize.md};
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;

  let variantStyles = "";
  switch (options.variant) {
    case "secondary":
      variantStyles = `
        background: ${colors.background};
        color: ${colors.text};
        padding: ${baseStyles.spacing.md} ${baseStyles.spacing.xl};
        border-radius: ${baseStyles.borderRadius};
        border: 1px solid ${colors.border};
      `;
      break;
    case "icon":
      variantStyles = `
        background: none;
        color: ${colors.text};
        padding: ${baseStyles.spacing.sm};
      `;
      break;
    case "danger":
      variantStyles = `
        background: ${colors.error};
        color: white;
        padding: ${baseStyles.spacing.md} ${baseStyles.spacing.xl};
        border-radius: ${baseStyles.borderRadius};
      `;
      break;
    default: // primary
      variantStyles = `
        background: ${colors.primary};
        color: white;
        padding: ${baseStyles.spacing.md} ${baseStyles.spacing.xl};
        border-radius: ${baseStyles.borderRadius};
      `;
  }

  // Apply initial styles immediately
  button.style.cssText = buttonBaseStyles + variantStyles;

  const updateStyles = () => {
    const colors = getThemeColors();
    let variantStyles = "";
    switch (options.variant) {
      case "secondary":
        variantStyles = `
          background: ${colors.background};
          color: ${colors.text};
          padding: ${baseStyles.spacing.md} ${baseStyles.spacing.xl};
          border-radius: ${baseStyles.borderRadius};
          border: 1px solid ${colors.border};
        `;
        break;
      case "icon":
        variantStyles = `
          background: none;
          color: ${colors.text};
          padding: ${baseStyles.spacing.sm};
        `;
        break;
      case "danger":
        variantStyles = `
          background: ${colors.error};
          color: white;
          padding: ${baseStyles.spacing.md} ${baseStyles.spacing.xl};
          border-radius: ${baseStyles.borderRadius};
        `;
        break;
      default: // primary
        variantStyles = `
          background: ${colors.primary};
          color: white;
          padding: ${baseStyles.spacing.md} ${baseStyles.spacing.xl};
          border-radius: ${baseStyles.borderRadius};
        `;
    }
    button.style.cssText = buttonBaseStyles + variantStyles;
  };

  ThemeManager.addThemeChangeListener(() => updateStyles());

  button.addEventListener("mouseover", () => {
    const colors = getThemeColors();
    if (options.variant === "icon") {
      button.style.color = colors.primary;
    } else if (options.variant === "secondary") {
      button.style.backgroundColor = colors.headerBg;
    } else if (options.variant === "danger") {
      button.style.backgroundColor = colors.errorBackground;
    } else {
      button.style.backgroundColor = colors.primaryHover;
    }
  });

  button.addEventListener("mouseout", () => {
    updateStyles();
  });

  button.addEventListener("click", onClick);
  return button;
}

/**
 * Creates a container for buttons with consistent styling
 */
export function createButtonContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: row;
    gap: ${baseStyles.spacing.md};
    margin-top: ${baseStyles.spacing.lg};
    justify-content: flex-start;
  `;
  return container;
}

/**
 * Creates a date cell with consistent formatting
 */
export function createDateCell(date: string | undefined): HTMLTableCellElement {
  const cell = createTableCell();

  if (date) {
    const formattedDate = new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    cell.textContent = formattedDate;
    cell.title = new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  }

  const updateStyles = () => {
    const colors = getThemeColors();
    const existingStyles = cell.style.cssText;
    cell.style.cssText = `
      ${existingStyles}
      color: ${colors.text};
      font-size: ${baseStyles.fontSize.sm};
      text-align: center;
    `;
  };

  updateStyles();
  ThemeManager.addThemeChangeListener(() => updateStyles());

  return cell;
}

/**
 * Creates a preview (eye) icon SVG element
 */
export function createPreviewIcon({
  size = 16,
  color,
}: {
  size?: number;
  color?: string;
} = {}): SVGElement {
  const colors = getThemeColors();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size.toString());
  svg.setAttribute("height", size.toString());
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", color || colors.text);
  svg.setAttribute("stroke-width", "2");
  svg.innerHTML = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  `;

  if (!color) {
    ThemeManager.addThemeChangeListener(() => {
      const colors = getThemeColors();
      svg.setAttribute("stroke", colors.text);
    });
  }

  return svg;
}

/**
 * Creates an error icon SVG element
 */
function createErrorIcon({
  size = 16,
  color,
}: {
  size?: number;
  color?: string;
} = {}): SVGElement {
  const colors = getThemeColors();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size.toString());
  svg.setAttribute("height", size.toString());
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", color || colors.error);
  svg.setAttribute("stroke-width", "2");
  svg.innerHTML = `
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  `;
  return svg;
}

/**
 * Creates a preview button with icon
 */
export function createPreviewButton(onClick: () => void): HTMLButtonElement {
  const button = createButton("", onClick, { variant: "icon" });
  button.title = "Preview conversation";
  button.appendChild(createPreviewIcon());
  return button;
}

/**
 * Creates a name cell with preview and edit functionality
 */
export function createNameCell(
  name: string,
  url?: string,
  onPreview?: () => void,
  onRename?: (newName: string) => void
): HTMLTableCellElement {
  const cell = createTableCell();
  let currentContent: HTMLElement;

  function createNormalView(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${baseStyles.spacing.md};
    `;

    if (url) {
      container.appendChild(createLink(name, url));
    } else {
      const text = document.createElement("span");
      text.textContent = name;
      const colors = getThemeColors();
      text.style.color = colors.text;

      const updateStyles = () => {
        const colors = getThemeColors();
        text.style.color = colors.text;
      };
      ThemeManager.addThemeChangeListener(() => updateStyles());
      container.appendChild(text);
    }

    if (onPreview) {
      container.appendChild(createPreviewButton(onPreview));
    }

    if (onRename) {
      container.appendChild(createEditButton(() => switchToEditMode()));
    }

    return container;
  }

  function switchToEditMode(): void {
    const editableCell = new EditableCell({
      initialValue: name,
      validator: validateFilePath,
      onSave: (newValue) => {
        onRename?.(newValue);
        switchToNormalMode();
      },
      onCancel: () => switchToNormalMode(),
    });

    currentContent.replaceWith(editableCell.getElement());
    currentContent = editableCell.getElement();
    editableCell.focus();
  }

  function switchToNormalMode(): void {
    const normalView = createNormalView();
    currentContent.replaceWith(normalView);
    currentContent = normalView;
  }

  currentContent = createNormalView();
  cell.appendChild(currentContent);

  return cell;
}

/**
 * Creates a cell displaying search result information with expandable content
 */
export function createSearchResultCell(
  searchResult?: SearchResultInfo,
  error?: string,
  preview?: SearchResultPreview,
  allResults?: SearchResultInfo[]
): HTMLTableCellElement {
  const cell = createTableCell();
  const colors = getThemeColors();

  // Handle working state
  if (error === "Working..." || error === "Cancelling...") {
    const workingContainer = document.createElement("div");
    const isWorking = error === "Working...";

    const updateStyles = () => {
      const colors = getThemeColors();
      workingContainer.style.cssText = `
        padding: ${baseStyles.spacing.md};
        color: ${colors.text};
        font-size: ${baseStyles.fontSize.sm};
        background: ${colors.headerBg};
        border-radius: ${baseStyles.borderRadius};
        border-left: 3px solid ${colors.text};
        display: flex;
        align-items: center;
        gap: ${baseStyles.spacing.md};
      `;
    };

    updateStyles();
    ThemeManager.addThemeChangeListener(() => updateStyles());

    const statusContainer = document.createElement("div");
    statusContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${baseStyles.spacing.md};
    `;

    const spinner = document.createElement("div");
    const updateSpinnerStyles = () => {
      const colors = getThemeColors();
      spinner.style.cssText = `
        width: 12px;
        height: 12px;
        border: 2px solid ${colors.text};
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `;
    };

    updateSpinnerStyles();
    ThemeManager.addThemeChangeListener(() => updateSpinnerStyles());

    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    statusContainer.appendChild(spinner);
    statusContainer.appendChild(document.createTextNode(error));
    workingContainer.appendChild(statusContainer);

    cell.appendChild(workingContainer);
    return cell;
  }

  // Handle error state
  if (error && error !== "No match found") {
    const errorContainer = document.createElement("div");
    errorContainer.style.cssText = `
      padding: ${baseStyles.spacing.md};
      color: ${colors.error};
      font-size: ${baseStyles.fontSize.sm};
      background: ${colors.errorBackground};
      border-radius: ${baseStyles.borderRadius};
      border-left: 3px solid ${colors.error};
      display: flex;
      align-items: center;
      gap: ${baseStyles.spacing.md};
      cursor: pointer;
    `;

    const errorButton = createButton(
      "",
      () => {
        preview?.show(error);
      },
      { variant: "icon" }
    );
    errorButton.title = "View error details";
    errorButton.appendChild(createErrorIcon());

    errorContainer.appendChild(errorButton);
    errorContainer.appendChild(document.createTextNode(error));

    cell.appendChild(errorContainer);
    return cell;
  }

  // Handle "No match found" state
  if (error === "No match found") {
    const noMatchContainer = document.createElement("div");
    noMatchContainer.style.cssText = `
      padding: ${baseStyles.spacing.md};
      color: ${colors.warning};
      font-size: ${baseStyles.fontSize.sm};
      background: ${colors.warningBackground};
      border-radius: ${baseStyles.borderRadius};
      border-left: 3px solid ${colors.warning};
    `;
    noMatchContainer.textContent = "No match found";
    cell.appendChild(noMatchContainer);
    return cell;
  }

  if (!searchResult) {
    return cell;
  }

  // Create clickable container for search result
  const container = document.createElement("div");

  const updateStyles = () => {
    const colors = getThemeColors();
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: ${baseStyles.spacing.sm};
      max-width: 400px;
      min-width: 200px;
      cursor: pointer;
      padding: ${baseStyles.spacing.md};
      border-radius: ${baseStyles.borderRadius};
      transition: background-color 0.2s ease;
    `;
  };

  updateStyles();
  ThemeManager.addThemeChangeListener(() => updateStyles());

  // Add hover effect
  container.addEventListener("mouseover", () => {
    const colors = getThemeColors();
    container.style.backgroundColor = colors.headerBg;
  });
  container.addEventListener("mouseout", () => {
    container.style.backgroundColor = "transparent";
  });

  // Add click handler to show preview
  container.addEventListener("click", () => {
    preview?.show(allResults || [searchResult]);
  });

  // Add match reason with truncation
  const reason = document.createElement("div");
  reason.textContent = searchResult.matchReason;

  const updateReasonStyles = () => {
    const colors = getThemeColors();
    reason.style.cssText = `
      font-size: ${baseStyles.fontSize.sm};
      color: ${colors.text};
      line-height: 1.4;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    `;
  };

  updateReasonStyles();
  ThemeManager.addThemeChangeListener(() => updateReasonStyles());

  container.appendChild(reason);

  // Add snippet preview with truncation
  const snippet = document.createElement("div");
  snippet.textContent = searchResult.relevantSnippet;

  const updateSnippetStyles = () => {
    const colors = getThemeColors();
    snippet.style.cssText = `
      font-size: ${baseStyles.fontSize.sm};
      color: ${colors.text};
      font-style: italic;
      background: ${colors.headerBg};
      padding: ${baseStyles.spacing.md};
      border-radius: ${baseStyles.borderRadius};
      border-left: 3px solid ${colors.primary};
      line-height: 1.4;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    `;
  };

  updateSnippetStyles();
  ThemeManager.addThemeChangeListener(() => updateSnippetStyles());

  container.appendChild(snippet);

  // Add "Click to view details" hint with result count if multiple
  const hint = document.createElement("div");

  const updateHintStyles = () => {
    const colors = getThemeColors();
    hint.style.cssText = `
      font-size: ${baseStyles.fontSize.sm};
      color: ${colors.primary};
      display: flex;
      align-items: center;
      gap: ${baseStyles.spacing.sm};
    `;
  };

  updateHintStyles();
  ThemeManager.addThemeChangeListener(() => updateHintStyles());

  hint.appendChild(createPreviewIcon({ color: colors.primary }));

  const resultCount = allResults?.length || 1;
  hint.appendChild(
    document.createTextNode(
      resultCount > 1
        ? `Click to view ${resultCount} results`
        : "Click to view details"
    )
  );
  container.appendChild(hint);

  cell.appendChild(container);
  return cell;
}

/**
 * Creates an edit icon SVG element
 */
function createEditIcon({
  size = 16,
  color,
}: {
  size?: number;
  color?: string;
} = {}): SVGElement {
  const colors = getThemeColors();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size.toString());
  svg.setAttribute("height", size.toString());
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", color || colors.text);
  svg.setAttribute("stroke-width", "2");
  svg.innerHTML = `
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  `;

  if (!color) {
    ThemeManager.addThemeChangeListener(() => {
      const colors = getThemeColors();
      svg.setAttribute("stroke", colors.text);
    });
  }

  return svg;
}

/**
 * Creates an edit button with icon
 */
function createEditButton(onClick: () => void): HTMLButtonElement {
  const button = createButton("", onClick, { variant: "icon" });
  button.title = "Edit name";
  button.appendChild(createEditIcon());
  return button;
}

/**
 * Validates a file path
 */
function validateFilePath(value: string): string | null {
  if (!value) {
    return "Path cannot be empty";
  }

  // Check for invalid characters
  const invalidChars = /[\x00-\x1F]/g; // Allow slashes and other path chars
  if (invalidChars.test(value)) {
    return "Path contains invalid characters";
  }

  return null;
}
