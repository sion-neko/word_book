import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEVEL_COLORS, LEVEL_LABELS, Word } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import Icon from '../Icon';

interface Props {
  word: Word;
  num: number;
  isLast: boolean;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onPress: () => void;
}

export default function WordRow({ word, num, isLast, selectMode, selected, onToggleSelect, onPress }: Props) {
  const t = useTheme();

  const tagColor = LEVEL_COLORS[word.level];
  const tagLabel = LEVEL_LABELS[word.level];

  const rowStyle = [
    styles.row,
    { backgroundColor: t.surface, borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: t.hair },
  ];

  const content = (
    <>
      {selectMode ? (
        <View
          style={[
            styles.selectDot,
            { borderColor: t.faint, borderWidth: selected ? 0 : 1.5, backgroundColor: selected ? t.accent : 'transparent' },
          ]}
        >
          {selected && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
        </View>
      ) : (
        <Text style={[styles.num, { color: t.faint, fontFamily: t.mono(400) }]}>{num}</Text>
      )}
      <View style={styles.body}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.front, { color: t.ink, fontFamily: t.font(600) }]} numberOfLines={1}>
            {word.question}
          </Text>
          <Text style={[styles.back, { color: t.sub, fontFamily: t.font(400) }]} numberOfLines={1}>
            {word.answer}
          </Text>
        </View>
        {!selectMode && (
          <View style={styles.tagWrap}>
            <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
            <Text style={{ color: tagColor, fontFamily: t.font(700), fontSize: 12.5, minWidth: 36 }}>{tagLabel}</Text>
          </View>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={selectMode ? onToggleSelect : onPress}
      style={rowStyle}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  selectDot: { width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  num: { width: 20, textAlign: 'right', fontSize: 13 },
  body: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  front: { fontSize: 16 },
  back: { fontSize: 13.5, marginTop: 2 },
  tagWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  tagDot: { width: 8, height: 8, borderRadius: 999 },
});
