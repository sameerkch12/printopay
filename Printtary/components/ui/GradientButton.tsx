import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = true,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  const gradients: Record<string, [string, string]> = {
    primary: [Colors.primary, Colors.accent],
    secondary: [Colors.bgSurface, Colors.bgElevated],
    danger: [Colors.error, '#c2410c'],
    ghost: ['transparent', 'transparent'],
  };

  const heights = { sm: 42, md: 52, lg: 60 };
  const fontSizes = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.md };
  const contrastText = variant === 'primary' || variant === 'danger';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.wrapper, style]}
        accessibilityLabel={title}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={disabled ? ['#334155', '#475569'] : gradients[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            { height: heights[size] },
            variant === 'ghost' && styles.ghostBorder,
            variant === 'secondary' && styles.secondaryBorder,
            ...(variant === 'primary' && !disabled ? [Shadow.glow] : []),
          ]}
        >
          {loading ? (
            <ActivityIndicator color={contrastText ? '#fff' : Colors.textPrimary} size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && icon}
              <Text style={[
                styles.text,
                { fontSize: fontSizes[size] },
                contrastText && styles.contrastText,
                variant === 'secondary' && styles.secondaryText,
                variant === 'ghost' && styles.ghostText,
                textStyle,
              ]}>
                {title}
              </Text>
              {icon && iconPosition === 'right' && icon}
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    borderRadius: Radius.md,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  contrastText: {
    color: '#fff',
  },
  secondaryText: {
    color: Colors.textSecondary,
  },
  ghostText: {
    color: Colors.textSecondary,
  },
});
