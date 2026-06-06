import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import { createDeck, deleteDeck, getDecks, updateDeck } from '../db/database';
import { Deck, RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Decks'>;
};

export default function DecksScreen({ navigation }: Props) {
  const [decks, setDecks] = useState<Deck[]>(() => getDecks());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const reload = useCallback(() => setDecks(getDecks()), []);

  const handleAdd = () => {
    Alert.prompt(
      '新しいデッキ',
      'デッキ名を入力してください',
      (name) => {
        if (!name?.trim()) return;
        createDeck(name.trim());
        reload();
      },
      'plain-text'
    );
  };

  const handleDelete = (deck: Deck) => {
    Alert.alert(
      `「${deck.name}」を削除`,
      '単語も全て削除されます。よろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deleteDeck(deck.id);
            reload();
          },
        },
      ]
    );
  };

  const startEditDeckName = (deck: Deck) => {
    setEditingId(deck.id);
    setEditingName(deck.name);
  };

  const commitEditDeckName = (id: number) => {
    if (editingName.trim()) {
      updateDeck(id, editingName.trim());
      reload();
    }
    setEditingId(null);
  };

  const renderDeck = ({ item }: { item: Deck }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DeckDetail', { deckId: item.id, deckName: item.name })}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {editingId === item.id ? (
          <TextInput
            style={styles.editInput}
            value={editingName}
            onChangeText={setEditingName}
            onBlur={() => commitEditDeckName(item.id)}
            onSubmitEditing={() => commitEditDeckName(item.id)}
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={() => startEditDeckName(item)}>
            <Text style={styles.deckName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.wordCount}>{item.word_count ?? 0} 単語</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>単語帳</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>＋ デッキ追加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={decks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDeck}
        contentContainerStyle={decks.length === 0 ? { flex: 1 } : { padding: 16, gap: 12 }}
        ListEmptyComponent={
          <EmptyState
            message="デッキがありません"
            sub="「＋ デッキ追加」で最初のデッキを作りましょう"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22, color: '#6B7280' },
  addBtn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  deckName: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 4 },
  editInput: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#4A90D9',
    paddingVertical: 2,
    marginBottom: 4,
  },
  wordCount: { fontSize: 13, color: '#9CA3AF' },
  arrow: { fontSize: 22, color: '#D1D5DB', marginLeft: 8 },
});
