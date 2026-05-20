import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { usePrint } from '@/hooks/usePrint';
import { getStatusColor, getStatusLabel, formatFileSize, formatTimeLeft } from '@/services/printService';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

export default function JobDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { jobHistory } = usePrint();

  const job = jobHistory.find(j => j.id === jobId);

  if (!job) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader title="Job Details" showBack />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorText}>This print job may have expired or been removed.</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(job.status);
  const amountLabel = formatRupees(job.estimatedPrice);
  const rateLabel = formatRatePerPage(job.estimatedPrice, job.estimatedPages);

  const formatDate = (date: Date) => new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={`#${job.jobNumber}`}
        subtitle="Print Job Details"
        showBack
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <LinearGradient
          colors={[`${statusColor}20`, `${statusColor}08`]}
          style={[styles.statusHero, { borderColor: `${statusColor}35` }]}
        >
          <View style={[styles.statusIconWrap, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons name={getStatusIcon(job.status)} size={32} color={statusColor} />
          </View>
          <Text style={styles.statusTitle}>{getStatusLabel(job.status)}</Text>
          <Text style={styles.statusSubtitle}>{getStatusMessage(job.status)}</Text>
          <Badge label={getStatusLabel(job.status)} color={statusColor} />
        </LinearGradient>

        {/* Print code card */}
        <GlassCard variant="glow" gradient>
          <View style={styles.otpRow}>
            <View>
              <Text style={styles.otpLabel}>Print Code</Text>
              <Text style={styles.otpHint}>Show at shop counter</Text>
            </View>
            <View style={styles.otpValueRow}>
              {job.otp.split('').map((d, i) => (
                <LinearGradient
                  key={i}
                  colors={[Colors.primary, Colors.accent]}
                  style={styles.otpDigit}
                >
                  <Text style={styles.otpDigitText}>{d}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
          {job.file.expiresAt && (
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={14} color={Colors.warning} />
              <Text style={styles.expiryText}>
                File {formatTimeLeft(new Date(job.file.expiresAt))}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* File info */}
        <GlassCard>
          <SectionTitle icon="document-text-outline" title="Document" />
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <Ionicons name="document-text" size={24} color={Colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName}>{job.file.name}</Text>
              <Text style={styles.fileMeta}>
                {formatFileSize(job.file.size)} · {job.file.pages} pages
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Print settings */}
        <GlassCard>
          <SectionTitle icon="options-outline" title="Print Settings" />
          <View style={styles.settingsGrid}>
            {[
              { label: 'Color', value: job.settings.color === 'bw' ? 'Black & White' : 'Color', icon: 'contrast-outline' },
              { label: 'Copies', value: `${job.settings.copies}x`, icon: 'copy-outline' },
              { label: 'Paper', value: job.settings.paperSize, icon: 'document-outline' },
              { label: 'Range', value: job.settings.pageRange, icon: 'list-outline' },
              { label: 'Orientation', value: job.settings.orientation === 'portrait' ? 'Portrait' : 'Landscape', icon: 'phone-portrait-outline' },
              { label: 'Sides', value: job.settings.sides === 'single' ? 'Single' : 'Double', icon: 'layers-outline' },
            ].map(item => (
              <View key={item.label} style={styles.settingItem}>
                <Ionicons name={item.icon as any} size={14} color={Colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.totalPagesRow}>
            <Text style={styles.totalPagesLabel}>Total Pages to Print</Text>
            <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.totalPagesBadge}>
              <Text style={styles.totalPagesValue}>{job.estimatedPages} pages</Text>
            </LinearGradient>
          </View>
          <View style={styles.paymentSummary}>
            <View>
              <Text style={styles.paymentLabel}>Rate</Text>
              <Text style={styles.paymentValue}>{rateLabel}</Text>
            </View>
            <View style={styles.paymentAmountBox}>
              <Text style={styles.paymentAmountLabel}>Amount to Pay</Text>
              <Text style={styles.paymentAmount}>{amountLabel}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Shop info */}
        <GlassCard>
          <SectionTitle icon="storefront-outline" title="Shop Details" />
          <View style={styles.shopRow}>
            <View style={styles.shopIcon}>
              <Ionicons name="storefront" size={22} color={Colors.primaryLight} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.shopName}>{job.shopName}</Text>
              {job.shopAddress && (
                <View style={styles.shopAddrRow}>
                  <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.shopAddr}>{job.shopAddress}</Text>
                </View>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Status timeline */}
        <GlassCard>
          <SectionTitle icon="git-branch-outline" title="Status Timeline" />
          <View style={styles.timeline}>
            {job.statusHistory.map((event, idx) => {
              const isLast = idx === job.statusHistory.length - 1;
              const evColor = getStatusColor(event.status);
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: evColor, ...(isLast ? Shadow.glow : {}) }]}>
                      <Ionicons name={getStatusIcon(event.status)} size={10} color="#fff" />
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: `${evColor}40` }]} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[styles.timelineStatus, { color: evColor }]}>
                      {getStatusLabel(event.status)}
                    </Text>
                    <Text style={styles.timelineMsg}>{event.message}</Text>
                    <Text style={styles.timelineTime}>{formatDate(event.timestamp)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Timestamps */}
        <GlassCard>
          <SectionTitle icon="calendar-outline" title="Timestamps" />
          <View style={styles.timestampList}>
            <TimestampRow label="Created" value={formatDate(job.createdAt)} />
            <TimestampRow label="Last Updated" value={formatDate(job.updatedAt)} />
            {job.file.expiresAt && (
              <TimestampRow label="File Expires" value={formatDate(new Date(job.file.expiresAt))} warning />
            )}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={secStyles.row}>
      <Ionicons name={icon as any} size={15} color={Colors.primaryLight} />
      <Text style={secStyles.text}>{title}</Text>
    </View>
  );
}

