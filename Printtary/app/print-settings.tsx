import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { usePrint } from '@/hooks/usePrint';
import { calculatePrintPrice, fetchShopDetails, formatFileSize, getShopPrintRate } from '@/services/printService';
import { PrintSettings } from '@/types';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { PRINT_CONFIG } from '@/constants/config';

const FIXED_DEFAULTS = {
  sides: 'single',
  paperSize: 'A4',
} satisfies Pick<PrintSettings, 'sides' | 'paperSize'>;
const DEFAULT_PRINT_SETTINGS = PRINT_CONFIG.defaultSettings as PrintSettings;

function isDefaultPrintSettings(settings: PrintSettings) {
  return (
    settings.color === DEFAULT_PRINT_SETTINGS.color &&
    settings.copies === DEFAULT_PRINT_SETTINGS.copies &&
    settings.pageRange === DEFAULT_PRINT_SETTINGS.pageRange &&
    settings.orientation === DEFAULT_PRINT_SETTINGS.orientation &&
    settings.sides === DEFAULT_PRINT_SETTINGS.sides &&
    settings.paperSize === DEFAULT_PRINT_SETTINGS.paperSize
  );
}

function fileKey(fileId?: string, index = 0) {
  return fileId || `file-${index}`;
}

export default function PrintSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { shopId } = useLocalSearchParams<{ shopId?: string }>();
  const {
    setPrintSettings,
    selectedFile,
    selectedFiles,
    setSelectedFiles,
    isUploading,
    uploadProgress,
    submitPrintJob,
    selectedShop,
    setSelectedShop,
  } = usePrint();

  const [settings] = useState<PrintSettings>({
    ...DEFAULT_PRINT_SETTINGS,
  });
  const [settingsByFileId, setSettingsByFileId] = useState<Record<string, PrintSettings>>({});
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { width } = useWindowDimensions();

  React.useEffect(() => {
    let mounted = true;

    async function restoreShopFromUrl() {
      if (!shopId || selectedShop?.id === shopId) return;
      const shop = await fetchShopDetails(shopId);
      if (mounted && shop) setSelectedShop(shop);
    }

    restoreShopFromUrl();
    return () => {
      mounted = false;
    };
  }, [selectedShop?.id, setSelectedShop, shopId]);

  const filesToPrint = useMemo(
    () => selectedFiles.length ? selectedFiles : selectedFile ? [selectedFile] : [],
    [selectedFile, selectedFiles]
  );
  const activeFile = filesToPrint[activeFileIndex] ?? filesToPrint[0];
  const activeFilePages = activeFile?.pages ?? 1;
  const activeFileKey = fileKey(activeFile?.id, activeFileIndex);
  const activeSettings = settingsByFileId[activeFileKey] ?? settings;
  const documentSettings = filesToPrint.map((file, index) => ({
    fileId: file.id,
    fileName: file.name,
    settings: index === activeFileIndex
      ? activeSettings
      : settingsByFileId[fileKey(file.id, index)] ?? settings,
  }));
  const filePages = filesToPrint.reduce((total, file) => total + (file.pages ?? 1), 0) || 1;
  const selectedPages = documentSettings.reduce((total, item, index) => total + parseRangeCount(item.settings.pageRange, filesToPrint[index]?.pages ?? 1), 0);
  const totalPages = Math.max(1, documentSettings.reduce((total, item, index) => {
    const selectedFilePages = parseRangeCount(item.settings.pageRange, filesToPrint[index]?.pages ?? 1);
    return total + selectedFilePages * item.settings.copies;
  }, 0));
  const finalPrice = documentSettings.reduce((total, item, index) => {
    const selectedFilePages = parseRangeCount(item.settings.pageRange, filesToPrint[index]?.pages ?? 1);
    return total + calculatePrintPrice(selectedShop, item.settings, selectedFilePages * item.settings.copies);
  }, 0);
  const previewSlideWidth = Math.max(240, Math.min(width - Spacing.md * 4, 480));
  const landscape = activeSettings.orientation === 'landscape';
  const blackAndWhitePreview = activeSettings.color === 'bw'
    ? ({ filter: 'grayscale(1) contrast(1.08)' } as Record<string, string>)
    : undefined;
  const generationProgress = isUploading ? uploadProgress : submitting ? 6 : 0;

  React.useEffect(() => {
    if (activeFileIndex >= filesToPrint.length) {
      setActiveFileIndex(Math.max(0, filesToPrint.length - 1));
    }
  }, [activeFileIndex, filesToPrint.length]);

  React.useEffect(() => {
    if (!filesToPrint.length) return;
    setSettingsByFileId((current) => {
      const next = { ...current };
      for (const [index, file] of filesToPrint.entries()) {
        const key = fileKey(file.id, index);
        next[key] ??= { ...DEFAULT_PRINT_SETTINGS };
      }
      return next;
    });
  }, [filesToPrint]);

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettingsByFileId((current) => ({
      ...current,
      [activeFileKey]: {
        ...(current[activeFileKey] ?? settings),
        [key]: value,
      },
    }));
  };

  const adjustCopies = (delta: number) => {
    setSettingsByFileId((current) => ({
      ...current,
      [activeFileKey]: {
        ...(current[activeFileKey] ?? settings),
        copies: Math.max(1, Math.min(PRINT_CONFIG.maxCopies, activeSettings.copies + delta)),
      },
    }));
  };

  const goToFile = (index: number) => {
    const nextIndex = Math.max(0, Math.min(filesToPrint.length - 1, index));
    setActiveFileIndex(nextIndex);
  };

  const handleRemoveActiveFile = () => {
    if (filesToPrint.length <= 1) {
      router.back();
      return;
    }

    const activeId = activeFile?.id;
    const nextFiles = activeId
      ? filesToPrint.filter((file) => file.id !== activeId)
      : filesToPrint.filter((_, index) => index !== activeFileIndex);
    setSelectedFiles(nextFiles);
    requestAnimationFrame(() => goToFile(Math.min(activeFileIndex, nextFiles.length - 1)));
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!filesToPrint.length || !selectedShop) {
      setSubmitError('Please select a shop and file before generating print code.');
      return;
    }
    setSubmitting(true);
    const payload: PrintSettings = {
      ...documentSettings[0]?.settings,
      ...FIXED_DEFAULTS,
    };
  const finalDocumentSettings = documentSettings.map((item) => ({
      ...item,
      pages: filesToPrint.find((file) => file.id === item.fileId)?.pages ?? 1,
      settings: {
        ...item.settings,
        ...FIXED_DEFAULTS,
      },
    })).map((item) => ({
      ...item,
      chargeablePages: parseRangeCount(item.settings.pageRange, item.pages ?? 1) * item.settings.copies,
      estimatedPrice: calculatePrintPrice(
        selectedShop,
        item.settings,
        parseRangeCount(item.settings.pageRange, item.pages ?? 1) * item.settings.copies
      ),
    }));
    const usedDefaultSettings = finalDocumentSettings.every((item) => isDefaultPrintSettings(item.settings));
    setPrintSettings(payload);
    try {
      const job = await submitPrintJob(filesToPrint, payload, selectedShop.id, usedDefaultSettings, finalDocumentSettings);
      router.replace({ pathname: '/otp-success', params: { jobId: job.id } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not generate print code. Please try again.');
      setSubmitting(false);
    }
  };

  if (!filesToPrint.length || !selectedShop) {
    return (
      <View style={styles.emptyScreen}>
        <Ionicons name="alert-circle-outline" size={42} color={Colors.warning} />
        <Text style={styles.emptyTitle}>Print details missing</Text>
        <Text style={styles.emptyText}>Please select a shop and upload your document again.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/print')}>
          <Text style={styles.primaryButtonText}>Start Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScreenHeader title="Print Settings" subtitle={selectedShop.name} showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.addFilesBtn} onPress={() => router.back()}>
            <Ionicons name="document-attach-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.addFilesText}>Add files</Text>
          </Pressable>
        </View>

        <View style={styles.previewShell}>
          <Pressable style={styles.removeBtn} onPress={handleRemoveActiveFile}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.previewTitleRow}>
            <View style={styles.fileCounter}>
              <Ionicons name="documents-outline" size={15} color={Colors.primaryLight} />
              <Text style={styles.fileCounterText}>File {activeFileIndex + 1}/{filesToPrint.length}</Text>
            </View>
            <Text style={styles.previewFileName} numberOfLines={1}>{activeFile?.name ?? 'Document'}</Text>
          </View>

          <View style={[styles.previewCarousel, { width: previewSlideWidth }]}>
            {filesToPrint.length > 1 ? (
              <>
                <Pressable
                  onPress={() => goToFile(activeFileIndex - 1)}
                  disabled={activeFileIndex === 0}
                  style={[styles.navBtn, styles.navBtnLeft, activeFileIndex === 0 && styles.navBtnDisabled]}
                >
                  <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
                </Pressable>
                <Pressable
                  onPress={() => goToFile(activeFileIndex + 1)}
                  disabled={activeFileIndex === filesToPrint.length - 1}
                  style={[styles.navBtn, styles.navBtnRight, activeFileIndex === filesToPrint.length - 1 && styles.navBtnDisabled]}
                >
                  <Ionicons name="chevron-forward" size={22} color={Colors.textPrimary} />
                </Pressable>
              </>
            ) : null}
            <View style={[styles.previewSlide, { width: previewSlideWidth }]}>
              <View style={[
                styles.pagePreview,
                landscape ? styles.pageLandscape : styles.pagePortrait,
              ]}>
                {activeFile?.type.startsWith('image/') ? (
                  <Image
                    key={activeFile.id}
                    source={{ uri: activeFile.uri }}
                    style={[
                      styles.previewImage,
                      landscape && styles.previewImageLandscape,
                      blackAndWhitePreview,
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[
                    styles.pdfPreview,
                    landscape && styles.pdfPreviewLandscape,
                    activeSettings.color === 'bw' && styles.pdfPreviewBw,
                  ]}>
                    <Ionicons name="document-text" size={52} color="#ef4444" />
                    <Text style={styles.pdfName} numberOfLines={2}>{activeFile?.name ?? 'Document'}</Text>
                    <Text style={styles.pdfMeta}>
                      {formatFileSize(activeFile?.size ?? 0)} - {activeFilePages} page{activeFilePages !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {filesToPrint.length > 1 ? (
            <View style={styles.previewDots}>
              {filesToPrint.map((file, index) => (
                <Pressable
                  key={file.id}
                  onPress={() => goToFile(index)}
                  style={[styles.previewDot, index === activeFileIndex && styles.previewDotActive]}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.activeFileMeta}>
            <Text style={styles.activeFileMetaText}>
              {formatFileSize(activeFile?.size ?? 0)} - {activeFilePages} page{activeFilePages !== 1 ? 's' : ''}
            </Text>
            {filesToPrint.length > 1 ? (
            <View style={styles.nextHint}>
                <Text style={styles.nextHintText}>Tap Next</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.previewMeta}>
            <MetaPill icon="copy-outline" text={`${activeSettings.copies} copy`} />
            <MetaPill icon="document-outline" text={`${selectedPages}/${filePages} pages`} />
            <MetaPill icon={landscape ? 'phone-landscape-outline' : 'phone-portrait-outline'} text={landscape ? 'Landscape' : 'Portrait'} />
            <MetaPill icon={activeSettings.color === 'color' ? 'color-palette-outline' : 'contrast-outline'} text={activeSettings.color === 'color' ? 'Color' : 'B & W'} />
          </View>
        </View>

        <View style={styles.copiesCard}>
          <View>
            <Text style={styles.cardTitle}>Number of copies</Text>
            <Text style={styles.cardSub}>File {activeFileIndex + 1} ({activeFilePages} page{activeFilePages !== 1 ? 's' : ''})</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable onPress={() => adjustCopies(-1)} disabled={activeSettings.copies <= 1} style={styles.stepperBtn}>
              <Text style={[styles.stepperText, activeSettings.copies <= 1 && styles.disabledText]}>-</Text>
            </Pressable>
            <Text style={styles.copyCount}>{activeSettings.copies}</Text>
            <Pressable onPress={() => adjustCopies(1)} disabled={activeSettings.copies >= PRINT_CONFIG.maxCopies} style={styles.stepperBtn}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.optionsCard}>
          <Text style={styles.sectionTitle}>Page range</Text>
          <View style={styles.rangeRow}>
            <Pressable
              onPress={() => updateSetting('pageRange', 'All')}
              style={[styles.rangeChip, activeSettings.pageRange === 'All' && styles.rangeChipActive]}
            >
              <Text style={[styles.rangeChipText, activeSettings.pageRange === 'All' && styles.activeText]}>All pages</Text>
            </Pressable>
            <View style={[styles.rangeInputWrap, activeSettings.pageRange !== 'All' && styles.rangeInputActive]}>
              <TextInput
                value={activeSettings.pageRange === 'All' ? '' : activeSettings.pageRange}
                onChangeText={(value) => updateSetting('pageRange', value.trim() ? value : 'All')}
                placeholder="e.g. 1-5, 8"
                placeholderTextColor={Colors.textMuted}
                style={styles.rangeInput}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Choose print color</Text>
          <View style={styles.optionGrid}>
            <ChoiceCard
              title="Coloured"
              subtitle={`Rs ${getShopPrintRate(selectedShop, 'color')}/page`}
              icon="color-palette"
              selected={activeSettings.color === 'color'}
              onPress={() => updateSetting('color', 'color')}
              color="#f59e0b"
            />
            <ChoiceCard
              title="B & W"
              subtitle={`Rs ${getShopPrintRate(selectedShop, 'bw')}/page`}
              icon="contrast"
              selected={activeSettings.color === 'bw'}
              onPress={() => updateSetting('color', 'bw')}
              color={Colors.primaryLight}
            />
          </View>

          <Text style={styles.sectionTitle}>Choose print orientation</Text>
          <View style={styles.optionGrid}>
            <ChoiceCard
              title="Portrait"
              subtitle="8.3 x 11.7 in"
              icon="phone-portrait"
              selected={activeSettings.orientation === 'portrait'}
              onPress={() => updateSetting('orientation', 'portrait')}
              color={Colors.info}
            />
            <ChoiceCard
              title="Landscape"
              subtitle="11.7 x 8.3 in"
              icon="phone-landscape"
              selected={activeSettings.orientation === 'landscape'}
              onPress={() => updateSetting('orientation', 'landscape')}
              color={Colors.info}
            />
          </View>
        </View>

        {isUploading ? (
          <View style={styles.uploadingCard}>
            <ActivityIndicator color={Colors.primaryLight} />
            <Text style={styles.uploadingText}>Uploading secure print job... {uploadProgress}%</Text>
          </View>
        ) : null}

        {submitError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.totalLabel}>Total {totalPages} page{totalPages !== 1 ? 's' : ''}</Text>
          <Text style={styles.totalPrice}>Rs {finalPrice.toFixed(0)}</Text>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || isUploading}
          style={({ pressed }) => [
            styles.generateBtn,
            (pressed || submitting || isUploading) && { opacity: 0.82 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateText}>Generate Print Code</Text>
          )}
        </Pressable>
      </View>

      {(submitting || isUploading) ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingPanel}>
            <View style={styles.loadingIconWrap}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
            <Text style={styles.loadingTitle}>Generating print code</Text>
            <Text style={styles.loadingBody}>
              File upload ho rahi hai. Please wait, screen band mat kijiye.
            </Text>
            <View style={styles.loadingProgress}>
              <ProgressBar
                progress={generationProgress}
                height={10}
                label="Uploading secure file"
              />
            </View>
            <Text style={styles.loadingPercent}>{Math.round(generationProgress)}%</Text>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function MetaPill({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={13} color={Colors.primaryLight} />
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

function ChoiceCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  color,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choiceCard, selected && styles.choiceCardSelected]}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.choiceTextWrap}>
        <Text style={[styles.choiceTitle, selected && styles.activeText]}>{title}</Text>
        <Text style={styles.choiceSub}>{subtitle}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={16} color={Colors.success} /> : null}
    </Pressable>
  );
}

function parseRangeCount(range: string, total: number): number {
  if (!range || range === 'All') return total;
  let count = 0;
  range.split(',').forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.includes('-')) {
      const [from, to] = trimmed.split('-').map((value) => parseInt(value.trim(), 10));
      if (Number.isFinite(from) && Number.isFinite(to)) {
        const start = Math.max(1, Math.min(from, to));
        const end = Math.min(total, Math.max(from, to));
        count += Math.max(0, end - start + 1);
      }
      return;
    }

    const page = parseInt(trimmed, 10);
    if (Number.isFinite(page) && page >= 1 && page <= total) count += 1;
  });
  return count || total;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.bg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  content: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  topRow: {
    alignItems: 'flex-end',
  },
  addFilesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addFilesText: {
    color: Colors.primaryLight,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  previewShell: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
    ...Shadow.card,
  },
  removeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: 42,
  },
  fileCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    backgroundColor: 'rgba(99,102,241,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fileCounterText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  previewFileName: {
    flex: 1,
    minWidth: 0,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  previewCarousel: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    position: 'absolute',
    top: '46%',
    zIndex: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(15,23,42,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnLeft: {
    left: 8,
  },
  navBtnRight: {
    right: 8,
  },
  navBtnDisabled: {
    opacity: 0.28,
  },
  pagePreview: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePortrait: {
    width: '58%',
    maxWidth: 300,
    aspectRatio: 0.71,
  },
  pageLandscape: {
    width: '78%',
    maxWidth: 420,
    aspectRatio: 1.41,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewImageLandscape: {
    width: '72%',
    height: '142%',
    transform: [{ rotate: '90deg' }],
  },
  pdfPreview: {
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
  },
  pdfPreviewLandscape: {
    transform: [{ rotate: '90deg' }],
  },
  pdfPreviewBw: {
    opacity: 0.72,
  },
  pdfName: {
    maxWidth: 280,
    textAlign: 'center',
    fontSize: FontSize.base,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },
  pdfMeta: {
    color: '#64748b',
    fontSize: FontSize.sm,
  },
  previewDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  previewDotActive: {
    width: 22,
    backgroundColor: Colors.primaryLight,
  },
  activeFileMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeFileMetaText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  nextHint: {
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nextHintText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  previewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  copiesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  cardSub: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: FontWeight.medium,
  },
  disabledText: {
    opacity: 0.35,
  },
  copyCount: {
    minWidth: 28,
    textAlign: 'center',
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  optionsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rangeChip: {
    height: 38,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 10,
  },
  rangeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99,102,241,0.18)',
  },
  rangeChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  rangeInputWrap: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 10,
  },
  rangeInputActive: {
    borderColor: Colors.primary,
  },
  rangeInput: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  choiceCard: {
    flex: 1,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
    padding: 8,
  },
  choiceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99,102,241,0.16)',
  },
  choiceIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconSelected: {
    backgroundColor: 'rgba(99,102,241,0.18)',
  },
  choiceTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  choiceTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  choiceSub: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  activeText: {
    color: Colors.primaryLight,
  },
  uploadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  uploadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Radius.lg,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  totalPrice: {
    marginTop: 2,
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  generateBtn: {
    flex: 1,
    maxWidth: 250,
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Shadow.glow,
  },
  generateText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(15,23,42,0.38)',
  },
  loadingPanel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.card,
  },
  loadingIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Shadow.glow,
  },
  loadingTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  loadingBody: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  loadingProgress: {
    width: '100%',
    marginTop: Spacing.sm,
  },
  loadingPercent: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
