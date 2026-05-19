import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'bordered' | 'glow';
  padding?: number;
  gradient?: boolean;
}

export function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 20,
  gradient = false,
}: GlassCardProps) {
  const variantStyles: ViewStyle[] = [
    variant === 'elevated' ? styles.elevated : {},
    variant === 'bordered' ? styles.bordered : {},
    variant === 'glow' ? styles.glow : {},
  ];

  if (gradient) {
    return (
      <LinearGradient
        colors={['rgba(99,102,241,0.1)', 'rgba(168,85,247,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, ...variantStyles, { padding }, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.base, ...variantStyles, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  elevated: {
    backgroundColor: Colors.bgElevated,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bordered: {
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.bgCard,
  },
  glow: {
    borderColor: 'rgba(99,102,241,0.4)',
    ...Shadow.glow,
  },
});
