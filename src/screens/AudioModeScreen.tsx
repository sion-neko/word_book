import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import IconButton from '../components/ui/IconButton';
import SpeedControl from '../components/ui/SpeedControl';
import { getSetting, updateWordLevel } from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { ALL_LEVELS, LEVEL_COLORS, LEVEL_LABELS, MemoryLevel, RootStackParamList, Word } from '../types';
import { sleep, speakText, stopSpeech } from '../utils/tts';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AudioMode'>;
  route: RouteProp<RootStackParamList, 'AudioMode'>;
};

export default function AudioModeScreen({ navigation, route }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { title } = route.params;

  const [cards, setCards] = useState<Word[]>(route.params.words);
  const cardsRef = useRef<Word[]>(cards);
  cardsRef.current = cards;

  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const [phase, setPhase] = useState<'q' | 'a'>('q');
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  const [loop, setLoop] = useState(true);
  const loopRef = useRef(true);

  const pauseQA = useRef(parseFloat(getSetting('pause_between_qa') ?? '1.5'));
  const pauseWords = useRef(parseFloat(getSetting('pause_between_words') ?? '2.0'));

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      stopSpeech();
    };
  }, []);

  const runFrom = async (startIndex: number) => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    let i = startIndex;

    while (isPlayingRef.current) {
      const list = cardsRef.current;
      if (i >= list.length) {
        if (loopRef.current) {
          i = 0;
        } else {
          break;
        }
      }
      idxRef.current = i;
      setIdx(i);
      setPhase('q');

      const word = list[i];
      const qText = word.reading?.trim() || word.question;
      await speakText(qText, rateRef.current);
      if (!isPlayingRef.current) break;
      await sleep(pauseQA.current * 1000);
      if (!isPlayingRef.current) break;

      setPhase('a');
      await speakText(word.answer, rateRef.current);
      if (!isPlayingRef.current) break;
      await sleep(pauseWords.current * 1000);
      if (!isPlayingRef.current) break;

      i++;
    }

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  };

  const stop = async () => {
    isPlayingRef.current = false;
    await stopSpeech();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlayingRef.current) {
      stop();
    } else {
      runFrom(idxRef.current);
    }
  };

  const jump = async (d: number) => {
    await stop();
    const next = Math.max(0, Math.min(cardsRef.current.length - 1, idxRef.current + d));
    idxRef.current = next;
    setIdx(next);
    setPhase('q');
  };

  const close = async () => {
    await stop();
    navigation.goBack();
  };

  const handleLevelChange = (lvl: MemoryLevel) => {
    const word = cardsRef.current[idx];
    if (!word) return;
    updateWordLevel(word.id, lvl);
    setCards((cs) => cs.map((c) => (c.id === word.id ? { ...c, level: lvl } : c)));
  };

  const card = cards[Math.min(idx, cards.length - 1)];
  const speaking = isPlaying;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <IconButton name="close" label="閉じる" onPress={close} strokeWidth={2.2} />
        <View style={styles.titleWrap}>
          <Text style={{ color: t.faint, fontFamily: t.mono(700), fontSize: 11, letterSpacing: 2.5 }}>音声モード</Text>
          <Text style={{ color: t.ink, fontFamily: t.font(700), fontSize: 14, marginTop: 2 }} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={{ color: t.sub, fontFamily: t.mono(400), fontSize: 13, minWidth: 38, textAlign: 'right' }}>
          {cards.length ? idx + 1 : 0}/{cards.length}
        </Text>
      </View>

      <View style={styles.nowPlaying}>
        <PulsingDisc speaking={speaking} />

        <Text style={{ color: phase === 'q' ? t.accentInk : t.faint, fontFamily: t.mono(700), fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>
          {phase === 'q' ? 'QUESTION' : 'ANSWER'}
        </Text>
        <Text
          style={{
            color: t.ink,
            fontFamily: t.font(700),
            fontSize: 24,
            textAlign: 'center',
            lineHeight: 32,
            opacity: phase === 'q' ? 1 : 0.45,
          }}
        >
          {card?.question ?? ''}
        </Text>
        <View style={[styles.divider, { backgroundColor: t.hairStrong }]} />
        <Text
          style={{
            color: t.ink,
            fontFamily: t.font(600),
            fontSize: 20,
            textAlign: 'center',
            lineHeight: 28,
            opacity: phase === 'a' ? 1 : 0.45,
          }}
        >
          {card?.answer ?? ''}
        </Text>
      </View>

      {card && (
        <View style={styles.levelRow}>
          {ALL_LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv}
              onPress={() => handleLevelChange(lv)}
              style={[
                styles.levelChip,
                {
                  backgroundColor: card.level === lv ? LEVEL_COLORS[lv] : hexA(LEVEL_COLORS[lv], t.dark ? 0.16 : 0.1),
                },
              ]}
            >
              <Text
                style={{
                  color: card.level === lv ? '#fff' : LEVEL_COLORS[lv],
                  fontFamily: t.font(700),
                  fontSize: 12,
                }}
              >
                {LEVEL_LABELS[lv]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.transport}>
        <View style={styles.optionsRow}>
          <SpeedControl rate={rate} onChange={setRate} compact />
          <TouchableOpacity
            onPress={() => setLoop((l) => !l)}
            style={[styles.loopBtn, { backgroundColor: loop ? t.accent : t.pill }]}
          >
            <Icon name="repeat" size={17} color={loop ? '#fff' : t.sub} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainRow}>
          <TouchableOpacity onPress={() => jump(-1)} disabled={idx === 0} style={[styles.skipBtn, { opacity: idx === 0 ? 0.3 : 1 }]}>
            <Icon name="skip-back" size={26} color={t.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={togglePlay}
            disabled={cards.length === 0}
            style={[styles.playBtn, { backgroundColor: t.accent, shadowColor: t.accent }]}
          >
            <Icon name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => jump(1)}
            disabled={idx >= cards.length - 1 && !loop}
            style={[styles.skipBtn, { opacity: idx >= cards.length - 1 && !loop ? 0.3 : 1 }]}
          >
            <Icon name="skip-fwd" size={26} color={t.ink} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PulsingDisc({ speaking }: { speaking: boolean }) {
  const t = useTheme();
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);
  const bars = useRef(Array.from({ length: 5 }, () => new Animated.Value(0.3))).current;
  const barLoopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loopsRef.current.forEach((l) => l.stop());
    barLoopsRef.current.forEach((l) => l.stop());
    if (speaking) {
      loopsRef.current = rings.map((v, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 800),
            Animated.timing(v, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ])
        )
      );
      loopsRef.current.forEach((l, i) => {
        rings[i].setValue(0);
        l.start();
      });
      barLoopsRef.current = bars.map((v, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 350, delay: i * 90, useNativeDriver: false }),
            Animated.timing(v, { toValue: 0.3, duration: 350, useNativeDriver: false }),
          ])
        )
      );
      barLoopsRef.current.forEach((l) => l.start());
    } else {
      rings.forEach((v) => v.setValue(0));
      bars.forEach((v) => v.setValue(0.3));
    }
    return () => {
      loopsRef.current.forEach((l) => l.stop());
      barLoopsRef.current.forEach((l) => l.stop());
    };
  }, [speaking]);

  return (
    <View style={styles.discWrap}>
      {rings.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              borderColor: hexA(t.accent, 0.5),
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.25] }) }],
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.discCore,
          speaking
            ? { backgroundColor: t.accent, shadowColor: t.accent, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 }
            : [t.shadowSoft, { backgroundColor: t.surface }],
        ]}
      >
        {speaking ? (
          <View style={styles.bars}>
            {bars.map((v, i) => (
              <Animated.View key={i} style={[styles.bar, { height: v.interpolate({ inputRange: [0.3, 1], outputRange: ['30%', '100%'] }) }]} />
            ))}
          </View>
        ) : (
          <Icon name="headphones" size={40} color={t.accentInk} strokeWidth={1.6} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 4 },
  titleWrap: { flex: 1, alignItems: 'center' },
  nowPlaying: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  divider: { height: 1, width: 40, marginVertical: 18 },
  discWrap: { width: 132, height: 132, marginBottom: 30, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 1.5 },
  discCore: { width: 96, height: 96, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34 },
  bar: { width: 4, borderRadius: 999, backgroundColor: '#fff' },
  levelRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, marginBottom: 6 },
  levelChip: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transport: { padding: 24, paddingBottom: 30 },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 },
  loopBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 26 },
  skipBtn: { width: 56, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 76, height: 76, borderRadius: 999, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 26, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
});
