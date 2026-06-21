import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import Icon from '../Icon';

interface Props {
  speaking: boolean;
  onPress: () => void;
  size?: number;
}

const BAR_COUNT = 6;

export default function AudioButton({ speaking, onPress, size = 64 }: Props) {
  const t = useTheme();
  const anims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))).current;
  const iconSize = Math.round(size * 0.44);
  const barAreaHeight = Math.round(size * 0.4);
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loopsRef.current.forEach((l) => l.stop());
    if (speaking) {
      loopsRef.current = anims.map((v, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 350, delay: i * 90, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            Animated.timing(v, { toValue: 0.3, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          ])
        )
      );
      loopsRef.current.forEach((l) => l.start());
    } else {
      anims.forEach((v) => v.setValue(0.3));
    }
    return () => loopsRef.current.forEach((l) => l.stop());
  }, [speaking]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { width: size, height: size },
        speaking
          ? {
              backgroundColor: t.accent,
              shadowColor: t.accent,
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }
          : ([t.shadowSoft, { backgroundColor: t.surface }] as const),
      ]}
    >
      {speaking ? (
        <View style={[styles.bars, { height: barAreaHeight }]}>
          {anims.map((v, i) => (
            <Animated.View
              key={i}
              style={[styles.bar, { height: v.interpolate({ inputRange: [0.3, 1], outputRange: ['30%', '100%'] }) }]}
            />
          ))}
        </View>
      ) : (
        <Icon name="volume" size={iconSize} color={t.accentInk} strokeWidth={1.8} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { width: 3.5, borderRadius: 999, backgroundColor: '#fff' },
});
