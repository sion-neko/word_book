import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  message: string;
  sub?: string;
}

export default function EmptyState({ message, sub }: Props) {
  const t = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: t.ink, fontFamily: t.font(600) }]}>{message}</Text>
      {sub && <Text style={[styles.sub, { color: t.faint, fontFamily: t.font(400) }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 17,
    textAlign: 'center',
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});
