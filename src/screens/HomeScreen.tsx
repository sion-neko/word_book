import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import Field from '../components/ui/Field';
import FolderCard from '../components/ui/FolderCard';
import Header from '../components/ui/Header';
import IconButton from '../components/ui/IconButton';
import Sheet from '../components/ui/Sheet';
import { createDeck, FOLDER_COLORS, getDecks, getWeakWords, getWords } from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { Deck, RootStackParamList, WeakWord, Word } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const t = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [wordsByDeck, setWordsByDeck] = useState<Record<number, Word[]>>({});
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [query, setQuery] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

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

  const handleCreateFolder = (name: string, color: string) => {
    createDeck(name, color);
    setShowNewFolder(false);
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
            onPress={() => setShowNewFolder(true)}
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
                onPress={() => navigation.navigate('Study', { words: weakWords, title: '苦手な復習' })}
                style={[styles.reviewBtn, t.shadowSoft, { backgroundColor: t.ink }]}
              >
                <View style={[styles.reviewIcon, { backgroundColor: hexA('#C8553D', 0.9) }]}>
                  <Icon name="sparkle" size={22} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.dark ? t.ink : '#fff', fontFamily: t.font(700), fontSize: 16 }}>
                    苦手な問題を復習
                  </Text>
                  <Text
                    style={{
                      color: t.dark ? t.sub : 'rgba(255,255,255,0.7)',
                      fontFamily: t.mono(400),
                      fontSize: 13,
                      marginTop: 1,
                    }}
                  >
                    {weakWords.length}問をまとめて出題
                  </Text>
                </View>
                <Icon name="arrow-right" size={20} color={t.dark ? t.sub : 'rgba(255,255,255,0.7)'} strokeWidth={2} />
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

      <NewFolderSheet visible={showNewFolder} onClose={() => setShowNewFolder(false)} onCreate={handleCreateFolder} />
    </View>
  );
}

function NewFolderSheet({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const valid = name.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onCreate(name.trim(), color);
    setName('');
    setColor(FOLDER_COLORS[0]);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="新しいフォルダ"
      trailing={
        <TouchableOpacity onPress={submit} disabled={!valid} hitSlop={8}>
          <Text style={{ color: valid ? t.accentInk : t.faint, fontFamily: t.font(700), fontSize: 16 }}>作成</Text>
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
});
