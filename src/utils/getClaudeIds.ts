/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/src/utils/getClaudeIds.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 *
 * Utility functions for retrieving organization and project IDs from Claude
 */

import { getHeaders } from "./getHeaders";
import type { Conversation } from "../types";
import { ClaudeCache } from "../services/ClaudeCache";

const API_URL = "https://api.claude.ai/api/organizations";

/**
 * Gets project and conversation IDs from the current URL
 */
export function getIdsFromUrl(): {
  projectId: string | null;
  conversationId: string | null;
} {
  const projectMatch = window.location.pathname.match(/\/project\/([^\/]+)/);
  if (projectMatch) {
    return { projectId: projectMatch[1], conversationId: null };
  }

  const chatMatch = window.location.pathname.match(/\/chat\/([^\/]+)/);
  if (!chatMatch) {
    throw new Error(
      "Please navigate to a Claude chat or project page before using this command"
    );
  }

  return {
    projectId: null,
    conversationId: chatMatch[1],
  };
}

/**
 * Gets the organization ID from cookies
 * @throws Error if organization ID is not found or invalid
 */
export function getOrganizationId(): string {
  if (!document.cookie) {
    throw new Error("No cookies found");
  }

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("lastActiveOrg="));

  if (!cookie) {
    throw new Error(
      "Organization ID not found in cookies. Please ensure you are logged into Claude.ai"
    );
  }

  const parts = cookie.split("=");
  if (parts.length !== 2) {
    throw new Error("Invalid organization ID cookie format");
  }

  try {
    const value = decodeURIComponent(parts[1]);
    if (!value) {
      throw new Error("Empty organization ID value");
    }
    // Remove any surrounding quotes
    const cleanValue = value.replace(/^"|"$/g, "");
    if (!cleanValue) {
      throw new Error("Empty organization ID after cleaning");
    }
    return cleanValue;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse organization ID: ${error.message}`);
    }
    throw new Error("Failed to parse organization ID");
  }
}

/**
 * Gets the project UUID for API requests
 * @param organizationId - Organization ID to use for API request
 * @param tryGet - if true, return null if not found
 * @returns Promise resolving to project UUID
 * @throws Error if project UUID cannot be retrieved
 */
export async function getProjectUuid(
  organizationId: string,
  tryGet = false
): Promise<string> {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  const { projectId, conversationId } = getIdsFromUrl();

  if (projectId) {
    return projectId;
  }

  if (conversationId) {
    const url = `${API_URL}/${organizationId}/chat_conversations/${conversationId}?tree=True&rendering_mode=messages`;

    try {
      const data = await ClaudeCache.fetchWithCache<Conversation>(url, {
        headers: getHeaders(),
        timeoutMs: 300000, // Cache conversation details for 5 minutes
      });

      const projectUuid = data.project_uuid;

      if (!projectUuid && !tryGet) {
        throw new Error("Project UUID not found in conversation details");
      }

      return projectUuid;
    } catch (error) {
      throw new Error(
        `Failed to fetch conversation details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  throw new Error("No project or conversation ID found in URL");
}
