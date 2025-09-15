// client/app/(tabs)/pest.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "@/lib/api";
import Card from "@/components/Card";

export default function Pest() {
  const [img, setImg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickAndUpload = async () => {
    const p = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (p.canceled) return;
    setImg((p as any).assets[0].uri);

    setLoading(true);
    const form = new FormData();
    // @ts-ignore
    form.append("image", { uri: p.uri, name: "img.jpg", type: "image/jpeg" });
    try {
      const r = await axios.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data.result);
    } catch (e) {
      setResult({ disease: "Unknown", confidence: 0.0, remedy: "Could not analyze. Try again." });
    } finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <Card>
        <Text style={s.title}>Pest & Disease Detection</Text>
        <Text>Upload a clear photo of leaf / crop.</Text>

        <TouchableOpacity onPress={pickAndUpload} style={s.button}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>{img ? "Upload new image" : "Select Image"}</Text>
        </TouchableOpacity>

        {img && <Image source={{ uri: img }} style={s.preview} />}

        {loading && <ActivityIndicator size="large" color="#0B6E4F" style={{ marginTop: 12 }} />}
        {result && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "700" }}>{result.disease}</Text>
            <Text>Confidence: {(result.confidence || 0).toFixed(2)}</Text>
            <Text style={{ marginTop: 8, color: "#0B6E4F" }}>{result.remedy}</Text>
          </View>
        )}
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 12 },
  title: { fontWeight: "700", fontSize: 18, marginBottom: 8 },
  button: { marginTop: 12, backgroundColor: "#0B6E4F", padding: 12, borderRadius: 10, alignItems: "center" },
  preview: { width: "100%", height: 220, marginTop: 12, borderRadius: 12 },
});
