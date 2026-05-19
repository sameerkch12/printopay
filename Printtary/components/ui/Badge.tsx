import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  label,
  color = Colors.primary,
  bgColor,
  style,
  size = 'md',
  dot = true,
}: BadgeProps) {
  const bg = bgColor ?? `${color}22`;

  return (
    <View style={[styles.base, { backgroundColor: bg }, size === 'sm' && styles.sm, style]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    includeFontPadding: false,
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
  },
});
