import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { usePrint } from '@/hooks/usePrint';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

export default function OTPSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { jobHistory, resetFlow } = usePrint();

  const job = jobHistory.find(j => j.id === jobId);

  // Animations
  const checkScale = useSharedValue(0);
  const otpScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    checkScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 100 }));
    otpScale.value = withDelay(600, withSpring(1, { damping: 10 }));
    cardOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    cardTranslateY.value = withDelay(800, withTiming(0, { duration: 400 }));
  }, [cardOpacity, cardTranslateY, checkScale, otpScale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const otpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: otpScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const handleShare = async () => {
    if (!job) return;
    const amountLabel = formatRupees(job.estimatedPrice);
    const rateLabel = formatRatePerPage(job.estimatedPrice, job.estimatedPages);

    try {
      await Share.share({
        message: `PrintSecure OTP\n\nShop: ${job.shopName}\nJob: #${job.jobNumber}\nOTP: ${job.otp}\nAmount: ${amountLabel}\nRate: ${rateLabel}\n\nShow this OTP at the shop counter to start printing.\nFile expires in 24 hours.`,
        title: 'PrintSecure - Print Job OTP',
      });
    } catch {}
  };

  const handleNewJob = () => {
    resetFlow();
    router.replace('/(tabs)/print');
  };

  const handleTrack = () => {
    router.replace({ pathname: '/job-details', params: { jobId: job?.id } });
  };

  if (!job) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Job not found</Text>
          <GradientButton title="Go Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    );
  }

  const amountLabel = formatRupees(job.estimatedPrice);
  const rateLabel = formatRatePerPage(job.estimatedPrice, job.estimatedPages);

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Success hero */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['rgba(34,197,94,0.15)', 'transparent']}
          style={styles.heroBg}
        />

        {/* Success icon */}
        <Animated.View style={[styles.successCircle, checkStyle]}>
          <LinearGradient
            colors={[Colors.success, '#16a34a']}
            style={styles.successCircleGradient}
          >
            <Ionicons name="checkmark" size={56} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.successTitle}>Upload Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your document has been securely uploaded. Show the OTP below at the shop counter.
        </Text>
      </View>

      {/* OTP Display */}
      <Animated.View style={otpStyle}>
        <LinearGradient
          colors={['rgba(99,102,241,0.2)', 'rgba(168,85,247,0.12)']}
          style={styles.otpCard}
        >
          <View style={styles.otpHeader}>
            <Ionicons name="key" size={20} color={Colors.primaryLight} />
            <Text style={styles.otpHeaderTitle}>Your Secure OTP</Text>
            <View style={styles.otpExpiry}>
              <Ionicons name="time-outline" size={12} color={Colors.warning} />
              <Text style={styles.otpExpiryText}>Valid 24h</Text>
            </View>
          </View>

          {/* Big OTP digits */}
          <View style={styles.otpDigits}>
            {job.otp.split('').map((digit, idx) => (
              <Animated.View key={idx} style={styles.otpDigitBox}>
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={styles.otpDigitGradient}
                >
                  <Text style={styles.otpDigitText}>{digit}</Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>

          <Text style={styles.otpInstruction}>
            Tell the shop attendant your OTP to authorize printing
          </Text>

          {/* Share button */}
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-social" size={16} color={Colors.primaryLight} />
            <Text style={styles.shareBtnText}>Share OTP Details</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>

      {/* Job details */}
      <Animated.View style={cardStyle}>
        <GlassCard gradient>
          <Text style={styles.detailsTitle}>Job Details</Text>
          <View style={styles.detailsList}>
            {[
              { icon: 'receipt', label: 'Job Number', value: `#${job.jobNumber}` },
              { icon: 'storefront', label: 'Shop', value: job.shopName },
              { icon: 'document-text', label: 'File', value: job.file.name },
              { icon: 'contrast', label: 'Color', value: job.settings.color === 'bw' ? 'Black & White' : 'Color' },
              { icon: 'copy', label: 'Copies', value: `${job.settings.copies}x` },
              { icon: 'layers', label: 'Sides', value: job.settings.sides === 'single' ? 'Single' : 'Double' },
              { icon: 'resize', label: 'Paper', value: job.settings.paperSize },
              { icon: 'time', label: 'Expires', value: '24 hours' },
            ].map(item => (
              <View key={item.label} style={styles.detailRow}>
                <Ionicons name={item.icon as any} size={14} color={Colors.textMuted} />
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.value}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentIcon}>
              <Ionicons name="cash-outline" size={20} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Payment Summary</Text>
              <Text style={styles.paymentHint}>Pay this amount to the shop owner</Text>
            </View>
            <Text style={styles.paymentAmount}>{amountLabel}</Text>
          </View>
          <View style={styles.paymentRows}>
            <PaymentRow label="Rate" value={rateLabel} />
            <PaymentRow label="Pages" value={`${job.estimatedPages} pages`} />
            <PaymentRow label="Copies" value={`${job.settings.copies}x`} />
          </View>
        </GlassCard>

        {/* Security notice */}
        <GlassCard style={styles.securityNotice}>
          <View style={styles.securityRow}>
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>Secure Print Mode</Text>
              <Text style={styles.securityText}>
                The shop can only preview your document. Files cannot be downloaded and are auto-deleted after 24 hours.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Action buttons */}
        <View style={styles.actions}>
          <GradientButton
            title="Track Print Status"
            onPress={handleTrack}
            size="lg"
            icon={<Ionicons name="pulse" size={18} color="#fff" />}
          />
          <GradientButton
            title="New Print Job"
            onPress={handleNewJob}
            variant="secondary"
            size="md"
            icon={<Ionicons name="add" size={18} color={Colors.primaryLight} />}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function formatRupees(amount?: number) {
  return typeof amount === 'number' ? `Rs ${amount.toFixed(0)}` : 'Rs --';
}

function formatRatePerPage(amount: number | undefined, pages: number) {
  if (typeof amount !== 'number' || pages <= 0) return 'Rs --/page';
  return `Rs ${(amount / pages).toFixed(0)}/page`;
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.paymentRow}>
      <Text style={styles.paymentRowLabel}>{label}</Text>
      <Text style={styles.paymentRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: -Spacing.md,
    right: -Spacing.md,
    height: '100%',
    borderRadius: Radius.xl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    ...Shadow.success,
  },
  successCircleGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  successSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    includeFontPadding: false,
    paddingHorizontal: Spacing.md,
  },
  otpCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.3)',
    gap: Spacing.md,
    alignItems: 'center',
    ...Shadow.glow,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  otpHeaderTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
    includeFontPadding: false,
  },
  otpExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  otpExpiryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
    includeFontPadding: false,
  },
  otpDigits: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  otpDigitBox: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.glow,
  },
  otpDigitGradient: {
    width: 64,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitText: {
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    includeFontPadding: false,
    letterSpacing: 2,
  },
  otpInstruction: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  shareBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
    includeFontPadding: false,
  },
  detailsTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: Spacing.sm,
  },
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
    includeFontPadding: false,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    flex: 1,
    textAlign: 'right',
  },
  paymentCard: {
    borderColor: 'rgba(34,197,94,0.22)',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  paymentHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.success,
    includeFontPadding: false,
  },
  paymentRows: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentRowLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  paymentRowValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  securityNotice: {
    borderColor: 'rgba(34,197,94,0.2)',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  securityIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    marginBottom: 4,
  },
  securityText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    includeFontPadding: false,
  },
  actions: {
    gap: Spacing.sm,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
});
