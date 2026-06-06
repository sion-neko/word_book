import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LEVEL_COLORS, LEVEL_LABELS, MemoryLevel } from '../types';

interface Props {
  level: MemoryLevel;
  onPress?: (level: MemoryLevel) => void;
  size?: 'sm' | 'md';
}

export default function LevelBadge({ level, onPress, size = 'md' }: Props) {
  const color = LEVEL_COLORS[level];
  const label = LEVEL_LABELS[level];
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(level)}
      disabled={!onPress}
      style={[
        styles.badge,
        { backgroundColor: color + '20', borderColor: color },
        isSmall && styles.small,
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color }, isSmall && styles.smallText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 11,
  },
});
