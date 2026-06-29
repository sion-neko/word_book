import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import FlipCard from '../components/ui/FlipCard';
import IconButton from '../components/ui/IconButton';
import MasteryBar from '../components/ui/MasteryBar';
import PrimaryButton from '../components/ui/PrimaryButton';
import { updateWordLevel } from '../db/database';
import { hexA } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { ALL_LEVELS, isWeak, LEVEL_COLORS, LEVEL_LABELS, MemoryLevel, RootStackParamList, TOP_LEVEL, Word } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Study'>;
  route: RouteProp<RootStackParamList, 'Study'>;
};

const SWIPE_THRESHOLD = 80;
const SWIPE_OUT_X = 500;

export default function StudyScreen({ navigation, route }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<Word[]>(route.params.words);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const isSwipingRef = useRef(false);
  const onSwipeRef = useRef<(dir: 1 | -1) => void>(() => {});
  const onTapRef = useRef<() => void>(() => {});

  const close = () => navigation.goBack();

  const go = (d: number) => {
    setFlipped(false);
    if (d > 0 && idx >= cards.length - 1) {
      setDone(true);
      return;
    }
    if (d < 0 && idx <= 0) return;
    setIdx((i) => Math.max(0, Math.min(cards.length - 1, i + d)));
  };

  const tag = (lvl: MemoryLevel) => {
    const card = cards[idx];
    if (!card) return;
    updateWordLevel(card.id, lvl);
    setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, level: lvl } : c)));
    setTimeout(() => go(1), 180);
  };

  // Updated every render to capture latest state
  onSwipeRef.current = (dir: 1 | -1) => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    const card = cards[idx];
    const lvl: MemoryLevel = dir > 0 ? TOP_LEVEL : 0;
    Animated.timing(pan, {
      toValue: { x: dir * SWIPE_OUT_X, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      isSwipingRef.current = false;
      if (card) {
        updateWordLevel(card.id, lvl);
        setCards((cs) => cs.map((c) => (c.id === card.id ? { ...c, level: lvl } : c)));
      }
      go(1);
    });
  };

  onTapRef.current = () => setFlipped((f) => !f);

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
  }, [idx]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSwipingRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !isSwipingRef.current && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (isSwipingRef.current) return;
        if (Math.abs(g.dx) > SWIPE_THRESHOLD) {
          onSwipeRef.current(g.dx > 0 ? 1 : -1);
        } else if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          onTapRef.current();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const leftOpacity = pan.x.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rightOpacity = pan.x.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const restart = (subset: Word[]) => {
    setCards(subset);
    setIdx(0);
    setDone(false);
    setFlipped(false);
    pan.setValue({ x: 0, y: 0 });
  };

  if (done) {
    const weakCards = cards.filter((c) => isWeak(c.level));
    const weakCount = weakCards.length;
    const goodCount = cards.length - weakCount;
    const rate = cards.length ? Math.round((goodCount / cards.length) * 100) : 0;
    const rateColor = rate >= 80 ? LEVEL_COLORS[4] : rate >= 50 ? LEVEL_COLORS[2] : LEVEL_COLORS[0];

    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.resultWrap}>
          <Text style={{ color: t.faint, fontFamily: t.mono(700), fontSize: 13, letterSpacing: 2 }}>習熟率</Text>
          <Text style={{ color: rateColor, fontFamily: t.mono(700), fontSize: 68, marginTop: 4 }}>
            {rate}
            <Text style={{ fontSize: 30 }}>%</Text>
          </Text>
          <Text style={{ color: t.sub, fontFamily: t.mono(400), fontSize: 15, marginTop: 8 }}>
            {cards.length}問中 {goodCount}問が覚えた以上
          </Text>

          <View style={styles.barWrap}>
            <MasteryBar words={cards} />
          </View>
          <View style={styles.legend}>
            {ALL_LEVELS.map((lv) => {
              const n = cards.filter((c) => c.level === lv).length;
              return (
                <View key={lv} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: LEVEL_COLORS[lv] }]} />
                  <Text style={{ color: t.sub, fontFamily: t.font(600), fontSize: 13, flex: 1 }}>
                    {LEVEL_LABELS[lv]}
                  </Text>
                  <Text style={{ color: t.ink, fontFamily: t.mono(500), fontSize: 13 }}>{n}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.resultActions}>
            {weakCount > 0 && (
              <PrimaryButton full icon="arrow-right" onPress={() => restart(weakCards)}>
                {`苦手${weakCount}問を再挑戦`}
              </PrimaryButton>
            )}
            <View style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <PrimaryButton full kind="ghost" onPress={() => restart(cards)}>
                  もう一度
                </PrimaryButton>
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton full kind={weakCount > 0 ? 'ghost' : 'solid'} onPress={close}>
                  終了
                </PrimaryButton>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const card = cards[Math.min(idx, cards.length - 1)];
  if (!card) return null;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <IconButton name="close" label="閉じる" onPress={close} strokeWidth={2.2} />
        <View style={[styles.progressTrack, { backgroundColor: t.hair }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${((idx + 1) / cards.length) * 100}%`, backgroundColor: t.accent },
            ]}
          />
        </View>
        <Text style={{ fontFamily: t.mono(400), color: t.sub, fontSize: 14, minWidth: 48, textAlign: 'right' }}>
          {idx + 1}/{cards.length}
        </Text>
      </View>

      <View style={styles.cardArea}>
        <Animated.View
          style={[styles.cardAnimated, { transform: [...pan.getTranslateTransform(), { rotate }] }]}
          {...panResponder.panHandlers}
        >
          <FlipCard word={card} flipped={flipped} />
          <Animated.View
            pointerEvents="none"
            style={[styles.swipeLabel, styles.swipeLabelLeft, { opacity: leftOpacity, borderColor: LEVEL_COLORS[0] }]}
          >
            <Text style={[styles.swipeLabelText, { color: LEVEL_COLORS[0] }]}>苦手</Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.swipeLabel, styles.swipeLabelRight, { opacity: rightOpacity, borderColor: LEVEL_COLORS[TOP_LEVEL] }]}
          >
            <Text style={[styles.swipeLabelText, { color: LEVEL_COLORS[TOP_LEVEL] }]}>完璧</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.bottomArea}>
        <Text style={[styles.swipeHint, { color: t.faint }]}>
          ← スワイプで苦手 ・ 完璧でスワイプ → ／ タップで習熟度を選択
        </Text>
        <View style={styles.levelRow}>
          {ALL_LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv}
              onPress={() => tag(lv)}
              style={[styles.levelBtn, { borderColor: t.hair, backgroundColor: hexA(LEVEL_COLORS[lv], t.dark ? 0.16 : 0.1) }]}
            >
              <Text style={{ color: LEVEL_COLORS[lv], fontFamily: t.font(700), fontSize: 13.5, textAlign: 'center' }}>
                {LEVEL_LABELS[lv]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => go(-1)} disabled={idx === 0} style={[styles.navBtn, { opacity: idx === 0 ? 0.35 : 1 }]}>
            <Icon name="back" size={18} color={t.sub} strokeWidth={2} />
            <Text style={{ color: t.sub, fontFamily: t.font(600), fontSize: 15 }}>前へ</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => go(1)} style={styles.navBtn}>
            <Text style={{ color: t.sub, fontFamily: t.font(600), fontSize: 15 }}>次へ</Text>
            <Icon name="chevron" size={18} color={t.sub} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 8 },
  progressTrack: { flex: 1, height: 5, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  cardArea: { flex: 1, padding: 22, paddingTop: 14 },
  cardAnimated: { flex: 1 },
  swipeLabel: {
    position: 'absolute',
    top: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 3,
    borderRadius: 8,
  },
  swipeLabelLeft: { left: 24, transform: [{ rotate: '-15deg' }] },
  swipeLabelRight: { right: 24, transform: [{ rotate: '15deg' }] },
  swipeLabelText: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  bottomArea: { padding: 18, paddingBottom: 30 },
  swipeHint: { fontSize: 12, textAlign: 'center', marginBottom: 10, fontWeight: '600' },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  barWrap: { width: '100%', maxWidth: 320, marginTop: 26 },
  legend: { width: '100%', maxWidth: 320, marginTop: 14, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 999 },
  resultActions: { width: '100%', maxWidth: 320, marginTop: 32, gap: 12 },
  resultRow: { flexDirection: 'row', gap: 12 },
});
