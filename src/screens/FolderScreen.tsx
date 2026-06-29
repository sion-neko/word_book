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
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Header from '../components/ui/Header';
import IconButton from '../components/ui/IconButton';
import Sheet from '../components/ui/Sheet';
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
  const [selectedLevels, setSelectedLevels] = useState<Set<MemoryLevel>>(new Set());
  const [scopeSheet, setScopeSheet] = useState(false);
  const [csvSheet, setCsvSheet] = useState(false);
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

  const list = words.filter((w) => selectedLevels.size === 0 || selectedLevels.has(w.level));
  const num = (w: Word) => words.findIndex((x) => x.id === w.id) + 1;

  const toggleLevel = (lv: MemoryLevel) =>
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      next.has(lv) ? next.delete(lv) : next.add(lv);
      return next;
    });

  const scopeLabel =
    selectedLevels.size === 0
      ? 'すべて'
      : [...selectedLevels].sort((a, b) => a - b).map((lv) => LEVEL_LABELS[lv]).join('・');

  const countOptions: { value: CountOption; label: string }[] = [
    { value: 5, label: '5問' },
    { value: 10, label: '10問' },
    { value: 15, label: '15問' },
    { value: 20, label: '20問' },
  ]
    .filter((o) => list.length > o.value)
    .concat([{ value: 'all', label: '全問' }]);

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
    setCsvSheet(false);
    await new Promise((r) => setTimeout(r, 400));
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
            <TouchableOpacity onPress={() => setCsvSheet(true)} style={[styles.csvBtn, { borderColor: t.hairStrong }]}>
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

        {!selectMode && (
          <>
            <Text style={[styles.label, { color: t.sub, fontFamily: t.font(700) }]}>出題する範囲</Text>
            <TouchableOpacity
              onPress={() => setScopeSheet(true)}
              style={[
                styles.scopeBtn,
                {
                  borderColor: selectedLevels.size > 0 || shuffle ? t.accent : t.hairStrong,
                  backgroundColor: selectedLevels.size > 0 || shuffle ? t.accentSoft : t.surface,
                },
              ]}
            >
              <Text style={{ color: selectedLevels.size > 0 || shuffle ? t.accentInk : t.ink, fontFamily: t.font(600), fontSize: 13.5 }}>
                {scopeLabel}
              </Text>
              {shuffle && <Icon name="shuffle" size={13} color={t.accentInk} strokeWidth={2.2} />}
              <Icon name="chevron" size={14} color={selectedLevels.size > 0 || shuffle ? t.accentInk : t.sub} strokeWidth={2.2} />
            </TouchableOpacity>

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

      <Sheet visible={scopeSheet} onClose={() => setScopeSheet(false)} title="出題する範囲">
        <TouchableOpacity
          onPress={() => setSelectedLevels(new Set())}
          style={[styles.scopeOption, { backgroundColor: selectedLevels.size === 0 ? t.accentSoft : 'transparent' }]}
        >
          <Text style={{ color: selectedLevels.size === 0 ? t.accentInk : t.ink, fontFamily: t.font(selectedLevels.size === 0 ? 700 : 600), fontSize: 15 }}>
            すべて
          </Text>
          {selectedLevels.size === 0 && <Icon name="check" size={16} color={t.accentInk} strokeWidth={2.6} />}
        </TouchableOpacity>
        <View style={[styles.scopeDivider, { backgroundColor: t.hair }]} />
        {ALL_LEVELS.map((lv) => {
          const on = selectedLevels.has(lv);
          return (
            <TouchableOpacity
              key={lv}
              onPress={() => toggleLevel(lv)}
              style={[styles.scopeOption, { backgroundColor: on ? hexA(LEVEL_COLORS[lv], t.dark ? 0.18 : 0.1) : 'transparent' }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.levelDot, { backgroundColor: LEVEL_COLORS[lv] }]} />
                <Text style={{ color: on ? LEVEL_COLORS[lv] : t.ink, fontFamily: t.font(on ? 700 : 600), fontSize: 15 }}>
                  {LEVEL_LABELS[lv]}
                </Text>
              </View>
              {on && <Icon name="check" size={16} color={LEVEL_COLORS[lv]} strokeWidth={2.6} />}
            </TouchableOpacity>
          );
        })}
        <View style={[styles.scopeDivider, { backgroundColor: t.hair }]} />
        <View style={styles.scopeOption}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="shuffle" size={16} color={shuffle ? t.accentInk : t.sub} strokeWidth={2} />
            <Text style={{ color: t.ink, fontFamily: t.font(600), fontSize: 15 }}>シャッフル</Text>
          </View>
          <Switch value={shuffle} onValueChange={setShuffle} trackColor={{ true: t.accent }} />
        </View>
      </Sheet>

      <Sheet visible={csvSheet} onClose={() => setCsvSheet(false)} title="CSVインポート">
        <Text style={[styles.csvSectionLabel, { color: t.sub, fontFamily: t.font(700) }]}>ファイルの形式</Text>
        <View style={[styles.csvCodeBox, { backgroundColor: t.pill }]}>
          <Text style={{ color: t.ink, fontFamily: t.mono(400), fontSize: 13, lineHeight: 22 }}>
            {'問題,答え,読み方\napple,りんご,アップル\nbanana,バナナ,バナナ'}
          </Text>
        </View>
        <Text style={{ color: t.faint, fontFamily: t.font(400), fontSize: 12, marginTop: 6, marginHorizontal: 4 }}>
          読み方は省略できます。ヘッダー行は不要です。
        </Text>

        <Text style={[styles.csvSectionLabel, { color: t.sub, fontFamily: t.font(700), marginTop: 20 }]}>PDFから作る場合</Text>
        <Text style={{ color: t.faint, fontFamily: t.font(400), fontSize: 13, marginBottom: 8, marginHorizontal: 4 }}>
          ChatGPTやClaudeに以下のプロンプトを貼るとCSVを自動生成できます。
        </Text>
        <View style={[styles.csvCodeBox, { backgroundColor: t.pill }]}>
          <Text selectable style={{ color: t.ink, fontFamily: t.mono(400), fontSize: 12, lineHeight: 20 }}>
            {'以下のテキストから単語帳のCSVを作成してください。\n形式は「問題,答え,読み方」の3列で、\nヘッダー行は不要です。\n\n[ここにPDFや教科書のテキストを貼り付け]'}
          </Text>
        </View>
        <Text style={{ color: t.faint, fontFamily: t.font(400), fontSize: 12, marginTop: 6, marginHorizontal: 4 }}>
          長押しでテキストをコピーできます。
        </Text>

        <TouchableOpacity
          onPress={handleCSVImport}
          style={[styles.csvImportBtn, { backgroundColor: t.accent }]}
        >
          <Text style={{ color: '#fff', fontFamily: t.font(700), fontSize: 15.5 }}>ファイルを選択</Text>
        </TouchableOpacity>
      </Sheet>

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
  label: { fontSize: 12.5, letterSpacing: 0.4, marginHorizontal: 2, marginBottom: 10 },
  scopeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 },
  scopeOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, paddingHorizontal: 14, borderRadius: 10, marginBottom: 2 },
  scopeDivider: { height: 0.5, marginVertical: 6, marginHorizontal: 14 },
  levelDot: { width: 10, height: 10, borderRadius: 999 },
  playRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  squareBtn: { width: 54, height: 54, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  listCard: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, overflow: 'hidden' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 14 },
  bulkBar: { flexDirection: 'row', gap: 10, padding: 14, paddingBottom: 28, borderTopWidth: 0.5 },
  bulkBtn: { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  csvSectionLabel: { fontSize: 12, letterSpacing: 0.5, marginBottom: 8, marginHorizontal: 4 },
  csvCodeBox: { borderRadius: 10, padding: 12, marginHorizontal: 2 },
  csvImportBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 4 },
});
