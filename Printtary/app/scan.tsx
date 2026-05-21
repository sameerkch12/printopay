import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  // TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { usePrint } from '@/hooks/usePrint';
import { fetchShopDetails } from '@/services/printService';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setSelectedShop } = usePrint();
  const { showAlert } = useAlert();

  // Manual code entry is parked for a future release.
  // const [shopCode, setShopCode] = useState('');
  const [loading, setLoading] = useState(false);
  const activeTab = 'qr';
  const scanTabs = ['qr'] as const;
  // const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  // const scanTabs = ['qr', 'manual'] as const;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const resolveShop = async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setLoading(true);
    try {
      const shop = await fetchShopDetails(trimmedCode);
      if (shop) {
        setSelectedShop(shop);
        router.push({ pathname: '/upload', params: { shopId: shop.id } });
      } else {
        showAlert('Shop Not Found', `No active shop found for this QR/link:\n${trimmedCode}`);
        setScanned(false);
      }
    } catch {
      showAlert('Scan Failed', 'Could not open this shop QR. Please try again.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  /*
  const handleManualEntry = async () => {
    const code = shopCode.trim();
    if (!code) {
      showAlert('Enter Shop Code', 'Please enter a valid shop code or ID');
      return;
    }
    await resolveShop(code);
  };
  */

  const handleQrScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || loading) return;
    setScanned(true);
    await resolveShop(data);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Shop QR</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {scanTabs.map(tab => (
              <Pressable
                key={tab}
                onPress={() => {
                  // setActiveTab(tab);
                }}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
              >
                <Ionicons
                  name="qr-code-outline"
                  // name={tab === 'qr' ? 'qr-code-outline' : 'keypad-outline'}
                  size={16}
                  color={activeTab === tab ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  Scan QR
                  {/* {tab === 'qr' ? 'Scan QR' : 'Enter Code'} */}
                </Text>
              </Pressable>
            ))}
          </View>

          {(
            <View style={styles.qrSection}>
              <GlassCard style={styles.qrCard} gradient>
                <View style={styles.qrFrame}>
                  {permission?.granted ? (
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      onBarcodeScanned={scanned ? undefined : handleQrScanned}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    />
                  ) : (
                    <View style={styles.qrCenter}>
                      <Ionicons name="camera-outline" size={64} color={Colors.textMuted} style={{ opacity: 0.5 }} />
                      <Text style={styles.qrCenterText}>Camera permission required</Text>
                      <GradientButton
                        title="Allow Camera"
                        onPress={requestPermission}
                        variant="secondary"
                        size="sm"
                      />
                    </View>
                  )}
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    style={styles.qrCornerTL}
                  />
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    style={styles.qrCornerTR}
                  />
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    style={styles.qrCornerBL}
                  />
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    style={styles.qrCornerBR}
                  />

                  {loading && (
                    <View style={styles.scanningOverlay}>
                      <Text style={styles.qrCenterText}>Finding shop...</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.qrHint}>
                  Align the QR code within the frame. It will scan automatically.
                </Text>
              </GlassCard>

              {scanned && !loading && (
                <GlassCard style={styles.noticeCard}>
                  <GradientButton
                    title="Scan Again"
                    onPress={() => setScanned(false)}
                    variant="secondary"
                    size="sm"
                  />
                </GlassCard>
              )}
            </View>
          )}

          {/*
            Manual Code Entry is hidden for now.
            Restore TextInput import, shopCode state, handleManualEntry, setActiveTab,
            and scanTabs = ['qr', 'manual'] when this feature is needed.

            <View style={styles.manualSection}>
              <GlassCard gradient>
                <Text style={styles.inputLabel}>Shop Code or ID</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="storefront-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    value={shopCode}
                    onChangeText={setShopCode}
                    placeholder="Paste shop QR code or Mongo shop ID"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleManualEntry}
                  />
                  {shopCode.length > 0 && (
                    <Pressable onPress={() => setShopCode('')}>
                      <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                <Text style={styles.inputHint}>
                  The shop code is usually displayed at the counter or printed on the QR poster.
                </Text>

                <GradientButton
                  title="Find Shop"
                  onPress={handleManualEntry}
                  loading={loading}
                  disabled={!shopCode.trim()}
                  style={{ marginTop: 4 }}
                />
              </GlassCard>
            </View>
          */}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const cornerStyle = {
  position: 'absolute' as const,
  width: 24,
  height: 24,
  borderRadius: 3,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgCard,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 24,
    gap: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
    includeFontPadding: false,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  qrSection: {
    gap: Spacing.md,
  },
  qrCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  qrFrame: {
    width: 220,
    height: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  qrCornerTL: { ...cornerStyle, top: 0, left: 0 },
  qrCornerTR: { ...cornerStyle, top: 0, right: 0 },
  qrCornerBL: { ...cornerStyle, bottom: 0, left: 0 },
  qrCornerBR: { ...cornerStyle, bottom: 0, right: 0 },
  qrCenter: {
    alignItems: 'center',
    gap: 8,
  },
  qrCenterText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
    includeFontPadding: false,
  },
  qrCenterSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    includeFontPadding: false,
  },
  noticeCard: {
    gap: Spacing.md,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  noticeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    includeFontPadding: false,
  },
  manualSection: {
    gap: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    includeFontPadding: false,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  inputHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    includeFontPadding: false,
    marginBottom: Spacing.md,
  },
});
