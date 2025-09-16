import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";
import { LinearGradient } from "expo-linear-gradient";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export default function PestScreen() {
  const [query, setQuery] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const GEMINI_API_KEY = "AIzaSyA3sB8PMnM26UiCuHOPSbXEXFaKtQ7hSf4"; // Replace with your API key

  /**
   * Generate pest advice using text query
   */
  const handleTextAnalysis = async (): Promise<void> => {
    if (!query.trim()) {
      Alert.alert("Input Required", "Please enter a pest or crop name");
      return;
    }

    setLoading(true);
    try {
      const prompt = `
You are an expert agricultural pest control advisor for Indian farmers.
The user query is: "${query}".
Detect the language of this query and reply in the same language.
Use simple, farmer-friendly language suitable for local farmers.

Provide detailed advice covering:
1. Pest/Disease Identification (if applicable)
2. Symptoms to look for
3. Organic/Natural control methods
4. Chemical control options (if necessary)
5. Prevention strategies
6. Best practices for application

Provide output in the same language as the input. Do NOT reply in English if the input is not English.
`;


      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const generatedText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unable to generate advice. Please try again.";

      setAdvice(generatedText);

      // Auto-speak the advice
      if (generatedText) {
        speakAdvice(generatedText);
      }
    } catch (error) {
      console.error("Text analysis error:", error);
      Alert.alert(
        "Error",
        "Failed to get pest advice. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pick image from gallery
   */
  const pickImageFromGallery = async (): Promise<void> => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to photos to analyze pest images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImageUri(selectedImage.uri);
        await analyzeImage(selectedImage.uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  /**
   * Take photo with camera
   */
  const takePictureWithCamera = async (): Promise<void> => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take pest photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0];
        setImageUri(capturedImage.uri);
        await analyzeImage(capturedImage.uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  /**
   * Show image source selection
   */
  const showImageOptions = (): void => {
    Alert.alert("Select Image Source", "Choose how you want to add the pest/crop image", [
      { text: "Camera", onPress: takePictureWithCamera },
      { text: "Gallery", onPress: pickImageFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  /**
   * Analyze uploaded image using Gemini 2.0 Flash
   */
  const analyzeImage = async (uri: string): Promise<void> => {
    setLoading(true);
    try {
      const base64Image = await convertImageToBase64(uri);

      const prompt = `
You are an expert agricultural pest and disease diagnosis specialist for Indian farmers.
Detect the language of this image-related query and reply in the same language.
Use simple, farmer-friendly language suitable for local farmers.

Analyze this crop/pest image and provide:
1. Crop Type
2. Pest/Disease Identification
3. Severity Level
4. Symptoms
5. Treatment Options (Organic + Chemical with Indian product names)
6. Prevention
7. Urgency
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topP: 0.8,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Vision API Error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const analysisResult =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unable to analyze the image. Please ensure the image clearly shows the crop/pest and try again.";

      setAdvice(analysisResult);

      if (analysisResult) {
        speakAdvice(analysisResult);
      }
    } catch (error) {
      console.error("Image analysis error:", error);
      Alert.alert(
        "Analysis Error",
        "Failed to analyze the image. Please ensure you have a good internet connection and the image clearly shows the pest/crop."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Convert image URI to base64
   */
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Base64 conversion error:", error);
      throw new Error("Failed to process image");
    }
  };

  /**
   * Speak the advice using text-to-speech (splits into 4000 char chunks)
   */
  const speakAdvice = (text: string): void => {
  setIsListening(true);

  const chunkSize = 4000;
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }

  const speakChunks = (index: number) => {
    if (index >= chunks.length) {
      setIsListening(false);
      return;
    }
    Speech.speak(chunks[index], {
      rate: 0.8,
      pitch: 1.0,
      onDone: () => speakChunks(index + 1),
      onError: () => setIsListening(false),
    });
  };

  speakChunks(0);
};


  const stopSpeech = (): void => {
    Speech.stop();
    setIsListening(false);
  };

  const clearAll = (): void => {
    setQuery("");
    setImageUri(null);
    setAdvice("");
    Speech.stop();
    setIsListening(false);
  };

  return (
    <LinearGradient colors={["#e8f5e8", "#f0fff0", "#e0f7e0"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🐛 Pest & Crop Advisor</Text>
          <Text style={styles.subtitle}>AI-Powered Agricultural Diagnosis</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 Describe Your Problem</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., white flies on tomato, leaf spots on wheat..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleTextAnalysis}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Get Text Analysis</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📷 Upload Crop/Pest Image</Text>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={showImageOptions}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>📸 Take/Upload Photo</Text>
          </TouchableOpacity>

          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingText}>
              {imageUri ? "Analyzing image..." : "Getting advice..."}
            </Text>
          </View>
        )}

        {advice && !loading && (
          <View style={styles.adviceCard}>
            <View style={styles.adviceHeader}>
              <Text style={styles.adviceTitle}>🎯 Expert Advice</Text>
              <View style={styles.audioControls}>
                {!isListening ? (
                  <TouchableOpacity style={styles.audioButton} onPress={() => speakAdvice(advice)}>
                    <Text style={styles.audioButtonText}>🔊 Listen</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.audioButton, styles.stopButton]}
                    onPress={stopSpeech}
                  >
                    <Text style={styles.audioButtonText}>⏸️ Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <ScrollView style={styles.adviceScrollView}>
              <Text style={styles.adviceText}>{advice}</Text>
            </ScrollView>
          </View>
        )}

        {(advice || imageUri || query) && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
              <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20 },
  header: { alignItems: "center", marginBottom: 30, marginTop: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#2e7d32", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#2e7d32", marginBottom: 15 },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fafafa",
    textAlignVertical: "top",
    marginBottom: 15,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: "#2e7d32" },
  secondaryButton: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#2e7d32" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  secondaryButtonText: { color: "#2e7d32", fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 15, fontSize: 16, fontWeight: "600", color: "#666" },
  imageContainer: { marginTop: 15, position: "relative" },
  image: { width: "100%", height: 200, borderRadius: 10, backgroundColor: "#f0f0f0" },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeImageText: { color: "white", fontSize: 12, fontWeight: "600" },
  loadingContainer: { alignItems: "center", marginVertical: 30 },
  loadingText: { marginTop: 15, fontSize: 16, color: "#2e7d32", fontWeight: "500" },
  adviceCard: {
    backgroundColor: "#e8f5e8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: "#2e7d32",
  },
  adviceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  adviceTitle: { fontSize: 20, fontWeight: "bold", color: "#2e7d32" },
  audioControls: { flexDirection: "row" },
  audioButton: { backgroundColor: "#2e7d32", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 },
  stopButton: { backgroundColor: "#ff5722" },
  audioButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
  adviceScrollView: { maxHeight: 300 },
  adviceText: { fontSize: 16, color: "#333", lineHeight: 24 },
  actionButtons: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  clearButton: { backgroundColor: "#ff5722", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  clearButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
