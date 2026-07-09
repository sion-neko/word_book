import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../Icon';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

// Default品質のボイスしか無い端末向けに、Kyoko(拡張)のダウンロードを案内するダイアログ
export default function VoiceHintDialog({ visible, onClose }: Props) {
  const t = useTheme();
  const [dontShow, setDontShow] = useState(false);
  const close = () => onClose(dontShow);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.card, t.shadow, { backgroundColor: t.surface }]} onPress={() => {}}>
          <Text style={[styles.label, { color: t.ink, fontFamily: t.font(700) }]}>
            音声をもっと自然にできます
          </Text>
          <Text style={{ color: t.sub, fontFamily: t.font(400), fontSize: 13.5, lineHeight: 21, marginTop: 6 }}>
            iPhoneの「設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 日本語」から「Kyoko(拡張)」をダウンロードすると、より自然な声で再生されます。ダウンロード後は自動で使われます。
          </Text>
          <TouchableOpacity onPress={() => setDontShow(!dontShow)} style={styles.checkRow} hitSlop={8}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: dontShow ? t.accent : t.hairStrong,
                  backgroundColor: dontShow ? t.accent : 'transparent',
                },
              ]}
            >
              {dontShow && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
            </View>
            <Text style={{ color: t.sub, fontFamily: t.font(600), fontSize: 13.5 }}>今後表示しない</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} style={[styles.btn, { backgroundColor: t.accent }]}>
            <Text style={{ color: '#fff', fontFamily: t.font(700), fontSize: 16 }}>OK</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'flex-end', padding: 16 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 22 },
  label: { fontSize: 16.5, lineHeight: 24 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
