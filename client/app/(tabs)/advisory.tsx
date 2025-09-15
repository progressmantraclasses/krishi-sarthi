// client/app/(tabs)/advisory.tsx
import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "@/lib/api";
import * as Speech from "expo-speech";
import Card from "@/components/Card";

type Msg = { id:string, from: "user"|"bot", text:string };

export default function Advisory() {
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const loadingRef = useRef(false);

  const send = async () => {
    if(!text.trim()) return;
    const m:Msg = { id: Date.now().toString(), from: "user", text };
    setMsgs(prev=>[...prev, m]);
    setText("");
    // call backend
    try {
      const r = await axios.post("/advice", { soilType: "loamy", month: new Date().getMonth()+1, pincode:"110038", query: text });
      if(r.data.success){
        const adv = r.data.advisory;
        const botText = `Rec: ${adv.recommendedCrop}. ${adv.notes}`;
        setMsgs(prev => [...prev, { id: (Date.now()+1).toString(), from: "bot", text: botText } ]);
        Speech.speak(botText);
      } else {
        const err = "Sorry, could not fetch advice.";
        setMsgs(prev => [...prev, { id: (Date.now()+2).toString(), from: "bot", text: err } ]);
      }
    } catch(e){
      setMsgs(prev => [...prev, { id: (Date.now()+3).toString(), from: "bot", text: "Network error, saved to offline queue." } ]);
      // axios wrapper will queue
      await axios.post("/advice", { soilType:"loamy", month: new Date().getMonth()+1, pincode:"110038", query:text },);

    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior="padding">
      <Card style={{ flex: 1 }}>
        <Text style={s.title}>Crop Advisory Chat</Text>

        <FlatList
          data={msgs}
          keyExtractor={i=>i.id}
          style={{ flex: 1 }}
          renderItem={({item}) => (
            <View style={[s.msg, item.from === "user" ? s.me : s.bot]}>
              <Text>{item.text}</Text>
            </View>
          )}
        />

        <View style={s.inputRow}>
          <TextInput value={text} onChangeText={setText} placeholder="Ask something like: 'Which crop after monsoon?'" style={s.input} />
          <TouchableOpacity onPress={send} style={s.send}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 12 },
  title: { fontWeight: "700", fontSize: 18, marginBottom: 8 },
  msg: { padding: 10, borderRadius: 10, marginVertical: 6, maxWidth: "80%" },
  me: { alignSelf: "flex-end", backgroundColor: "#DCFCE7" },
  bot: { alignSelf: "flex-start", backgroundColor: "#FFF6E6" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#eee", padding: 10, borderRadius: 10, backgroundColor: "#fff" },
  send: { padding: 12, backgroundColor: "#0B6E4F", borderRadius: 12 },
});
