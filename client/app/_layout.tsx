// client/app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="auth/login" 
          options={{
            headerShown: true,
            headerTitle: "Login",
            headerStyle: {
              backgroundColor: '#0B6E4F',
            },
            headerTintColor: '#fff',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}