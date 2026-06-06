import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  message: string;
  sub?: string;
}

export default function EmptyState({ message, sub }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
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
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
