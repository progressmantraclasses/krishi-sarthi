// client/utils/locationService.ts
import * as Location from 'expo-location';

export const getCurrentCoordinates = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission denied');
  
  const loc = await Location.getCurrentPositionAsync({});
  return loc.coords; // { latitude, longitude }
};