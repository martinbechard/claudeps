/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/ui/components/StatusManager.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 */

import type { StatusState, StatusConfig } from "../../types";

/**
 * Required elements for status management
 */
interface StatusElements {
  statusElement: HTMLElement;
  statusText: HTMLElement;
  statusDetails: HTMLElement;
  scriptInput: HTMLTextAreaElement;
  runButton: HTMLButtonElement;
}

/**
 * Manages the display and updates of status information.
 */
export class StatusManager {
  private readonly elements: StatusElements;
  private currentState: StatusState = "ready";
  public onCancel: (() => void) | null = null;

  private static readonly STATUS_CONFIGS: Record<StatusState, StatusConfig> = {
    ready: { text: "READY", class: "ready" },
    working: { text: "WORKING", class: "working" },
    error: { text: "ERROR", class: "error" },
  };

  /**
   * Creates a new StatusManager instance.
   * @param elements - Required DOM elements for status management
   */
  constructor(elements: StatusElements) {
    this.elements = elements;
    this.initializeStatus();
    this.setupCancelHandler();
  }

  /**
   * Sets up initial status display.
   */
  private initializeStatus(): void {
    this.setStatus("ready");
  }

  /**
   * Sets up handler for cancel button clicks
   */
  private setupCancelHandler(): void {
    this.elements.runButton.addEventListener("click", () => {
      if (this.currentState === "working" && this.onCancel) {
        this.onCancel();
      }
    });
  }

  /**
   * Updates the current status display.
   * @param state - New status state to display
   * @param details - Optional details message
   * @param clearInput - Whether to clear input on ready state
   */
  public async setStatus(
    state: StatusState,
    details: string = "",
    clearInput: boolean = true
  ): Promise<void> {
    console.log("Status:", state, details);

    const config = StatusManager.STATUS_CONFIGS[state];
    this.elements.statusText.textContent = config.text;
    this.elements.statusDetails.textContent = details;
    this.elements.statusElement.className = `status ${config.class}`;

    this.currentState = state;
    this.updateInputState(state);
    this.updateButtonState(state);

    // Clear input on ready state if clearInput is true
    if (state === "ready" && clearInput) {
      this.elements.scriptInput.value = "";
    }
  }

  /**
   * Updates the input field state based on status.
   * @param state - Current status state
   */
  private updateInputState(state: StatusState): void {
    this.elements.scriptInput.disabled = state === "working";
  }

  /**
   * Updates the run button state based on status.
   * @param state - Current status state
   */
  private updateButtonState(state: StatusState): void {
    if (state === "working") {
      this.elements.runButton.textContent = "Cancel";
      this.elements.runButton.disabled = false;
    } else {
      this.elements.runButton.textContent = "Run Script";
      this.elements.runButton.disabled = false;
    }
  }

  /**
   * Gets the current status state.
   * @returns Current status state
   */
  public getCurrentState(): StatusState {
    return this.currentState;
  }

  /**
   * Checks if the status is in a specific state.
   * @param state - State to check
   * @returns True if current state matches
   */
  public isInState(state: StatusState): boolean {
    return this.currentState === state;
  }
}