function TimestampRow({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <View style={tsStyles.row}>
      <Text style={tsStyles.label}>{label}</Text>
      <Text style={[tsStyles.value, warning && { color: Colors.warning }]}>{value}</Text>
    </View>
  );
}

function getStatusIcon(status: string): any {
  return status === 'pending' ? 'time-outline' : 'checkmark-circle';
}

function getStatusMessage(status: string): string {
  const map: Record<string, string> = {
    pending: 'Waiting for print code verification at the shop',
    processing: 'Print code verified, preparing your document',
    printing: 'Your document is being printed right now',
    completed: 'Print job completed successfully',
    failed: 'Print job failed — contact the shop',
    expired: 'Job expired — file has been deleted',
  };
  return map[status] ?? '';
}

function formatRupees(amount?: number) {
  return typeof amount === 'number' ? `Rs ${amount.toFixed(0)}` : 'Rs --';
}

function formatRatePerPage(amount: number | undefined, pages: number) {
  if (typeof amount !== 'number' || pages <= 0) return 'Rs --/page';
  return `Rs ${(amount / pages).toFixed(0)}/page`;
}

const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  text: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, includeFontPadding: false },
});

const tsStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  label: { fontSize: FontSize.sm, color: Colors.textMuted, includeFontPadding: false },
  value: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, includeFontPadding: false },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.md, gap: Spacing.md },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  errorTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  errorText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
  statusHero: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, borderWidth: 1 },
  statusIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  statusSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, includeFontPadding: false },
  otpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  otpLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  otpHint: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false, marginTop: 2 },
  otpValueRow: { flexDirection: 'row', gap: 6 },
  otpDigit: { width: 44, height: 52, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', ...Shadow.glow },
  otpDigitText: { fontSize: 24, fontWeight: FontWeight.extrabold, color: '#fff', includeFontPadding: false },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  expiryText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '600', includeFontPadding: false },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIcon: { width: 48, height: 48, borderRadius: Radius.sm, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false },
  fileMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, includeFontPadding: false, marginTop: 2 },
  settingsGrid: { gap: 10, marginBottom: Spacing.md },
  settingItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false, textTransform: 'uppercase', letterSpacing: 0.3 },
  settingValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false },
  totalPagesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  totalPagesLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, includeFontPadding: false },
  totalPagesBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  totalPagesValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
  paymentSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  paymentLabel: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false, textTransform: 'uppercase', letterSpacing: 0.3 },
  paymentValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false, marginTop: 2 },
  paymentAmountBox: { alignItems: 'flex-end' },
  paymentAmountLabel: { fontSize: FontSize.xs, color: Colors.textMuted, includeFontPadding: false, textTransform: 'uppercase', letterSpacing: 0.3 },
  paymentAmount: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.success, includeFontPadding: false, marginTop: 2 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopIcon: { width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, includeFontPadding: false },
  shopAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopAddr: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1, includeFontPadding: false },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineRight: { flex: 1, paddingBottom: 16, gap: 2 },
  timelineStatus: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, includeFontPadding: false },
  timelineMsg: { fontSize: FontSize.xs, color: Colors.textSecondary, includeFontPadding: false },
  timelineTime: { fontSize: 10, color: Colors.textMuted, includeFontPadding: false },
  timestampList: { gap: 0 },
});
