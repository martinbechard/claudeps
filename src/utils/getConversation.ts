/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/utils/getConversation.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Utility functions for retrieving conversation details from Claude's API
 */

import { getHeaders } from "./getHeaders";
import { getOrganizationId, getIdsFromUrl } from "./getClaudeIds";
import type { Conversation } from "../types";

const API_URL = "https://claude.ai/api/organizations";

let conversationCache: { [key: string]: Conversation } = {};

/**
 * Clears the cached conversation for the given ID
 * @param conversationId The ID of the conversation to clear from cache
 */
export function clearConversationCache(conversationId: string): void {
  delete conversationCache[conversationId];
}

/**
 * Gets current conversation details including latest message ID
 * @returns Promise resolving to { conversationId, parentMessageUuid }
 * @throws Error if conversation details cannot be retrieved
 */
export async function getCurrentConversationDetails(): Promise<Conversation> {
  // Get conversation ID from URL
  const match = window.location.pathname.match(/\/chat\/([^\/]+)/);
  if (!match) {
    throw new Error("Please navigate to a Claude chat page first");
  }
  const conversationId = match[1];

  return getConversationDetails(conversationId);
}

/**
 * Gets conversation details including latest message ID
 * @param conversationId identifies the conversation for which to get the details.
 * @returns Promise resolving to { conversationId, parentMessageUuid }
 * @throws Error if conversation details cannot be retrieved
 */
export async function getConversationDetails(
  conversationId: string
): Promise<Conversation> {
  const orgId = getOrganizationId();

  try {
    // Get conversation details
    const response = await fetch(
      `${API_URL}/${orgId}/chat_conversations/${conversationId}?tree=True&rendering_mode=messages`,
      {
        method: "GET",
        headers: getHeaders(),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const conversation: Conversation = await response.json();

    // Update cache with new conversation details
    conversationCache[conversationId] = conversation;

    return conversation;
  } catch (error) {
    throw new Error(
      `Failed to get conversation details: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
