import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Platform,
  ScrollView,
  Dimensions,
  StatusBar
} from "react-native";
import * as Location from "expo-location";

const { width } = Dimensions.get('window');

export default function Weather() {
  const [locationName, setLocationName] = useState<string>("Fetching location...");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PC IP for physical devices
  const PC_IP = "192.168.1.9";

  const fetchLocationAndWeather = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1️⃣ Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("Permission denied");
        setWeatherData(null);
        setLoading(false);
        return;
      }

      // 2️⃣ Get current coordinates
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // 3️⃣ Reverse geocode for address
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: { "User-Agent": "KrishiSarthi/1.0" } }
      );
      const data = await res.json();
      setLocationName(data.display_name || "Address not found");

      // 4️⃣ Determine API URL
      const apiBase =
        Platform.OS === "android" || Platform.OS === "ios"
          ? `http://${PC_IP}:5000/api/weather`
          : "http://localhost:5000/api/weather";

      // 5️⃣ Fetch weather from server
      const weatherRes = await fetch(`${apiBase}?lat=${latitude}&lon=${longitude}`);
      if (!weatherRes.ok) throw new Error("Weather API returned an error");
      const weatherJson = await weatherRes.json();
      setWeatherData(weatherJson);

      setLoading(false);
    } catch (e: any) {
      console.log("Error fetching location or weather:", e);
      setErrorMsg(e.message || "Unable to fetch location/weather");
      setWeatherData(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationAndWeather();
  }, []);

  const getWeatherIcon = (condition: string) => {
    const cond = condition?.toLowerCase();
    if (cond?.includes('sun') || cond?.includes('clear')) return '☀️';
    if (cond?.includes('cloud')) return '☁️';
    if (cond?.includes('rain')) return '🌧️';
    if (cond?.includes('snow')) return '❄️';
    if (cond?.includes('storm')) return '⛈️';
    return '🌤️';
  };

  const formatLocation = (location: string) => {
    const parts = location.split(',');
    return parts.length > 2 ? `${parts[0]}, ${parts[1]}` : location;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B6E4F" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Getting your weather...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="light-content" backgroundColor="#0B6E4F" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weather</Text>
        <Text style={styles.lastUpdated}>
          Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Location Card */}
      <View style={styles.locationCard}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>{formatLocation(locationName)}</Text>
      </View>

      {/* Weather Content */}
      {weatherData ? (
        <View style={styles.weatherContainer}>
          {/* Main Weather Card */}
          <View style={styles.mainWeatherCard}>
            <Text style={styles.weatherIcon}>
              {getWeatherIcon(weatherData.weather)}
            </Text>
            <Text style={styles.temperature}>{Math.round(weatherData.temperature)}°</Text>
            <Text style={styles.condition}>{weatherData.weather}</Text>
          </View>

          {/* Weather Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>💧</Text>
              <Text style={styles.detailValue}>{weatherData.humidity}%</Text>
              <Text style={styles.detailLabel}>Humidity</Text>
            </View>
            
            <View style={styles.detailCard}>
              <Text style={styles.detailIcon}>💨</Text>
              <Text style={styles.detailValue}>{weatherData.wind_speed}</Text>
              <Text style={styles.detailLabel}>Wind (m/s)</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>
            {errorMsg || "Weather data not available"}
          </Text>
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={fetchLocationAndWeather}
        activeOpacity={0.8}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
        <Text style={styles.refreshText}>Refresh Weather</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B6E4F',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B6E4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#C8E6C9',
    opacity: 0.8,
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  weatherContainer: {
    paddingHorizontal: 20,
  },
  mainWeatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  weatherIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  temperature: {
    fontSize: 64,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  condition: {
    fontSize: 18,
    color: '#C8E6C9',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#C8E6C9',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorText: {
    color: '#FFCDD2',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  refreshIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});