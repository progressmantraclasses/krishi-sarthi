import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type Props = {
  uri?: string;
  size?: number;
  name?: string;
};

/**
 * Small avatar component that either displays image or initials badge.
 */
export default function Avatar({ uri, size = 40, name = 'U' }: Props) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const initials = (name || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.root, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: Math.max(12, size / 3) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#E6F6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#0B6E4F', fontWeight: '700' },
});
