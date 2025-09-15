import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, TouchableOpacity, TextInput, Image, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';

const API_BASE = 'http://10.0.2.2:5000/api'; // emulator: use localhost mapping; on device use LAN IP

export default function App() {
  const [lang, setLang] = useState('en');
  const [soil, setSoil] = useState('loamy');
  const [pincode, setPincode] = useState('110038');
  const [month, setMonth] = useState((new Date().getMonth()+1).toString());
  const [chat, setChat] = useState([]);
  const [image, setImage] = useState(null);

  const askAdvice = async () => {
    const payload = { soilType: soil, pincode, month };
    setChat(prev => [...prev, { type:'me', text: `Soil:${soil} Pin:${pincode}` }]);
    try {
      const r = await axios.post(`${API_BASE}/advice`, payload);
      if(r.data.success){
        const adv = r.data.advisory;
        const text = `Recommended Crop: ${adv.recommendedCrop}. ${adv.notes}`;
        setChat(prev => [...prev, { type:'bot', text }]);
        // speak out
        Speech.speak(text, { language: lang==='hi' ? 'hi-IN' : 'en-US' });
      }
    } catch(e){ console.log(e); }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality:0.6 });
    if(!res.cancelled){
      setImage(res.uri);
      // upload to backend
      const form = new FormData();
      form.append('image', { uri: res.uri, name: 'photo.jpg', type: 'image/jpeg' });
      try {
        const r = await axios.post(`${API_BASE}/upload`, form, { headers: {'Content-Type':'multipart/form-data'} });
        if(r.data.success){
          const txt = `Pest detection: ${r.data.result.disease} (conf ${r.data.result.confidence}) - ${r.data.result.remedy}`;
          setChat(prev => [...prev, { type:'bot', text: txt }]);
          Speech.speak(txt, { language: lang==='hi' ? 'hi-IN' : 'en-US' });
        }
      } catch(e){ console.log(e); }
    }
  };

  const marketPrices = async () => {
    const r = await axios.get(`${API_BASE}/misc/market-prices`);
    if(r.data.success){
      setChat(prev => [...prev, { type:'bot', text: `Market: Wheat ${r.data.prices.wheat}, Rice ${r.data.prices.rice}` }]);
    }
  };

  return (
    <SafeAreaView style={{flex:1}}>
      <View style={styles.header}>
        <Text style={styles.title}>AgroVision — Kheti Sarthi</Text>
        <View style={{flexDirection:'row'}}>
          <Button title="EN" onPress={()=>setLang('en')} />
          <Button title="HI" onPress={()=>setLang('hi')} />
        </View>
      </View>

      <View style={styles.controls}>
        <Text>Soil Type</Text>
        <View style={{flexDirection:'row', marginVertical:6}}>
          {['loamy','clay','sandy','silt'].map(s => (
            <TouchableOpacity key={s} onPress={()=>setSoil(s)} style={[styles.chip, soil===s && styles.chipActive]}>
              <Text>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput value={pincode} onChangeText={setPincode} style={styles.input} placeholder="Pincode" keyboardType="numeric" />
        <View style={{flexDirection:'row', gap:8}}>
          <Button title="Get Advice" onPress={askAdvice} />
          <Button title="Market Prices" onPress={marketPrices} />
          <Button title="Upload Image" onPress={pickImage} />
        </View>
      </View>

      <View style={{flex:1, padding:10}}>
        <LottieView source={require('./assets/farm.json')} autoPlay loop style={{height:120}} />
        <ScrollView style={{flex:1}}>
          {chat.map((c,i) => (
            <View key={i} style={[styles.bubble, c.type === 'me' ? styles.me : styles.bot]}>
              <Text>{c.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:{ padding:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title:{ fontSize:18, fontWeight:'700' },
  controls:{ padding:10, borderTopWidth:1, borderBottomWidth:1, borderColor:'#eee' },
  chip:{ padding:8, borderRadius:8, borderWidth:1, marginRight:8 },
  chipActive:{ backgroundColor:'#dff0d8' },
  input:{ borderWidth:1, padding:8, borderRadius:6, marginVertical:6 },
  bubble:{ marginVertical:6, padding:10, borderRadius:10, maxWidth:'80%' },
  me:{ alignSelf:'flex-end', backgroundColor:'#e0f7ff' },
  bot:{ alignSelf:'flex-start', backgroundColor:'#fff4e6' }
});
