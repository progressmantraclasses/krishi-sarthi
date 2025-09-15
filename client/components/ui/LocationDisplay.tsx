import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';

const LocationDisplay = () => {
  const [locationName, setLocationName] = useState('Loading...');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // 1️⃣ Location permission request
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Permission denied');
          return;
        }

        // 2️⃣ Get current coordinates
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;

        // 3️⃣ Reverse geocode using OpenStreetMap Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();

        // 4️⃣ Set readable address
        setLocationName(data.display_name || 'Address not found');
      } catch (error) {
        console.error(error);
        setLocationName('Unable to fetch location');
      }
    };

    fetchLocation();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>{locationName}</Text>
    </View>
  );
};

export default LocationDisplay;
