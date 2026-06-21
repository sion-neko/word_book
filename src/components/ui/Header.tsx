import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import IconButton from './IconButton';

interface Props {
  title?: string;
  large?: string;
  onBack?: () => void;
  backLabel?: string;
  trailing?: React.ReactNode;
}

export default function Header({ title, large, onBack, backLabel, trailing }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {onBack && backLabel ? (
          <TouchableOpacity onPress={onBack} hitSlop={8} style={styles.textBackBtn}>
            <Text style={{ color: t.accentInk, fontFamily: t.font(700), fontSize: 15 }}>{backLabel}</Text>
          </TouchableOpacity>
        ) : onBack ? (
          <IconButton name="back" onPress={onBack} color={t.accentInk} bg="transparent" strokeWidth={2} />
        ) : (
          <View style={{ width: 4 }} />
        )}
        {title ? (
          <Text style={[styles.title, { color: t.ink, fontFamily: t.font(700) }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={styles.trailing}>{trailing}</View>
      </View>
      {large && (
        <Text style={[styles.large, { color: t.ink, fontFamily: t.font(900) }]}>{large}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 14 },
  textBackBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  title: { flex: 1, textAlign: 'center', fontSize: 16, letterSpacing: 0.2 },
  trailing: { flexDirection: 'row', gap: 6 },
  large: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 14, fontSize: 32, letterSpacing: 0.5 },
});
