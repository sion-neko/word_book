import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../components/Icon';
import AudioButton from '../components/ui/AudioButton';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Field from '../components/ui/Field';
import Header from '../components/ui/Header';
import Segmented from '../components/ui/Segmented';
import { bulkDeleteWords, createWord, updateWord } from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { ALL_LEVELS, LEVEL_COLORS, LEVEL_LABELS, MemoryLevel, RootStackParamList } from '../types';
import { speakText } from '../utils/tts';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditCard'>;
  route: RouteProp<RootStackParamList, 'EditCard'>;
};

const DANGER = LEVEL_COLORS[0];

export default function EditCardScreen({ navigation, route }: Props) {
  const { deckId, word } = route.params;
  const t = useTheme();

  const [question, setQuestion] = useState(word?.question ?? '');
  const [answer, setAnswer] = useState(word?.answer ?? '');
  const [reading, setReading] = useState(word?.reading ?? '');
  const [answerReading, setAnswerReading] = useState(word?.answer_reading ?? '');
  const [lang, setLang] = useState<'ja-JP' | 'en-US'>((word?.lang as 'ja-JP' | 'en-US') ?? 'ja-JP');
  const [level, setLevel] = useState<MemoryLevel>(word?.level ?? 0);
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const [answerPreviewSpeaking, setAnswerPreviewSpeaking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const valid = question.trim().length > 0 && answer.trim().length > 0;

  const save = () => {
    if (!valid) return;
    if (word?.id) {
      updateWord(word.id, question.trim(), answer.trim(), reading.trim(), lang, level, answerReading.trim());
    } else {
      createWord(deckId, question.trim(), answer.trim(), reading.trim(), lang, level, answerReading.trim());
    }
    navigation.goBack();
  };

  const handlePreview = async () => {
    const text = reading.trim() || question.trim();
    if (!text || previewSpeaking) return;
    setPreviewSpeaking(true);
    await speakText(text, 1.0);
    setPreviewSpeaking(false);
  };

  const handleAnswerPreview = async () => {
    const text = answerReading.trim() || answer.trim();
    if (!text || answerPreviewSpeaking) return;
    setAnswerPreviewSpeaking(true);
    await speakText(text, 1.0);
    setAnswerPreviewSpeaking(false);
  };

  const handleDelete = () => {
    if (!word?.id) return;
    bulkDeleteWords([word.id]);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title={word ? '問題を編集' : '問題を追加'}
        onBack={() => navigation.goBack()}
        trailing={
          <TouchableOpacity onPress={save} disabled={!valid} hitSlop={8}>
            <Text style={{ color: valid ? t.accentInk : t.faint, fontFamily: t.font(700), fontSize: 16 }}>保存</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="表(問題)" value={question} onChangeText={setQuestion} placeholder="例：abandon" multiline autoFocus={!word} />
        <Field label="裏(答え)" value={answer} onChangeText={setAnswer} placeholder="例：〜を捨てる、放棄する" multiline />

        <View style={styles.readingRow}>
          <View style={{ flex: 1 }}>
            <Field label="表の音声の読み(任意)" value={reading} onChangeText={setReading} placeholder="未入力なら表を読み上げます" />
          </View>
          {(reading.trim() || question.trim()) && (
            <AudioButton size={40} speaking={previewSpeaking} onPress={handlePreview} />
          )}
        </View>

        <View style={styles.readingRow}>
          <View style={{ flex: 1 }}>
            <Field label="裏の音声の読み(任意)" value={answerReading} onChangeText={setAnswerReading} placeholder="未入力なら裏を読み上げます" />
          </View>
          {(answerReading.trim() || answer.trim()) && (
            <AudioButton size={40} speaking={answerPreviewSpeaking} onPress={handleAnswerPreview} />
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
          <TouchableOpacity
            onPress={() => setConfirmDelete(true)}
            style={[styles.deleteBtn, { backgroundColor: hexA(DANGER, t.dark ? 0.18 : 0.1) }]}
          >
            <Icon name="trash" size={19} color={DANGER} />
            <Text style={{ color: DANGER, fontFamily: t.font(700), fontSize: 16 }}>この問題を削除</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        label={word ? `「${word.question}」を削除しますか？` : ''}
        confirmColor={DANGER}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 12.5, letterSpacing: 0.4, marginHorizontal: 2, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  tagPick: { height: 40, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
