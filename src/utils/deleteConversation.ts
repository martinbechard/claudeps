import { getHeaders } from "./getHeaders";
import { getOrganizationId } from "./getClaudeIds";

export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  const organizationId = getOrganizationId();
  const endpoint = `https://claude.ai/api/organizations/${organizationId}/chat_conversations/${conversationId}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(conversationId),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData?.type === "error" && errorData?.error?.message) {
      throw new Error(`Delete conversation error: ${errorData.error.message}`);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};
