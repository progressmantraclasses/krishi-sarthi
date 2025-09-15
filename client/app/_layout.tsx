// client/app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Ensures UI respects safe area including bottom gesture nav */}
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="auth/login"
            options={{
              headerShown: true,
              headerTitle: "Login",
              headerStyle: {
                backgroundColor: "#0B6E4F",
              },
              headerTintColor: "#fff",
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f201fff", // match your theme
  },
});
