import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hexA } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { Deck, isWeak, Word } from '../../types';
import Icon from '../Icon';
import MasteryBar from './MasteryBar';

interface Props {
  deck: Deck;
  words: Word[];
  onPress: () => void;
}

export default function FolderCard({ deck, words, onPress }: Props) {
  const t = useTheme();
  const weak = words.filter((w) => isWeak(w.level)).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, t.shadowSoft, { backgroundColor: t.surface }]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: hexA(deck.color, t.dark ? 0.22 : 0.13) }]}>
          <Icon name="layers" size={22} color={deck.color} strokeWidth={1.8} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: t.ink, fontFamily: t.font(700) }]} numberOfLines={1}>
            {deck.name}
          </Text>
          <Text style={[styles.meta, { color: t.sub, fontFamily: t.mono(400) }]}>
            {words.length}問{weak > 0 ? ` · 苦手 ${weak}` : ''}
          </Text>
        </View>
        <Icon name="chevron" size={18} color={t.faint} strokeWidth={2} />
      </View>
      <View style={styles.barWrap}>
        <MasteryBar words={words} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 17 },
  meta: { fontSize: 13, marginTop: 2 },
  barWrap: { marginTop: 14 },
});
