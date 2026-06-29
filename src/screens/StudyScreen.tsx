import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import ConfirmDialog from '../components/ui/ConfirmDialog';
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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [initialCounts, setInitialCounts] = useState<Record<MemoryLevel, number>>(() =>
    ALL_LEVELS.reduce((acc, lv) => {
      acc[lv] = route.params.words.filter((w) => w.level === lv).length;
      return acc;
    }, {} as Record<MemoryLevel, number>)
  );

  const pan = useRef(new Animated.ValueXY()).current;
  const isSwipingRef = useRef(false);
  const onSwipeRef = useRef<(dir: 1 | -1) => void>(() => {});
  const onTapRef = useRef<() => void>(() => {});

  const close = () => navigation.goBack();
  const requestClose = () => setShowCloseConfirm(true);

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
    const lvl: MemoryLevel = dir > 0 ? TOP_LEVEL : 1;
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

  useEffect(() => {
    if (done) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowCloseConfirm(true);
      return true;
    });
    return () => sub.remove();
  }, [done]);

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
    setInitialCounts(
      ALL_LEVELS.reduce((acc, lv) => {
        acc[lv] = subset.filter((w) => w.level === lv).length;
        return acc;
      }, {} as Record<MemoryLevel, number>)
    );
    setCards(subset);
    setIdx(0);
    setDone(false);
    setFlipped(false);
    pan.setValue({ x: 0, y: 0 });
  };

  if (done) {
    const weakCards = cards.filter((c) => isWeak(c.level));
    const weakCount = weakCards.length;

    const finalCounts = ALL_LEVELS.reduce((acc, lv) => {
      acc[lv] = cards.filter((c) => c.level === lv).length;
      return acc;
    }, {} as Record<MemoryLevel, number>);

    const getDeltaColor = (lv: MemoryLevel, delta: number): string => {
      if (delta === 0 || lv < 3) return t.faint;
      return delta > 0 ? LEVEL_COLORS[4] : LEVEL_COLORS[0];
    };

    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.resultWrap}>
          <Text style={{ color: t.faint, fontFamily: t.mono(700), fontSize: 12, letterSpacing: 2, marginBottom: 20 }}>
            RESULT
          </Text>

          <View style={[styles.resultTable, t.shadowSoft, { backgroundColor: t.surface }]}>
            {([4, 3, 2, 1, 0] as MemoryLevel[]).map((lv, i) => {
              const before = initialCounts[lv] ?? 0;
              const after = finalCounts[lv] ?? 0;
              const delta = after - before;
              const color = getDeltaColor(lv, delta);
              const deltaStr = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0';
              const isLast = i === 4;
              return (
                <View key={lv} style={[styles.resultTableRow, !isLast && { borderBottomWidth: 0.5, borderBottomColor: t.hair }]}>
                  <View style={[styles.levelDot, { backgroundColor: LEVEL_COLORS[lv] }]} />
                  <Text style={{ color: t.sub, fontFamily: t.font(600), fontSize: 14, flex: 1 }}>
                    {LEVEL_LABELS[lv]}
                  </Text>
                  <Text style={{ color: color, fontFamily: t.mono(700), fontSize: 20, minWidth: 44, textAlign: 'right' }}>
                    {deltaStr}
                  </Text>
                  <Text style={{ color: t.faint, fontFamily: t.mono(400), fontSize: 12, marginLeft: 8, minWidth: 64 }}>
                    ({before}→{after})
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.barWrap}>
            <MasteryBar words={cards} />
          </View>

          <View style={styles.resultActions}>
            {weakCount > 0 && (
              <PrimaryButton full icon="arrow-right" onPress={() => restart(weakCards)}>
                {`苦手${weakCount}問を再挑戦`}
              </PrimaryButton>
            )}
            <View style={styles.resultBtnRow}>
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
        <IconButton name="close" label="閉じる" onPress={requestClose} strokeWidth={2.2} />
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
            style={[styles.swipeLabel, styles.swipeLabelLeft, { opacity: leftOpacity, borderColor: LEVEL_COLORS[1] }]}
          >
            <Text style={[styles.swipeLabelText, { color: LEVEL_COLORS[1] }]}>難しい</Text>
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
          ← スワイプで難しい ・ 完璧でスワイプ → ／ タップで習熟度を選択
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

      <ConfirmDialog
        visible={showCloseConfirm}
        label="学習を中断しますか？"
        description={"途中からの再開はできません\nここまでのタグ付けは保存されます"}
        confirmLabel="終了する"
        confirmColor={t.accent}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={close}
      />
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
  resultTable: { width: '100%', maxWidth: 320, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  resultTableRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  levelDot: { width: 9, height: 9, borderRadius: 999 },
  barWrap: { width: '100%', maxWidth: 320, marginTop: 20 },
  resultActions: { width: '100%', maxWidth: 320, marginTop: 28, gap: 12 },
  resultBtnRow: { flexDirection: 'row', gap: 12 },
});
