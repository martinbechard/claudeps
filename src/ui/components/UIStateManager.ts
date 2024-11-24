/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/ui/components/UIStateManager.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Manages UI state and logging for the Claude extension
 * Note: Making your UI state as predictable as a well-written script!
 */

import type { StatusManager } from "./StatusManager";
import type { FloatingWindowElements } from "../../types";
import { WindowStateService } from "../../services/WindowStateService";
import { StorageService } from "../../services/StorageService";
import { trace, DEBUG_KEYS } from "../../utils/trace";

export class UIStateManager {
  private readonly elements: FloatingWindowElements;
  private readonly statusManager: StatusManager;
  private isMinimized: boolean;
  private isCollapsed: boolean;
  private resizeObserver: ResizeObserver | null;
  private lastWidth: string;
  private lastHeight: string;

  constructor(elements: FloatingWindowElements, statusManager: StatusManager) {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.constructor Enter");
    this.elements = elements;
    this.statusManager = statusManager;
    // Initialize all private members
    this.isMinimized = false;
    this.isCollapsed = false;
    this.resizeObserver = null;
    this.lastWidth = "";
    this.lastHeight = "";

    this.setupResizeObserver();
    this.initializeWindowState();
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.constructor Exit");
  }

  /**
   * Initializes window state from saved state
   */
  private async initializeWindowState(): Promise<void> {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.initializeWindowState Enter");
    const state = await WindowStateService.loadState();
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.initializeWindowState Loading state:",
      state
    );

