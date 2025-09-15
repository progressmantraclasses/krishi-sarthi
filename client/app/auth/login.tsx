// client/app/auth/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import api, { setAuthToken } from "@/utils/axiosConfig"; 

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const login = async () => {
    if (!phone) return Alert.alert("Enter phone");

    try {
      // mock server: /auth/login returns token
      const r = await api.post("/auth/login", { phone });

      if (r.data.success) {
        // ✅ set token globally in axios
        setAuthToken(r.data.token);

        // TODO: store token securely (AsyncStorage / SecureStore)
        // await AsyncStorage.setItem("token", r.data.token);

        router.replace("/"); // go to home
      } else {
        Alert.alert("Invalid response from server");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Login failed");
    }
  };

  return (
    <View style={s.root}>
      <Text style={s.title}>Welcome to AgroVision</Text>
      <TextInput
        placeholder="Phone number"
        keyboardType="phone-pad"
        style={s.input}
        value={phone}
        onChangeText={setPhone}
      />
      <TouchableOpacity style={s.btn} onPress={login}>
        <Text style={{ color: "#fff" }}>Login / Signup</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#0B6E4F",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
