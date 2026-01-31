// client/app/(tabs)/advisory.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl,
  Animated,
  Easing
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Audio } from "expo-av";
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width > 768;

type Msg = {
  id: string;
  from: "user" | "bot";
  text: string;
  type?: "text" | "image" | "voice";
  imageUri?: string;
  weather?: any;
  timestamp: number;
  isSpeaking?: boolean;
};

type WeatherData = {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon?: string;
};

type SoilType = {
  id: string;
  name: string;
  nameHi: string;
  namePa: string;
  icon: string;
};

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳', nativeName: 'ਪੰਜਾਬੀ' }
];

const LOCATIONS = [
  { code: 'delhi', name: 'Delhi', icon: '🏛️', coords: { lat: 28.6139, lon: 77.2090 } },
  { code: 'punjab', name: 'Punjab', icon: '🌾', coords: { lat: 31.1471, lon: 75.3412 } },
  { code: 'uttar pradesh', name: 'Uttar Pradesh', icon: '🏘️', coords: { lat: 26.8467, lon: 80.9462 } }
];

const SOIL_TYPES: SoilType[] = [
  { id: 'loamy', name: 'Loamy', nameHi: 'दोमट', namePa: 'ਮਿਸ਼ਰਿਤ', icon: '🟤' },
  { id: 'clay', name: 'Clay', nameHi: 'चिकनी', namePa: 'ਚਿੱਕੜ', icon: '🧱' },
  { id: 'sandy', name: 'Sandy', nameHi: 'बलुई', namePa: 'ਰੇਤਲੀ', icon: '🏖️' },
  { id: 'black', name: 'Black', nameHi: 'काली', namePa: 'ਕਾਲੀ', icon: '⚫' },
  { id: 'red', name: 'Red', nameHi: 'लाल', namePa: 'ਲਾਲ', icon: '🔴' }
];

