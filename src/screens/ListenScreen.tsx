import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LevelBadge from '../components/LevelBadge';
import { getWords, getSetting, updateWordLevel } from '../db/database';
import { LEVEL_COLORS, LEVEL_LABELS, MemoryLevel, RootStackParamList, Word } from '../types';
import { sleep, speakText, stopSpeech } from '../utils/tts';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Listen'>;
  route: RouteProp<RootStackParamList, 'Listen'>;
};

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const ALL_LEVELS: MemoryLevel[] = [0, 1, 2, 3, 4];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ListenScreen({ navigation, route }: Props) {
  const { deckId, deckName } = route.params;

  const allWords = useRef<Word[]>(getWords(deckId));
  const [filterLevels, setFilterLevels] = useState<Set<MemoryLevel>>(new Set());
  const [isShuffle, setIsShuffle] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);
  const speed = SPEEDS[speedIndex];

  const pauseQA = useRef(parseFloat(getSetting('pause_between_qa') ?? '1.5'));
  const pauseWords = useRef(parseFloat(getSetting('pause_between_words') ?? '2.0'));

  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [wordLevels, setWordLevels] = useState<Record<number, MemoryLevel>>({});

  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const speedRef = useRef(speed);
  const queueRef = useRef<Word[]>([]);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  const buildQueue = useCallback(() => {
    let words = allWords.current;
    if (filterLevels.size > 0) {
      words = words.filter((w) => filterLevels.has(w.level as MemoryLevel));
    }
    const q = isShuffle ? shuffle(words) : [...words];
    queueRef.current = q;
    setQueue(q);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setShowAnswer(false);
  }, [filterLevels, isShuffle]);

  useEffect(() => { buildQueue(); }, [buildQueue]);

  const stopPlayback = useCallback(async () => {
    isPlayingRef.current = false;
    await stopSpeech();
    setIsPlaying(false);
  }, []);

  const playFrom = useCallback(async (startIndex: number) => {
    isPlayingRef.current = true;
    setIsPlaying(true);

    const q = queueRef.current;
    let i = startIndex;

    while (isPlayingRef.current && i < q.length) {
      currentIndexRef.current = i;
      setCurrentIndex(i);
      setShowAnswer(false);

      const word = q[i];
      const ttsText = word.reading?.trim() || word.question;

      await speakText(ttsText, speedRef.current);
      if (!isPlayingRef.current) break;

      await sleep(pauseQA.current * 1000);
      if (!isPlayingRef.current) break;

      setShowAnswer(true);
      await speakText(word.answer, speedRef.current);
      if (!isPlayingRef.current) break;

      await sleep(pauseWords.current * 1000);
      if (!isPlayingRef.current) break;

      i++;
    }

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setShowAnswer(false);
    }
  }, []);

  const handlePlayPause = async () => {
    if (isPlayingRef.current) {
      await stopPlayback();
    } else {
      if (queue.length === 0) return;
      await playFrom(currentIndexRef.current);
    }
  };

  const handlePrev = async () => {
    await stopPlayback();
    const next = Math.max(0, currentIndexRef.current - 1);
    currentIndexRef.current = next;
    setCurrentIndex(next);
    setShowAnswer(false);
  };

  const handleNext = async () => {
    await stopPlayback();
    const next = Math.min(queue.length - 1, currentIndexRef.current + 1);
    currentIndexRef.current = next;
    setCurrentIndex(next);
    setShowAnswer(false);
  };

  const handleLevelChange = (lv: MemoryLevel) => {
    const word = queue[currentIndex];
    if (!word) return;
    updateWordLevel(word.id, lv);
    setWordLevels((prev) => ({ ...prev, [word.id]: lv }));
    allWords.current = allWords.current.map((w) =>
      w.id === word.id ? { ...w, level: lv } : w
    );
  };

  const toggleFilterLevel = (lv: MemoryLevel) => {
    stopPlayback();
    setFilterLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lv)) next.delete(lv);
      else next.add(lv);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      stopSpeech();
    };
  }, []);

  const currentWord = queue[currentIndex];
  const currentLevel: MemoryLevel =
    (currentWord ? (wordLevels[currentWord.id] ?? currentWord.level) : 0) as MemoryLevel;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={async () => { await stopPlayback(); navigation.goBack(); }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{deckName}</Text>
        <Text style={styles.progress}>
          {queue.length > 0 ? `${currentIndex + 1} / ${queue.length}` : '0 / 0'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterLevels.size === 0 && styles.filterChipActive]}
          onPress={() => { stopPlayback(); setFilterLevels(new Set()); }}
        >
          <Text style={[styles.filterText, filterLevels.size === 0 && styles.filterTextActive]}>
            全て
          </Text>
        </TouchableOpacity>
        {ALL_LEVELS.map((lv) => (
          <TouchableOpacity
            key={lv}
            style={[
              styles.filterChip,
              filterLevels.has(lv) && styles.filterChipActive,
            ]}
            onPress={() => toggleFilterLevel(lv)}
          >
            <Text style={[styles.filterText, filterLevels.has(lv) && styles.filterTextActive]}>
              {LEVEL_LABELS[lv]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.cardArea}>
        {currentWord ? (
          <View style={styles.wordCard}>
            <Text style={styles.questionText}>{currentWord.question}</Text>
            {currentWord.reading ? (
              <Text style={styles.readingText}>{currentWord.reading}</Text>
            ) : null}
            <View style={styles.divider} />
            <Text style={[styles.answerText, !showAnswer && styles.answerHidden]}>
              {showAnswer ? currentWord.answer : '・・・'}
            </Text>
            <View style={styles.levelRow}>
              <LevelBadge level={currentLevel} size="md" />
            </View>
          </View>
        ) : (
          <View style={styles.wordCard}>
            <Text style={styles.emptyCardText}>単語がありません</Text>
          </View>
        )}
      </View>

      {currentWord && (
        <View style={styles.levelSelector}>
          <Text style={styles.levelSelectorLabel}>記憶レベルを更新</Text>
          <View style={styles.levelButtons}>
            {ALL_LEVELS.map((lv) => (
              <TouchableOpacity
                key={lv}
                style={[
                  styles.levelBtn,
                  { borderColor: LEVEL_COLORS[lv] },
                  currentLevel === lv && { backgroundColor: LEVEL_COLORS[lv] },
                ]}
                onPress={() => handleLevelChange(lv)}
              >
                <Text
                  style={[
                    styles.levelBtnText,
                    { color: currentLevel === lv ? '#FFFFFF' : LEVEL_COLORS[lv] },
                  ]}
                >
                  {LEVEL_LABELS[lv]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.controls}>
        <View style={styles.speedRow}>
          <TouchableOpacity
            onPress={() => setSpeedIndex((i) => Math.max(0, i - 1))}
            style={styles.speedBtn}
          >
            <Text style={styles.speedArrow}>−</Text>
          </TouchableOpacity>
          <Text style={styles.speedText}>{speed.toFixed(2)}x</Text>
          <TouchableOpacity
            onPress={() => setSpeedIndex((i) => Math.min(SPEEDS.length - 1, i + 1))}
            style={styles.speedBtn}
          >
            <Text style={styles.speedArrow}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shuffleBtn, isShuffle && styles.shuffleBtnActive]}
            onPress={() => { stopPlayback(); setIsShuffle((s) => !s); }}
          >
            <Text style={[styles.shuffleText, isShuffle && styles.shuffleTextActive]}>
              シャッフル
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playRow}>
          <TouchableOpacity style={styles.skipBtn} onPress={handlePrev}>
            <Text style={styles.skipIcon}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.playBtn, queue.length === 0 && styles.playBtnDisabled]}
            onPress={handlePlayPause}
            disabled={queue.length === 0}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
            <Text style={styles.skipIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  progress: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
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
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 200,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  readingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    borderRadius: 1,
  },
  answerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A90D9',
    textAlign: 'center',
  },
  answerHidden: { color: '#D1D5DB' },
  levelRow: { marginTop: 16 },
  emptyCardText: { fontSize: 16, color: '#9CA3AF' },
  levelSelector: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  levelSelectorLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  levelBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelBtnText: { fontSize: 13, fontWeight: '600' },
  controls: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speedBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  speedArrow: { fontSize: 18, color: '#374151', fontWeight: '700', lineHeight: 22 },
  speedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    minWidth: 48,
    textAlign: 'center',
  },
  shuffleBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  shuffleBtnActive: { backgroundColor: '#4A90D9' },
  shuffleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  shuffleTextActive: { color: '#FFFFFF' },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  skipBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipIcon: { fontSize: 30 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  playBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  playIcon: { fontSize: 30, color: '#FFFFFF' },
});
