import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ALL_LEVELS, LEVEL_COLORS, Word } from '../../types';

export default function MasteryBar({ words }: { words: Word[] }) {
  const t = useTheme();
  const total = words.length || 1;
  return (
    <View style={[styles.track, { backgroundColor: t.hair }]}>
      {ALL_LEVELS.map((lv) => {
        const n = words.filter((w) => w.level === lv).length;
        if (n === 0) return null;
        return <View key={lv} style={{ width: `${(n / total) * 100}%`, backgroundColor: LEVEL_COLORS[lv] }} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 6, borderRadius: 999, overflow: 'hidden', gap: 1.5 },
});
