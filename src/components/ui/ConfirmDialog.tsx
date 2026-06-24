import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  visible: boolean;
  label: string;
  confirmLabel?: string;
  confirmColor: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  visible,
  label,
  confirmLabel = '削除する',
  confirmColor,
  onCancel,
  onConfirm,
}: Props) {
  const t = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, t.shadow, { backgroundColor: t.surface }]} onPress={() => {}}>
          <Text style={[styles.label, { color: t.ink, fontFamily: t.font(700) }]}>{label}</Text>
          <Text style={{ color: t.sub, fontFamily: t.font(400), fontSize: 13, textAlign: 'center', marginTop: 6 }}>
            この操作は取り消せません
          </Text>
          <TouchableOpacity onPress={onConfirm} style={[styles.btn, { backgroundColor: confirmColor }]}>
            <Text style={{ color: '#fff', fontFamily: t.font(700), fontSize: 16 }}>{confirmLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={[styles.btn, { backgroundColor: t.pill }]}>
            <Text style={{ color: t.ink, fontFamily: t.font(700), fontSize: 16 }}>キャンセル</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'flex-end', padding: 16 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 22, gap: 10 },
  label: { fontSize: 16.5, textAlign: 'center', lineHeight: 24 },
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
});
