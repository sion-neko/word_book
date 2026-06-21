import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import Icon from '../Icon';

interface Props {
  rate: number;
  onChange: (v: number) => void;
  compact?: boolean;
}

export default function SpeedControl({ rate, onChange, compact }: Props) {
  const t = useTheme();
  const dec = () => onChange(Math.max(0.5, Math.round((rate - 0.25) * 100) / 100));
  const inc = () => onChange(Math.min(2, Math.round((rate + 0.25) * 100) / 100));
  const size = compact ? 30 : 38;

  return (
    <View style={[styles.wrap, { backgroundColor: t.pill }]}>
      {!compact && (
        <View style={styles.gaugeWrap}>
          <Icon name="gauge" size={16} color={t.sub} />
        </View>
      )}
      <TouchableOpacity onPress={dec} disabled={rate <= 0.5} style={[styles.btn, { width: size, height: size, opacity: rate <= 0.5 ? 0.3 : 1 }]}>
        <Text style={{ color: t.ink, fontSize: 20, fontFamily: t.font(700) }}>−</Text>
      </TouchableOpacity>
      <Text
        style={{
          minWidth: compact ? 48 : 58,
          textAlign: 'center',
          color: t.ink,
          fontFamily: t.mono(500),
          fontSize: compact ? 14 : 16,
        }}
      >
        {rate.toFixed(2).replace(/0$/, '')}×
      </Text>
      <TouchableOpacity onPress={inc} disabled={rate >= 2} style={[styles.btn, { width: size, height: size, opacity: rate >= 2 ? 0.3 : 1 }]}>
        <Text style={{ color: t.ink, fontSize: 20, fontFamily: t.font(700) }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, padding: 3 },
  gaugeWrap: { marginLeft: 9, marginRight: 4 },
  btn: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
