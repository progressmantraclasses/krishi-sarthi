// client/app/settings.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import Card from "@/components/Card";

export default function Settings() {
  const [lang, setLang] = useState("hi");
  const [offline, setOffline] = useState(false);
  return (
    <View style={s.root}>
      <Card>
        <Text style={s.title}>Settings</Text>
        <View style={{marginTop:8}}>
          <Text style={{marginBottom:6}}>Language</Text>
          <View style={{flexDirection:"row", gap:8}}>
            <Text onPress={()=>setLang("hi")} style={{fontWeight: lang==="hi" ? "700":"400"}}>Hindi</Text>
            <Text onPress={()=>setLang("en")} style={{fontWeight: lang==="en" ? "700":"400", marginLeft:16}}>English</Text>
          </View>
        </View>

        <View style={{marginTop:12}}>
          <Text>Offline mode (demo)</Text>
          <Switch value={offline} onValueChange={setOffline}/>
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, padding:12 },
  title:{ fontWeight:"700", fontSize:18 }
});
