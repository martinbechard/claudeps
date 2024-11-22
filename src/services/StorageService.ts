/**
 * Service to handle browser storage operations
 */
import { OPFSStorage, IStorage } from "../types/storage";

export class StorageService {
  private static storage: IStorage = new OPFSStorage();
  private static readonly KEYS_FILE = "_storage_keys";

  /**
   * Get a value from storage
   * @param key The key to get
   * @returns The value or undefined if not found
   */
  static async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.storage.getItem(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.warn(`Failed to get storage value for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a value in storage
   * @param key The key to set
   * @param value The value to set
   */
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      await this.storage.setItem(key, JSON.stringify(value));
      await this.addKeyToIndex(key);
    } catch (error) {
      console.error(`Failed to set storage value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove a value from storage
   * @param key The key to remove
   */
  static async remove(key: string): Promise<void> {
    try {
      await this.storage.removeItem(key);
      await this.removeKeyFromIndex(key);
    } catch (error) {
      console.error(`Failed to remove storage value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all entries from storage
   */
  static async clear(): Promise<void> {
    try {
      const keys = await this.getStorageKeys();
      await Promise.all(keys.map((key) => this.storage.removeItem(key)));
      await this.storage.removeItem(this.KEYS_FILE);
    } catch (error) {
      console.error("Failed to clear storage:", error);
      throw error;
    }
  }

  /**
   * Get all storage keys
   */
  private static async getStorageKeys(): Promise<string[]> {
    try {
      const value = await this.storage.getItem(this.KEYS_FILE);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add a key to the index
   */
  private static async addKeyToIndex(key: string): Promise<void> {
    if (key === this.KEYS_FILE) return;

    const keys = await this.getStorageKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      await this.storage.setItem(this.KEYS_FILE, JSON.stringify(keys));
    }
  }

  /**
   * Remove a key from the index
   */
  private static async removeKeyFromIndex(key: string): Promise<void> {
    if (key === this.KEYS_FILE) return;

    const keys = await this.getStorageKeys();
    const index = keys.indexOf(key);
    if (index !== -1) {
      keys.splice(index, 1);
      await this.storage.setItem(this.KEYS_FILE, JSON.stringify(keys));
    }
  }
}
