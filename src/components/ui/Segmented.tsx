import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Option<T> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: t.pill }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.seg, on ? t.shadowSoft : null, { backgroundColor: on ? t.surface : 'transparent' }]}
          >
            <Text style={{ color: on ? t.ink : t.sub, fontFamily: t.font(700), fontSize: 14.5 }}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4, borderRadius: 14, padding: 4 },
  seg: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
