/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/requestCompletion.ts
 */

import { getHeaders } from "./getHeaders";
import { getOrganizationId } from "./getClaudeIds";
import {
  getCurrentConversationDetails,
  getConversationDetails,
  clearConversationCache,
} from "./getConversation";
import { EventStreamParser } from "./EventStreamParser";
import { createConversation } from "./createConversation";
import { deleteConversation } from "./deleteConversation";
import type { CompletionResponse } from "../types";
import { MessageLimitError } from "./messageUtils";

const API_URL = "https://claude.ai/api/organizations";
const STREAMING_API_URL = "https://claude.ai/api/organizations";
const DEFAULT_TIMEZONE = "America/Toronto";

interface Message {
  role: "human" | "assistant";
  content: string;
}

/**
 * Parameters for completion requests
 */
interface CompletionRequestParams {
  prompt?: string;
  messages?: Message[];
  timezone?: string;
  attachments?: any[];
  files?: any[];
  syncSources?: any[];
  renderingMode?: "messages" | "json";
  stream?: boolean;
  conversationId?: string;
  projectUuid?: string;
  onProgress?: (chunk: string) => void;
  continueConversation?: boolean;
}

/**
 * Makes a non-streaming completion request to Claude's API
 */
async function makeNonStreamingRequest(
  orgId: string,
  endpoint: string,
  requestBody: any
): Promise<CompletionResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 429) {
      throw new MessageLimitError();
    }
    if (errorData?.type === "error" && errorData?.error?.message) {
      const errorMessage = errorData.error.message;
      if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("message limit")
      ) {
        throw new MessageLimitError();
      }
      throw new Error(`LLM Error: ${errorMessage}`);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return {
    completion: data.completion,
    stop_reason: data.stop_reason || "",
    model: data.model || "",
    stop: data.stop,
    log_id: data.log_id || "",
    messageLimit: data.messageLimit || {
      type: "none",
      remaining: 0,
    },
  };
}

/**
 * Handles a streaming response with the event stream parser
 */
async function handleStreamingResponse(
  response: Response,
  onProgress?: (chunk: string) => void
): Promise<string> {
  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new EventStreamParser(true);

  let accumulatedText = "";
  let hasReceivedData = false;
  let hasError = false;
  let errorMessage = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      console.log("Received chunk:", chunk);

      try {
        const message = parser.processChunk(chunk);
        if (message) {
          hasReceivedData = true;
          accumulatedText = message;
          if (onProgress) {
            onProgress(message);
          }
        }

        if (parser.isMessageComplete()) {
          break;
        }
      } catch (error) {
        console.error("Error processing chunk:", error);
        hasError = true;
        errorMessage = error instanceof Error ? error.message : "Unknown error";
        break;
      }
    }

    if (hasError) {
      throw new Error(errorMessage);
    }

    if (!hasReceivedData) {
      console.error("No data received from stream");
      throw new Error("No data received from API");
    }

    const finalMessage = parser.getMessage();
    if (!finalMessage.trim()) {
      throw new Error("Empty response from API");
    }

    return finalMessage;
  } catch (error) {
    console.error("Error processing stream:", error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Makes a completion request to Claude's API
 * @param params Request parameters
 * @returns Promise resolving to completion response
 * @throws Error if the request fails
 */
export async function requestCompletion(
  params: CompletionRequestParams
): Promise<CompletionResponse> {
  try {
    const orgId = getOrganizationId();

    // Get conversation details only if continuing conversation
    let conversationId = params.conversationId || "";
    let parentMessageUuid = "00000000-0000-4000-8000-000000000000";

    if (params.continueConversation) {
      const details = params.conversationId
        ? await getConversationDetails(params.conversationId)
        : await getCurrentConversationDetails();

      conversationId = details.uuid;
      parentMessageUuid = details.current_leaf_message_uuid;
    } else {
      // If we have an old conversation ID and we're not continuing it, delete it
      if (conversationId) {
        try {
          await deleteConversation(conversationId);
        } catch (error) {
          console.error("Failed to delete old conversation:", error);
        }
      }
      // Create a new conversation
      const newConversation = await createConversation(
        orgId,
        params.projectUuid
      );
      conversationId = newConversation.uuid;
    }

    // Convert messages to prompt if messages are provided
    let prompt = params.prompt;
    if (params.messages && !prompt) {
      prompt =
        params.messages
          .map(
            (msg) =>
              `{${msg.role === "human" ? "Human" : "Assistant"}: ${
                msg.content
              }}`
          )
          .join("\n\n") + "\n\nAssistant:";
    }

    if (!prompt) {
      throw new Error("Either prompt or messages must be provided");
    }

    const endpoint = `${STREAMING_API_URL}/${orgId}/chat_conversations/${conversationId}/completion`;

    const requestBody = {
      prompt,
      parent_message_uuid: parentMessageUuid,
      timezone: params.timezone || DEFAULT_TIMEZONE,
      attachments: params.attachments || [],
      files: params.files || [],
      sync_sources: params.syncSources || [],
      rendering_mode: params.renderingMode || "messages",
    };

    console.log("Making request to:", endpoint);

    // Always use streaming for claude.ai requests
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Accept: "text/event-stream",
      },
      credentials: "include",
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      const errorData = await response.json().catch(() => null);
      console.error("Error data:", errorData);
      if (response.status === 429) {
        throw new MessageLimitError();
      }
      if (errorData?.type === "error" && errorData?.error?.message) {
        const errorMessage = errorData.error.message;
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("message limit")
        ) {
          throw new MessageLimitError();
        }
        throw new Error(`LLM Error: ${errorMessage}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Response received, processing stream...");

    // Handle streaming response with parser
    const fullCompletion = await handleStreamingResponse(
      response,
      params.onProgress
    );

    console.log("Stream processing complete, completion:", fullCompletion);

    if (!fullCompletion || !fullCompletion.trim()) {
      throw new Error("Failed to get response from API");
    }

    // Clear conversation cache after successful completion if we were continuing a conversation
    if (params.continueConversation && conversationId) {
      clearConversationCache(conversationId);
    }

    // Return response in expected format
    return {
      completion: fullCompletion,
      stop_reason: "stop_sequence",
      model: "claude-2",
      stop: null,
      log_id: "",
      messageLimit: {
        type: "none",
        remaining: 0,
      },
    };
  } catch (error) {
    console.error("Request completion error:", error);
    if (error instanceof MessageLimitError) {
      throw error; // Re-throw MessageLimitError
    }
    throw error;
  }
}
