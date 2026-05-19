import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { usePrint } from '@/hooks/usePrint';
import { fetchShopDetails } from '@/services/printService';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function ShopLinkScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setSelectedShop } = usePrint();
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function openShop() {
      if (!id) {
        setError('Shop link is missing.');
        return;
      }

      const shop = await fetchShopDetails(String(id));
      if (!mounted) return;

      if (!shop) {
        setError('This shop is not active yet or the QR link is invalid.');
        return;
      }

      setSelectedShop(shop);
      router.replace({ pathname: '/upload', params: { shopId: shop.id } });
    }

    openShop();
    return () => {
      mounted = false;
    };
  }, [id, router, setSelectedShop]);

  return (
    <View style={styles.screen}>
      <GlassCard style={styles.card} gradient>
        {error ? (
          <>
            <Ionicons name="alert-circle" size={42} color={Colors.warning} />
            <Text style={styles.title}>Shop not available</Text>
            <Text style={styles.message}>{error}</Text>
            <GradientButton title="Choose another shop" onPress={() => router.replace('/(tabs)/print')} />
          </>
        ) : (
          <>
            <ActivityIndicator color={Colors.primaryLight} size="large" />
            <Text style={styles.title}>Opening shop...</Text>
            <Text style={styles.message}>Please wait while we prepare document upload.</Text>
          </>
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
});
