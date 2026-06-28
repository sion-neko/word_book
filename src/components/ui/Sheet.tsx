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
  variant?: 'center' | 'bottom';
}

export default function Sheet({ visible, onClose, title, trailing, children, variant = 'center' }: Props) {
  const t = useTheme();

  // center variant
  const translateY = useRef(new Animated.Value(0)).current;
  const centerMaxHeight = useRef(new Animated.Value(MAX_HEIGHT)).current;
  const sheetHeightRef = useRef(0);
  const kbShownRef = useRef(false);

  // bottom variant
  const bottomPadding = useRef(new Animated.Value(0)).current;
  const bottomMaxHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.92)).current;

  useEffect(() => {
    if (!visible) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    if (variant === 'bottom') {
      const showSub = Keyboard.addListener(showEvent, (e) => {
        const kbH = e.endCoordinates.height;
        Animated.parallel([
          Animated.timing(bottomPadding, {
            toValue: kbH,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.timing(bottomMaxHeight, {
            toValue: SCREEN_HEIGHT - kbH - 8,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();
      });
      const hideSub = Keyboard.addListener(hideEvent, () => {
        Animated.parallel([
          Animated.timing(bottomPadding, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.timing(bottomMaxHeight, {
            toValue: SCREEN_HEIGHT * 0.92,
            duration: 180,
            useNativeDriver: false,
          }),
        ]).start();
      });
      return () => {
        showSub.remove();
        hideSub.remove();
        bottomPadding.setValue(0);
        bottomMaxHeight.setValue(SCREEN_HEIGHT * 0.92);
      };
    }

    // center variant
    const showSub = Keyboard.addListener(showEvent, (e) => {
      kbShownRef.current = true;
      const kbHeight = e.endCoordinates.height;
      const maxH = SCREEN_HEIGHT - kbHeight - 24;
      const sheetH = sheetHeightRef.current || MAX_HEIGHT;
      const effectiveH = Math.min(sheetH, maxH);
      const neededShift = SCREEN_HEIGHT / 2 - kbHeight - 8 - effectiveH / 2;
      const preferredShift = -(kbHeight / 4);
      const shift = Math.min(neededShift, preferredShift);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: shift,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(centerMaxHeight, {
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
        Animated.timing(centerMaxHeight, {
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
      centerMaxHeight.setValue(MAX_HEIGHT);
    };
  }, [visible, variant, translateY, centerMaxHeight, bottomPadding, bottomMaxHeight]);

  if (!visible) return null;

  if (variant === 'bottom') {
    return (
      <Modal transparent visible onRequestClose={onClose}>
        <View style={styles.wrapBottom}>
          <Pressable style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={onClose} />
          <Animated.View style={{ paddingBottom: bottomPadding }}>
            <Animated.View style={[styles.sheetBottom, { backgroundColor: t.bg, maxHeight: bottomMaxHeight }]}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Text style={{ color: t.accentInk, fontSize: 16, fontFamily: t.font(600) }}>キャンセル</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: t.ink, fontFamily: t.font(700) }]} numberOfLines={1}>
                  {title}
                </Text>
                <View style={styles.trailing}>{trailing}</View>
              </View>
              <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={onClose} />
        <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <Animated.View
            style={[styles.sheet, { backgroundColor: t.bg, maxHeight: centerMaxHeight }]}
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
  // center variant
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheetWrap: { width: '100%', zIndex: 1 },
  sheet: { width: '100%', borderRadius: 26 },
  // bottom variant
  wrapBottom: { flex: 1, justifyContent: 'flex-end' },
  sheetBottom: { width: '100%', borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.35)', alignSelf: 'center', marginTop: 10, marginBottom: 2 },
  // shared
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 16 },
  trailing: { minWidth: 60, alignItems: 'flex-end' },
  body: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 8 },
});
