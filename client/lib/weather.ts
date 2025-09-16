import * as Location from "expo-location";

// ----- Types -----
export interface WeatherData {
  name: string;
  main: { temp: number; humidity: number; feels_like: number };
  weather: Array<{ main: string; description: string; icon: string }>;
  wind: { speed: number };
}

export interface ForecastData {
  dt: number;
  main: { temp: number };
  weather: Array<{ main: string; icon: string }>;
}

export interface GeminiResult {
  news: string;
  advice: string;
}

// ----- Helpers -----
export const getWeatherEmoji = (weatherMain: string) => {
  switch (weatherMain?.toLowerCase()) {
    case "clear": return "☀️";
    case "clouds": return "☁️";
    case "rain": return "🌧️";
    case "drizzle": return "🌦️";
    case "snow": return "❄️";
    case "thunderstorm": return "⛈️";
    case "mist":
    case "fog": return "🌫️";
    default: return "🌤️";
  }
};

// ----- Location -----
export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");
  const location = await Location.getCurrentPositionAsync({});
  return location.coords;
};

// ----- Fetch Weather -----
export const fetchWeatherData = async (latitude: number, longitude: number) => {
  const API_KEY = "471a72366218898d101149ddd12bba91";

  try {
    // Current weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    if (!weatherRes.ok) throw new Error(`Weather API failed: ${weatherRes.status}`);
    const weatherData: WeatherData = await weatherRes.json();

    // Forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    if (!forecastRes.ok) throw new Error(`Forecast API failed: ${forecastRes.status}`);
    const forecastData = await forecastRes.json();

    // Simplified daily forecast (next 7 days)
    const forecast: ForecastData[] = forecastData.list
      .filter((_: any, index: number) => index % 8 === 0)
      .slice(0, 7);

    return { current: weatherData, forecast };
  } catch (error) {
    console.error("Weather fetch error:", error);
    throw new Error("Failed to fetch weather data.");
  }
};

// ----- Gemini 2.0 Flash: Village-focused Farming Advice -----
export const fetchGeminiAdvice = async (
  locationName: string,
  weatherCondition: string
): Promise<GeminiResult> => {
  const GEMINI_API_KEY = "AIzaSyA3sB8PMnM26UiCuHOPSbXEXFaKtQ7hSf4"; // keep as is

  try {
    const prompt = `
Village-focused agricultural info for ${locationName}, India.
Current weather: ${weatherCondition}.
Provide:
1. Recent farming/pest alerts (2-3 lines)
2. Practical farming advice (2-3 lines)
Format: NEWS: [news] | ADVICE: [advice]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          temperature: 0.7,
          candidate_count: 1,
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API failed: ${response.status}`);
    const data = await response.json();

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return { news: "No news available.", advice: "Monitor weather and pests carefully." };
    }

    const [newsContent, adviceContent] = content.split(" | ");
    return {
      news: newsContent?.replace("NEWS: ", "").trim() || "No news available.",
      advice: adviceContent?.replace("ADVICE: ", "").trim() || "Monitor weather and pests carefully.",
    };
  } catch (error) {
    console.error("Gemini advice error:", error);
    return { news: "No news available.", advice: "Monitor weather and pests carefully." };
  }
};
