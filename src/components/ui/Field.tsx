import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
}

export default function Field({ label, value, onChangeText, placeholder, multiline, autoFocus }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: t.sub, fontFamily: t.font(700) }]}>{label}</Text>
      <View style={[styles.box, t.shadowSoft, { backgroundColor: t.fieldBg }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.faint}
          multiline={multiline}
          numberOfLines={multiline ? 2 : 1}
          autoFocus={autoFocus}
          style={[styles.input, { color: t.ink, fontFamily: t.font(400) }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12.5, letterSpacing: 0.5, marginBottom: 7, marginLeft: 4 },
  box: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  input: { fontSize: 17, lineHeight: 22, padding: 0 },
});
