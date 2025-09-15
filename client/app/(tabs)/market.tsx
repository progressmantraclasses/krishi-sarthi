// client/app/(tabs)/market.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import axios from "@/lib/api";
// import { Card } from "react-native-paper";
import Card from "../../components/Card";

export default function Market() {
  const [prices, setPrices] = useState<any>(null);
  const load = async() => {
    const r = await axios.get("/misc/market-prices");
    setPrices(r.data.prices);
  };
  useEffect(()=>{ load(); },[]);
  return (
    <View style={s.root}>
      <Card>
        <Text style={s.title}>Market Prices</Text>
        {!prices ? <Text>Loading...</Text> : (
          <FlatList
            data={Object.entries(prices)}
            keyExtractor={([k])=>k}
            renderItem={({item})=>(
              <View style={s.row}><Text style={{fontWeight:"700"}}>{item[0]}</Text><Text>{item[0]}</Text></View>
            )}
          />
        )}
        <TouchableOpacity onPress={load} style={s.refresh}><Text style={{color:"#fff"}}>Refresh</Text></TouchableOpacity>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, padding:12 },
  title:{ fontWeight:"700", fontSize:18, marginBottom:8 },
  row:{ flexDirection:"row", justifyContent:"space-between", paddingVertical:8 },
  refresh:{ marginTop:12, backgroundColor:"#0B6E4F", padding:10, borderRadius:8, alignItems:"center" }
});