export default function Advisory() {
  // Get safe area insets for proper spacing
  const insets = useSafeAreaInsets();
  const tabBarHeight = 83; // Typical tab bar height + padding
  
  // State Management
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLocation, setSelectedLocation] = useState('delhi');
  const [selectedSoilType, setSelectedSoilType] = useState('loamy');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording>();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [defaultQuestions, setDefaultQuestions] = useState<string[]>([]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showSoilSelector, setShowSoilSelector] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typing, setTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Refs and Animations
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize component
  useEffect(() => {
    initializeApp();
    startAnimations();
  }, []);

  useEffect(() => {
    loadDefaultQuestions();
    fetchWeatherData();
  }, [selectedLanguage, selectedLocation]);

  useEffect(() => {
    checkNetworkStatus();
    const networkInterval = setInterval(checkNetworkStatus, 5000);
    return () => clearInterval(networkInterval);
  }, []);

  // Enhanced animations
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation for interactive elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1),
        })
      ])
    ).start();
  };

  const initializeApp = async () => {
    try {
      await requestPermissions();
      await loadCachedData();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();

      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert('Permission Required', 'Camera and media library access needed for image analysis');
      }
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location access needed for weather updates');
      }
      if (audioStatus !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access needed for voice queries');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const loadCachedData = async () => {
    try {
      const cachedLanguage = await SecureStore.getItemAsync('selected_language');
      const cachedLocation = await SecureStore.getItemAsync('selected_location');
      const cachedSoilType = await SecureStore.getItemAsync('selected_soil_type');

      if (cachedLanguage) setSelectedLanguage(cachedLanguage);
      if (cachedLocation) setSelectedLocation(cachedLocation);
      if (cachedSoilType) setSelectedSoilType(cachedSoilType);
    } catch (error) {
      console.error('Cache loading error:', error);
    }
  };

  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(networkState.isConnected || false);
    } catch (error) {
      console.error('Network check error:', error);
      setIsOnline(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(`http://192.168.190.23:5000/api/weather?location=${selectedLocation}`);
      const data = await response.json();
      
      if (data.success && data.weather && data.weather.list && data.weather.list.length > 0) {
        const current = data.weather.list[0];
        setWeatherData({
          temperature: Math.round(current.main.temp),
          description: current.weather[0].description,
          humidity: current.main.humidity,
          windSpeed: current.wind.speed,
          icon: current.weather[0].icon
        });
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherData({
        temperature: 25,
        description: 'Weather unavailable',
        humidity: 60,
        windSpeed: 5
      });
    }
  };

  const loadDefaultQuestions = async () => {
    try {
      const response = await fetch(`http://192.168.190.23:5000/api/default-questions?lang=${selectedLanguage}&location=${selectedLocation}`);
      const data = await response.json();
      
      if (data.success) {
        setDefaultQuestions(data.questions);
      } else {
        setDefaultQuestions(getFallbackQuestions());
      }
    } catch (error) {
      console.error('Default questions error:', error);
      setDefaultQuestions(getFallbackQuestions());
    }
  };

  const getFallbackQuestions = () => {
    const questions = {
      en: [
        "What crops should I plant this season?",
        "How much pesticide should I use for wheat?",
        "What's the best fertilizer for my soil type?",
        "When is the right time to harvest?"
      ],
      hi: [
        "इस सीजन में कौन सी फसल लगानी चाहिए?",
        "गेहूं के लिए कितना कीटनाशक इस्तेमाल करना चाहिए?",
        "मेरी मिट्टी के लिए सबसे अच्छा उर्वरक कौन सा है?",
        "फसल काटने का सही समय कब है?"
      ],
      pa: [
        "ਇਸ ਸੀਜ਼ਨ ਵਿੱਚ ਕਿਹੜੀ ਫਸਲ ਲਗਾਉਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਕਣਕ ਲਈ ਕਿੰਨਾ ਕੀਟਨਾਸ਼ਕ ਵਰਤਣਾ ਚਾਹੀਦਾ ਹੈ?",
        "ਮੇਰੀ ਮਿੱਟੀ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਖਾਦ ਕਿਹੜੀ ਹੈ?",
        "ਫਸਲ ਵੱਢਣ ਦਾ ਸਹੀ ਸਮਾਂ ਕਦੋਂ ਹੈ?"
      ]
    };
    
    return questions[selectedLanguage as keyof typeof questions] || questions.en;
  };

  // Enhanced Text-to-Speech function with proper error handling
  const speakText = async (message: Msg) => {
    try {
      // Stop any ongoing speech
      await Speech.stop();
      setSpeakingMessageId(null);
      
      // If this message is already being spoken, stop it
      if (speakingMessageId === message.id) {
        return;
      }

      // Truncate text if it's too long (Speech API limit is 4000 characters)
      const maxLength = 3500; // Leave some buffer
      let textToSpeak = message.text;
      if (textToSpeak.length > maxLength) {
        textToSpeak = textToSpeak.substring(0, maxLength) + "...";
        Alert.alert(
          'Text Truncated', 
          'The response was too long for speech. Playing first part only.'
        );
      }

      // Set speaking state
      setSpeakingMessageId(message.id);
      
      // Configure speech options based on language
      const speechOptions: Speech.SpeechOptions = {
        language: getLanguageCode(selectedLanguage),
        pitch: 1.0,
        rate: 0.8,
        onStart: () => {
          console.log('Speech started');
        },
        onDone: () => {
          console.log('Speech completed');
          setSpeakingMessageId(null);
        },
        onStopped: () => {
          console.log('Speech stopped');
          setSpeakingMessageId(null);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setSpeakingMessageId(null);
          Alert.alert('Speech Error', 'Could not play audio. Please try again.');
        }
      };

      // Start speaking with truncated text
      await Speech.speak(textToSpeak, speechOptions);
      
    } catch (error) {
      console.error('TTS Error:', error);
      setSpeakingMessageId(null);
      
      if (error.message && error.message.includes('too long')) {
        Alert.alert(
          'Text Too Long', 
          'The response is too long for speech synthesis. Please try with shorter messages.'
        );
      } else {
        Alert.alert(
          'Speech Error', 
          'Text-to-speech is not available. Please check your device settings.'
        );
      }
    }
  };

  const getLanguageCode = (lang: string): string => {
    const languageCodes = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'pa': 'pa-IN'
    };
    return languageCodes[lang as keyof typeof languageCodes] || 'en-US';
  };

  const sendMessage = async (messageText: string, imageUri?: string) => {
    if (!messageText.trim() && !imageUri) return;

    const userMsg: Msg = {
      id: Date.now().toString(),
      from: "user",
      text: messageText || "Image uploaded for analysis",
      type: imageUri ? "image" : "text",
      imageUri,
      timestamp: Date.now()
    };

    setMsgs(prev => [...prev, userMsg]);
    setText("");
    setLoading(true);
    setTyping(true);

    // Enhanced typing animation
    const typingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      ])
    );
    typingAnimation.start();

    try {
      if (!isOnline) {
        throw new Error('offline');
      }

      const endpoint = imageUri ? '/api/image-query' : '/api/chat';
      const payload: any = {
        query: messageText,
        location: selectedLocation,
        language: selectedLanguage,
        soilType: selectedSoilType
      };

      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        payload.image = base64;
      }

      const response = await fetch(`http://192.168.190.23:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        const botMsg: Msg = {
          id: (Date.now() + 1).toString(),
          from: "bot",
          text: data.response,
          weather: data.weather_summary,
          timestamp: Date.now()
        };
        
        setMsgs(prev => [...prev, botMsg]);
        
        // Auto-speak response with delay
        setTimeout(() => {
          speakText(botMsg);
        }, 500);
        
        // Save to cache with proper size management
        await saveToSecureStore(`last_response_${userMsg.id}`, botMsg);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      let errorMessage = "Sorry, I couldn't process your request.";
      
      if (error.message === 'offline') {
        errorMessage = isOnline ? 
          "Message saved offline. Will send when connected." :
          "You're offline. Message saved and will be sent when connected.";
        
        // Save offline message with proper size management
        const offlineMsg = {
          query: messageText,
          location: selectedLocation,
          language: selectedLanguage,
          soilType: selectedSoilType,
          imageUri,
          timestamp: Date.now()
        };
        await saveToSecureStore(`offline_msg_${Date.now()}`, offlineMsg);
      }
      
      const errorMsg: Msg = {
        id: (Date.now() + 2).toString(),
        from: "bot",
        text: errorMessage,
        timestamp: Date.now()
      };
      setMsgs(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTyping(false);
      typingAnimation.stop();
      typingAnim.setValue(0);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access needed for voice queries');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started successfully');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Could not start voice recording');
    }
  };

 // Updated stopRecording function with proper speech-to-text integration
const stopRecording = async () => {
  if (!recording) return;

  try {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(undefined);

    console.log('Recording stopped and stored at', uri);
    
    // Show loading indicator for speech-to-text processing
    setLoading(true);
    
    try {
      // Convert audio file to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64Audio = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Send to your backend for speech-to-text conversion
      const sttResponse = await fetch('http://192.168.190.23:5000/api/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          language: selectedLanguage,
          location: selectedLocation
        })
      });

      const sttData = await sttResponse.json();
      
      if (sttData.success && sttData.text) {
        // Set the converted text in the input field
        setText(sttData.text);
        
        // Optionally auto-send the message
        if (sttData.text.trim()) {
          setTimeout(() => {
            sendMessage(sttData.text);
          }, 500);
        }
      } else {
        throw new Error(sttData.error || 'Speech recognition failed');
      }
      
    } catch (sttError) {
      console.error('Speech-to-text error:', sttError);
      Alert.alert(
        'Speech Recognition Error',
        'Could not convert speech to text. Please try again or type your question.',
        [
          {
            text: 'Try Again',
            onPress: () => startRecording()
          },
          {
            text: 'Type Instead',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
    
  } catch (error) {
    console.error('Failed to stop recording', error);
    Alert.alert('Recording Error', 'Failed to stop recording');
    setLoading(false);
  }
};

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        sendMessage("Please analyze this agricultural image", imageUri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        sendMessage("Please analyze this agricultural image", imageUri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Could not take photo');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchWeatherData(),
        loadDefaultQuestions(),
        checkNetworkStatus()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const saveToSecureStore = async (key: string, data: any) => {
    try {
      const jsonString = JSON.stringify(data);
      
      // Check if data is too large for SecureStore (2048 byte limit)
      if (jsonString.length > 2000) {
        console.warn(`Data for ${key} is too large for SecureStore, using truncated version`);
        
        // For bot messages, save only essential info
        if (data.text && data.text.length > 1000) {
          const truncatedData = {
            ...data,
            text: data.text.substring(0, 1000) + "... [truncated]",
            isTruncated: true
          };
          await SecureStore.setItemAsync(key, JSON.stringify(truncatedData));
        } else {
          // Skip saving if still too large
          console.warn(`Skipping SecureStore save for ${key} - data too large`);
        }
      } else {
        await SecureStore.setItemAsync(key, jsonString);
      }
    } catch (error) {
      console.error(`Error saving to SecureStore (${key}):`, error);
    }
  };

  const savePreference = async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error saving preference ${key}:`, error);
    }
  };

  const renderMessage = ({ item, index }: { item: Msg; index: number }) => {
    const isUser = item.from === "user";
    const isSpeaking = speakingMessageId === item.id;

    return (
      <Animated.View 
        style={[
          s.messageContainer,
          isUser ? s.userMessageContainer : s.botMessageContainer,
          { 
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [-100, 0],
                outputRange: [50, 0]
              })
            }]
          }
        ]}
      >
        <View style={[s.messageBubble, isUser ? s.userBubble : s.botBubble]}>
          {item.imageUri && (
            <View style={s.imageContainer}>
              <Image source={{ uri: item.imageUri }} style={s.messageImage} />
              <View style={s.imageOverlay}>
                <MaterialIcons name="image" size={16} color="white" />
              </View>
            </View>
          )}
          
          <Text style={[s.messageText, isUser ? s.userText : s.botText]}>
            {item.text}
          </Text>
          
          {item.weather && (
            <View style={s.weatherBadge}>
              <MaterialIcons name="wb-cloudy" size={14} color="#8BC34A" />
              <Text style={s.weatherText}>{item.weather}</Text>
            </View>
          )}
          
          <Text style={[s.timestamp, isUser ? s.userTimestamp : s.botTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {!isUser && (
          <TouchableOpacity 
            style={[s.speakButton, isSpeaking && s.speakingButton]}
            onPress={() => speakText(item)}
            activeOpacity={0.7}
          >
            <Animated.View style={[
              s.speakButtonInner,
              isSpeaking && { transform: [{ scale: pulseAnim }] }
            ]}>
              <MaterialIcons 
                name={isSpeaking ? "volume-up" : "volume-up"} 
                size={16} 
                color={isSpeaking ? "#FF6B35" : "#0B6E4F"} 
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!typing) return null;

    return (
      <Animated.View style={[s.typingContainer, { opacity: typingAnim }]}>
        <View style={s.typingBubble}>
          <View style={s.typingDots}>
            <Animated.View style={[
              s.typingDot, 
              { transform: [{ scale: typingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.3]
              })}]}
            ]} />
            <Animated.View style={[
              s.typingDot, 
              { transform: [{ scale: typingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1.3, 1]
              })}]}
            ]} />
            <Animated.View style={[
              s.typingDot,
              { transform: [{ scale: typingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.3]
              })}]}
            ]} />
          </View>
          <Text style={s.typingText}>AI is thinking...</Text>
        </View>
      </Animated.View>
    );
  };

  const renderDefaultQuestion = (question: string, index: number) => (
    <Animated.View
      key={index}
      style={[
        s.questionCard,
        isTablet && s.questionCardTablet,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <TouchableOpacity
        onPress={() => sendMessage(question)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F0FFF0', '#E8F5E8']}
          style={s.questionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[s.questionText, isSmallDevice && s.questionTextSmall]}>
            {question}
          </Text>
          <View style={s.questionIcon}>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#0B6E4F" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSelector = (items: any[], selectedValue: string, onSelect: (value: string) => void, renderItem: (item: any) => JSX.Element) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={s.selectorScroll}
      contentContainerStyle={s.selectorContent}
    >
      {items.map((item) => (
        <TouchableOpacity
          key={item.code || item.id}
          style={[
            s.selectorItem,
            (selectedValue === (item.code || item.id)) && s.selectedSelectorItem
          ]}
          onPress={() => onSelect(item.code || item.id)}
          activeOpacity={0.7}
        >
          {renderItem(item)}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F5E8" />
      
      <LinearGradient 
        colors={['#E8F5E8', '#F0FFF0', '#FFFFFF']} 
        style={s.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        
        {/* Enhanced Header */}
        <Animated.View 
          style={[
            s.header,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <BlurView intensity={90} style={s.headerBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(232,245,232,0.9)']}
              style={s.headerGradient}
            >
              <View style={s.headerContent}>
                <View style={s.headerTop}>
                  <Animated.View 
                    style={[
                      s.titleContainer,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    <Text style={s.title}>🌾 Krishi AI</Text>
                    <Text style={s.subtitle}>
                      {selectedLanguage === 'hi' ? 'आपका स्मार्ट खेती सलाहकार' :
                       selectedLanguage === 'pa' ? 'ਤੁਹਾਡਾ ਸਮਾਰਟ ਖੇਤੀ ਸਲਾਹਕਾਰ' :
                       'Your Smart Farming Assistant'}
                    </Text>
                  </Animated.View>
                  
                  <View style={s.headerControls}>
                    <Animated.View 
                      style={[
                        s.networkStatus, 
                        isOnline ? s.online : s.offline,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <MaterialIcons 
                        name={isOnline ? "wifi" : "wifi-off"} 
                        size={12} 
                        color={isOnline ? "#4CAF50" : "#FF5722"} 
                      />
                    </Animated.View>
                    
                    <TouchableOpacity
                      style={s.controlBtn}
                      onPress={() => setShowLanguageSelector(!showLanguageSelector)}
                    >
                      <Text style={s.controlBtnText}>
                        {LANGUAGES.find(l => l.code === selectedLanguage)?.flag}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={s.controlBtn}
                      onPress={() => setShowLocationSelector(!showLocationSelector)}
                    >
                      <Text style={s.controlBtnText}>
                        {LOCATIONS.find(l => l.code === selectedLocation)?.icon}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Language Selector */}
                {showLanguageSelector && (
                  <Animated.View 
                    style={[
                      s.selectorContainer,
                      { opacity: fadeAnim }
                    ]}
                  >
                    {renderSelector(
                      LANGUAGES,
                      selectedLanguage,
                      (code) => {
                        setSelectedLanguage(code);
                        setShowLanguageSelector(false);
                        savePreference('selected_language', code);
                      },
                      (lang) => (
                        <>
                          <Text style={s.selectorIcon}>{lang.flag}</Text>
                          <Text style={[s.selectorText, selectedLanguage === lang.code && s.selectedSelectorText]}>
                            {lang.nativeName}
                          </Text>
                        </>
                      )
                    )}
                  </Animated.View>
                )}

                {/* Location Selector */}
                {showLocationSelector && (
                  <Animated.View 
                    style={[
                      s.selectorContainer,
                      { opacity: fadeAnim }
                    ]}
                  >
                    {renderSelector(
                      LOCATIONS,
                      selectedLocation,
                      (code) => {
                        setSelectedLocation(code);
                        setShowLocationSelector(false);
                        savePreference('selected_location', code);
                      },
                      (location) => (
                        <>
                          <Text style={s.selectorIcon}>{location.icon}</Text>
                          <Text style={[s.selectorText, selectedLocation === location.code && s.selectedSelectorText]}>
                            {location.name}
                          </Text>
                        </>
                      )
                    )}
                  </Animated.View>
                )}

                {/* Enhanced Weather Card */}
                {weatherData && (
                  <Animated.View 
                    style={[
                      s.weatherCard,
                      { 
                        opacity: fadeAnim,
                        transform: [{ scale: pulseAnim }]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={['rgba(139, 195, 74, 0.15)', 'rgba(76, 175, 80, 0.1)', 'rgba(255, 255, 255, 0.9)']}
                      style={s.weatherGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={s.weatherContent}>
                        <View style={s.weatherMain}>
                          <MaterialIcons name="wb-sunny" size={28} color="#FF9800" />
                          <Text style={s.weatherTemp}>{weatherData.temperature}°C</Text>
                          <Text style={s.weatherDesc}>{weatherData.description}</Text>
                        </View>
                        <View style={s.weatherDetails}>
                          <View style={s.weatherDetail}>
                            <MaterialIcons name="opacity" size={18} color="#2196F3" />
                            <Text style={s.weatherDetailText}>{weatherData.humidity}%</Text>
                          </View>
                          <View style={s.weatherDetail}>
                            <MaterialIcons name="air" size={18} color="#607D8B" />
                            <Text style={s.weatherDetailText}>{weatherData.windSpeed}m/s</Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={msgs}
          keyExtractor={item => item.id}
          style={s.messagesList}
          contentContainerStyle={s.messagesContent}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Enhanced Default Questions */}
        {msgs.length === 0 && (
          <Animated.View 
            style={[
              s.questionsContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <ScrollView 
              style={s.questionsScroll}
              contentContainerStyle={s.questionsContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View 
                style={[
                  s.questionsHeader,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={['#FF9800', '#FFC107']}
                  style={s.lightbulbGradient}
                >
                  <MaterialIcons name="lightbulb-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={s.questionsTitle}>
                  {selectedLanguage === 'hi' ? 'त्वरित प्रश्न पूछें' :
                   selectedLanguage === 'pa' ? 'ਤੁਰੰਤ ਸਵਾਲ ਪੁੱਛੋ' :
                   'Quick Questions'}
                </Text>
              </Animated.View>
              
              <View style={[s.questionsGrid, isTablet && s.questionsGridTablet]}>
                {defaultQuestions.map((question, index) => renderDefaultQuestion(question, index))}
              </View>
              
              {/* Enhanced Soil Type Selector */}
              <Animated.View 
                style={[
                  s.soilSelectorContainer,
                  { opacity: fadeAnim }
                ]}
              >
                <View style={s.soilSelectorHeader}>
                  <LinearGradient
                    colors={['#8BC34A', '#4CAF50']}
                    style={s.soilIconGradient}
                  >
                    <Text style={s.soilSelectorIcon}>🌱</Text>
                  </LinearGradient>
                  <Text style={s.soilSelectorTitle}>
                    {selectedLanguage === 'hi' ? 'मिट्टी का प्रकार चुनें' :
                     selectedLanguage === 'pa' ? 'ਮਿੱਟੀ ਦੀ ਕਿਸਮ ਚੁਣੋ' :
                     'Select Soil Type'}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.soilTypesContainer}>
                    {SOIL_TYPES.map((soil) => (
                      <TouchableOpacity
                        key={soil.id}
                        style={[
                          s.soilTypeCard,
                          selectedSoilType === soil.id && s.selectedSoilType
                        ]}
                        onPress={() => {
                          setSelectedSoilType(soil.id);
                          savePreference('selected_soil_type', soil.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={selectedSoilType === soil.id ? 
                            ['#E8F5E8', '#C8E6C9'] : 
                            ['rgba(255, 255, 255, 0.9)', 'rgba(248, 255, 248, 0.9)']}
                          style={s.soilTypeGradient}
                        >
                          <Text style={s.soilTypeIcon}>{soil.icon}</Text>
                          <Text style={[
                            s.soilTypeName,
                            selectedSoilType === soil.id && s.selectedSoilTypeName
                          ]}>
                            {selectedLanguage === 'hi' ? soil.nameHi :
                             selectedLanguage === 'pa' ? soil.namePa :
                             soil.name}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Enhanced Input Area with Proper Layout */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.keyboardAvoidingView}
        >
          <Animated.View 
            style={[
              s.inputContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                paddingBottom: Math.max(insets.bottom, 16) + tabBarHeight,
              }
            ]}
          >
            <BlurView intensity={95} style={s.inputBlur}>
              <LinearGradient
                colors={['rgba(255,255,255,0.98)', 'rgba(248,255,248,0.95)']}
                style={s.inputGradient}
              >
                <View style={s.inputContent}>
                  {/* Text Input Area - Above buttons */}
                  <View style={s.textInputWrapper}>
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      placeholder={
                        selectedLanguage === 'hi' ? "यहाँ अपना सवाल लिखें..." :
                        selectedLanguage === 'pa' ? "ਇੱਥੇ ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ..." :
                        "Ask me something"
                      }
                      style={[s.textInput, isSmallDevice && s.textInputSmall]}
                      multiline
                      maxLength={500}
                      placeholderTextColor="#999"
                      textAlignVertical="top"
                      numberOfLines={2}
                    />
                    <View style={s.inputFooter}>
                      <Text style={s.charCount}>{text.length}/500</Text>
                      {text.length > 450 && (
                        <MaterialIcons 
                          name="warning" 
                          size={12} 
                          color="#FF9800" 
                          style={s.warningIcon}
                        />
                      )}
                    </View>
                  </View>
                  
                  {/* Action Buttons Row - Below text input */}
                  <View style={s.actionButtonsRow}>
                    {/* Image Picker Button */}
                    <TouchableOpacity 
                      style={s.actionBtn} 
                      onPress={pickImage}
                      activeOpacity={0.8}
                    >
                      <LinearGradient 
                        colors={['#E3F2FD', '#BBDEFB']} 
                        style={s.actionBtnGradient}
                      >
                        <MaterialIcons name="photo-library" size={24} color="#1976D2" />
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    {/* Camera Button */}
                    <TouchableOpacity 
                      style={s.actionBtn} 
                      onPress={takePhoto}
                      activeOpacity={0.8}
                    >
                      <LinearGradient 
                        colors={['#E8F5E8', '#C8E6C9']} 
                        style={s.actionBtnGradient}
                      >
                        <MaterialIcons name="camera-alt" size={24} color="#388E3C" />
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Voice Button */}
                    <TouchableOpacity
                      style={[
                        s.actionBtn,
                        isRecording && s.recordingActiveBtn
                      ]}
                      onPress={isRecording ? stopRecording : startRecording}
                      activeOpacity={0.8}
                    >
                      <LinearGradient 
                        colors={isRecording ? 
                          ['#FFEBEE', '#FFCDD2'] : 
                          ['#FFF3E0', '#FFE0B2']} 
                        style={s.actionBtnGradient}
                      >
                        <MaterialIcons 
                          name={isRecording ? "stop" : "mic"} 
                          size={24} 
                          color={isRecording ? "#D32F2F" : "#F57C00"} 
                        />
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Send Button */}
                    <TouchableOpacity
                      style={[
                        s.sendButton,
                        (!text.trim() && !loading) && s.disabledSendBtn
                      ]}
                      onPress={() => sendMessage(text)}
                      disabled={!text.trim() || loading}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={
                          (!text.trim() && !loading) 
                            ? ['#B0BEB0', '#9E9E9E']
                            : ['#4CAF50', '#2E7D32']
                        }
                        style={s.sendBtnGradient}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <MaterialIcons name="send" size={22} color="#FFFFFF" />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <Animated.View style={[
                      s.recordingIndicator,
                      { transform: [{ scale: pulseAnim }] }
                    ]}>
                      <View style={s.recordingIndicatorContent}>
                        <Animated.View style={[
                          s.recordingDot,
                          { transform: [{ scale: typingAnim }] }
                        ]} />
                        <Text style={s.recordingText}>
                          {selectedLanguage === 'hi' ? 'रिकॉर्डिंग...' :
                           selectedLanguage === 'pa' ? 'ਰਿਕਾਰਡਿੰਗ...' :
                           'Recording...'}
                        </Text>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
  },
  
  // Safe area and keyboard handling
  keyboardAvoidingView: {
    flex: 0,
  },
  
  gradient: {
    flex: 1,
  },
  
  // Enhanced Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
    paddingBottom: 8,
  },
  headerBlur: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#4A7C59',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  networkStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  online: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  offline: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
  },
  controlBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 18,
    minWidth: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  controlBtnText: {
    fontSize: 18,
  },
  
  // Enhanced Selector Styles
  selectorContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  selectorScroll: {
    maxHeight: 60,
  },
  selectorContent: {
    paddingHorizontal: 4,
  },
  selectorItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedSelectorItem: {
    backgroundColor: '#0B6E4F',
    borderColor: '#0B6E4F',
    transform: [{ scale: 1.05 }],
  },
  selectorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  selectorText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  selectedSelectorText: {
    color: '#FFFFFF',
  },
  
  // Enhanced Weather Styles
  weatherCard: {
    marginTop: 16,
  },
  weatherGradient: {
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8BC34A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B5E20',
    marginLeft: 10,
  },
  weatherDesc: {
    fontSize: 15,
    color: '#4A7C59',
    marginLeft: 10,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 13,
    color: '#4A7C59',
    fontWeight: '600',
  },
  
  // Enhanced Messages Styles
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: width * 0.85,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  userBubble: {
    backgroundColor: '#0B6E4F',
    borderBottomRightRadius: 8,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 195, 74, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1B5E20',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.45,
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 195, 74, 0.3)',
  },
  weatherText: {
    fontSize: 13,
    color: '#8BC34A',
    marginLeft: 6,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#9E9E9E',
  },
  speakButton: {
    backgroundColor: 'rgba(11, 110, 79, 0.1)',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
    shadowColor: '#0B6E4F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speakingButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  speakButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Enhanced Typing Indicator
  typingContainer: {
    alignSelf: 'flex-start',
    marginVertical: 8,
    marginLeft: 16,
  },
  typingBubble: {
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    padding: 16,
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8BC34A',
    marginRight: 6,
  },
  typingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  
  // Enhanced Questions Styles
  questionsContainer: {
    maxHeight: height * 0.45,
    paddingHorizontal: 16,
  },
  questionsScroll: {
    flex: 1,
  },
  questionsContent: {
    paddingVertical: 16,
  },
  questionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  lightbulbGradient: {
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  questionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
  },
  questionsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  questionsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  questionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  questionCardTablet: {
    width: '48%',
  },
  questionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#8BC34A',
  },
  questionText: {
    fontSize: 16,
    color: '#1B5E20',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
    fontWeight: '600',
  },
  questionTextSmall: {
    fontSize: 15,
  },
  questionIcon: {
    backgroundColor: 'rgba(11, 110, 79, 0.15)',
    borderRadius: 20,
    padding: 8,
  },
  
  // Enhanced Soil Selector
  soilSelectorContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 195, 74, 0.3)',
  },
  soilSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  soilIconGradient: {
    borderRadius: 16,
    padding: 8,
    marginRight: 10,
  },
  soilSelectorIcon: {
    fontSize: 20,
  },
  soilSelectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  soilTypesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 12,
  },
  soilTypeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  soilTypeGradient: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'rgba(139, 195, 74, 0.3)',
    borderRadius: 24,
  },
  selectedSoilType: {
    transform: [{ scale: 1.05 }],
  },
  soilTypeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  soilTypeName: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedSoilTypeName: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  
  // Enhanced Input Styles with New Layout
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    // paddingBottom will be set dynamically
  },
  inputBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputContent: {
    gap: 12,
  },
  
  // Text Input Wrapper (Above buttons)
  textInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
    fontWeight: '400',
    lineHeight: 22,
  },
  textInputSmall: {
    fontSize: 15,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  warningIcon: {
    marginLeft: 4,
  },
  
  // Action Buttons Row (Below text input)
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  recordingActiveBtn: {
    transform: [{ scale: 1.1 }],
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  disabledSendBtn: {
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Recording Indicator
  recordingIndicator: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderRadius: 20,
    padding: 8,
    marginTop: 8,
  },
  recordingIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#FF5722',
    fontWeight: '600',
  },
  
  // Enhanced Recording Indicator
  // recordingIndicator: {
  //   marginTop: 16,
  //   borderRadius: 24,
  //   overflow: 'hidden',
  // },
  recordingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  //recordingDot: {
  //   width: 10,
  //   height: 10,
  //   borderRadius: 5,
  //   backgroundColor: '#FF5722',
  //   marginRight: 10,
  // },
  // recordingText: {
  //   fontSize: 15,
  //   color: '#FF5722',
  //   fontWeight: '600',
  // },
});