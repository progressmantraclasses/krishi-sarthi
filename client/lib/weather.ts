// weather.ts - Updated location handling

import * as Location from "expo-location";

// ----- Types -----
export interface WeatherData {
  name: string;
  main: { temp: number; humidity: number; feels_like: number };
  weather: Array<{ main: string; description: string; icon: string }>;
  wind: { speed: number };
  coords?: { lat: number; lon: number }; // Add coordinates to track location
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

export interface LocationInfo {
  name: string;
  coords: { lat: number; lon: number };
  isCurrentLocation: boolean;
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

// ----- Reverse Geocoding to get better location name -----
export const getCurrentLocationWithAddress = async () => {
  try {
    // First check if location services are enabled
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      throw new Error("Location services are disabled. Please enable location services in your device settings.");
    }

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission denied. Please allow location access to get weather for your current location.");
    }

    console.log("Getting current position...");
    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000,
      maximumAge: 10000,
    });

    console.log("Got coordinates:", location.coords.latitude, location.coords.longitude);

    // Try to get address using reverse geocoding
    try {
      console.log("Attempting reverse geocoding...");
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        console.log("Reverse geocoding result:", address);
        
        // Build location name from address components
        let locationName = "";
        if (address.subLocality) {
          locationName = address.subLocality;
        } else if (address.district) {
          locationName = address.district;
        } else if (address.city) {
          locationName = address.city;
        } else if (address.region) {
          locationName = address.region;
        } else {
          locationName = "Current Location";
        }

        // Add city/state for context if different
        if (address.city && locationName !== address.city) {
          locationName += `, ${address.city}`;
        }
        if (address.region && !locationName.includes(address.region)) {
          locationName += `, ${address.region}`;
        }

        return {
          coords: location.coords,
          locationName: locationName || "Current Location",
          fullAddress: address
        };
      }
    } catch (geocodeError) {
      console.log("Reverse geocoding failed:", geocodeError);
    }

    // If reverse geocoding fails, return coordinates with generic name
    return {
      coords: location.coords,
      locationName: "Current Location",
      fullAddress: null
    };

  } catch (error) {
    console.error("Location error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get current location. Please check your location settings.");
  }
};

// Keep the original function for compatibility
export const getCurrentLocation = async () => {
  const result = await getCurrentLocationWithAddress();
  return result.coords;
};

// ----- Enhanced Fetch Weather with better location handling -----
export const fetchWeatherData = async (
  latitude: number, 
  longitude: number, 
  customLocationName?: string
) => {
  const API_KEY = "471a72366218898d101149ddd12bba91";

  try {
    console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}`);
    
    // Current weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    
    if (!weatherRes.ok) {
      const errorText = await weatherRes.text();
      console.error("Weather API Error:", errorText);
      throw new Error(`Weather API failed: ${weatherRes.status} - ${errorText}`);
    }
    
    const weatherData: WeatherData = await weatherRes.json();
    
    // Use custom location name if provided (for current location)
    if (customLocationName) {
      weatherData.name = customLocationName;
    }
    
    // Add coordinates to weather data
    weatherData.coords = { lat: latitude, lon: longitude };

    console.log("Weather data fetched for:", weatherData.name);

    // Forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );
    
    if (!forecastRes.ok) {
      const errorText = await forecastRes.text();
      console.error("Forecast API Error:", errorText);
      throw new Error(`Forecast API failed: ${forecastRes.status} - ${errorText}`);
    }
    
    const forecastData = await forecastRes.json();

    // Simplified daily forecast (next 7 days)
    const forecast: ForecastData[] = forecastData.list
      .filter((_: any, index: number) => index % 8 === 0)
      .slice(0, 7);

    return { current: weatherData, forecast };
  } catch (error) {
    console.error("Weather fetch error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch weather data. Please check your internet connection.");
  }
};

// ----- Gemini 2.0 Flash: Village-focused Farming Advice -----
export const fetchGeminiAdvice = async (
  locationName: string,
  weatherCondition: string
): Promise<GeminiResult> => {
  const GEMINI_API_KEY = "AIzaSyA3sB8PMnM26UiCuHOPSbXEXFaKtQ7hSf4";

  try {
    const prompt = `You are an agricultural advisor for Indian farmers. For the location ${locationName}, India, with current weather condition: ${weatherCondition}.

Please provide:
1. Recent farming/agricultural news or pest alerts relevant to this region (2-3 sentences)
2. Practical farming advice based on current weather conditions (2-3 sentences)

Format your response exactly as:
NEWS: [your news content here]
ADVICE: [your advice content here]`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        candidateCount: 1,
        maxOutputTokens: 200,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log("Sending request to Gemini API for:", locationName);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.warn("No content received from Gemini API");
      return { 
        news: "Weather monitoring advised for current conditions.", 
        advice: "Monitor weather patterns and adjust farming activities accordingly." 
      };
    }

    // Parse the response
    const newsMatch = content.match(/NEWS:\s*(.*?)(?=ADVICE:|$)/s);
    const adviceMatch = content.match(/ADVICE:\s*(.*)/s);

    const news = newsMatch?.[1]?.trim() || "Monitor local agricultural conditions.";
    const advice = adviceMatch?.[1]?.trim() || "Adjust farming practices based on weather conditions.";

    return { news, advice };

  } catch (error) {
    console.error("Gemini advice error:", error);
    
    // Provide fallback advice based on weather condition
    let fallbackAdvice = "Monitor weather and pests carefully.";
    if (weatherCondition.toLowerCase().includes('rain')) {
      fallbackAdvice = "Good time for planting. Ensure proper drainage in fields.";
    } else if (weatherCondition.toLowerCase().includes('clear')) {
      fallbackAdvice = "Ideal for harvesting. Ensure adequate irrigation for crops.";
    } else if (weatherCondition.toLowerCase().includes('cloud')) {
      fallbackAdvice = "Moderate conditions. Good for most farming activities.";
    }
    
    return { 
      news: "Unable to fetch latest agricultural news. Check local sources.", 
      advice: fallbackAdvice 
    };
  }
};