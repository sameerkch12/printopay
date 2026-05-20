import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { ShopCard } from '@/components/feature/ShopCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { usePrint } from '@/hooks/usePrint';
import { fetchAllShops } from '@/services/printService';
import { getRealtimeSocket } from '@/services/realtime';
import { Shop } from '@/types';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

export default function PrintScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedShop, setSelectedShop } = usePrint();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [locationMessage, setLocationMessage] = useState('Showing all approved shops. Tap Find Nearby Shops to show shops within 10 km.');

  useEffect(() => {
    let mounted = true;

    const loadShops = async () => {
      setLoading(true);
      try {
        const data = await fetchAllShops();
        if (!mounted) return;
        setShops(data);
        setLocationMessage('Showing all approved shops. Tap Find Nearby Shops to show shops within 10 km.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadShops().catch(() => {
      if (mounted) {
        setLocationMessage('Could not load shops. Please try again.');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const socket = getRealtimeSocket();
    const reloadShops = async () => {
      try {
        const data = await fetchAllShops();
        if (mounted) {
          setShops(data);
          setLocationMessage('Showing all approved shops. Tap Find Nearby Shops to show shops within 10 km.');
        }
      } catch {
        if (mounted) setLocationMessage('Could not load shops. Please try again.');
      }
    };

    socket.on('shops:changed', reloadShops);

    return () => {
      mounted = false;
      socket.off('shops:changed', reloadShops);
    };
  }, []);

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const findNearbyShops = async () => {
    setNearbyLoading(true);
    setLocationMessage('Finding nearby shops...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationMessage('Location permission denied. Showing all approved shops.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const data = await fetchAllShops({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setShops(data);
      setLocationMessage(data.length ? 'Showing approved shops within 10 km.' : 'No approved shops found within 10 km.');
    } catch {
      setLocationMessage('Could not find nearby shops. Showing all approved shops.');
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedShop) {
      router.push({ pathname: '/upload', params: { shopId: selectedShop.id } });
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Print Job</Text>
        <Pressable
          onPress={() => router.push('/scan')}
          style={styles.qrBtn}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            style={styles.qrBtnGradient}
          >
            <Ionicons name="qr-code" size={18} color="#fff" />
            <Text style={styles.qrBtnText}>Scan QR</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Steps indicator */}
      <View style={styles.stepsBar}>
        {['Select Shop', 'Upload File', 'Settings', 'Get Code'].map((step, idx) => (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, idx === 0 && styles.stepDotActive]}>
                {idx === 0 ? (
                  <Ionicons name="storefront" size={12} color="#fff" />
                ) : (
                  <Text style={styles.stepDotNum}>{idx + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, idx === 0 && styles.stepLabelActive]}>{step}</Text>
            </View>
            {idx < 3 && <View style={styles.stepLine} />}
          </React.Fragment>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search print shops..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={findNearbyShops}
          disabled={nearbyLoading}
          style={({ pressed }) => [
            styles.nearbyBtn,
            (pressed || nearbyLoading) && { opacity: 0.85 },
          ]}
        >
          <LinearGradient
            colors={['rgba(99,102,241,0.22)', 'rgba(168,85,247,0.14)']}
            style={styles.nearbyBtnGradient}
          >
            <Ionicons name="navigate" size={17} color={Colors.primaryLight} />
            <Text style={styles.nearbyBtnText}>
              {nearbyLoading ? 'Finding Nearby Shops...' : 'Find Nearby Shops'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Shop list */}
      <ScrollView
        style={styles.shopList}
        contentContainerStyle={styles.shopListContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listTitle}>
          {filtered.length} approved shop{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.locationText}>{locationMessage}</Text>

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No shops found</Text>
            <Text style={styles.emptyText}>Try a different search term or scan the shop QR code</Text>
          </GlassCard>
        ) : (
          filtered.map(shop => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onSelect={setSelectedShop}
              selected={selectedShop?.id === shop.id}
            />
          ))
        )}
      </ScrollView>

      {/* Continue CTA */}
      {selectedShop && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 8 }]}>
          <LinearGradient
            colors={[Colors.bgCard, Colors.bg]}
            style={styles.ctaBarGradient}
          >
            <View style={styles.selectedShopInfo}>
              <Ionicons name="storefront" size={16} color={Colors.primaryLight} />
              <Text style={styles.selectedShopName} numberOfLines={1}>
                {selectedShop.name}
              </Text>
            </View>
            <GradientButton
              title="Upload Document"
              onPress={handleContinue}
              size="md"
              icon={<Ionicons name="arrow-forward" size={18} color="#fff" />}
              iconPosition="right"
            />
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  qrBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  qrBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  qrBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#fff',
    includeFontPadding: false,
  },
  stepsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    color: Colors.primaryLight,
  },
  stepLine: {
    height: 1,
    flex: 0.8,
    backgroundColor: Colors.border,
    marginTop: -10,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  nearbyBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  nearbyBtnGradient: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
  },
  nearbyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
    includeFontPadding: false,
  },
  shopList: {
    flex: 1,
  },
  shopListContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: 120,
  },
  listTitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
    includeFontPadding: false,
    marginBottom: 4,
  },
  locationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
    marginTop: -4,
    marginBottom: 4,
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  ctaBarGradient: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  selectedShopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedShopName: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.semibold,
    includeFontPadding: false,
    flex: 1,
  },
});
