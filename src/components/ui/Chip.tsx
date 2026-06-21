import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hexA } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  count?: number;
}

export default function Chip({ label, active, onPress, color, count }: Props) {
  const t = useTheme();
  const activeBg = active ? (color ? hexA(color, t.dark ? 0.22 : 0.13) : t.ink) : 'transparent';
  const textColor = active ? color ?? (t.dark ? t.ink : t.surface) : t.sub;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, { borderColor: active ? 'transparent' : t.hair, backgroundColor: activeBg }]}
    >
      {color && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={{ color: textColor, fontFamily: t.font(600), fontSize: 14 }}>{label}</Text>
      {count != null && (
        <Text style={{ color: textColor, fontFamily: t.mono(400), fontSize: 12, opacity: 0.7 }}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  dot: { width: 8, height: 8, borderRadius: 999 },
});
