import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PrintJobCard } from '@/components/feature/PrintJobCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { usePrint } from '@/hooks/usePrint';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'printopay:home-theme';

const homeThemes = {
  dark: {
    bg: Colors.bg,
    bgCard: Colors.bgCard,
    border: Colors.border,
    borderFocus: Colors.borderFocus,
    textPrimary: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    textMuted: Colors.textMuted,
    heroGradient: ['rgba(99,102,241,0.2)', 'rgba(168,85,247,0.1)'] as [string, string],
    cardGradient: ['rgba(99,102,241,0.1)', 'rgba(168,85,247,0.04)'] as [string, string],
    softPrimary: 'rgba(99,102,241,0.08)',
    softWarning: 'rgba(245,158,11,0.15)',
    softSuccess: 'rgba(34,197,94,0.15)',
    softAccent: 'rgba(99,102,241,0.15)',
  },
  light: {
    bg: '#f8fafc',
    bgCard: '#ffffff',
    border: 'rgba(15,23,42,0.1)',
    borderFocus: 'rgba(99,102,241,0.28)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    heroGradient: ['rgba(99,102,241,0.14)', 'rgba(34,197,94,0.08)'] as [string, string],
    cardGradient: ['rgba(255,255,255,1)', 'rgba(238,242,255,0.9)'] as [string, string],
    softPrimary: 'rgba(99,102,241,0.08)',
    softWarning: 'rgba(245,158,11,0.14)',
    softSuccess: 'rgba(34,197,94,0.14)',
    softAccent: 'rgba(99,102,241,0.12)',
  },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jobHistory } = usePrint();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = homeThemes[themeMode];
  const darkMode = themeMode === 'dark';

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (!mounted || (stored !== 'light' && stored !== 'dark')) return;
        setThemeMode(stored);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = (enabled: boolean) => {
    const nextTheme = enabled ? 'dark' : 'light';
    setThemeMode(nextTheme);
    AsyncStorage.setItem(THEME_KEY, nextTheme).catch(() => undefined);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const recentJobs = jobHistory.slice(0, 3);
  const pendingCount = jobHistory.filter(j => j.status === 'pending' || j.status === 'printing').length;
  const completedCount = jobHistory.filter(j => j.status === 'completed').length;

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning 👋</Text>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>PrintoPay</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.themeToggle, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.themeToggleText, { color: theme.textSecondary }]}>
              {darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            </Text>
            <Switch
              value={darkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <Pressable
            onPress={() => router.push('/scan')}
            style={styles.scanBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              style={styles.scanBtnGradient}
            >
              <Ionicons name="qr-code" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Hero CTA */}
      <LinearGradient
        colors={theme.heroGradient}
        style={[styles.heroBanner, { borderColor: theme.borderFocus }]}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroLeft}>
            <Badge label="SECURE" color={Colors.success} size="sm" />
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Ready to print?</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Scan QR code at the shop or pick a nearby print center</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.primary} style={{ opacity: 0.8 }} />
          </View>
        </View>
        <View style={styles.heroActions}>
          <Pressable
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [styles.heroPrimaryBtn, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroPrimaryBtnGradient}
            >
              <Ionicons name="qr-code-outline" size={16} color="#fff" />
              <Text style={styles.heroPrimaryBtnText}>Scan QR</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/print')}
            style={({ pressed }) => [
              styles.heroSecondaryBtn,
              { backgroundColor: theme.softPrimary, borderColor: theme.borderFocus },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="search-outline" size={16} color={Colors.primaryLight} />
            <Text style={styles.heroSecondaryBtnText}>Find Shop</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <GlassCard style={StyleSheet.flatten([styles.statCard, themedCard(theme)])} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: theme.softWarning }]}>
            <Ionicons name="time-outline" size={18} color={Colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>In Progress</Text>
        </GlassCard>
        <GlassCard style={StyleSheet.flatten([styles.statCard, themedCard(theme)])} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: theme.softSuccess }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Completed</Text>
        </GlassCard>
        <GlassCard style={StyleSheet.flatten([styles.statCard, themedCard(theme)])} padding={14}>
          <View style={[styles.statIconWrap, { backgroundColor: theme.softAccent }]}>
            <Ionicons name="document-text-outline" size={18} color={Colors.primaryLight} />
          </View>
          <Text style={[styles.statValue, { color: theme.textPrimary }]}>{jobHistory.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Print</Text>
        </GlassCard>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>How it works</Text>
        <View style={styles.stepsGrid}>
          {[
            { step: '1', icon: 'qr-code-outline', title: 'Scan QR', desc: 'Scan shop QR code', color: Colors.primary },
            { step: '2', icon: 'cloud-upload-outline', title: 'Upload', desc: 'Upload your document', color: Colors.accent },
            { step: '3', icon: 'options-outline', title: 'Configure', desc: 'Set print settings', color: Colors.warning },
            { step: '4', icon: 'key-outline', title: 'Get Code', desc: 'Share print code at shop', color: Colors.success },
          ].map((item) => (
            <GlassCard key={item.step} style={StyleSheet.flatten([styles.stepCard, themedCard(theme)])} padding={12}>
              <LinearGradient
                colors={[`${item.color}22`, `${item.color}08`]}
                style={styles.stepIconWrap}
              >
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </LinearGradient>
              <Text style={[styles.stepNum, { color: theme.textMuted }]}>Step {item.step}</Text>
              <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
            </GlassCard>
          ))}
        </View>
      </View>

      {/* Security features */}
      <LinearGradient
        colors={theme.cardGradient}
        style={[styles.securityCard, styles.themedGradientCard, { borderColor: theme.border }]}
      >
        <View style={styles.securityHeader}>
          <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
          <Text style={[styles.securityTitle, { color: theme.textPrimary }]}>Enterprise Security</Text>
        </View>
        <View style={styles.securityList}>
          {[
            'Files expire automatically after 24 hours',
            'Shop owner cannot download your file',
            'Print code required for every print job',
            'Secure signed URLs only',
            'All actions logged & audited',
          ].map((feat, idx) => (
            <View key={idx} style={styles.securityItem}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={[styles.securityText, { color: theme.textSecondary }]}>{feat}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Recent jobs */}
      {recentJobs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Jobs</Text>
            <Pressable onPress={() => router.push('/(tabs)/jobs')}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <View style={styles.jobsList}>
              {recentJobs.map(job => (
                <PrintJobCard key={job.id} job={job} />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function themedCard(theme: (typeof homeThemes)[ThemeMode]) {
  return {
    backgroundColor: theme.bgCard,
    borderColor: theme.border,
  };
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  headerTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    letterSpacing: -0.5,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  themeToggle: {
    minHeight: 36,
    maxWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  themeToggleText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    includeFontPadding: false,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
  },
  scanBtn: {},
  scanBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  heroBanner: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    gap: Spacing.md,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
  },
  heroIconWrap: {
    width: 80,
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroPrimaryBtn: {
    flex: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  heroPrimaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroPrimaryBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: '#fff',
    includeFontPadding: false,
  },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  heroSecondaryBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    includeFontPadding: false,
    textAlign: 'center',
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stepCard: {
    width: '47.5%',
    gap: 4,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNum: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  stepDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
    lineHeight: 16,
  },
  securityCard: {
    gap: Spacing.md,
  },
  themedGradientCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 20,
    ...Shadow.card,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  securityList: {
    gap: 8,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    includeFontPadding: false,
    flex: 1,
  },
  jobsList: {
    gap: Spacing.sm,
  },
});
