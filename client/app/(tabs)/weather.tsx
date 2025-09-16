import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  getCurrentLocation,
  fetchWeatherData,
  fetchGeminiAdvice,
  getWeatherEmoji,
  WeatherData,
  ForecastData,
} from "../../lib/weather";

const OWM_API_KEY = "471a72366218898d101149ddd12bba91"; // Your OpenWeatherMap API key

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState("");
  const [advice, setAdvice] = useState("");
  const [searchText, setSearchText] = useState("");
  const [villageResults, setVillageResults] = useState<Array<{ name: string; state?: string; lat: number; lon: number }>>([]);
  const [selectedVillage, setSelectedVillage] = useState<{ name: string; lat: number; lon: number } | null>(null);

  // Load weather by GPS
  const loadWeatherByLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      const { current, forecast } = await fetchWeatherData(coords.latitude, coords.longitude);
      setWeather(current);
      setForecast(forecast);

      const gemini = await fetchGeminiAdvice(current.name, current.weather[0].description);
      setNews(gemini.news);
      setAdvice(gemini.advice);
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Search villages via OpenWeatherMap
  const searchVillage = async (query: string) => {
    setSearchText(query);
    if (query.length === 0) {
      setVillageResults([]);
      return;
    }

    try {
      const res = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)},IN&limit=10&appid=${OWM_API_KEY}`
      );
      const data = await res.json();
      setVillageResults(
        data.map((v: any) => ({ name: v.name, state: v.state, lat: v.lat, lon: v.lon }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch weather for selected village
  const handleVillageSelect = async (village: { name: string; lat: number; lon: number }) => {
    setSelectedVillage(village);
    setSearchText(village.name);
    setVillageResults([]);
    setLoading(true);
    try {
      const { current, forecast } = await fetchWeatherData(village.lat, village.lon);
      setWeather(current);
      setForecast(forecast);

      const gemini = await fetchGeminiAdvice(current.name, current.weather[0].description);
      setNews(gemini.news);
      setAdvice(gemini.advice);
    } catch (err) {
      Alert.alert("Error", "Could not fetch weather for this village");
    } finally {
      setLoading(false);
    }
  };

  const renderForecastItem = ({ item }: { item: ForecastData }) => (
    <View style={styles.forecastCard}>
      <Text>{new Date(item.dt * 1000).toLocaleDateString("en", { weekday: "short" })}</Text>
      <Text>{getWeatherEmoji(item.weather[0].main)}</Text>
      <Text>{Math.round(item.main.temp)}°C</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Current Location */}
      <TouchableOpacity style={styles.locationBtn} onPress={loadWeatherByLocation}>
        <Text style={styles.locationBtnText}>📍 Current Location</Text>
      </TouchableOpacity>

      {/* Village Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search village"
          value={searchText}
          onChangeText={searchVillage}
        />
        {villageResults.length > 0 && (
          <View style={styles.dropdown}>
            {villageResults.map((village) => (
              <TouchableOpacity
                key={`${village.name}-${village.lat}`}
                style={styles.dropdownItem}
                onPress={() => handleVillageSelect(village)}
              >
                <Text>{village.name} {village.state ? `(${village.state})` : ""}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading && <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />}

      {/* Weather Info */}
      {weather && (
        <View style={styles.weatherContainer}>
          <Text style={styles.cityName}>{weather.name}</Text>
          <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.weather[0].main)}</Text>
          <Text style={styles.temperature}>{Math.round(weather.main.temp)}°C</Text>

          <FlatList
            data={forecast}
            renderItem={renderForecastItem}
            keyExtractor={(item) => item.dt.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 20 }}
          />

          <View style={styles.newsContainer}>
            <Text style={styles.newsTitle}>📰 Agricultural News</Text>
            <Text>{news}</Text>
          </View>

          <View style={styles.adviceContainer}>
            <Text style={styles.adviceTitle}>🌱 Farming Advice</Text>
            <Text>{advice}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  locationBtn: { backgroundColor: "#D0F0C0", padding: 15, borderRadius: 10, marginBottom: 15 },
  locationBtnText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  searchContainer: { marginBottom: 20, position: "relative" },
  input: { backgroundColor: "#f0f0f0", padding: 12, borderRadius: 25, fontSize: 16 },
  dropdown: { position: "absolute", top: 50, left: 0, right: 0, backgroundColor: "#fff", borderRadius: 10, zIndex: 10, maxHeight: 200 },
  dropdownItem: { padding: 10, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
  goBtn: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 25, marginBottom: 10, marginTop: 10 },
  goText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  weatherContainer: { marginTop: 10 },
  cityName: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  weatherEmoji: { fontSize: 80, textAlign: "center", marginVertical: 10 },
  temperature: { fontSize: 48, textAlign: "center" },
  forecastCard: { marginRight: 15, alignItems: "center" },
  newsContainer: { marginTop: 20 },
  newsTitle: { fontSize: 18, fontWeight: "bold" },
  adviceContainer: { marginTop: 20 },
  adviceTitle: { fontSize: 18, fontWeight: "bold" },
});
