import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEVEL_COLORS, LEVEL_LABELS, Word } from '../../types';
import { useTheme } from '../../theme/ThemeContext';
import Icon from '../Icon';

interface Props {
  word: Word;
  num: number;
  isLast: boolean;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onLongPress: () => void;
  onSwipeDelete: () => void;
}

const SWIPE_MAX = 96;
const SWIPE_THRESHOLD = 64;
const LONG_PRESS_MS = 480;

export default function WordRow({
  word,
  num,
  isLast,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
  onSwipeDelete,
}: Props) {
  const t = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const snapBack = () => {
    Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        moved.current = false;
        longPressTimer.current = setTimeout(() => {
          if (!moved.current) {
            clearLongPress();
            onLongPress();
          }
        }, LONG_PRESS_MS);
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 7 || Math.abs(g.dy) > 7) {
          moved.current = true;
          clearLongPress();
        }
        const next = g.dx < 0 ? Math.max(g.dx, -SWIPE_MAX) : 0;
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        clearLongPress();
        const swiped = g.dx < -SWIPE_THRESHOLD;
        snapBack();
        if (swiped) onSwipeDelete();
      },
      onPanResponderTerminate: () => {
        clearLongPress();
        snapBack();
      },
    })
  ).current;

  const tagColor = LEVEL_COLORS[word.level];
  const tagLabel = LEVEL_LABELS[word.level];

  const content = (
    <>
      {selectMode ? (
        <View
          style={[
            styles.selectDot,
            { borderColor: t.faint, borderWidth: selected ? 0 : 1.5, backgroundColor: selected ? t.accent : 'transparent' },
          ]}
        >
          {selected && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
        </View>
      ) : (
        <Text style={[styles.num, { color: t.faint, fontFamily: t.mono(400) }]}>{num}</Text>
      )}
      <View style={styles.body}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.front, { color: t.ink, fontFamily: t.font(600) }]} numberOfLines={1}>
            {word.question}
          </Text>
          <Text style={[styles.back, { color: t.sub, fontFamily: t.font(400) }]} numberOfLines={1}>
            {word.answer}
          </Text>
        </View>
        {!selectMode && (
          <View style={styles.tagWrap}>
            <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
            <Text style={{ color: tagColor, fontFamily: t.font(700), fontSize: 12.5, minWidth: 36 }}>{tagLabel}</Text>
          </View>
        )}
      </View>
    </>
  );

  const rowStyle = [
    styles.row,
    { backgroundColor: t.surface, borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: t.hair },
  ];

  if (selectMode) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onToggleSelect} style={rowStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.backdrop, { backgroundColor: LEVEL_COLORS[0] }]}>
        <Icon name="trash" size={20} color="#fff" strokeWidth={2} />
      </View>
      <Animated.View {...panResponder.panHandlers} style={[rowStyle, { transform: [{ translateX }] }]}>
        {content}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'hidden' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  selectDot: { width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  num: { width: 20, textAlign: 'right', fontSize: 13 },
  body: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  front: { fontSize: 16 },
  back: { fontSize: 13.5, marginTop: 2 },
  tagWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  tagDot: { width: 8, height: 8, borderRadius: 999 },
});
