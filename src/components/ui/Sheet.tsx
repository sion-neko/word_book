import React from 'react';
import {
  KeyboardAvoidingView,
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

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export default function Sheet({ visible, onClose, title, trailing, children }: Props) {
  const t = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.wrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={[styles.backdrop, StyleSheet.absoluteFill]} onPress={onClose} />
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { width: '100%', maxHeight: '85%', borderRadius: 26, zIndex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 16 },
  trailing: { minWidth: 60, alignItems: 'flex-end' },
  body: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 8 },
});
