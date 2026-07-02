import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import AudioButton from '../components/ui/AudioButton';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Field from '../components/ui/Field';
import Header from '../components/ui/Header';
import IconButton from '../components/ui/IconButton';
import Sheet from '../components/ui/Sheet';
import {
  addPronunciation,
  deletePronunciation,
  getPronunciations,
  updatePronunciation,
} from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { LEVEL_COLORS, Pronunciation, RootStackParamList } from '../types';
import { speakText } from '../utils/tts';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PronunciationDict'>;
};

const DANGER = LEVEL_COLORS[0];

export default function PronunciationDictScreen({ navigation }: Props) {
  const t = useTheme();
  const [entries, setEntries] = useState<Pronunciation[]>(() => getPronunciations());
  const [editing, setEditing] = useState<Pronunciation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [reading, setReading] = useState('');
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Pronunciation | null>(null);

  const reload = useCallback(() => setEntries(getPronunciations()), []);

  const openAdd = () => {
    setEditing(null);
    setTerm('');
    setReading('');
    setSheetOpen(true);
  };

  const openEdit = (entry: Pronunciation) => {
    setEditing(entry);
    setTerm(entry.term);
    setReading(entry.reading);
    setSheetOpen(true);
  };

  const valid = term.trim().length > 0 && reading.trim().length > 0;

  const save = () => {
    if (!valid) return;
    if (editing) {
      updatePronunciation(editing.id, term.trim(), reading.trim());
    } else {
      addPronunciation(term.trim(), reading.trim());
    }
    setSheetOpen(false);
    reload();
  };

  const handlePreview = async () => {
    const text = reading.trim();
    if (!text || previewSpeaking) return;
    setPreviewSpeaking(true);
    await speakText(text, 1.0);
    setPreviewSpeaking(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deletePronunciation(confirmDelete.id);
    setConfirmDelete(null);
    reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Header
        title="読み方辞書"
        onBack={navigation.goBack}
        trailing={
          <IconButton
            name="plus"
            label="追加"
            onPress={openAdd}
            color={t.accentInk}
            bg={t.accentSoft}
            strokeWidth={2.2}
          />
        }
      />

      <Text style={{ color: t.faint, fontFamily: t.font(400), fontSize: 12.5, marginHorizontal: 18, marginTop: 4, marginBottom: 4 }}>
        「AI→エーアイ」のように登録すると、すべてのカードの読み上げで自動的に置き換わります。
      </Text>

      <ScrollView contentContainerStyle={styles.body}>
        {entries.length > 0 ? (
          <View style={[styles.listCard, t.shadowSoft, { backgroundColor: t.surface }]}>
            {entries.map((e, index) => (
              <TouchableOpacity
                key={e.id}
                activeOpacity={0.7}
                onPress={() => openEdit(e)}
                style={[
                  styles.row,
                  { borderBottomWidth: index === entries.length - 1 ? 0 : 0.5, borderBottomColor: t.hair },
                ]}
              >
                <Text style={[styles.term, { color: t.ink, fontFamily: t.font(600) }]} numberOfLines={1}>
                  {e.term}
                </Text>
                <Icon name="arrow-right" size={14} color={t.faint} strokeWidth={2} />
                <Text style={[styles.reading, { color: t.sub, fontFamily: t.font(400) }]} numberOfLines={1}>
                  {e.reading}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <EmptyState message="右上の + から読みを登録しましょう" sub="例：AI → エーアイ" />
        )}
      </ScrollView>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? '読み方を編集' : '読み方を追加'}
        variant="bottom"
        trailing={
          <TouchableOpacity onPress={save} disabled={!valid} hitSlop={8}>
            <Text style={{ color: valid ? t.accentInk : t.faint, fontFamily: t.font(700), fontSize: 15 }}>保存</Text>
          </TouchableOpacity>
        }
      >
        <Field label="用語" value={term} onChangeText={setTerm} placeholder="例：AI" />
        <View style={styles.readingRow}>
          <View style={{ flex: 1 }}>
            <Field label="読み方" value={reading} onChangeText={setReading} placeholder="例：エーアイ" />
          </View>
          {reading.trim() && <AudioButton size={40} speaking={previewSpeaking} onPress={handlePreview} />}
        </View>
        {editing && (
          <TouchableOpacity
            onPress={() => {
              setSheetOpen(false);
              setConfirmDelete(editing);
            }}
            style={[styles.deleteBtn, { backgroundColor: hexA(DANGER, t.dark ? 0.18 : 0.1) }]}
          >
            <Icon name="trash" size={18} color={DANGER} />
            <Text style={{ color: DANGER, fontFamily: t.font(700), fontSize: 15 }}>この読み方を削除</Text>
          </TouchableOpacity>
        )}
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete !== null}
        label={confirmDelete ? `「${confirmDelete.term}」を削除しますか？` : ''}
        confirmColor={DANGER}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  listCard: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  term: { fontSize: 15.5, flexShrink: 1 },
  reading: { fontSize: 14, flex: 1 },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: { height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
});
