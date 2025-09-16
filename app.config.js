export default {
  expo: {
    name: "Pest & Crop Advisor",
    slug: "pest-crop-advisor",
    version: "1.0.0",
    platforms: ["ios", "android"],

    ios: {
      infoPlist: {
        NSCameraUsageDescription: "This app needs camera access to analyze crop images.",
        NSPhotoLibraryUsageDescription: "This app needs photo access to analyze crop images.",
        NSMicrophoneUsageDescription: "This app needs microphone access for voice input",
      },
    },

    android: {
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "RECORD_AUDIO"
      ],
    },

    extra: {
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.AIzaSyDF3KAQn3gSShNo-TJp47BTw4hELH-tA64,
    },

    // Only image-picker here; linear-gradient & expo-speech do NOT need plugins
    plugins: [
      "expo-image-picker",
    ],
  },
};
