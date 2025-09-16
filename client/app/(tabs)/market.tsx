import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { fetchAllMarketRates, MarketRecord } from "../../lib/market";

export default function MarketSearchScreen() {
  const [query, setQuery] = useState("");
  const [allData, setAllData] = useState<MarketRecord[]>([]);
  const [filtered, setFiltered] = useState<MarketRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchAllMarketRates();
      setAllData(data);
      setFiltered(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (!text) {
      setFiltered(allData);
      return;
    }
    const lower = text.toLowerCase();
    const results = allData.filter(
      (item) =>
        item.state.toLowerCase().includes(lower) ||
        item.district.toLowerCase().includes(lower) ||
        item.market.toLowerCase().includes(lower) ||
        item.commodity.toLowerCase().includes(lower)
    );
    setFiltered(results);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search by State, District, Market, Commodity..."
        value={query}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.commodity}>
              {item.commodity} ({item.variety})
            </Text>
            <Text>State: {item.state}</Text>
            <Text>District: {item.district}</Text>
            <Text>Market: {item.market}</Text>
            <Text>Grade: {item.grade}</Text>
            <Text>
              Min: ₹{item.minPrice} | Max: ₹{item.maxPrice} | Modal: ₹
              {item.modalPrice}
            </Text>
            <Text>Date: {item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#e0f7fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  commodity: { fontWeight: "bold", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
