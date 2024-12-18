/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 */

import type { Script, ScriptStatement, StopCondition } from "../types";
import { CommandExecutor } from "./CommandExecutor";
import type { StatusManager } from "../ui/components/StatusManager";
import {
  checkMessageLimitForRetry,
  MessageLimitError,
} from "../utils/messageUtils";
import { AnthropicService } from "./AnthropicService";
import { CommandHistoryService } from "./CommandHistoryService";
import { sleep as sleepAsync } from "@/utils/sleep";

/**
 * Callback type for logging output from the script runner.
 */
type LogCallback = (
  message: string,
  type?: "info" | "error" | "success"
) => void;

const RETRY_INTERVAL_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REPEATS = 15;
const OPERATION_CANCELLED_MESSAGE = "Operation cancelled";

/**
 * Manages script execution and streaming state.
 */
export class ScriptRunner {
  private isRunning: boolean = false;
  private readonly logCallback: LogCallback;
  private readonly CHECK_INTERVAL: number = 500; // Check every 500ms
  private readonly MAX_WAIT_TIME_MS: number = 120000; // Wait up to 2 minutes
  private readonly commandExecutor: CommandExecutor;
  private readonly statusManager: StatusManager;
  public readonly historyService: CommandHistoryService;

  constructor(
    logCallback: LogCallback,
    commandExecutor: CommandExecutor,
    statusManager: StatusManager
  ) {
    this.logCallback = logCallback;
    this.commandExecutor = commandExecutor;
    this.statusManager = statusManager;
    this.historyService = new CommandHistoryService();
  }

  /**
   * Creates a delay Promise that can be cancelled when isRunning becomes false
   */
  private createCancellableDelay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      // Check isRunning status every 100ms
      const checker = setInterval(() => {
        if (!this.isRunning) {
          clearTimeout(timeout);
          clearInterval(checker);
          reject(new Error(OPERATION_CANCELLED_MESSAGE));
        }
      }, 100);

