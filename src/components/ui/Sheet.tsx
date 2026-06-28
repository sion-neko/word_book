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

const MAX_HEIGHT = Dimensions.get('window').height * 0.85;
import { useTheme } from '../../theme/ThemeContext';

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

  useEffect(() => {
    if (!visible) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(translateY, {
        toValue: -(e.endCoordinates.height / 4),
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
      translateY.setValue(0);
    };
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={onClose} />
        <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }] }]}>
          <View style={[styles.sheet, { backgroundColor: t.bg }]}>
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
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { width: '100%', zIndex: 1 },
  sheet: { width: '100%', maxHeight: MAX_HEIGHT, borderRadius: 26 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 16 },
  trailing: { minWidth: 60, alignItems: 'flex-end' },
  body: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 8 },
});
