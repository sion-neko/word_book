import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export default function Sheet({ visible, onClose, title, trailing, children }: Props) {
  const t = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const maxHeight = useRef(new Animated.Value(MAX_HEIGHT)).current;
  const sheetHeightRef = useRef(0);
  const kbShownRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      kbShownRef.current = true;
      const kbHeight = e.endCoordinates.height;
      const maxH = SCREEN_HEIGHT - kbHeight - 24;
      const sheetH = sheetHeightRef.current || MAX_HEIGHT;
      const effectiveH = Math.min(sheetH, maxH);
      // モーダルの下端がキーボードの上 8px に収まるための最低シフト量
      const neededShift = SCREEN_HEIGHT / 2 - kbHeight - 8 - effectiveH / 2;
      // ユーザーが好む軽いシフト（kbHeight/4）
      const preferredShift = -(kbHeight / 4);
      // コンテンツが多いときは必要分だけ多くシフト
      const shift = Math.min(neededShift, preferredShift);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: shift,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(maxHeight, {
          toValue: maxH,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      kbShownRef.current = false;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(maxHeight, {
          toValue: MAX_HEIGHT,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      kbShownRef.current = false;
      translateY.setValue(0);
      maxHeight.setValue(MAX_HEIGHT);
    };
  }, [visible, translateY, maxHeight]);

  if (!visible) return null;

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={onClose} />
        <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <Animated.View
            style={[styles.sheet, { backgroundColor: t.bg, maxHeight }]}
            onLayout={(e) => {
              if (!kbShownRef.current) {
                sheetHeightRef.current = e.nativeEvent.layout.height;
              }
            }}
          >
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { width: '100%', zIndex: 1 },
  sheet: { width: '100%', borderRadius: 26 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 16 },
  trailing: { minWidth: 60, alignItems: 'flex-end' },
  body: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 8 },
});
