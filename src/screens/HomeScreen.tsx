import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Field from '../components/ui/Field';
import FolderCard from '../components/ui/FolderCard';
import Header from '../components/ui/Header';
import IconButton from '../components/ui/IconButton';
import Sheet from '../components/ui/Sheet';
import { createDeck, deleteDeck, FOLDER_COLORS, getDecks, getWeakWords, getWords, updateDeck } from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { Deck, LEVEL_COLORS, RootStackParamList, WeakWord, Word } from '../types';

const DANGER = LEVEL_COLORS[0];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [wordsByDeck, setWordsByDeck] = useState<Record<number, Word[]>>({});
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [query, setQuery] = useState('');
  const [folderSheet, setFolderSheet] = useState<{ visible: boolean; deck: Deck | null }>({
    visible: false,
    deck: null,
  });
  const [deletingDeck, setDeletingDeck] = useState<Deck | null>(null);

  const reload = useCallback(() => {
    const ds = getDecks();
    setDecks(ds);
    const map: Record<number, Word[]> = {};
    ds.forEach((d) => {
      map[d.id] = getWords(d.id);
    });
    setWordsByDeck(map);
    setWeakWords(getWeakWords());
  }, []);

  useFocusEffect(reload);

  const shown = decks.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  const totalWords = decks.reduce((n, d) => n + (wordsByDeck[d.id]?.length ?? 0), 0);

  const handleSaveFolder = (name: string, color: string) => {
    if (folderSheet.deck) {
      updateDeck(folderSheet.deck.id, name, color);
    } else {
      createDeck(name, color);
    }
    setFolderSheet({ visible: false, deck: null });
    reload();
  };

  const handleDeleteFolder = (deck: Deck) => {
    setFolderSheet({ visible: false, deck: null });
    setDeletingDeck(deck);
  };

  const confirmDeleteFolder = () => {
    if (!deletingDeck) return;
    deleteDeck(deletingDeck.id);
    setDeletingDeck(null);
    reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Header
        large="単語帳"
        trailing={
          <IconButton
            name="plus"
            label="新規フォルダ"
            onPress={() => setFolderSheet({ visible: true, deck: null })}
            color={t.accentInk}
            bg={t.accentSoft}
            strokeWidth={2.2}
          />
        }
      />

      <FlatList
        data={shown}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <FolderCard
            deck={item}
            words={wordsByDeck[item.id] ?? []}
            onPress={() => navigation.navigate('Folder', { deckId: item.id, deckName: item.name })}
            onLongPress={() => setFolderSheet({ visible: true, deck: item })}
          />
        )}
        ListHeaderComponent={
          <>
            <View style={[styles.searchBar, t.shadowSoft, { backgroundColor: t.fieldBg }]}>
              <Icon name="search" size={18} color={t.faint} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="フォルダを検索"
                placeholderTextColor={t.faint}
                style={[styles.searchInput, { color: t.ink, fontFamily: t.font(400) }]}
              />
            </View>

            {weakWords.length > 0 && query === '' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Study', { words: weakWords, title: '今日の問題' })}
                style={[styles.reviewBtn, t.shadowSoft, { backgroundColor: t.accent }]}
              >
                <View style={[styles.reviewIcon, { backgroundColor: hexA('#ffffff', 0.22) }]}>
                  <Icon name="calendar" size={22} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontFamily: t.font(700), fontSize: 16 }}>今日の問題</Text>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontFamily: t.mono(400),
                      fontSize: 13,
                      marginTop: 1,
                    }}
                  >
                    {weakWords.length}問をまとめて出題
                  </Text>
                </View>
                <Icon name="arrow-right" size={20} color="rgba(255,255,255,0.75)" strokeWidth={2} />
              </TouchableOpacity>
            )}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.sub, fontFamily: t.font(700) }]}>マイフォルダ</Text>
              <Text style={{ color: t.faint, fontFamily: t.mono(400), fontSize: 12 }}>
                {decks.length}個 · {totalWords}問
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            message={decks.length === 0 ? 'フォルダがありません' : '該当するフォルダがありません'}
            sub={decks.length === 0 ? '右上の + から最初のフォルダを作りましょう' : undefined}
          />
        }
      />

      <FolderSheet
        visible={folderSheet.visible}
        deck={folderSheet.deck}
        onClose={() => setFolderSheet({ visible: false, deck: null })}
        onSave={handleSaveFolder}
        onDelete={handleDeleteFolder}
      />

      <ConfirmDialog
        visible={deletingDeck !== null}
        label={deletingDeck ? `「${deletingDeck.name}」を削除しますか？\n中の問題もすべて削除されます` : ''}
        confirmColor={DANGER}
        onCancel={() => setDeletingDeck(null)}
        onConfirm={confirmDeleteFolder}
      />
    </View>
  );
}

function FolderSheet({
  visible,
  deck,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  deck: Deck | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  onDelete: (deck: Deck) => void;
}) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const valid = name.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setName(deck?.name ?? '');
      setColor(deck?.color ?? FOLDER_COLORS[0]);
    }
  }, [visible, deck]);

  const submit = () => {
    if (!valid) return;
    onSave(name.trim(), color);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={deck ? 'フォルダを編集' : '新しいフォルダ'}
      trailing={
        <TouchableOpacity onPress={submit} disabled={!valid} hitSlop={8}>
          <Text style={{ color: valid ? t.accentInk : t.faint, fontFamily: t.font(700), fontSize: 16 }}>
            {deck ? '保存' : '作成'}
          </Text>
        </TouchableOpacity>
      }
    >
      <Field label="フォルダ名" value={name} onChangeText={setName} placeholder="例：TOEIC 必須英単語" autoFocus />
      <Text style={[styles.colorLabel, { color: t.sub, fontFamily: t.font(700) }]}>カラー</Text>
      <View style={styles.colorRow}>
        {FOLDER_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && { borderWidth: 3, borderColor: t.bg, shadowColor: c, shadowOpacity: 1, shadowRadius: 0 },
            ]}
          />
        ))}
      </View>

      {deck && (
        <TouchableOpacity
          onPress={() => onDelete(deck)}
          style={[styles.deleteBtn, { backgroundColor: hexA(DANGER, t.dark ? 0.18 : 0.1) }]}
        >
          <Icon name="trash" size={19} color={DANGER} />
          <Text style={{ color: DANGER, fontFamily: t.font(700), fontSize: 16 }}>このフォルダを削除</Text>
        </TouchableOpacity>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingBottom: 40 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  reviewIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, letterSpacing: 0.5 },
  colorLabel: { fontSize: 12.5, letterSpacing: 0.5, marginTop: 6, marginBottom: 10, marginLeft: 4 },
  colorRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 4, paddingBottom: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 38, height: 38, borderRadius: 999 },
  deleteBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
});
