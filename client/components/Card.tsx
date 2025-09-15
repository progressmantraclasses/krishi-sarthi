import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
};

/**
 * Simple card wrapper used throughout the app — shadowed white card,
 * rounded corners, padding. Accepts style overrides.
 */
export default function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    // subtle shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    // elevation for Android
    elevation: 3,
  },
});