      // Clean up interval when timeout completes
      setTimeout(() => {
        clearInterval(checker);
        resolve();
      }, ms);
    });
  }

  /**
   * Executes a command script
   * @param script - Parsed command script to execute
   * @throws Error if command execution fails
   */
  private async executeCommand(script: ScriptStatement): Promise<void> {
    if (!script.command && !script.aliasCommand) {
      throw new Error("No command specified");
    }

    await this.commandExecutor.executeCommand(script, this);
  }

  /**
   * Executes a script with the provided configuration.
   * @param script - Script configuration to execute
   * @throws Error if script execution fails
   */
  public async runScript(script: Script): Promise<void> {
    if (this.isRunning) {
      throw new Error("Script is already running");
    }

    try {
      this.isRunning = true;

      // Execute each statement in sequence
      let shouldContinue = true;
      for (const statement of script.statements) {
        if (!shouldContinue || !this.isRunning) break;
        console.log(`run statement: ${JSON.stringify(statement)}`);

        try {
          if (statement.isCommand) {
            await this.executeCommand(statement);
            continue;
          }

          if (!statement.prompt) {
            continue;
          }

          const response = await this.executePromptLoop(
            statement.prompt,
            statement.options?.stopConditions
          );

          if (response === "stopped" || response === "failed") {
            break;
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === OPERATION_CANCELLED_MESSAGE
          ) {
            this.logCallback("Script cancelled", "info");
            return;
          }
          this.logCallback(
            `Statement execution failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            "error"
          );
          throw error;
        }
      }

      // If all statements executed and no stop conditions met, we're done
      if (shouldContinue) {
        this.logCallback("Script completed successfully", "success");
        return;
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === OPERATION_CANCELLED_MESSAGE
      ) {
        this.logCallback("Script cancelled", "info");
        return;
      }
      this.logCallback(
        `Script execution failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  public async executePromptLoop(
    prompt: string,
    stopConditions?: StopCondition[],
    maxRepeats = DEFAULT_MAX_REPEATS
  ) {
    if (isNaN(maxRepeats)) {
      throw new Error(`Invalid /max value - must be a number: "${maxRepeats}"`);
    }

    let currentRepeat = 1;
    while (currentRepeat <= maxRepeats) {
      // Update output for each attempt
      if (maxRepeats > 1) {
        this.logCallback(`Repeat ${currentRepeat} of ${maxRepeats}...\n`);
      }
      const response = await this.executeStoppablePrompt(
        prompt,
        stopConditions
      );

      if (response === "not_applicable" || response === "stopped") {
        return response;
      }

      // If this was the last try and conditions weren't met
      if (currentRepeat === maxRepeats) {
        this.logCallback(
          "\nMax attempts reached without meeting stop condition"
        );
        return "not_stopped";
      }

      currentRepeat++;
    }
    console.log("failed to match");
    return "failed";
  }

  public async executeStoppablePrompt(
    prompt: string,
    stopConditions?: StopCondition[]
  ): Promise<"stopped" | "not_stopped" | "not_applicable" | "failed"> {
    const response = (await this.executePrompt(prompt)) || "";
    if (!stopConditions?.length) {
      return "not_applicable";
    }

    // Check all stop conditions
    const stopReason = this.checkStopConditions(response, stopConditions);

    if (stopReason) {
      this.logCallback(`Stop condition met: ${stopReason}`, "info");
      return "stopped";
    } else {
      return "not_stopped";
    }
  }

  public async executePrompt(prompt: string) {
    let response = "";
    try {
      // First try using the text input and streaming method ONCE
      response = await this.executePromptWithStreaming(prompt);
      return response;
    } catch (error) {
      if (error instanceof MessageLimitError) {
        // Switch to using AnthropicService with retries
        while (this.isRunning) {
          try {
            this.logCallback(
              "Message limit reached, trying direct completion...",
              "info"
            );
            const result = await AnthropicService.complete({
              prompt: prompt,
              forceNoApiKey: true,
              continueConversation: true,
            });

            if (!result.success) {
              if (result.cancelled) {
                throw new Error(OPERATION_CANCELLED_MESSAGE);
              }
              throw new Error(result.error || "Failed to get response");
            }

            response = result.text || "";
            return response;
          } catch (directError) {
            if (directError instanceof MessageLimitError) {
              this.logCallback(
                "Message limit still in effect, waiting 1 minute...",
                "info"
              );
              try {
                await this.createCancellableDelay(RETRY_INTERVAL_MS);
              } catch (error: unknown) {
                if (
                  error instanceof Error &&
                  error.message === OPERATION_CANCELLED_MESSAGE
                ) {
                  throw error;
                }
              }
              continue; // Try again after waiting
            }
            if (
              directError instanceof Error &&
              directError.message === OPERATION_CANCELLED_MESSAGE
            ) {
              throw directError;
            }
            throw directError; // Re-throw other errors
          }
        }
      } else if (
        error instanceof Error &&
        error.message === OPERATION_CANCELLED_MESSAGE
      ) {
        throw error;
      } else {
        throw error; // Re-throw non-MessageLimitError errors
      }
    }
  }

  /**
   * Executes a prompt using text input and streaming
   * @param prompt - Prompt text to execute
   * @returns The response text
   * @throws Error if execution fails
   * @throws MessageLimitError if rate limit is hit
   */
  private async executePromptWithStreaming(prompt: string): Promise<string> {
    const targetDiv = await this.findInputElement();
    await this.insertPrompt(prompt);
    const startCount = this.countMessages();

    await this.simulateEnterKey(targetDiv);
    if (!(await this.waitForStreamingToStart(startCount))) {
      throw new Error("Failed to detect streaming");
    }
    return await this.checkStreaming();
  }

  private countMessages() {
    const streamedDivs = document.body.querySelectorAll(
      'div[data-is-streaming="false"]'
    );
    const streamingDivs = document.body.querySelectorAll(
      'div[data-is-streaming="true"]'
    );

    const total = streamedDivs.length + streamingDivs.length;

    return total;
  }

  private async waitForStreamingToStart(startCount: number) {
    const MAX_STREAMING_WAIT = 50;

    for (let iteration = 0; iteration < MAX_STREAMING_WAIT; iteration++) {
      const newCount = this.countMessages();
      if (newCount > startCount) {
        return true;
      }
      checkMessageLimitForRetry();
      await sleepAsync(1000);
    }

    return false;
  }

  /**
   * Monitors the streaming state of Claude's response.
   * @returns The final response text
   * @throws {MessageLimitError} if message limit is reached
   * @throws Error if monitoring times out
   *
   * IMPORTANT: Call this function once streaming is started and possibly completed
   */
  private async checkStreaming(): Promise<string> {
    const startTime = Date.now();

    try {
      while (this.isRunning && Date.now() - startTime < this.MAX_WAIT_TIME_MS) {
        // Check if we're out of  messages for now
        checkMessageLimitForRetry();

        // Look for cancellation
        if (!this.isRunning) {
          throw new Error(OPERATION_CANCELLED_MESSAGE);
        }

        let streamingDiv = document.querySelector(
          'div[data-is-streaming="true"]'
        );

        if (streamingDiv) {
          // Wait before next check
          await sleepAsync(this.CHECK_INTERVAL);

          continue;
        }

        // Get the last message div which contains the final response
        const nodes = document.querySelectorAll(
          'div[data-is-streaming="false"]'
        );

        // NodeList is similar to an array. To get the last node:
        const messageDiv = nodes[nodes.length - 1];

        return messageDiv?.textContent || "";
      }

      throw new Error("Response timeout after 2 minutes");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === OPERATION_CANCELLED_MESSAGE
      ) {
        throw error;
      }
      // Don't clear input on error
      throw error;
    }
  }

  /**
   * Clears the input element
   */
  private async clearInput(): Promise<void> {
    const targetDiv = await this.findInputElement();
    targetDiv.innerHTML = '<p data-placeholder="true"></p>';
  }

  /**
   * Finds the input element for script execution.
   * @returns Promise resolving to the input element
   * @throws Error if element not found
   */
  private async findInputElement(): Promise<Element> {
    const targetDiv = document.querySelector('div[enterkeyhint="enter"]');
    if (!targetDiv) {
      throw new Error("Input element not found");
    }
    return targetDiv;
  }

  /**
   * Inserts or updates prompt text in the input element
   * @param text - Text to insert
   */
  private async insertPrompt(text: string): Promise<void> {
    const targetDiv = await this.findInputElement();
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
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Simulates pressing the Enter key.
   * @param element - Element to receive the key event
   */
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

  /**
   * Checks stop conditions against a response
   * @param response - Response text to check
   * @param stopConditions - Array of conditions to check
   * @returns The matching condition or null if none match
   */
  private checkStopConditions(
    response: string,
    stopConditions: StopCondition[]
  ): string | null {
    for (const condition of stopConditions) {
      const contained = response.includes(condition.target);
      if (
        (condition.type === "if" && contained) ||
        (condition.type === "if_not" && !contained)
      ) {
        return `${condition.type} ${condition.target}`;
      }
    }
    return null;
  }

  /**
   * Cancels the currently running script.
   */
  public cancel(): void {
    this.isRunning = false;
  }
}
