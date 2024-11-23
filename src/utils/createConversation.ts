/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/createConversation.ts
 */

import { v4 as uuidv4 } from "uuid";
import { getHeaders } from "./getHeaders";

export interface ConversationResponse {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

/**
 * Creates a new conversation in Claude's API
 */
export async function createConversation(
  organizationId: string,
  projectUuid?: string
): Promise<ConversationResponse> {
  const payload = {
    uuid: uuidv4(),
    name: "",
    project_uuid: projectUuid || null,
  };

  const response = await fetch(
    `https://claude.ai/api/organizations/${organizationId}/chat_conversations`,
    {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData?.type === "error" && errorData?.error?.message) {
      throw new Error(`Create conversation error: ${errorData.error.message}`);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
