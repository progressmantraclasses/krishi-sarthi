import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Props = {
  title: string;
  icon?: string;
  href?: string;
  style?: ViewStyle;
  onPress?: () => void;
};

export default function BigButton({ title, icon = 'home', href, style, onPress }: Props) {
  const router = useRouter();
  const handle = () => {
    if (href) router.push(href as any); // cast fixes TS
    else if (onPress) onPress();
  };

  return (
    <TouchableOpacity style={[styles.root, style]} onPress={handle} activeOpacity={0.8}>
      <Ionicons name={`${icon}-outline` as any} size={22} color="#fff" />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#0B6E4F',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    margin: 6,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
