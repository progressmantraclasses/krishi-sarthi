// client/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0B6E4F',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarStyle: {
          height: 68 + (Platform.OS === 'ios' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = "home-outline";
          
          if (route.name === "index") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "advisory") {
            iconName = focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
          } else if (route.name === "pest") {
            iconName = focused ? "bug" : "bug-outline";
          } else if (route.name === "weather") {
            iconName = focused ? "cloud" : "cloud-outline";
          } else if (route.name === "market") {
            iconName = focused ? "trending-up" : "trending-up-outline";
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#0B6E4F",
        tabBarInactiveTintColor: "#777",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          href: "/", 
          title: "Home",
          headerTitle: "Namaste, Kisan"
        }} 
      />
      <Tabs.Screen 
        name="advisory" 
        options={{ 
          title: "Advisory",
          headerTitle: "Crop Advisory"
        }} 
      />
      <Tabs.Screen 
        name="pest" 
        options={{ 
          title: "Pest",
          headerTitle: "Pest Detection"
        }} 
      />
      <Tabs.Screen 
        name="weather" 
        options={{ 
          title: "Weather",
          headerTitle: "Weather Forecast"
        }} 
      />
      <Tabs.Screen 
        name="market" 
        options={{ 
          title: "Market",
          headerTitle: "Market Prices"
        }} 
      />
      
      {/* Hide settings from tab bar but keep it accessible */}
      <Tabs.Screen 
        name="settings" 
        options={{ 
          href: null,  // This removes it from the tab bar
          headerTitle: "Settings"
        }} 
      />
    </Tabs>
  );
}