import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { getWeatherByCoords } from "../../lib/weather"; // Modify your lib to accept lat/lon
import Card from "../../components/Card";

export default function WeatherScreen() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch weather for current location
  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission denied!");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      const data = await getWeatherByCoords(lat, lon);
      setWeather(data);
      setError("");

      // Show alert if rain is coming
      if (data.weather[0].main.toLowerCase().includes("rain")) {
        Alert.alert("Weather Alert", "⚠️ Rain expected today. Take precautions!");
      }

    } catch (err) {
      setError("⚠️ Could not fetch weather.");
      setWeather(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(); // Automatically fetch on screen load
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌦 Krishi Weather</Text>

      <Button title="Refresh Weather" onPress={fetchWeather} />

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {weather && (
        <Card style={styles.card}>
          <Text style={styles.result}>📍 {weather.name}</Text>
          <Text style={styles.result}>🌡 Temp: {weather.main.temp}°C</Text>
          <Text style={styles.result}>🌦 {weather.weather[0].description}</Text>
          <Text style={styles.result}>💧 Humidity: {weather.main.humidity}%</Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  error: { color: "red", marginTop: 10, textAlign: "center" },
  card: { padding: 15, marginTop: 20 },
  result: { fontSize: 16, marginVertical: 3 },
});
