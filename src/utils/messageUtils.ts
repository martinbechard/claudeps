const MESSAGE_LIMIT_TEXT = "Message limit reached for Claude 3.5 Sonnet";

const MESSAGE_LIMIT_RETRY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export class MessageLimitError extends Error {
  constructor() {
    super("Claude message limit reached");
    this.name = "MessageLimitError";
  }
}

/**
 * Checks if the given element contains the Claude message limit notification
 * by searching for specific text within a div structure with error styling
 */
export const hasMessageLimitReached = (element: Element): boolean => {
  // Find the outer div with error class
  const errorDiv = element.querySelector(
    "fieldset div.text-danger-000 div.text-sm"
  );
  if (!errorDiv) return false;

  // Search for the message limit text within nested divs
  const textContent = errorDiv.textContent;
  return textContent?.includes(MESSAGE_LIMIT_TEXT) ?? false;
};

/**
 * Checks for displayed message limit error and throws if found
 * Used specifically for handling retry scenarios
 * @throws {MessageLimitError} when message limit is reached and error div is displayed
 */
export const checkMessageLimitForRetry = (element: Element): void => {
  // Find the outer div with error class
  const errorDiv = element.querySelector(
    "fieldset div.text-danger-000 div.text-sm"
  );
  if (!errorDiv) return;

  // Check if the error div is displayed
  const style = window.getComputedStyle(errorDiv);
  if (style.display === "none") return;

  // Search for the message limit text within nested divs
  const textContent = errorDiv.textContent;
  if (textContent?.includes(MESSAGE_LIMIT_TEXT)) {
    throw new MessageLimitError();
  }
};

export { MESSAGE_LIMIT_RETRY_INTERVAL_MS as RETRY_INTERVAL_MS };
