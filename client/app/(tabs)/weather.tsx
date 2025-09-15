// client/app/(tabs)/weather.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import api from "@/lib/api";
import Card from "@/components/Card";
import Header from "@/components/Header";
import axios from "axios";



export default function Weather() {
  const [forecast, setForecast] = useState<any>(null);

  const load = async() => {
    try {
      const r = await axios.get("/misc/weather?pincode=110038");
      setForecast(r.data.forecast);
    } catch(e){
      console.log(e);
    }
  };
  useEffect(()=>{ load(); },[]);

  return (
    <View style={s.root}>
      <Card>
        <Text style={s.title}>Weather Forecast</Text>
        {!forecast ? <Text>Loading...</Text> : (
          <View>
            <Text>Today: {forecast.today.temp}°C — {forecast.today.condition}</Text>
            <Text style={{ marginTop: 8, fontWeight: "700" }}>Next days</Text>
            <FlatList data={forecast.next3} keyExtractor={(_,i)=>i.toString()} renderItem={({item})=>(
              <Text>{item.day}: {item.temp}°C — {item.condition}</Text>
            )} />
          </View>
        )}
        <TouchableOpacity onPress={load} style={s.refresh}><Text style={{color:"#fff"}}>Refresh</Text></TouchableOpacity>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, padding:12 },
  title:{ fontWeight:"700", fontSize:18, marginBottom:8 },
  refresh:{ marginTop:12, backgroundColor:"#0B6E4F", padding:10, borderRadius:8, alignItems:"center" }
});
