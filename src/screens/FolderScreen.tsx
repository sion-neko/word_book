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
import Field from '../components/ui/Field';
import Header from '../components/ui/Header';
import IconButton from '../components/ui/IconButton';
import MasteryBar from '../components/ui/MasteryBar';
import Segmented from '../components/ui/Segmented';
import Sheet from '../components/ui/Sheet';
import SplitButton from '../components/ui/SplitButton';
import WordRow from '../components/ui/WordRow';
import {
  bulkCreateWords,
  bulkDeleteWords,
  bulkUpdateWordLevel,
  createWord,
  getWords,
  updateWord,
} from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { ALL_LEVELS, LEVEL_COLORS, LEVEL_LABELS, MemoryLevel, RootStackParamList, TOP_LEVEL, Word } from '../types';
import { pickAndParseCSV } from '../utils/csv';
import { speakText } from '../utils/tts';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Folder'>;
  route: RouteProp<RootStackParamList, 'Folder'>;
};

type CountOption = 5 | 10 | 20 | 'all';

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
  const [editing, setEditing] = useState<{ visible: boolean; word: Word | null }>({ visible: false, word: null });

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
  const selectedCards = list.filter((w) => selected.has(w.id));

  const handleBulkPerfect = () => {
    bulkUpdateWordLevel([...selected], TOP_LEVEL);
    exitSelect();
    reload();
  };
  const handleBulkDelete = () => {
    setConfirm({ ids: [...selected], label: `${selected.size}問を削除しますか？` });
  };
  const handleSwipeDelete = (word: Word) => {
    setConfirm({ ids: [word.id], label: `「${word.question}」を削除しますか？` });
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

  const saveCard = (data: { id?: number; question: string; answer: string; reading: string; lang: string; level: MemoryLevel }) => {
    if (data.id) {
      updateWord(data.id, data.question, data.answer, data.reading, data.lang, data.level);
    } else {
      createWord(deckId, data.question, data.answer, data.reading, data.lang, data.level);
    }
    setEditing({ visible: false, word: null });
    reload();
  };
  const deleteCard = (word: Word) => {
    setEditing({ visible: false, word: null });
    setConfirm({ ids: [word.id], label: `「${word.question}」を削除しますか？` });
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Header
        title={selectMode ? (selected.size ? `${selected.size}問を選択中` : '問題を選択') : deckName}
        onBack={selectMode ? exitSelect : navigation.goBack}
        backLabel={selectMode ? 'キャンセル' : undefined}
        trailing={
          selectMode ? (
            <TouchableOpacity
              onPress={() =>
                selected.size === list.length ? setSelected(new Set()) : setSelected(new Set(list.map((w) => w.id)))
              }
              hitSlop={8}
            >
              <Text style={{ color: t.accentInk, fontFamily: t.font(700), fontSize: 15 }}>
                {selected.size === list.length && list.length ? '全解除' : 'すべて選択'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleCSVImport} style={[styles.csvBtn, { borderColor: t.hairStrong }]}>
                <Text style={{ color: t.sub, fontFamily: t.font(700), fontSize: 12.5 }}>CSV</Text>
              </TouchableOpacity>
              <IconButton name="plus" label="問題を追加" onPress={() => setEditing({ visible: true, word: null })} color={t.accentInk} bg={t.accentSoft} strokeWidth={2.2} />
              <IconButton name="pencil" label="複数選択" onPress={() => setSelectMode(true)} color={t.accentInk} bg={t.accentSoft} strokeWidth={2.2} />
            </View>
          )
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
                  options={[
                    { value: 5, label: '5問' },
                    { value: 10, label: '10問' },
                    { value: 20, label: '20問' },
                    { value: 'all', label: '全部' },
                  ]}
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
                onPress={() => setEditing({ visible: true, word: item })}
                onSwipeDelete={() => handleSwipeDelete(item)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            message={words.length === 0 ? '右上の + から問題を追加しましょう' : 'この範囲の問題はありません'}
          />
        )}

        {!selectMode && list.length > 0 && (
          <Text style={[styles.hint, { color: t.faint }]}>タップで編集 ・ 左スワイプで削除</Text>
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

      <EditCardSheet
        visible={editing.visible}
        word={editing.word}
        onClose={() => setEditing({ visible: false, word: null })}
        onSave={saveCard}
        onDelete={deleteCard}
      />
    </View>
  );
}

function EditCardSheet({
  visible,
  word,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  word: Word | null;
  onClose: () => void;
  onSave: (data: { id?: number; question: string; answer: string; reading: string; lang: string; level: MemoryLevel }) => void;
  onDelete: (word: Word) => void;
}) {
  const t = useTheme();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [reading, setReading] = useState('');
  const [lang, setLang] = useState<'ja-JP' | 'en-US'>('ja-JP');
  const [level, setLevel] = useState<MemoryLevel>(0);
  const [previewSpeaking, setPreviewSpeaking] = useState(false);

  useEffect(() => {
    if (visible) {
      setQuestion(word?.question ?? '');
      setAnswer(word?.answer ?? '');
      setReading(word?.reading ?? '');
      setLang((word?.lang as 'ja-JP' | 'en-US') ?? 'ja-JP');
      setLevel(word?.level ?? 0);
    }
  }, [visible, word]);

  const valid = question.trim().length > 0 && answer.trim().length > 0;
  const save = () => {
    if (!valid) return;
    onSave({ id: word?.id, question: question.trim(), answer: answer.trim(), reading: reading.trim(), lang, level });
  };

  const handlePreview = async () => {
    const text = (reading.trim() || question.trim());
    if (!text || previewSpeaking) return;
    setPreviewSpeaking(true);
    await speakText(text, 1.0);
    setPreviewSpeaking(false);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={word ? '問題を編集' : '問題を追加'}
      trailing={
        <TouchableOpacity onPress={save} disabled={!valid} hitSlop={8}>
          <Text style={{ color: valid ? t.accentInk : t.faint, fontFamily: t.font(700), fontSize: 16 }}>保存</Text>
        </TouchableOpacity>
      }
    >
      <Field label="表(問題)" value={question} onChangeText={setQuestion} placeholder="例：abandon" multiline autoFocus />
      <Field label="裏(答え)" value={answer} onChangeText={setAnswer} placeholder="例：〜を捨てる、放棄する" multiline />
      <View style={styles.readingRow}>
        <View style={{ flex: 1 }}>
          <Field label="音声の読み(任意)" value={reading} onChangeText={setReading} placeholder="未入力なら表を読み上げます" />
        </View>
        {(reading.trim() || question.trim()) && (
          <AudioButton size={40} speaking={previewSpeaking} onPress={handlePreview} />
        )}
      </View>

      <Text style={[styles.label, { color: t.sub, fontFamily: t.font(700), marginTop: 6 }]}>音声の言語</Text>
      <View style={{ marginBottom: 18 }}>
        <Segmented
          value={lang}
          onChange={setLang}
          options={[
            { value: 'ja-JP', label: '日本語' },
            { value: 'en-US', label: '英語' },
          ]}
        />
      </View>

      <Text style={[styles.label, { color: t.sub, fontFamily: t.font(700) }]}>習熟度タグ</Text>
      <View style={styles.tagRow}>
        {ALL_LEVELS.map((lv) => {
          const on = level === lv;
          return (
            <TouchableOpacity
              key={lv}
              onPress={() => setLevel(lv)}
              style={[styles.tagPick, { backgroundColor: on ? LEVEL_COLORS[lv] : hexA(LEVEL_COLORS[lv], t.dark ? 0.16 : 0.1) }]}
            >
              <Text style={{ color: on ? '#fff' : LEVEL_COLORS[lv], fontFamily: t.font(700), fontSize: 14.5 }}>
                {LEVEL_LABELS[lv]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {word && (
        <TouchableOpacity onPress={() => onDelete(word)} style={[styles.deleteBtn, { backgroundColor: hexA(DANGER, t.dark ? 0.18 : 0.1) }]}>
          <Icon name="trash" size={19} color={DANGER} />
          <Text style={{ color: DANGER, fontFamily: t.font(700), fontSize: 16 }}>この問題を削除</Text>
        </TouchableOpacity>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  csvBtn: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, height: 40, justifyContent: 'center', alignItems: 'center' },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  tagPick: { height: 40, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
