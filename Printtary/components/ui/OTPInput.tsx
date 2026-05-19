import React, { useEffect, useRef } from 'react';
import {
  TextInput,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, Radius, Shadow } from '@/constants/theme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 4, value, onChange, error = false }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    onChange(clean);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.container}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        autoComplete="one-time-code"
      />
      {digits.map((digit, idx) => (
        <OTPCell
          key={idx}
          digit={digit}
          error={error}
          focused={value.length === idx}
        />
      ))}
    </Pressable>
  );
}

function OTPCell({ digit, focused, error }: { digit: string; focused: boolean; error: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!digit) return;
    scale.value = withSpring(1.12, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
  }, [digit, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.cell,
        digit ? styles.filledCell : {},
        focused && !error ? styles.focusedCell : {},
        error ? styles.errorCell : {},
        animStyle,
      ]}
    >
      <Text style={[styles.digit, digit ? styles.filledDigit : styles.placeholder]}>
        {digit || '.'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  cell: {
    width: 64,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  filledCell: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderColor: Colors.primary,
  },
  focusedCell: {
    borderColor: Colors.primaryLight,
    ...Shadow.glow,
  },
  errorCell: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorGlow,
  },
  digit: {
    fontSize: 28,
    fontWeight: '700',
    includeFontPadding: false,
  },
  filledDigit: {
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textMuted,
    fontSize: 22,
  },
});
