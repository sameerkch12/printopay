import React from 'react';
import { View, Text, Pressable, StyleSheet, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PrintJob } from '@/types';
import { getStatusColor, getStatusLabel, formatFileSize } from '@/services/printService';
import { Badge } from '@/components/ui/Badge';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow, getActiveThemeMode } from '@/constants/theme';

interface PrintJobCardProps {
  job: PrintJob;
}

export function PrintJobCard({ job }: PrintJobCardProps) {
  const router = useRouter();
  const statusColor = getStatusColor(job.status);
  const isLightMode = getActiveThemeMode() === 'light';
  const codeTint = job.status === 'pending' ? Colors.warning : Colors.success;
  const codeBackground = isLightMode ? `${codeTint}18` : `${codeTint}22`;
  const codeTextColor = isLightMode ? (job.status === 'pending' ? '#92400e' : '#15803d') : codeTint;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/job-details', params: { jobId: job.id } })}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={[Colors.bgCard, Colors.bgElevated]}
        style={styles.gradient}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.jobNum}>#{job.jobNumber}</Text>
            <Badge
              label={getStatusLabel(job.status)}
              color={statusColor}
              size="sm"
            />
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>

        {/* File info */}
        <View style={styles.fileRow}>
          <View style={styles.fileIconWrap}>
            <Ionicons name="document-text" size={18} color={Colors.primaryLight} />
          </View>
          <Text style={styles.fileName} numberOfLines={1}>{job.file.name}</Text>
          <Text style={styles.fileSize}>{formatFileSize(job.file.size)}</Text>
        </View>

        {/* Shop + settings */}
        <View style={styles.divider} />
        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Ionicons name="storefront-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.detailText} numberOfLines={1}>{job.shopName}</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="copy-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.detailText}>{job.settings.copies}x</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="color-palette-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.detailText}>{job.settings.color === 'bw' ? 'B&W' : 'Color'}</Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="layers-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.detailText}>{job.estimatedPages}pg</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(job.createdAt)}</Text>
          <View style={[styles.otpBadge, { borderColor: codeTint, backgroundColor: codeBackground }]}>
            <Ionicons name="keypad" size={10} color={codeTextColor} />
            <Text style={[styles.otpText, { color: codeTextColor }]}>Code: {job.otp || '----'}</Text>
          </View>
        </View>

        {/* Status bar */}
        <View style={[styles.statusBar, { backgroundColor: `${statusColor}30` }]}>
          <View style={[styles.statusBarFill, { backgroundColor: statusColor, width: getStatusWidth(job.status) }]} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function getStatusWidth(status: string): DimensionValue {
  return status === 'pending' ? '35%' : '100%';
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  gradient: {
    padding: Spacing.md,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobNum: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  fileSize: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  otpText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  statusBar: {
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: -4,
  },
  statusBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
