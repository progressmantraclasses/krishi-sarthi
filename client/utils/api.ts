// utils/api.ts
import * as Network from 'expo-network';
import { OfflineQueue } from './offlineQueue';

export class ApiService {
  private static baseUrl = 'http://your-backend-url';

  static async sendMessage(
    query: string,
    location: string,
    language: string,
    soilType: string,
    imageUri?: string
  ): Promise<any> {
    const netInfo = await Network.getNetworkStateAsync();

    if (!netInfo.isConnected) {
      // Add to offline queue
      await OfflineQueue.addToQueue({
        query,
        location,
        language,
        soilType,
        imageUri,
      });
      throw new Error('offline');
    }

    const endpoint = imageUri ? '/api/image-query' : '/api/chat';
    const payload: any = {
      query,
      location,
      language,
      soilType,
    };

    if (imageUri) {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      payload.image = base64;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  static async getDefaultQuestions(language: string, location: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/default-questions?lang=${language}&location=${location}`
      );
      const data = await response.json();
      return data.success ? data.questions : [];
    } catch (error) {
      console.error('Failed to fetch default questions:', error);
      return this.getFallbackQuestions(language);
    }
  }

  static async getWeatherData(location: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/weather?location=${location}`);
      const data = await response.json();
      return data.success ? data.weather : null;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  }

  private static getFallbackQuestions(language: string): string[] {
    const questions = {
      en: [
        "What crops should I plant this season?",
        "How much fertilizer do I need?",
        "When should I harvest my crops?",
        "How to prevent pest damage?"
      ],
      hi: [
        "इस मौसम में कौन सी फसल बोनी चाहिए?",
        "कितना खाद डालना चाहिए?",
        "फसल कब काटनी चाहिए?",
        "कीट-पतंगों से कैसे बचाव करें?"
      ],
      pa: [
        "ਇਸ ਮੌਸਮ ਵਿੱਚ ਕਿਹੜੀ ਫਸਲ ਬੀਜਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਕਿੰਨਾ ਖਾਦ ਪਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?",
        "ਫਸਲ ਕਦੋਂ ਕੱਟਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਕੀਟਾਂ ਤੋਂ ਕਿਵੇਂ ਬਚਾਅ ਕਰੀਏ?"
      ]
    };
    
    return questions[language as keyof typeof questions] || questions.en;
  }
}



// utils/validation.ts
