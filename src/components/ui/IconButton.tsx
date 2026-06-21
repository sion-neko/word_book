import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon, { IconName } from '../Icon';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
  name: IconName;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  iconSize?: number;
  label?: string;
  strokeWidth?: number;
  disabled?: boolean;
}

export default function IconButton({
  name,
  onPress,
  color,
  bg,
  size = 40,
  iconSize = 20,
  label,
  strokeWidth,
  disabled,
}: Props) {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      activeOpacity={0.6}
      style={[
        styles.btn,
        { width: size, height: size, backgroundColor: bg ?? t.pill, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Icon name={name} size={iconSize} color={color ?? t.ink} strokeWidth={strokeWidth} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
