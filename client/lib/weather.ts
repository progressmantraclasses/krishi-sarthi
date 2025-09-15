import { WEATHER_API_KEY } from "../constants/config";

const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Fetch by city name (existing)
export const getWeather = async (city: string) => {
  const url = `${BASE_URL}?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("City not found");
  return res.json();
};

// NEW: Fetch by latitude & longitude
export const getWeatherByCoords = async (lat: number, lon: number) => {
  const url = `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather not found for coordinates");
  return res.json();
};
