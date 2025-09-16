import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Alert,
  Platform 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "@/lib/api";
import Card from "@/components/Card";

// Define types for better type safety
interface DetectionResult {
  disease: string;
  pest?: string;
  confidence: number;
  category: 'disease' | 'pest' | 'healthy' | 'unknown';
  remedy: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  treatment_steps: string[];
  organic_solutions: string[];
  chemical_solutions?: string[];
  estimated_recovery_time: string;
}

export default function Pest() {
  const [img, setImg] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request camera permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to analyze your images!'
        );
        return false;
      }
    }
    return true;
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Better quality for detection
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setImg(imageUri);
        await uploadAndAnalyze(imageUri, result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to select image');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'We need camera access to take photos for analysis.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setImg(imageUri);
        await uploadAndAnalyze(imageUri, result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setError('Failed to take photo');
    }
  };

  const uploadAndAnalyze = async (imageUri: string, imageAsset: any) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Create proper file object for upload
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: `pest_detection_${Date.now()}.jpg`,
      } as any;

      formData.append('image', imageFile);
      formData.append('analysis_type', 'pest_disease'); // Specify analysis type

      const response = await axios.post('/api/pest-detection', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.data && response.data.success) {
        setResult(response.data.result);
      } else {
        throw new Error(response.data?.message || 'Analysis failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Could not analyze image. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try again.';
      } else if (error.response?.status === 413) {
        errorMessage += 'Image too large. Please try a smaller image.';
      } else if (error.response?.status >= 500) {
        errorMessage += 'Server error. Please try again later.';
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      
      // Set a fallback result for demo purposes
      setResult({
        disease: "Analysis Failed",
        category: 'unknown',
        confidence: 0,
        remedy: errorMessage,
        prevention: "Please try uploading a clear, well-lit image of the affected plant part.",
        severity: 'low',
        symptoms: [],
        treatment_steps: [],
        organic_solutions: [],
        estimated_recovery_time: "N/A"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#DC2626';
      case 'medium': return '#EA580C';
      case 'low': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'disease': return '🦠';
      case 'pest': return '🐛';
      case 'healthy': return '✅';
      default: return '❓';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>🌿 Pest & Disease Detection</Text>
          <Text style={styles.subtitle}>
            Upload a clear photo of leaves, stems, or affected crop areas for AI-powered analysis
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={takePhoto} style={[styles.button, styles.primaryButton]}>
            <Text style={styles.buttonText}>📷 Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={pickFromGallery} style={[styles.button, styles.secondaryButton]}>
            <Text style={[styles.buttonText, { color: '#0B6E4F' }]}>
              📂 {img ? "Choose Different Image" : "Select from Gallery"}
            </Text>
          </TouchableOpacity>
        </View>

        {img && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: img }} style={styles.preview} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0B6E4F" />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {result && !loading && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getCategoryIcon(result.category)}</Text>
              <View style={styles.resultTitle}>
                <Text style={styles.diseaseName}>
                  {result.pest ? result.pest : result.disease}
                </Text>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidence}>
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </Text>
                  <View style={[
                    styles.severityBadge, 
                    { backgroundColor: getSeverityColor(result.severity) }
                  ]}>
                    <Text style={styles.severityText}>
                      {result.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {result.symptoms && result.symptoms.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔍 Symptoms Detected</Text>
                {result.symptoms.map((symptom, index) => (
                  <Text key={index} style={styles.listItem}>• {symptom}</Text>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💊 Treatment</Text>
              <Text style={styles.remedyText}>{result.remedy}</Text>
              
              {result.treatment_steps && result.treatment_steps.length > 0 && (
                <View style={styles.stepsContainer}>
                  <Text style={styles.stepsTitle}>Treatment Steps:</Text>
                  {result.treatment_steps.map((step, index) => (
                    <Text key={index} style={styles.stepItem}>
                      {index + 1}. {step}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {result.organic_solutions && result.organic_solutions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌱 Organic Solutions</Text>
                {result.organic_solutions.map((solution, index) => (
                  <Text key={index} style={styles.listItem}>• {solution}</Text>
                ))}
              </View>
            )}

            {result.chemical_solutions && result.chemical_solutions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚗️ Chemical Solutions</Text>
                {result.chemical_solutions.map((solution, index) => (
                  <Text key={index} style={styles.listItem}>• {solution}</Text>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛡️ Prevention</Text>
              <Text style={styles.preventionText}>{result.prevention}</Text>
            </View>

            {result.estimated_recovery_time && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏰ Recovery Time</Text>
                <Text style={styles.recoveryTime}>{result.estimated_recovery_time}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>📋 Tips for Better Results:</Text>
          <Text style={styles.tipItem}>• Use good lighting and avoid shadows</Text>
          <Text style={styles.tipItem}>• Capture affected areas clearly</Text>
          <Text style={styles.tipItem}>• Include some healthy parts for comparison</Text>
          <Text style={styles.tipItem}>• Avoid blurry or distant shots</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 8,
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0B6E4F',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#0B6E4F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    marginBottom: 20,
  },
  preview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  resultIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  resultTitle: {
    flex: 1,
  },
  diseaseName: {
    fontWeight: '700',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidence: {
    fontSize: 14,
    color: '#6B7280',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  remedyText: {
    color: '#0B6E4F',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  preventionText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  recoveryTime: {
    color: '#0B6E4F',
    fontSize: 14,
    fontWeight: '500',
  },
  listItem: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  stepsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepsTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  stepItem: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  tips: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tipsTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
  },
  tipItem: {
    color: '#1E40AF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
});