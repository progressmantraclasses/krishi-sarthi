import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  visible?: boolean;
  text?: string;
};

/**
 * A thin banner that appears at top when the app detects offline mode.
 * Use in App shell or pages: <OfflineBanner visible={isOffline} />
 */
export default function OfflineBanner({ visible = false, text = 'You are offline. Actions will be queued.' }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.root}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FFDDAA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  text: { color: '#6C3A00', fontWeight: '600' },
});
