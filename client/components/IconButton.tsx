import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  name: string;
  size?: number;
  onPress?: () => void;
  color?: string;
};

/** small circular icon button */
export default function IconButton({ name, size = 20, onPress, color = '#0B6E4F' }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.root} activeOpacity={0.7}>
      <Ionicons name={name as any} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});
