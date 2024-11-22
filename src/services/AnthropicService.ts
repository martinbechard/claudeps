/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/services/AnthropicService.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Service for making requests to the Anthropic API
 * Note: Your friendly neighborhood AI API whisperer!
 */

import { SettingsService } from "./SettingsService";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  signal?: AbortSignal;
}

export interface CompletionResult {
  success: boolean;
  text?: string;
  error?: string;
  cancelled?: boolean;
}

export class AnthropicService {
  /**
   * Makes a request to the Anthropic API through the background script
   */
  public static async complete(
    messages: Message[],
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    console.log("[AnthropicService] Starting API request");

    try {
      const enableApi = await SettingsService.getSetting("enableAnthropicApi");
      if (!enableApi) {
        console.log("[AnthropicService] Anthropic API is disabled");
        return {
          success: false,
          error: "Anthropic API is disabled in settings",
        };
      }

      const settings = await SettingsService.validateSettings();
      if (!settings.valid) {
        console.log("[AnthropicService] Invalid settings:", settings.message);
        return {
          success: false,
          error: settings.message,
        };
      }

      const apiKey = await SettingsService.getSetting("anthropicApiKey");
      if (!apiKey) {
        console.log("[AnthropicService] No API key found");
        return {
          success: false,
          error: "API key not found in settings",
        };
      }

      const model = await SettingsService.getSetting("model");
      console.log("[AnthropicService] Using model:", model);

      const requestBody = {
        model,
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
      };

      return new Promise((resolve, reject) => {
        console.log("[AnthropicService] Sending message to background script");

        // Set up abort handler if signal is provided
        if (options.signal) {
          options.signal.addEventListener("abort", () => {
            console.log("[AnthropicService] Request cancelled");
            resolve({
              success: false,
              cancelled: true,
              error: "Request cancelled",
            });
          });

          // If signal is already aborted, resolve immediately
          if (options.signal.aborted) {
            console.log("[AnthropicService] Signal already aborted");
            resolve({
              success: false,
              cancelled: true,
              error: "Request cancelled",
            });
            return;
          }
        }

        chrome.runtime.sendMessage(
          {
            type: "anthropic_complete",
            apiKey,
            body: requestBody,
          },
          (response) => {
            // Check if request was cancelled
            if (options.signal?.aborted) {
              console.log("[AnthropicService] Request was cancelled");
              resolve({
                success: false,
                cancelled: true,
                error: "Request cancelled",
              });
              return;
            }

            if (chrome.runtime.lastError) {
              console.error(
                "[AnthropicService] Runtime error:",
                chrome.runtime.lastError
              );
              resolve({
                success: false,
                error: chrome.runtime.lastError.message,
              });
              return;
            }

            if (response.error) {
              console.error("[AnthropicService] API error:", response.error);
              resolve({
                success: false,
                error: response.error,
              });
              return;
            }

            console.log("[AnthropicService] Received successful response");
            resolve({
              success: true,
              text: response.content[0]?.text || "",
            });
          }
        );
      });
    } catch (error) {
      console.error("[AnthropicService] Unexpected error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }
}
