import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Chip from '../components/ui/Chip';
import Header from '../components/ui/Header';
import { getSetting, setSetting } from '../db/database';
import { ACCENT_OPTIONS } from '../theme/theme';
import { useThemeSettings } from '../theme/ThemeContext';
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
  const { theme: t, dark, accent, setDark, setAccent } = useThemeSettings();

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
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Header
        title="設定"
        onBack={navigation.goBack}
        trailing={
          <TouchableOpacity onPress={save} hitSlop={8}>
            <Text style={{ color: t.accentInk, fontFamily: t.font(700), fontSize: 16 }}>保存</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.section, t.shadowSoft, { backgroundColor: t.surface }]}>
          <Text style={[styles.sectionTitle, { color: t.sub, fontFamily: t.font(700) }]}>テーマ</Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.ink, fontFamily: t.font(600) }]}>ダークモード</Text>
            <Switch value={dark} onValueChange={setDark} trackColor={{ true: t.accent }} />
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.ink, fontFamily: t.font(600) }]}>アクセントカラー</Text>
            <View style={styles.swatchRow}>
              {ACCENT_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setAccent(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    accent === c && { borderWidth: 2, borderColor: t.ink },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, t.shadowSoft, { backgroundColor: t.surface }]}>
          <Text style={[styles.sectionTitle, { color: t.sub, fontFamily: t.font(700) }]}>再生設定</Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.ink, fontFamily: t.font(600) }]}>再生速度</Text>
            <View style={styles.chipWrap}>
              {SPEEDS.map((s) => (
                <Chip key={s} label={`${s}x`} active={speed === s} onPress={() => setSpeed(s)} />
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.ink, fontFamily: t.font(600) }]}>問題→解答の間隔 (秒)</Text>
            <View style={styles.chipWrap}>
              {PAUSES.map((p) => (
                <Chip key={p} label={String(p)} active={pauseQA === p} onPress={() => setPauseQA(p)} />
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.ink, fontFamily: t.font(600) }]}>単語間の間隔 (秒)</Text>
            <View style={styles.chipWrap}>
              {PAUSES.map((p) => (
                <Chip key={p} label={String(p)} active={pauseWords === p} onPress={() => setPauseWords(p)} />
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, t.shadowSoft, { backgroundColor: t.surface }]}>
          <Text style={[styles.sectionTitle, { color: t.sub, fontFamily: t.font(700) }]}>CSVインポート形式</Text>
          <View style={[styles.infoBox, { backgroundColor: t.surfaceAlt, borderColor: t.hair }]}>
            <Text style={{ color: t.ink, fontFamily: t.mono(500), fontSize: 14 }}>{'問題文,解答[,読み仮名]'}</Text>
            <Text style={{ color: t.faint, fontFamily: t.mono(400), fontSize: 12, marginTop: 6 }}>
              {'例:\napple,りんご\napple,りんご,アップル'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, gap: 16 },
  sectionTitle: { fontSize: 12.5, letterSpacing: 0.5, textTransform: 'uppercase' },
  row: { gap: 10 },
  rowLabel: { fontSize: 15 },
  swatchRow: { flexDirection: 'row', gap: 12 },
  swatch: { width: 32, height: 32, borderRadius: 999 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoBox: { borderRadius: 10, padding: 12, borderWidth: 1 },
});
