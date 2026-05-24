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
        {['Shop', 'Upload', 'Settings', 'Print Code'].map((step, idx) => (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, idx <= 1 && styles.stepDotDone, idx === 1 && styles.stepDotActive]}>
                {idx < 1 ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : idx === 1 ? (
                  <Ionicons name="cloud-upload" size={12} color="#fff" />
                ) : (
                  <Text style={styles.stepDotNum}>{idx + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, idx <= 1 && styles.stepLabelDone, idx === 1 && styles.stepLabelActive]}>
                {step}
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
                      <Ionicons name="cloud-upload" size={32} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.dropTitle}>Drop your file here</Text>
                    <Text style={styles.dropSubtitle}>or tap to browse files</Text>

                    <View style={styles.formatsList}>
                      {ACCEPTED_FORMATS.map(fmt => (
                        <View key={fmt} style={styles.formatBadge}>
                          <Text style={styles.formatText}>{fmt}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.maxSize}>Maximum {MAX_FILES} files. Each file up to {MAX_SIZE_MB}MB</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {/* Tips */}
            <GlassCard style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="information-circle" size={18} color={Colors.info} />
                <Text style={styles.tipsTitle}>Upload Tips</Text>
              </View>
              {[
                'PDF, JPG, PNG, WEBP, and HEIC files are supported',
                'Use clear images for ID cards, forms, notes, and photocopies',
                'Files are automatically deleted after 24 hours',
                `Add up to ${MAX_FILES} files in one print job`,
                'Shop owner can download or print only after print code verification',
              ].map((tip, idx) => (
                <View key={idx} style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </GlassCard>
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
    paddingVertical: 12,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotDone: {
    backgroundColor: 'rgba(99,102,241,0.3)',
    borderColor: Colors.primary,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.glow,
  },
  stepDotNum: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '500',
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
    height: 1,
    flex: 0.8,
    backgroundColor: Colors.border,
    marginTop: -10,
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
    borderColor: 'rgba(99,102,241,0.3)',
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dropZoneActive: {
    borderColor: Colors.primary,
  },
  dropContent: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  dropIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  dropTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  dropSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  formatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
  },
  formatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryLight,
    includeFontPadding: false,
  },
  maxSize: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
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
    gap: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  tipsTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.info,
    marginTop: 6,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
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
