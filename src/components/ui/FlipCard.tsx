import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LEVEL_COLORS, LEVEL_LABELS, Word } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import Icon from '../Icon';

interface Props {
  word: Word;
  flipped: boolean;
}

// 親(StudyScreen)がジェスチャーを管理する前提の純粋な表示コンポーネント。
export default function FlipCard({ word, flipped }: Props) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(flipped ? 1 : 0)).current;
  const prevWordId = useRef(word.id);

  useEffect(() => {
    if (prevWordId.current !== word.id) {
      // カードが切り替わった場合はアニメーションさせず即座に表面へスナップする
      prevWordId.current = word.id;
      anim.setValue(flipped ? 1 : 0);
      return;
    }
    Animated.timing(anim, { toValue: flipped ? 1 : 0, duration: 550, useNativeDriver: true }).start();
  }, [word.id, flipped]);

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = anim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const renderFace = (
    isBack: boolean,
    rotate: Animated.AnimatedInterpolation<string>,
    opacity: Animated.AnimatedInterpolation<number>
  ) => (
    <Animated.View
      style={[
        styles.face,
        t.shadow,
        {
          backgroundColor: t.surface,
          opacity,
          transform: [{ perspective: 1600 }, { rotateY: rotate }],
        },
      ]}
    >
      <Text style={[styles.kicker, { color: isBack ? t.accentInk : t.faint, fontFamily: t.mono(700) }]}>
        {isBack ? 'ANSWER' : 'QUESTION'}
      </Text>
      <Text style={[styles.mainText, { color: t.ink, fontFamily: t.font(isBack ? 600 : 700) }]}>
        {isBack ? word.answer : word.question}
      </Text>
      {!isBack && word.reading ? (
        <Text style={[styles.hint, { color: t.sub, fontFamily: t.font(400) }]}>{word.reading}</Text>
      ) : null}
      <View style={styles.flipHint}>
        <Icon name="flip" size={15} color={t.faint} />
        <Text style={{ color: t.faint, fontSize: 12, fontFamily: t.font(600), marginLeft: 6 }}>
          タップで{isBack ? '戻る' : 'めくる'}
        </Text>
      </View>
      <View style={styles.levelTag}>
        <View style={[styles.levelDot, { backgroundColor: LEVEL_COLORS[word.level] }]} />
        <Text style={{ color: LEVEL_COLORS[word.level], fontSize: 12, fontFamily: t.font(700) }}>
          {LEVEL_LABELS[word.level]}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.wrap}>
      {renderFace(false, frontRotate, frontOpacity)}
      {renderFace(true, backRotate, backOpacity)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backfaceVisibility: 'hidden',
  },
  kicker: { position: 'absolute', top: 18, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  mainText: { fontSize: 28, textAlign: 'center', lineHeight: 36 },
  hint: { marginTop: 16, fontSize: 14, textAlign: 'center' },
  flipHint: { position: 'absolute', bottom: 18, flexDirection: 'row', alignItems: 'center' },
  levelTag: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  levelDot: { width: 8, height: 8, borderRadius: 999 },
});
