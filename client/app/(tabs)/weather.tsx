// weather.tsx - Updated with better location handling

import React, { useState, useEffect } from "react";
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
  Keyboard,
} from "react-native";

import {
  getCurrentLocationWithAddress,
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
  const [villageResults, setVillageResults] = useState<
    Array<{ name: string; state?: string; lat: number; lon: number }>
  >([]);
  const [selectedVillage, setSelectedVillage] = useState<{
    name: string;
    lat: number;
    lon: number;
  } | null>(null);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);

  // Auto-load weather for current location on component mount
  useEffect(() => {
    loadWeatherByLocation();
  }, []);

  // Fetch weather by GPS with better location detection
  const loadWeatherByLocation = async () => {
    setLoading(true);
    setSelectedVillage(null);
    setSearchText("");
    setIsCurrentLocation(true);
    
    try {
      console.log("Getting current location with address...");
      const locationData = await getCurrentLocationWithAddress();
      
      console.log("Location data:", locationData);
      console.log("Using location name:", locationData.locationName);
      
      console.log("Fetching weather data...");
      const { current, forecast } = await fetchWeatherData(
        locationData.coords.latitude, 
        locationData.coords.longitude,
        locationData.locationName // Pass the custom location name
      );
      
      console.log("Weather data obtained for:", current.name);
      
      setWeather(current);
      setForecast(forecast);

      console.log("Fetching Gemini advice...");
      const gemini = await fetchGeminiAdvice(current.name, current.weather[0].description);
      setNews(gemini.news?.trim() || "");
      setAdvice(gemini.advice?.trim() || "");
      
      console.log("All data loaded successfully");
    } catch (error) {
      console.error("Error in loadWeatherByLocation:", error);
      setIsCurrentLocation(false);
      
      // More specific error messages
      let errorMessage = "Failed to load weather data";
      if (error instanceof Error) {
        if (error.message.includes("Location services")) {
          errorMessage = "Location services are disabled. Please enable them in settings.";
        } else if (error.message.includes("permission")) {
          errorMessage = "Location permission denied. Please allow location access.";
        } else if (error.message.includes("network") || error.message.includes("internet")) {
          errorMessage = "No internet connection. Please check your network.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        "Error", 
        errorMessage,
        [
          {
            text: "OK",
            onPress: () => console.log("Error alert dismissed")
          }
        ]
      );
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

    if (query.length < 2) {
      return; // Wait for at least 2 characters
    }

    try {
      console.log("Searching for villages:", query);
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          query
        )},IN&limit=10&appid=${OWM_API_KEY}`
      );
      
      if (!res.ok) {
        throw new Error(`Search API failed: ${res.status}`);
      }
      
      const data = await res.json();
      const results = data.map((v: any) => ({ 
        name: v.name, 
        state: v.state, 
        lat: v.lat, 
        lon: v.lon 
      }));
      
      setVillageResults(results);
      console.log("Village search results:", results.length);
    } catch (err) {
      console.error("Village search error:", err);
      Alert.alert("Search Error", "Failed to search villages. Please try again.");
    }
  };

  // Handle village selection
  const handleVillageSelect = async (village: { name: string; lat: number; lon: number }) => {
    console.log("Village selected:", village.name);
    
    Keyboard.dismiss();
    setSelectedVillage(village);
    setSearchText(village.name);
    setVillageResults([]);
    setLoading(true);
    setIsCurrentLocation(false);
    
    try {
      console.log("Fetching weather for selected village...");
      const { current, forecast } = await fetchWeatherData(village.lat, village.lon);
      setWeather(current);
      setForecast(forecast);

      console.log("Fetching Gemini advice for village...");
      const gemini = await fetchGeminiAdvice(current.name, current.weather[0].description);
      setNews(gemini.news?.trim() || "");
      setAdvice(gemini.advice?.trim() || "");
      
      console.log("Village weather data loaded successfully");
    } catch (err) {
      console.error("Error fetching village weather:", err);
      Alert.alert("Error", "Could not fetch weather for this village. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Highlight advice with emojis
  const highlightAdvice = (text: string) => {
    if (/pest|insect|bug/i.test(text)) return "🚨 " + text;
    if (/rain|storm|flood|monsoon/i.test(text)) return "🌧️ " + text;
    if (/drought|dry|irrigation/i.test(text)) return "💧 " + text;
    if (/harvest|crop/i.test(text)) return "🌾 " + text;
    return "🌱 " + text;
  };

  // Render daily forecast item
  const renderForecastItem = ({ item }: { item: ForecastData }) => (
    <View style={styles.forecastCard}>
      <Text style={styles.forecastDay}>
        {new Date(item.dt * 1000).toLocaleDateString("en", { weekday: "short" })}
      </Text>
      <Text style={styles.forecastEmoji}>{getWeatherEmoji(item.weather[0].main)}</Text>
      <Text style={styles.forecastTemp}>{Math.round(item.main.temp)}°C</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={true}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Current Location */}
      <TouchableOpacity 
        style={[styles.locationBtn, loading && styles.disabledBtn]} 
        onPress={loadWeatherByLocation}
        disabled={loading}
      >
        <Text style={styles.locationBtnText}>
          {loading ? "Getting Location..." : "📍 Use Current Location"}
        </Text>
      </TouchableOpacity>

      {/* Village Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search for a village in India..."
          value={searchText}
          onChangeText={searchVillage}
          editable={!loading}
          clearButtonMode="while-editing"
        />
        {villageResults.length > 0 && (
          <View style={styles.dropdown}>
            <ScrollView 
              style={styles.dropdownScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {villageResults.map((village, index) => (
                <TouchableOpacity
                  key={`${village.name}-${village.lat}-${index}`}
                  style={styles.dropdownItem}
                  onPress={() => handleVillageSelect(village)}
                >
                  <Text style={styles.dropdownText}>
                    {village.name} {village.state ? `(${village.state})` : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {isCurrentLocation ? "Getting your location..." : "Loading weather data..."}
          </Text>
        </View>
      )}

      {/* Weather Info */}
      {weather && !loading && (
        <View style={styles.weatherContainer}>
          <View style={styles.locationHeader}>
            <Text style={styles.cityName}>{weather.name}</Text>
            {isCurrentLocation && (
              <Text style={styles.currentLocationLabel}>📍 Current Location</Text>
            )}
          </View>
          
          <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.weather[0].main)}</Text>
          <Text style={styles.temperature}>{Math.round(weather.main.temp)}°C</Text>
          <Text style={styles.description}>{weather.weather[0].description}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Feels like: {Math.round(weather.main.feels_like)}°C</Text>
            <Text style={styles.detailText}>Humidity: {weather.main.humidity}%</Text>
          </View>

          {forecast.length > 0 && (
            <>
              <Text style={styles.forecastTitle}>7-Day Forecast</Text>
              <FlatList
                data={forecast}
                renderItem={renderForecastItem}
                keyExtractor={(item) => item.dt.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.forecastList}
              />
            </>
          )}

          {news && (
            <View style={styles.newsContainer}>
              <Text style={styles.newsTitle}>📰 Agricultural News</Text>
              <Text style={styles.newsText}>{news}</Text>
            </View>
          )}

          {advice && (
            <View style={styles.adviceContainer}>
              <Text style={styles.adviceTitle}>🌱 Farming Advice</Text>
              <Text style={styles.adviceText}>{highlightAdvice(advice)}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f5f5f5' 
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  locationBtn: { 
    backgroundColor: "#4CAF50", 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledBtn: {
    backgroundColor: "#cccccc",
  },
  locationBtnText: { 
    fontSize: 16, 
    fontWeight: "600", 
    textAlign: "center",
    color: 'white'
  },
  searchContainer: { 
    marginBottom: 20, 
    position: "relative" 
  },
  input: { 
    backgroundColor: "#ffffff", 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdown: {
    position: "absolute",
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    zIndex: 1000,
    elevation: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: { 
    padding: 15, 
    borderBottomWidth: 0.5, 
    borderBottomColor: "#eee" 
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  weatherContainer: { 
    marginTop: 10,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  cityName: { 
    fontSize: 28, 
    fontWeight: "bold", 
    textAlign: "center",
    color: '#333',
    marginBottom: 5,
  },
  currentLocationLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weatherEmoji: { 
    fontSize: 80, 
    textAlign: "center", 
    marginVertical: 10 
  },
  temperature: { 
    fontSize: 48, 
    textAlign: "center",
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  forecastList: {
    marginBottom: 20,
  },
  forecastCard: { 
    marginRight: 15, 
    alignItems: "center",
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    minWidth: 75,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  forecastDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  forecastEmoji: {
    fontSize: 24,
    marginVertical: 5,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  newsContainer: { 
    marginTop: 20,
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 5,
  },
  newsTitle: { 
    fontSize: 18, 
    fontWeight: "bold",
    color: '#1976d2',
    marginBottom: 8,
  },
  newsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  adviceContainer: { 
    marginTop: 15,
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  adviceTitle: { 
    fontSize: 18, 
    fontWeight: "bold",
    color: '#4CAF50',
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
});