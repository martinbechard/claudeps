/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 */

const HISTORY_KEY = "command_history";
const MAX_HISTORY = 10;

export class CommandHistoryService {
  private history: string[] = [];
  private currentIndex: number = -1;

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      this.history = JSON.parse(savedHistory);
      this.currentIndex = this.history.length - 1;
    }
  }

  private saveHistory(): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  public addCommand(command: string): void {
    if (!command.trim()) return;

    // Remove duplicate if exists
    const existingIndex = this.history.indexOf(command);
    if (existingIndex !== -1) {
      this.history.splice(existingIndex, 1);
    }

    this.history.push(command);

    // Keep only last MAX_HISTORY items
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }

    this.currentIndex = this.history.length - 1;
    this.saveHistory();
  }

  public getPreviousCommand(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  public getNextCommand(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  public getCurrentCommand(): string | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  public clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    localStorage.removeItem(HISTORY_KEY);
  }
}
