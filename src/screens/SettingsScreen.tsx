import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSetting, setSetting } from '../db/database';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const PAUSES = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0];

function nearest<T extends number>(arr: T[], val: number): T {
  return arr.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a));
}

export default function SettingsScreen({ navigation }: Props) {
  const [speed, setSpeed] = useState<number>(() =>
    nearest(SPEEDS, parseFloat(getSetting('playback_speed') ?? '1.0'))
  );
  const [pauseQA, setPauseQA] = useState<number>(() =>
    nearest(PAUSES, parseFloat(getSetting('pause_between_qa') ?? '1.5'))
  );
  const [pauseWords, setPauseWords] = useState<number>(() =>
    nearest(PAUSES, parseFloat(getSetting('pause_between_words') ?? '2.0'))
  );

  const save = useCallback(() => {
    setSetting('playback_speed', String(speed));
    setSetting('pause_between_qa', String(pauseQA));
    setSetting('pause_between_words', String(pauseWords));
    navigation.goBack();
  }, [speed, pauseQA, pauseWords, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>保存</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>再生設定</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>再生速度</Text>
          <View style={styles.segmented}>
            {SPEEDS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.seg, speed === s && styles.segActive]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[styles.segText, speed === s && styles.segTextActive]}>
                  {s}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>問題→解答の間隔 (秒)</Text>
          <View style={styles.segmented}>
            {PAUSES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.seg, pauseQA === p && styles.segActive]}
                onPress={() => setPauseQA(p)}
              >
                <Text style={[styles.segText, pauseQA === p && styles.segTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>単語間の間隔 (秒)</Text>
          <View style={styles.segmented}>
            {PAUSES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.seg, pauseWords === p && styles.segActive]}
                onPress={() => setPauseWords(p)}
              >
                <Text style={[styles.segText, pauseWords === p && styles.segTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CSVインポート形式</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{'問題文,解答[,読み仮名]'}</Text>
          <Text style={styles.infoSub}>
            {'例:\napple,りんご\napple,りんご,アップル'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { minWidth: 60 },
  backText: { fontSize: 17, color: '#4A90D9' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveBtn: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { gap: 8 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seg: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  segActive: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  segText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  segTextActive: { color: '#FFFFFF' },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  infoSub: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
});

