import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

const EASING = Easing.bezier(0.32, 0.72, 0, 1);

export default function Sheet({ visible, onClose, title, trailing, children }: Props) {
  const t = useTheme();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 280, easing: EASING, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 220, easing: EASING, useNativeDriver: true }).start(() => {
        setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { backgroundColor: t.bg, transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={{ color: t.accentInk, fontSize: 16, fontFamily: t.font(600) }}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: t.ink, fontFamily: t.font(700) }]} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.trailing}>{trailing}</View>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 16 },
  trailing: { minWidth: 60, alignItems: 'flex-end' },
  body: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 8 },
});
