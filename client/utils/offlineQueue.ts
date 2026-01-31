
// utils/offlineQueue.ts
import * as SecureStore from 'expo-secure-store';

interface QueuedMessage {
  id: string;
  query: string;
  location: string;
  language: string;
  soilType: string;
  imageUri?: string;
  timestamp: number;
}

export class OfflineQueue {
  private static readonly QUEUE_KEY = 'krishi_offline_queue';

  static async addToQueue(message: Omit<QueuedMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newMessage: QueuedMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      
      queue.push(newMessage);
      await SecureStore.setItemAsync(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  }

  static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const queueJson = await SecureStore.getItemAsync(this.QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  static async processQueue(): Promise<void> {
    try {
      const queue = await this.getQueue();
      if (queue.length === 0) return;

      for (const message of queue) {
        try {
          // Process each queued message
          await this.sendQueuedMessage(message);
          // Remove from queue after successful processing
          await this.removeFromQueue(message.id);
        } catch (error) {
          console.error('Failed to process queued message:', message.id, error);
          // Keep in queue for retry
        }
      }
    } catch (error) {
      console.error('Failed to process offline queue:', error);
    }
  }

  private static async sendQueuedMessage(message: QueuedMessage): Promise<void> {
    const endpoint = message.imageUri ? '/api/image-query' : '/api/chat';
    const payload: any = {
      query: message.query,
      location: message.location,
      language: message.language,
      soilType: message.soilType,
    };

    if (message.imageUri) {
      // Convert image to base64 if needed
      payload.image = message.imageUri;
    }

    const response = await fetch(`http://your-backend-url${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to send queued message');
    }
  }

  private static async removeFromQueue(messageId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(msg => msg.id !== messageId);
      await SecureStore.setItemAsync(this.QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  }

  static async clearQueue(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  }
}