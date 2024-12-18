/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 */

import { FloatingWindow } from "./ui/components/FloatingWindow";
import { UIStateManager } from "./ui/components/UIStateManager";
import { ScriptParser } from "./utils/ScriptParser";
import { ScriptRunner } from "./services/ScriptRunner";
import { CommandExecutor } from "./services/CommandExecutor";
import { StatusManager } from "./ui/components/StatusManager";
import { ScriptExecutionManager } from "./services/ScriptExecutionManager";

/**
 * Main extension class that coordinates all functionality.
 */
export class ClaudeExtension {
  private floatingWindow: FloatingWindow;
  private scriptRunner: ScriptRunner | null = null;
  private scriptExecutionManager: ScriptExecutionManager | null = null;
  private uiStateManager: UIStateManager | null = null;
  private statusManager: StatusManager | null = null;
  private commandExecutor: CommandExecutor | null = null;

  constructor() {
    this.floatingWindow = new FloatingWindow();
  }

  /**
   * Legacy initialization method - maintains compatibility with content.ts
   */
  public async initializeUI(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initializes the extension.
   */
  private async initialize(): Promise<void> {
    try {
      // Create and inject floating window
      await this.floatingWindow.create();

      // Get UI elements
      const elements = this.floatingWindow.getElements();

      // Initialize status manager
      this.statusManager = new StatusManager({
        statusElement: elements.status,
        statusText: elements.statusText,
        statusDetails: elements.statusDetails,
        scriptInput: elements.scriptText as HTMLTextAreaElement,
        runButton: elements.runButton as HTMLButtonElement,
      });

      // Initialize UI state manager
      this.uiStateManager = new UIStateManager(elements, this.statusManager);
      this.floatingWindow.setUIStateManager(this.uiStateManager);

      // Initialize command executor
      this.commandExecutor = new CommandExecutor(
        this.statusManager,
        this.logToOutput.bind(this),
        elements.output
      );

      // Initialize script runner
      this.scriptRunner = new ScriptRunner(
        this.logToOutput.bind(this),
        this.commandExecutor,
        this.statusManager
      );

      // Initialize script execution manager
      this.scriptExecutionManager = new ScriptExecutionManager(
        this.statusManager,
        this.logToOutput.bind(this),
        elements.output
      );

      // Pass the history service to FloatingWindow
      if (this.scriptRunner) {
        this.floatingWindow.setHistoryService(this.scriptRunner.historyService);
      }

      // Set up script execution
      elements.runButton.addEventListener("click", async () => {
        const scriptText = elements.scriptText.value;
        if (!scriptText.trim() || !this.scriptExecutionManager) return;

        try {
          // Add command to history when executing
          this.scriptRunner?.historyService.addCommand(scriptText);
          await this.scriptExecutionManager.executeScript(scriptText);
        } catch (error) {
          this.logToOutput(
            `Script execution failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            "error"
          );
        }
      });
    } catch (error) {
      console.error("Failed to initialize extension:", error);
    }
  }

  /**
   * Logs output to the floating window.
   */
  private logToOutput(
    message: string,
    type: "info" | "error" | "success" = "info"
  ): void {
    const elements = this.floatingWindow.getElements();
    const output = elements.output;

    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.className = `output-message ${type}`;
    output.appendChild(messageDiv);
    output.scrollTop = output.scrollHeight;
  }

  /**
   * Cleans up resources when extension is unloaded.
   */
  public destroy(): void {
    this.floatingWindow.destroy();
    if (this.uiStateManager) {
      this.uiStateManager.destroy();
    }
  }
}
