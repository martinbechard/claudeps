import { StorageService } from "./StorageService";

export interface StarredItem {
  messageId: string;
  conversationId: string;
  label: string;
}

export class StarService {
  private static STORAGE_KEY = "starred-messages";
  private static LABELS_KEY = "star-labels";

  static async isStarred(
    messageId: string,
    conversationId: string
  ): Promise<boolean> {
    const stars = await this.getStarred();
    return stars.some(
      (s) => s.messageId === messageId && s.conversationId === conversationId
    );
  }

  static async getMessageLabel(
    messageId: string,
    conversationId: string
  ): Promise<string> {
    const stars = await this.getStarred();
    const star = stars.find(
      (s) => s.messageId === messageId && s.conversationId === conversationId
    );
    return star?.label || "Favorites";
  }

  static async getAllLabels(): Promise<string[]> {
    const labels = await StorageService.get<string[]>(this.LABELS_KEY);
    return labels || ["Favorites"];
  }

  static async addLabel(label: string): Promise<void> {
    const labels = await this.getAllLabels();
    if (!labels.includes(label)) {
      labels.push(label);
      await StorageService.set(this.LABELS_KEY, labels);
    }
  }

  static async setMessageLabel(
    messageId: string,
    conversationId: string,
    label: string
  ): Promise<void> {
    const stars = await this.getStarred();
    const star = stars.find(
      (s) => s.messageId === messageId && s.conversationId === conversationId
    );

    if (star) {
      star.label = label;
      await this.saveStars(stars);
    } else {
      // If message isn't starred, star it with the new label
      stars.push({ messageId, conversationId, label });
      await this.saveStars(stars);
    }

    // Always add new labels to the labels list
    await this.addLabel(label);
  }

  static async toggleStar(
    messageId: string,
    conversationId: string
  ): Promise<boolean> {
    const stars = await this.getStarred();
    const existingIndex = stars.findIndex(
      (s) => s.messageId === messageId && s.conversationId === conversationId
    );

    if (existingIndex >= 0) {
      stars.splice(existingIndex, 1);
      await this.saveStars(stars);
      return false;
    } else {
      stars.push({ messageId, conversationId, label: "Favorites" });
      await this.saveStars(stars);
      return true;
    }
  }

  static async getStarred(): Promise<StarredItem[]> {
    const stars = await StorageService.get<StarredItem[]>(this.STORAGE_KEY);

    if (!stars) return [];

    // Migrate old data if needed
    return stars.map((star: any) => ({
      messageId: star.messageId,
      conversationId: star.conversationId,
      label: star.label || "Favorites",
    }));
  }

  private static async saveStars(stars: StarredItem[]): Promise<void> {
    await StorageService.set(this.STORAGE_KEY, stars);
  }
}
