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

  useEffect(() => {
    if (!visible) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kbHeight = e.endCoordinates.height;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -(kbHeight / 4),
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(maxHeight, {
          toValue: SCREEN_HEIGHT - kbHeight - 24,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
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
          <Animated.View style={[styles.sheet, { backgroundColor: t.bg, maxHeight }]}>
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
