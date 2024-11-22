/**
 * Service to handle chrome.storage.sync operations for extension settings
 */
export class ChromeSettingsService {
  /**
   * Get a value from chrome sync storage
   * @param key The key to get
   * @returns The value or undefined if not found
   */
  static async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key];
    } catch (error) {
      console.warn(`Failed to get sync storage value for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a value in chrome sync storage
   * @param key The key to set
   * @param value The value to set
   */
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error(`Failed to set sync storage value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove a value from chrome sync storage
   * @param key The key to remove
   */
  static async remove(key: string): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error(
        `Failed to remove sync storage value for key ${key}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clear all entries from chrome sync storage
   */
  static async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error("Failed to clear sync storage:", error);
      throw error;
    }
  }
}
