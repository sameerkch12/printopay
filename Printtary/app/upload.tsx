import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FileCard } from '@/components/feature/FileCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { usePrint } from '@/hooks/usePrint';
import { fetchShopDetails } from '@/services/printService';
import { UploadedFile } from '@/types';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { useAlert } from '@/template';
import { APP_CONFIG } from '@/constants/config';

const ACCEPTED_FORMATS = ['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP', 'HEIC'];
const FORMAT_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  PDF: { icon: 'document-text-outline', color: '#ef4444' },
  JPG: { icon: 'image-outline', color: '#10b981' },
  JPEG: { icon: 'document-outline', color: '#3b82f6' },
  PNG: { icon: 'document-outline', color: '#f59e0b' },
  WEBP: { icon: 'image-outline', color: '#a855f7' },
  HEIC: { icon: 'phone-portrait-outline', color: '#14b8a6' },
};
const UPLOAD_STEPS = [
  { label: 'Shop', icon: 'cart-outline' },
  { label: 'Upload', icon: 'cloud-upload' },
  { label: 'Settings', icon: undefined },
  { label: 'Print Code', icon: undefined },
] as const;
const UPLOAD_TIPS = [
  { icon: 'checkmark-circle-outline', color: Colors.success, text: 'PDF, JPG, PNG, WEBP, and HEIC files are supported' },
  { icon: 'camera-outline', color: Colors.info, text: 'Use clear images for ID cards, forms, notes, and photocopies' },
  { icon: 'time-outline', color: Colors.accent, text: 'Files are automatically deleted after 24 hours' },
  { icon: 'layers-outline', color: Colors.warning, text: 'Add up to 10 files in one print job' },
  { icon: 'lock-closed-outline', color: Colors.error, text: 'Shop owner can download or print only after print code verification' },
] as const;
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const MAX_SIZE_MB = APP_CONFIG.maxFileSizeMB;
const MAX_FILES = 10;

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { shopId } = useLocalSearchParams<{ shopId?: string }>();
  const { setSelectedFile, selectedShop, setSelectedShop, selectedFiles, setSelectedFiles } = usePrint();
  const { showAlert } = useAlert();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  React.useEffect(() => {
    let mounted = true;

    async function restoreShopFromUrl() {
      if (!shopId || selectedShop?.id === shopId) return;

      const shop = await fetchShopDetails(shopId);
      if (!mounted) return;

      if (shop) {
        setSelectedShop(shop);
      } else {
        showAlert('Shop Not Found', 'This upload link is invalid or the shop is not active.');
        router.replace('/(tabs)/print');
      }
    }

    restoreShopFromUrl();
    return () => {
      mounted = false;
    };
  }, [router, selectedShop?.id, setSelectedShop, shopId, showAlert]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_MIME_TYPES,
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;
      const assets = result.assets.slice(0, MAX_FILES - selectedFiles.length);

      if (!assets.length) {
        showAlert('Limit Reached', `You can add up to ${MAX_FILES} files in one print job.`);
        return;
      }

      // Check file size
      if (assets.some((asset) => asset.size && asset.size > MAX_SIZE_MB * 1024 * 1024)) {
        showAlert('File Too Large', `Maximum file size is ${MAX_SIZE_MB}MB. Please choose a smaller file.`);
        return;
      }

      // Prepare the local file before the final backend upload step.
      setUploading(true);
      setUploadProgress(0);

      setUploadProgress(100);

      const files: UploadedFile[] = assets.map((asset, index) => ({
        id: `file_${Date.now()}_${index}`,
        name: asset.name,
        size: asset.size ?? 0,
        type: asset.mimeType ?? mimeTypeFromName(asset.name),
        uri: asset.uri,
        pages: 1,
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 3600000),
      }));

      setSelectedFiles([...selectedFiles, ...files].slice(0, MAX_FILES));
      setUploading(false);

    } catch {
      setUploading(false);
      showAlert('Upload Failed', 'Could not load the file. Please try again.');
    }
  };

  const handleContinue = () => {
    if (selectedFiles.length) {
      router.push({ pathname: '/print-settings', params: selectedShop ? { shopId: selectedShop.id } : undefined });
    }
  };

  const handleRemove = (fileId?: string) => {
    if (fileId) {
      const nextFiles = selectedFiles.filter((file) => file.id !== fileId);
      setSelectedFiles(nextFiles);
      setSelectedFile(nextFiles[0] ?? null);
      return;
    }
    setSelectedFiles([]);
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Upload Document"
        subtitle={selectedShop?.name}
        showBack
        onBack={() => router.back()}
      />

      {/* Steps indicator */}
      <View style={styles.stepsBar}>
        {UPLOAD_STEPS.map((step, idx) => (
          <React.Fragment key={step.label}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, idx <= 1 && styles.stepDotDone, idx === 1 && styles.stepDotActive]}>
                {idx < 1 ? (
                  <Ionicons name={step.icon ?? 'checkmark'} size={22} color={Colors.textSecondary} />
                ) : idx === 1 ? (
                  <Ionicons name="cloud-upload" size={18} color="#fff" />
                ) : (
                  <Text style={styles.stepDotNum}>{idx + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, idx <= 1 && styles.stepLabelDone, idx === 1 && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
            {idx < 3 && <View style={[styles.stepLine, idx < 1 && styles.stepLineDone]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {!selectedFiles.length ? (
          /* Upload zone */
          <View style={styles.uploadSection}>
            <Pressable
              onPress={handleFilePick}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
              disabled={uploading}
            >
              <LinearGradient
                colors={['rgba(99,102,241,0.06)', 'rgba(168,85,247,0.03)']}
                style={styles.dropZone}
              >
                {uploading ? (
                  <View style={styles.uploadingState}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                    <View style={{ width: '80%', marginTop: 8 }}>
                      <ProgressBar progress={uploadProgress} label="Processing file" />
                    </View>
                  </View>
                ) : (
                  <View style={styles.dropContent}>
                    <LinearGradient
                      colors={[Colors.primary, Colors.accent]}
                      style={styles.dropIcon}
                    >
                      <Ionicons name="cloud-upload" size={38} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.dropTitle}>Upload your files</Text>
                    <Text style={styles.dropSubtitle}>
                      Click the button below to <Text style={styles.dropSubtitleStrong}>select files</Text>
                    </Text>
                    <Text style={styles.dropHint}>or drag & drop files here</Text>

                    <LinearGradient
                      colors={[Colors.primary, Colors.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.selectFilesButton}
                    >
                      <Ionicons name="folder-open-outline" size={22} color="#fff" />
                      <Text style={styles.selectFilesText}>Select Files</Text>
                    </LinearGradient>

                    <View style={styles.formatsList}>
                      {ACCEPTED_FORMATS.map((fmt) => (
                        <View key={fmt} style={styles.formatBadge}>
                          <Ionicons name={FORMAT_META[fmt].icon} size={18} color={FORMAT_META[fmt].color} />
                          <Text style={styles.formatText}>{fmt}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.uploadLimits}>
                      <View style={styles.uploadLimitItem}>
                        <Ionicons name="documents-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.uploadLimitText}>Maximum {MAX_FILES} files</Text>
                      </View>
                      <View style={styles.uploadLimitDivider} />
                      <View style={styles.uploadLimitItem}>
                        <Ionicons name="document-outline" size={20} color={Colors.textSecondary} />
                        <Text style={styles.uploadLimitText}>Each file up to {MAX_SIZE_MB}MB</Text>
                      </View>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={styles.tipsHeaderIcon}
                >
                  <Ionicons name="bulb-outline" size={22} color="#fff" />
                </LinearGradient>
                <Text style={styles.tipsTitle}>Upload Tips</Text>
              </View>
              {UPLOAD_TIPS.map((tip) => (
                <View key={tip.text} style={styles.tipItem}>
                  <View style={[styles.tipIconWrap, { backgroundColor: `${tip.color}14` }]}>
                    <Ionicons name={tip.icon} size={20} color={tip.color} />
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* File selected state */
          <View style={styles.fileSelectedSection}>
            <View style={styles.successBanner}>
              <LinearGradient
                colors={[Colors.successGlow, 'transparent']}
                style={styles.successBannerGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to print!</Text>
                  <Text style={styles.successSubtitle}>You can add up to {MAX_FILES} files before continuing</Text>
                </View>
              </LinearGradient>
            </View>

            {selectedFiles.map((file) => (
              <FileCard key={file.id} file={file} onRemove={() => handleRemove(file.id)} />
            ))}
            {selectedFiles.length < MAX_FILES ? (
              <Pressable onPress={handleFilePick} disabled={uploading} style={styles.addMoreBtn}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.primaryLight} />
                <Text style={styles.addMoreText}>Add more files ({selectedFiles.length}/{MAX_FILES})</Text>
              </Pressable>
            ) : null}

            {/* File details */}
            <GlassCard gradient>
              <Text style={styles.detailsTitle}>File Details</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Pages</Text>
                  <Text style={styles.detailValue}>{selectedFiles.reduce((total, file) => total + (file.pages ?? 1), 0)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Expires in</Text>
                  <Text style={[styles.detailValue, { color: Colors.warning }]}>24 hours</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Security</Text>
                  <View style={styles.securityBadge}>
                    <Ionicons name="lock-closed" size={10} color={Colors.success} />
                    <Text style={[styles.detailValue, { color: Colors.success, fontSize: 12 }]}>Print Code</Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Shop info */}
            {selectedShop && (
              <GlassCard>
                <View style={styles.shopInfoRow}>
                  <View style={styles.shopInfoIcon}>
                    <Ionicons name="storefront" size={18} color={Colors.primaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shopInfoName}>{selectedShop.name}</Text>
                    <Text style={styles.shopInfoAddr}>{selectedShop.address}</Text>
                  </View>
                  <Badge label="Active" />
                </View>
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {selectedFiles.length > 0 && !uploading && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 8 }]}>
          <GradientButton
            title="Continue to next"
            onPress={handleContinue}
            size="lg"
            icon={<Ionicons name="settings" size={18} color="#fff" />}
          />
        </View>
      )}
    </View>
  );
}

function mimeTypeFromName(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
}

// Inline Badge for this screen
function Badge({ label }: { label: string }) {
  return (
    <View style={inlineBadge.wrap}>
      <View style={inlineBadge.dot} />
      <Text style={inlineBadge.text}>{label}</Text>
    </View>
  );
}

const inlineBadge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  text: { fontSize: 11, fontWeight: '600', color: Colors.success, includeFontPadding: false },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepDot: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotDone: {
    backgroundColor: Colors.bgSurface,
    borderColor: Colors.primary,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.glow,
  },
  stepDotNum: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  stepLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: Colors.primaryLight,
  },
  stepLabelActive: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  stepLine: {
    height: 3,
    flex: 0.7,
    backgroundColor: Colors.border,
    marginTop: -28,
    borderRadius: Radius.full,
  },
  stepLineDone: {
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  uploadSection: {
    gap: Spacing.md,
  },
  dropZone: {
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(99,102,241,0.32)',
    minHeight: 430,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  dropZoneActive: {
    borderColor: Colors.primary,
  },
  dropContent: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  dropIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.glow,
  },
  dropTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    textAlign: 'center',
  },
  dropSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 22,
  },
  dropSubtitleStrong: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  dropHint: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    includeFontPadding: false,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  selectFilesButton: {
    minHeight: 58,
    width: '72%',
    minWidth: 220,
    maxWidth: 360,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
    ...Shadow.glow,
  },
  selectFilesText: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  formatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  formatBadge: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formatText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  maxSize: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  uploadLimits: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  uploadLimitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexShrink: 1,
  },
  uploadLimitDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  uploadLimitText: {
    flexShrink: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    includeFontPadding: false,
  },
  addMoreBtn: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
    backgroundColor: 'rgba(99,102,241,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addMoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
    includeFontPadding: false,
  },
  uploadingState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing.lg,
  },
  uploadingText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: '500',
    includeFontPadding: false,
  },
  tipsCard: {
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.xs,
  },
  tipsHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
    includeFontPadding: false,
  },
  fileSelectedSection: {
    gap: Spacing.md,
  },
  successBanner: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  successBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
  },
  successTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  successSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
    marginTop: 2,
  },
  detailsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailItem: {
    flex: 1,
    minWidth: '40%',
    gap: 2,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfoName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  shopInfoAddr: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    includeFontPadding: false,
    marginTop: 2,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
