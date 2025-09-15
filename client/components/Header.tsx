import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import Avatar from './Avatar';

type Props = {
  title?: string;
  subtitle?: string;
  style?: ViewStyle | ViewStyle[];
  logo?: any; // require(...) or { uri: string }
  showAvatar?: boolean;
};

/**
 * App header used on Home and top-level pages.
 * Shows optional logo on left, title/subtitle, and avatar on right.
 */
export default function Header({
  title = 'AgroVision',
  subtitle,
  style,
  logo,
  showAvatar = true,
}: Props) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.left}>
        {logo ? (
          <Image source={logo} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder} />
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {showAvatar ? <Avatar size={44} name="Kisan" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: { width: 48, height: 48, borderRadius: 10 },
  logoPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#E8F6F1',
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#666', fontSize: 12 },
});
