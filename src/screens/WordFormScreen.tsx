import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LevelBadge from '../components/LevelBadge';
import { createWord, getWord, updateWord, updateWordLevel } from '../db/database';
import { LEVEL_LABELS, MemoryLevel, RootStackParamList } from '../types';
import * as Speech from 'expo-speech';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WordForm'>;
  route: RouteProp<RootStackParamList, 'WordForm'>;
};

const ALL_LEVELS: MemoryLevel[] = [0, 1, 2, 3, 4];

export default function WordFormScreen({ navigation, route }: Props) {
  const { deckId, wordId } = route.params;
  const isEdit = wordId !== undefined;

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [reading, setReading] = useState('');
  const [level, setLevel] = useState<MemoryLevel>(0);
  const answerRef = useRef<TextInput>(null);
  const readingRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEdit && wordId) {
      const word = getWord(wordId);
      if (word) {
        setQuestion(word.question);
        setAnswer(word.answer);
        setReading(word.reading);
        setLevel(word.level as MemoryLevel);
      }
    }
  }, [isEdit, wordId]);

  const handleSave = () => {
    if (!question.trim()) {
      Alert.alert('エラー', '問題文を入力してください');
      return;
    }
    if (!answer.trim()) {
      Alert.alert('エラー', '解答を入力してください');
      return;
    }

    if (isEdit && wordId) {
      updateWord(wordId, question.trim(), answer.trim(), reading.trim());
      updateWordLevel(wordId, level);
    } else {
      createWord(deckId, question.trim(), answer.trim(), reading.trim());
    }

    navigation.goBack();
  };

  const previewTTS = () => {
    const text = reading.trim() || question.trim();
    if (text) Speech.speak(text, { rate: 1.0 });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? '単語を編集' : '単語を追加'}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>問題文 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="例: apple"
            placeholderTextColor="#9CA3AF"
            returnKeyType="next"
            onSubmitEditing={() => answerRef.current?.focus()}
          />

          <Text style={styles.label}>解答 <Text style={styles.required}>*</Text></Text>
          <TextInput
            ref={answerRef}
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder="例: りんご"
            placeholderTextColor="#9CA3AF"
            returnKeyType="next"
            onSubmitEditing={() => readingRef.current?.focus()}
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>読み仮名・発音（任意）</Text>
            {question.trim() && (
              <TouchableOpacity onPress={previewTTS}>
                <Text style={styles.previewTTS}>▶ 読み上げ確認</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            ref={readingRef}
            style={styles.input}
            value={reading}
            onChangeText={setReading}
            placeholder="TTSが誤読する場合に入力（例: アップル）"
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
          />

          {isEdit && (
            <>
              <Text style={[styles.label, { marginTop: 8 }]}>記憶レベル</Text>
              <View style={styles.levelRow}>
                {ALL_LEVELS.map((lv) => (
                  <TouchableOpacity
                    key={lv}
                    onPress={() => setLevel(lv)}
                    style={[styles.levelOption, level === lv && styles.levelOptionSelected]}
                  >
                    <LevelBadge level={lv} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelBtn: { minWidth: 70 },
  cancelText: { fontSize: 16, color: '#6B7280' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveBtn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  form: { flex: 1, padding: 20 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  required: { color: '#EF4444' },
  previewTTS: { fontSize: 13, color: '#4A90D9', fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  levelOption: {
    padding: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelOptionSelected: {
    borderColor: '#4A90D9',
    backgroundColor: '#EFF6FF',
  },
});
