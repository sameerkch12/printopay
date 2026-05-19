import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UploadedFile } from '@/types';
import { formatFileSize } from '@/services/printService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

interface FileCardProps {
  file: UploadedFile;
  onRemove?: () => void;
  compact?: boolean;
}

const FILE_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  pdf: { icon: 'document-text', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  jpg: { icon: 'image', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  jpeg: { icon: 'image', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  png: { icon: 'image', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  doc: { icon: 'document', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  docx: { icon: 'document', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
};

export function FileCard({ file, onRemove, compact = false }: FileCardProps) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
  const iconConfig = FILE_ICONS[ext] ?? FILE_ICONS.pdf;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <LinearGradient
        colors={[Colors.bgCard, Colors.bgElevated]}
        style={styles.gradient}
      >
        {/* File icon */}
        <View style={[styles.iconWrap, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.icon} size={compact ? 20 : 26} color={iconConfig.color} />
        </View>

        {/* File info */}
        <View style={styles.info}>
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
            {file.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatFileSize(file.size)}</Text>
            {file.pages ? (
              <>
                <View style={styles.dot} />
                <Text style={styles.meta}>{file.pages} pages</Text>
              </>
            ) : null}
            <View style={styles.dot} />
            <Text style={styles.metaExt}>.{ext.toUpperCase()}</Text>
          </View>
        </View>

        {/* Remove btn */}
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </Pressable>
        ) : (
          <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  compact: {
    borderRadius: Radius.sm,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  nameCompact: {
    fontSize: FontSize.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  metaExt: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: '600',
    includeFontPadding: false,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  removeBtn: {
    padding: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
