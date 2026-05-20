import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GradientButton } from '@/components/ui/GradientButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Print Without\nSharing on WhatsApp',
    subtitle: 'Securely send your documents to any print shop. No more sharing on messaging apps.',
    icon: 'shield-checkmark',
    color: Colors.primary,
    accent: Colors.accent,
  },
  {
    id: '2',
    title: 'Upload & Configure\nYour Print',
    subtitle: 'Choose B&W or color, paper size, copies, orientation — all from your phone.',
    icon: 'document-text',
    color: '#a855f7',
    accent: '#6366f1',
  },
  {
    id: '3',
    title: 'Secure 4-Digit\nPrint Code',
    subtitle: 'Your file expires in 24 hours. Shop owner needs your print code to print with your approval.',
    icon: 'key',
    color: '#22c55e',
    accent: '#3b82f6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      scrollX.value = withTiming(next * width);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Hero image */}
      <View style={styles.heroContainer}>
        <Image
          source={require('@/assets/images/onboarding-hero.png')}
          style={styles.heroImage}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', Colors.bg]}
          style={styles.heroOverlay}
        />
      </View>

      {/* Logo */}
      <View style={[styles.logoRow, { top: insets.top + 16 }]}>
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          style={styles.logoIcon}
        >
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
        </LinearGradient>
        <Text style={styles.logoText}>PrintoPay</Text>
      </View>

      {/* Skip */}
      {currentIndex < SLIDES.length - 1 && (
        <Pressable
          onPress={handleSkip}
          style={[styles.skipBtn, { top: insets.top + 16 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Slides */}
      <View style={styles.slidesWrapper}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.slide}>
              <LinearGradient
                colors={[`${item.color}25`, `${item.accent}10`]}
                style={styles.iconCircle}
              >
                <Ionicons name={item.icon as any} size={40} color={item.color} />
              </LinearGradient>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <GradientButton
            title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            size="lg"
            icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
            iconPosition="right"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.52,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  logoRow: {
    position: 'absolute',
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  skipBtn: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  slidesWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  slide: {
    width,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    paddingTop: height * 0.44,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    includeFontPadding: false,
  },
  slideSubtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    includeFontPadding: false,
    paddingHorizontal: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.textMuted,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
});
