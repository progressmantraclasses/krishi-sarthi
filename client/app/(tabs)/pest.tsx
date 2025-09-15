// client/app/(tabs)/pest.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Animated,
} from "react-native";

type PestData = {
  crop: string;
  pest: string;
  precaution: string;
  icon: string;
  severity: "Low" | "Medium" | "High";
};

const SAMPLE_PESTS: PestData[] = [
  { crop: "Wheat", pest: "Leaf Rust", precaution: "Spray fungicide in morning", icon: "🍂", severity: "High" },
  { crop: "Rice", pest: "Brown Plant Hopper", precaution: "Maintain proper water levels", icon: "🐛", severity: "Medium" },
  { crop: "Maize", pest: "Army Worm", precaution: "Use neem-based insecticide", icon: "🐞", severity: "High" },
  { crop: "Wheat", pest: "Blight", precaution: "Avoid excess irrigation", icon: "⚠️", severity: "Medium" },
  { crop: "Rice", pest: "Blast", precaution: "Apply balanced fertilizer", icon: "🔥", severity: "High" },
];

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#4CAF50",
  Medium: "#FFC107",
  High: "#F44336",
};

export default function PestDetection() {
  const [loading, setLoading] = useState(false);
  const [adviceList, setAdviceList] = useState<PestData[] | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const getAdvice = async () => {
    setLoading(true);
    setAdviceList(null);
    Animated.timing(fadeAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();

    try {
      // Fake location/weather/season logic
      const shuffled = SAMPLE_PESTS.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      setAdviceList(selected);

      // Animate results
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (e) {
      setAdviceList([
        { crop: "-", pest: "Error fetching data", precaution: "Try again", icon: "⚠️", severity: "Low" },
      ]);
    }
    setLoading(false);
  };

  const renderItem = ({ item }: { item: PestData }) => (
    <Animated.View style={[s.card, { opacity: fadeAnim }]}>
      <View style={[s.severityBar, { backgroundColor: SEVERITY_COLORS[item.severity] }]} />
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Text style={s.icon}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.pest}>Crop: {item.crop}</Text>
          <Text style={s.pest}>Pest/Disease: {item.pest}</Text>
          <Text style={s.precaution}>Precaution: {item.precaution}</Text>
          <Text style={{ fontWeight: "600", color: SEVERITY_COLORS[item.severity], marginTop: 2 }}>
            Severity: {item.severity}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.title}>Smart Pest & Disease Detection</Text>
      <Text style={s.sub}>
        Analyzing crop, season, and weather data… 🌱
      </Text>

      {/* Animated placeholder box instead of Lottie */}
      <View style={s.animationBox}>
        {loading ? <ActivityIndicator size="large" color="#0B6E4F" /> : <Text style={s.animText}>📡 AI Scanning...</Text>}
      </View>

      <TouchableOpacity style={s.btn} onPress={getAdvice}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Detect Pests</Text>
      </TouchableOpacity>

      {adviceList && (
        <FlatList
          data={adviceList}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderItem}
          style={{ marginTop: 20 }}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FCFFFB" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6, color: "#0B6E4F" },
  sub: { fontSize: 14, marginBottom: 20, color: "#555" },
  btn: {
    backgroundColor: "#0B6E4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 6,
  },
  severityBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  icon: { fontSize: 36 },
  pest: { fontSize: 16, fontWeight: "600", color: "#333" },
  precaution: { fontSize: 14, color: "#555", marginTop: 2 },
  animationBox: {
    height: 120,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 16,
  },
  animText: { fontSize: 18, fontWeight: "600", color: "#0B6E4F" },
});