    // Apply window state
    await WindowStateService.applyState(this.elements.window);
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.initializeWindowState State applied to window"
    );

    // Update local state
    this.isMinimized = state.isMinimized;
    this.isCollapsed = state.isCollapsed;

    // Initialize last known dimensions
    this.lastWidth = this.elements.window.style.width;
    this.lastHeight = this.elements.window.style.height;
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.initializeWindowState Initial dimensions:",
      {
        width: this.lastWidth,
        height: this.lastHeight,
      }
    );

    // Update minimize button state
    this.updateMinimizeButtonState();

    // Update collapse button state
    this.elements.collapseButton.textContent = this.isCollapsed ? "▶" : "▼";
    this.elements.collapseButton.title = this.isCollapsed
      ? "Expand"
      : "Collapse";
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.initializeWindowState Exit - Current state:",
      {
        isMinimized: this.isMinimized,
        isCollapsed: this.isCollapsed,
      }
    );
  }

  /**
   * Updates minimize button appearance based on current state
   */
  private updateMinimizeButtonState(): void {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.updateMinimizeButtonState Enter");
    // When minimized, show expand button
    // When expanded, show minimize button
    this.elements.minimizeButton.textContent = this.isMinimized ? "□" : "_";
    this.elements.minimizeButton.title = this.isMinimized
      ? "Expand"
      : "Minimize";
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.updateMinimizeButtonState Exit - Button updated:",
      {
        isMinimized: this.isMinimized,
      }
    );
  }

  /**
   * Sets up observer for window size changes
   */
  private setupResizeObserver(): void {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.setupResizeObserver Enter");
    if (typeof ResizeObserver === "undefined") {
      console.warn("ResizeObserver not supported in this browser");
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.resizeObserver Resize detected, current state:",
        {
          isMinimized: this.isMinimized,
        }
      );

      // Get the last entry since we only care about final size
      const lastEntry = entries[entries.length - 1];
      const element = lastEntry.target as HTMLElement;
      const newWidth = element.style.width;
      const newHeight = element.style.height;

      // Skip geometry save if minimized
      if (this.isMinimized) {
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.resizeObserver Window is minimized, skipping geometry save"
        );
        return;
      }

      // Only save if dimensions actually changed
      if (newWidth !== this.lastWidth || newHeight !== this.lastHeight) {
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.resizeObserver Dimensions changed:",
          {
            oldWidth: this.lastWidth,
            oldHeight: this.lastHeight,
            newWidth,
            newHeight,
          }
        );
        this.lastWidth = newWidth;
        this.lastHeight = newHeight;
        WindowStateService.saveGeometry(newWidth, newHeight);
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.resizeObserver New geometry saved"
        );
      }
    });

    this.resizeObserver.observe(this.elements.window);
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.setupResizeObserver Observer attached to window"
    );

    // Also observe script textarea height
    const scriptContainer = this.elements.scriptText.parentElement;
    if (scriptContainer) {
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.setupResizeObserver Setting up script container observer"
      );
      const scriptObserver = new ResizeObserver((entries) => {
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.scriptObserver Script area resize detected, minimized state:",
          this.isMinimized
        );

        // Skip if minimized
        if (this.isMinimized) {
          trace(
            DEBUG_KEYS.WINDOW,
            "UIStateManager.scriptObserver Window is minimized, skipping script height save"
          );
          return;
        }

        // Get the last entry
        const lastEntry = entries[entries.length - 1];
        const element = lastEntry.target as HTMLElement;
        WindowStateService.saveScriptHeight(element.style.height);
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.scriptObserver Script height saved:",
          element.style.height
        );
      });
      scriptObserver.observe(scriptContainer);
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.setupResizeObserver Script observer attached"
      );
    }
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.setupResizeObserver Exit");
  }

  /**
   * Updates window minimize state and UI
   */
  private async setMinimizedState(shouldMinimize: boolean): Promise<void> {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.setMinimizedState Enter:", {
      shouldMinimize,
      currentlyMinimized: this.isMinimized,
    });

    // Update state first so observers see correct state
    this.isMinimized = shouldMinimize;

    if (shouldMinimize) {
      // Minimize the window
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.setMinimizedState Minimizing window"
      );
      this.elements.window.style.width = "";
      this.elements.window.style.height = "";
      this.elements.window.classList.add("minimized");
    } else {
      // Expand the window
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.setMinimizedState Expanding window"
      );
      this.elements.window.classList.remove("minimized");

      // Load saved state (will use default values of 400x500 if no state exists)
      const state = await WindowStateService.loadState();
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.setMinimizedState Using dimensions:",
        {
          width: state.width,
          height: state.height,
          isFromSavedState: !!(await StorageService.get(
            "claude_extension_window_state"
          )),
        }
      );
      this.elements.window.style.width = state.width; // Default: 400px
      this.elements.window.style.height = state.height; // Default: 500px
    }

    // Update button appearance
    this.updateMinimizeButtonState();

    // Save window state
    WindowStateService.saveWindowState(this.isMinimized, this.isCollapsed);
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.setMinimizedState Window state saved"
    );
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.setMinimizedState Exit - New state:",
      {
        isMinimized: this.isMinimized,
      }
    );
  }

  /**
   * Handles minimize/expand button click
   */
  public handleMinimizeClick(): void {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.handleMinimizeClick Enter");
    // If showing minimize button ("_"), minimize the window
    // If showing expand button ("□"), expand the window
    const shouldMinimize = this.elements.minimizeButton.textContent === "_";
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.handleMinimizeClick Action:", {
      shouldMinimize,
      currentlyMinimized: this.isMinimized,
    });
    this.setMinimizedState(shouldMinimize);
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.handleMinimizeClick Exit");
  }

  /**
   * Toggles the collapse state of the output panel
   */
  public toggleCollapse(): void {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.toggleCollapse Enter");
    this.isCollapsed = !this.isCollapsed;
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.toggleCollapse New state:", {
      isCollapsed: this.isCollapsed,
      isMinimized: this.isMinimized,
    });

    if (this.isCollapsed) {
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.toggleCollapse Collapsing output panel"
      );
      // Store current window height for restoration
      const currentWindowHeight = this.elements.window.style.height;
      if (currentWindowHeight) {
        this.elements.window.dataset.prevHeight = currentWindowHeight;
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.toggleCollapse Stored previous height:",
          currentWindowHeight
        );
      }

      // Store output height for restoration
      const currentOutputHeight = this.elements.output.style.height;
      if (currentOutputHeight) {
        this.elements.output.dataset.prevHeight = currentOutputHeight;
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.toggleCollapse Stored previous output height:",
          currentOutputHeight
        );
      }

      // Collapse output area
      this.elements.output.style.maxHeight = "3em";
      this.elements.output.style.overflowY = "hidden";

      // Shrink window to fit collapsed content
      this.elements.window.style.height = "auto";
      this.elements.window.style.minHeight = "auto";
    } else {
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.toggleCollapse Expanding output panel"
      );
      // Restore window height
      const prevWindowHeight = this.elements.window.dataset.prevHeight;
      if (prevWindowHeight) {
        this.elements.window.style.height = prevWindowHeight;
        this.elements.window.style.minHeight = "200px"; // Restore default min-height
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.toggleCollapse Restored window height:",
          prevWindowHeight
        );
      }

      // Restore output height
      const prevOutputHeight = this.elements.output.dataset.prevHeight;
      if (prevOutputHeight) {
        this.elements.output.style.height = prevOutputHeight;
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.toggleCollapse Restored output height:",
          prevOutputHeight
        );
      }
      this.elements.output.style.maxHeight = "";
      this.elements.output.style.overflowY = "auto";
    }

    this.elements.collapseButton.textContent = this.isCollapsed ? "▶" : "▼";
    this.elements.collapseButton.title = this.isCollapsed
      ? "Expand"
      : "Collapse";

    // Save window state
    WindowStateService.saveWindowState(this.isMinimized, this.isCollapsed);

    // Only save geometry if not minimized
    if (!this.isMinimized) {
      const windowHeight = this.elements.window.style.height;
      if (windowHeight) {
        WindowStateService.saveGeometry(
          this.elements.window.style.width,
          windowHeight
        );
        trace(
          DEBUG_KEYS.WINDOW,
          "UIStateManager.toggleCollapse Saved new geometry:",
          {
            width: this.elements.window.style.width,
            height: windowHeight,
          }
        );
      }
    } else {
      trace(
        DEBUG_KEYS.WINDOW,
        "UIStateManager.toggleCollapse Window is minimized, skipping geometry save"
      );
    }

    trace(DEBUG_KEYS.WINDOW, "UIStateManager.toggleCollapse Exit");
  }

  /**
   * Updates button states based on execution state
   * @param isExecuting - Whether a script is currently executing
   */
  public updateButtonStates(isExecuting: boolean): void {
    this.elements.runButton.textContent = isExecuting ? "Cancel" : "Run Script";
    this.elements.runButton.disabled = false;
    this.elements.scriptText.disabled = isExecuting;
  }

  public setMode(scriptMode: boolean): void {
    WindowStateService.saveMode(scriptMode);
    // Update UI elements visibility
    if (
      this.elements.scriptModeContainer &&
      this.elements.simpleModeContainer
    ) {
      this.elements.scriptModeContainer.style.display = scriptMode
        ? "block"
        : "none";
      this.elements.simpleModeContainer.style.display = scriptMode
        ? "none"
        : "block";
    }
  }

  /**
   * Logs a message to the output area
   * @param message - Message to log
   * @param type - Type of message for styling
   */
  public log(
    message: string,
    type: "info" | "error" | "success" = "info"
  ): void {
    const log = document.createElement("div");
    log.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.style.color =
      type === "error" ? "red" : type === "success" ? "green" : "black";
    this.elements.output.appendChild(log);
    this.elements.output.scrollTop = this.elements.output.scrollHeight;
  }

  /**
   * Cleans up resources
   */
  public destroy(): void {
    trace(DEBUG_KEYS.WINDOW, "UIStateManager.destroy Enter");
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    trace(
      DEBUG_KEYS.WINDOW,
      "UIStateManager.destroy Exit - Resources cleaned up"
    );
  }

  /**
   * Clears the output area
   */
  public clearOutput(): void {
    this.elements.output.innerHTML = "";
  }
}
