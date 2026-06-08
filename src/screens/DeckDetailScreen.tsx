import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import LevelBadge from '../components/LevelBadge';
import { bulkCreateWords, deleteWord, getWords } from '../db/database';
import { LEVEL_LABELS, MemoryLevel, RootStackParamList, Word } from '../types';
import { pickAndParseCSV } from '../utils/csv';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeckDetail'>;
  route: RouteProp<RootStackParamList, 'DeckDetail'>;
};

const ALL_LEVELS: MemoryLevel[] = [0, 1, 2, 3, 4];

export default function DeckDetailScreen({ navigation, route }: Props) {
  const { deckId, deckName } = route.params;
  const [words, setWords] = useState<Word[]>(() => getWords(deckId));
  const [filterLevel, setFilterLevel] = useState<MemoryLevel | null>(null);

  const reload = useCallback(() => setWords(getWords(deckId)), [deckId]);

  useFocusEffect(reload);

  const filtered = filterLevel === null ? words : words.filter((w) => w.level === filterLevel);

  const handleDelete = (word: Word) => {
    Alert.alert(
      '単語を削除',
      `「${word.question}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deleteWord(word.id);
            reload();
          },
        },
      ]
    );
  };

  const handleCSVImport = async () => {
    try {
      const parsed = await pickAndParseCSV();
      if (!parsed) return;
      const count = bulkCreateWords(deckId, parsed);
      reload();
      Alert.alert('インポート完了', `${count} 件の単語を追加しました`);
    } catch (e) {
      Alert.alert('エラー', 'CSVの読み込みに失敗しました');
    }
  };

  const renderWord = ({ item }: { item: Word }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WordForm', { deckId, wordId: item.id })}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardBody}>
        <Text style={styles.question}>{item.question}</Text>
        {item.reading ? <Text style={styles.reading}>{item.reading}</Text> : null}
        <Text style={styles.answer}>{item.answer}</Text>
      </View>
      <LevelBadge level={item.level as MemoryLevel} size="sm" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{deckName}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.csvBtn} onPress={handleCSVImport}>
            <Text style={styles.csvBtnText}>CSV</Text>
          </TouchableOpacity>
          {words.length > 0 && (
            <TouchableOpacity
              style={styles.listenBtn}
              onPress={() => navigation.navigate('Listen', { deckId, deckName })}
            >
              <Text style={styles.listenBtnText}>▶ 聞く</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterLevel === null && styles.filterChipActive]}
          onPress={() => setFilterLevel(null)}
        >
          <Text style={[styles.filterText, filterLevel === null && styles.filterTextActive]}>
            全て ({words.length})
          </Text>
        </TouchableOpacity>
        {ALL_LEVELS.map((lv) => {
          const count = words.filter((w) => w.level === lv).length;
          return (
            <TouchableOpacity
              key={lv}
              style={[styles.filterChip, filterLevel === lv && styles.filterChipActive]}
              onPress={() => setFilterLevel(filterLevel === lv ? null : lv)}
            >
              <Text style={[styles.filterText, filterLevel === lv && styles.filterTextActive]}>
                {LEVEL_LABELS[lv]} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderWord}
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { padding: 16, gap: 10 }}
        ListEmptyComponent={
          <EmptyState
            message={filterLevel !== null ? 'このレベルの単語はありません' : '単語がありません'}
            sub={filterLevel === null ? '＋ボタンで単語を追加するか、CSVをインポートしましょう' : undefined}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('WordForm', { deckId })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 52,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 17, color: '#4A90D9' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  csvBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  csvBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  listenBtn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  listenBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 48,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: { backgroundColor: '#4A90D9' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBody: { flex: 1, marginRight: 10 },
  question: { fontSize: 16, fontWeight: '600', color: '#111827' },
  reading: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  answer: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, lineHeight: 32 },
});
