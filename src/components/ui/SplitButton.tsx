import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hexA } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import Icon from '../Icon';
import Sheet from './Sheet';

interface Option<T> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  count: T;
  setCount: (v: T) => void;
  options: Option<T>[];
  playable: number;
  disabled?: boolean;
  onPlay: () => void;
}

export default function SplitButton<T extends string | number>({
  count,
  setCount,
  options,
  playable,
  disabled,
  onPlay,
}: Props<T>) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const dis = disabled || playable === 0;

  return (
    <View>
      <View
        style={[
          styles.row,
          { backgroundColor: dis ? t.pill : t.accent, opacity: dis ? 0.5 : 1 },
          !dis
            ? { shadowColor: t.accent, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 }
            : null,
        ]}
      >
        <TouchableOpacity disabled={dis} onPress={onPlay} style={styles.main} activeOpacity={0.85}>
          <Icon name="play" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: t.font(700), fontSize: 17 }}>
            {count === 'all' ? `全部(${playable}問)を解く` : `${playable}問を解く`}
          </Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: hexA('#ffffff', 0.35) }]} />
        <TouchableOpacity disabled={dis} onPress={() => setOpen(true)} style={styles.chevronBtn} activeOpacity={0.85}>
          <Icon name="chevron" size={17} color="#fff" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} title="出題数を選ぶ">
        {options.map((o) => {
          const on = o.value === count;
          return (
            <TouchableOpacity
              key={String(o.value)}
              onPress={() => {
                setCount(o.value);
                setOpen(false);
              }}
              style={[styles.option, { backgroundColor: on ? t.accentSoft : 'transparent' }]}
            >
              <Text style={{ color: on ? t.accentInk : t.ink, fontFamily: t.font(on ? 700 : 600), fontSize: 15 }}>
                {o.label}
              </Text>
              {on && <Icon name="check" size={16} color={t.accentInk} strokeWidth={2.6} />}
            </TouchableOpacity>
          );
        })}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', height: 54, borderRadius: 14, overflow: 'hidden' },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  divider: { width: 0.5, marginVertical: 9 },
  chevronBtn: { width: 52, alignItems: 'center', justifyContent: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 2,
  },
});
