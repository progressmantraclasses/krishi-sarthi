// client/app/(tabs)/index.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import BigButton from "../../components/BigButton";
import Card from "../../components/Card";

const { width } = Dimensions.get("window");

export default function Home() {
  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.hi}>🌱 Namaste, Kisan</Text>
          <Text style={s.sub}>Smart crop advice & easy pest detection</Text>
        </View>
      </View>

      {/* Farm Animation Placeholder */}
      <View style={s.placeholder}>
        <Text style={s.placeholderText}>🌾 Farm Animation Coming Soon</Text>
      </View>

      {/* Quick Actions */}
      <Card>
        <Text style={s.cardTitle}>Quick Actions</Text>
        <View style={s.actions}>
          <View style={s.actionItem}>
            <BigButton
              title="Ask Advisor"
              icon="chatbubble-ellipses"
              href="/(tabs)/advisory"
            />
          </View>
          <View style={s.actionItem}>
            <BigButton title="Detect Pest" icon="bug" href="/(tabs)/pest" />
          </View>
          <View style={s.actionItem}>
            <BigButton title="Weather" icon="cloud" href="/(tabs)/weather" />
          </View>
          <View style={s.actionItem}>
            <BigButton title="Market" icon="trending-up" href="/(tabs)/market" />
          </View>
        </View>
      </Card>

      {/* Tip Section */}
      <Card>
        <Text style={s.cardTitle}>🌟 Today's Tip</Text>
        <Text style={s.tip}>
          💧 Irrigate lightly after sunrise to reduce fungal infections in crops.
        </Text>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9FCF7",
  },
  container: {
    padding: 16,
    paddingBottom: 100, // ensures scroll until nav bar
  },
  header: {
    marginBottom: 16,
  },
  hi: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2E7D32",
  },
  sub: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  actionItem: {
    width: "48%", // ✅ always 2 per row
  },
  placeholder: {
    height: width * 0.4,
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  placeholderText: {
    color: "#388E3C",
    fontSize: 14,
    fontStyle: "italic",
  },
  tip: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
});
