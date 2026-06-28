import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import AudioButton from '../components/ui/AudioButton';
import Chip from '../components/ui/Chip';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Header from '../components/ui/Header';
import IconButton from '../components/ui/IconButton';
import MasteryBar from '../components/ui/MasteryBar';
import Segmented from '../components/ui/Segmented';
import SplitButton from '../components/ui/SplitButton';
import WordRow from '../components/ui/WordRow';
import { bulkCreateWords, bulkDeleteWords, bulkUpdateWordLevel, getWords } from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { ALL_LEVELS, LEVEL_COLORS, LEVEL_LABELS, MemoryLevel, RootStackParamList, TOP_LEVEL, Word } from '../types';
import { pickAndParseCSV } from '../utils/csv';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Folder'>;
  route: RouteProp<RootStackParamList, 'Folder'>;
};

type CountOption = 5 | 10 | 15 | 20 | 'all';

const DANGER = LEVEL_COLORS[0];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FolderScreen({ navigation, route }: Props) {
  const { deckId, deckName } = route.params;
  const t = useTheme();

  const [words, setWords] = useState<Word[]>([]);
  const [scopeKey, setScopeKey] = useState('all');
  const [shuffle, setShuffle] = useState(false);
  const [count, setCount] = useState<CountOption>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: number[]; label: string } | null>(null);

  const reload = useCallback(() => setWords(getWords(deckId)), [deckId]);
  useFocusEffect(reload);

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const scopes: { key: string; label: string; color?: string; test: (level: MemoryLevel) => boolean }[] = [
    { key: 'all', label: 'すべて', test: () => true },
    ...ALL_LEVELS.slice(0, -1).map((lv) => ({
      key: `le${lv}`,
      label: `${LEVEL_LABELS[lv]}以下`,
      color: LEVEL_COLORS[lv],
      test: (level: MemoryLevel) => level <= lv,
    })),
  ];
  const scope = scopes.find((s) => s.key === scopeKey) ?? scopes[0];
  const list = words.filter((w) => scope.test(w.level));
  const num = (w: Word) => words.findIndex((x) => x.id === w.id) + 1;

  const countOptions: { value: CountOption; label: string }[] = [
    { value: 5, label: '5問' },
    { value: 10, label: '10問' },
    { value: 15, label: '15問' },
    { value: 20, label: '20問' },
  ]
    .filter((o) => list.length > o.value)
    .concat([{ value: 'all', label: '全部' }]);

  // 選択中のcountが非表示になったらリセット
  useEffect(() => {
    if (count !== 'all' && list.length <= count) setCount('all');
  }, [list.length]);

  const playable = count === 'all' ? list.length : Math.min(count, list.length);
  const pick = (): Word[] => {
    let arr = [...list];
    if (shuffle) arr = shuffleArray(arr);
    if (count !== 'all') arr = arr.slice(0, count);
    return arr;
  };

  const toggleSelect = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleBulkPerfect = () => {
    bulkUpdateWordLevel([...selected], TOP_LEVEL);
    exitSelect();
    reload();
  };
  const handleBulkDelete = () => {
    setConfirm({ ids: [...selected], label: `${selected.size}問を削除しますか？` });
  };
  const confirmDelete = () => {
    if (!confirm) return;
    bulkDeleteWords(confirm.ids);
    setConfirm(null);
    exitSelect();
    reload();
  };

  const handleCSVImport = async () => {
    try {
      const parsed = await pickAndParseCSV();
      if (!parsed) return;
      const importedCount = bulkCreateWords(deckId, parsed);
      reload();
      Alert.alert('インポート完了', `${importedCount} 件の単語を追加しました`);
    } catch {
      Alert.alert('エラー', 'CSVの読み込みに失敗しました');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Header
        title={deckName}
        onBack={navigation.goBack}
        trailing={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleCSVImport} style={[styles.csvBtn, { borderColor: t.hairStrong }]}>
              <Text style={{ color: t.sub, fontFamily: t.font(700), fontSize: 12.5 }}>CSV</Text>
            </TouchableOpacity>
            <IconButton
              name="plus"
              label="問題を追加"
              onPress={() => navigation.navigate('EditCard', { deckId, deckName })}
              color={t.accentInk}
              bg={t.accentSoft}
              strokeWidth={2.2}
            />
            <IconButton
              name="pencil"
              label="複数選択"
              onPress={() => (selectMode ? exitSelect() : setSelectMode(true))}
              color={selectMode ? t.bg : t.accentInk}
              bg={selectMode ? t.accentInk : t.accentSoft}
              strokeWidth={2.2}
            />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.identity}>
          <Text style={[styles.deckName, { color: t.ink, fontFamily: t.font(800) }]}>{deckName}</Text>
          <Text style={{ color: t.sub, fontFamily: t.mono(400), fontSize: 13, marginVertical: 5 }}>
            {words.length}問
          </Text>
          <MasteryBar words={words} />
        </View>

        {!selectMode && (
          <>
            <Text style={[styles.label, { color: t.sub, fontFamily: t.font(700) }]}>出題する範囲</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scopeScroll} contentContainerStyle={styles.scopeContent}>
              {scopes.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  color={s.color}
                  active={scopeKey === s.key}
                  onPress={() => setScopeKey(s.key)}
                  count={words.filter((w) => s.test(w.level)).length}
                />
              ))}
            </ScrollView>

            <View style={styles.shuffleRow}>
              <View style={styles.shuffleLabel}>
                <Icon name="shuffle" size={15} color={shuffle ? t.accentInk : t.sub} strokeWidth={2} />
                <Text style={{ color: t.ink, fontFamily: t.font(700), fontSize: 13.5 }}>シャッフル</Text>
              </View>
              <Switch value={shuffle} onValueChange={setShuffle} trackColor={{ true: t.accent }} />
            </View>

            <View style={styles.playRow}>
              <View style={{ flex: 1 }}>
                <SplitButton
                  count={count}
                  setCount={setCount}
                  playable={playable}
                  disabled={playable === 0}
                  onPlay={() => navigation.navigate('Study', { words: pick(), title: deckName })}
                  options={countOptions}
                />
              </View>
              <TouchableOpacity
                disabled={playable === 0}
                onPress={() => navigation.navigate('AudioMode', { words: pick(), title: deckName })}
                style={[styles.squareBtn, { borderColor: t.hairStrong, backgroundColor: t.surface, opacity: playable === 0 ? 0.4 : 1 }]}
              >
                <Icon name="headphones" size={22} color={t.ink} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {list.length > 0 ? (
          <View style={[styles.listCard, t.shadowSoft, { backgroundColor: t.surface }]}>
            {list.map((item, index) => (
              <WordRow
                key={item.id}
                word={item}
                num={num(item)}
                isLast={index === list.length - 1}
                selectMode={selectMode}
                selected={selected.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
                onPress={() => navigation.navigate('EditCard', { deckId, deckName, word: item })}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            message={words.length === 0 ? '右上の + から問題を追加しましょう' : 'この範囲の問題はありません'}
          />
        )}

        {!selectMode && list.length > 0 && (
          <Text style={[styles.hint, { color: t.faint }]}>タップで編集</Text>
        )}
      </ScrollView>

      {selectMode && (
        <View style={[styles.bulkBar, { backgroundColor: t.surface, borderTopColor: t.hair }]}>
          <TouchableOpacity
            disabled={selected.size === 0}
            onPress={handleBulkPerfect}
            style={[styles.bulkBtn, { backgroundColor: selected.size === 0 ? t.pill : t.accentSoft }]}
          >
            <Icon name="check" size={18} color={selected.size === 0 ? t.faint : t.accentInk} strokeWidth={2.4} />
            <Text style={{ color: selected.size === 0 ? t.faint : t.accentInk, fontFamily: t.font(700), fontSize: 15.5 }}>
              完璧にする
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={selected.size === 0}
            onPress={handleBulkDelete}
            style={[styles.bulkBtn, { backgroundColor: selected.size === 0 ? t.pill : hexA(DANGER, t.dark ? 0.2 : 0.12) }]}
          >
            <Icon name="trash" size={18} color={selected.size === 0 ? t.faint : DANGER} strokeWidth={1.9} />
            <Text style={{ color: selected.size === 0 ? t.faint : DANGER, fontFamily: t.font(700), fontSize: 15.5 }}>削除</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmDialog
        visible={confirm !== null}
        label={confirm?.label ?? ''}
        confirmColor={DANGER}
        onCancel={() => setConfirm(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  csvBtn: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, height: 40, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 18, paddingBottom: 40 },
  identity: { paddingHorizontal: 2, paddingBottom: 18 },
  deckName: { fontSize: 22, letterSpacing: 0.3 },
  label: { fontSize: 12.5, letterSpacing: 0.4, marginHorizontal: 2, marginBottom: 10 },
  scopeScroll: { marginHorizontal: -18 },
  scopeContent: { paddingHorizontal: 18, gap: 8, paddingBottom: 16 },
  shuffleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 2, marginBottom: 14 },
  shuffleLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  squareBtn: { width: 54, height: 54, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  listCard: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, overflow: 'hidden' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 14 },
  bulkBar: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 28, borderTopWidth: 0.5 },
  bulkBtn: { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
});
