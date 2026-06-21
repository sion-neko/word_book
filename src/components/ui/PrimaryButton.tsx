import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Icon, { IconName } from '../Icon';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  children: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  kind?: 'solid' | 'ghost';
  full?: boolean;
}

export default function PrimaryButton({ children, onPress, icon, disabled, kind = 'solid', full }: Props) {
  const t = useTheme();
  const solid = kind === 'solid';
  const shadow: ViewStyle =
    solid && !disabled
      ? { shadowColor: t.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }
      : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.btn,
        shadow,
        {
          width: full ? '100%' : undefined,
          borderWidth: solid ? 0 : 1.5,
          borderColor: t.hairStrong,
          backgroundColor: disabled ? t.pill : solid ? t.accent : t.surface,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {icon && <Icon name={icon} size={20} color={solid ? '#fff' : t.ink} strokeWidth={2} />}
      <Text style={{ color: solid ? '#fff' : t.ink, fontFamily: t.font(700), fontSize: 17 }}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
});
