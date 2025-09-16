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

  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
  );
  const weatherData: WeatherData = await weatherRes.json();

  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
  );
  const forecastData = await forecastRes.json();

  const forecast: ForecastData[] = forecastData.list
    .filter((_: any, index: number) => index % 8 === 0)
    .slice(0, 7);

  return { current: weatherData, forecast };
};

// ----- Gemini Advice / Pest Alerts -----
export const fetchGeminiAdvice = async (
  locationName: string,
  weatherData: WeatherData
): Promise<GeminiResult> => {
  const GEMINI_API_KEY = "AIzaSyDF3KAQn3gSShNo-TJp47BTw4hELH-tA64";

  try {
    // Prepare weather summary
    const weatherMain = weatherData.weather[0]?.main || "Unknown";
    const weatherDesc = weatherData.weather[0]?.description || "";
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;

    const prompt = `
You are an expert agricultural advisor for Indian villages.
The farmer is in ${locationName}, India. Current weather conditions:
- Weather: ${weatherMain} (${weatherDesc})
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s

Provide:
1. Recent farming or pest alerts (2-3 lines)
2. Practical village-friendly farming advice (2-3 lines)
Focus on crop protection, pest prevention, and actionable guidance for farmers.
Format: NEWS: [news & pest info] | ADVICE: [advice content]
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topP: 0.8, maxOutputTokens: 400 },
        }),
      }
    );

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (content.includes("NEWS:") && content.includes("ADVICE:")) {
      const [newsContent, adviceContent] = content.split(" | ");
      return {
        news: newsContent.replace("NEWS: ", "").trim(),
        advice: adviceContent.replace("ADVICE: ", "").trim(),
      };
    } else {
      return {
        news: "No recent news available.",
        advice: "Monitor weather and pests carefully.",
      };
    }
  } catch (error) {
    console.error(error);
    return { news: "No recent news available.", advice: "Monitor weather and pests carefully." };
  }
};
