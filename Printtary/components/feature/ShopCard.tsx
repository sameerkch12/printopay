import React from 'react';
import { Image, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Shop } from '@/types';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

interface ShopCardProps {
  shop: Shop;
  onSelect: (shop: Shop) => void;
  selected?: boolean;
}

export function ShopCard({ shop, onSelect, selected = false }: ShopCardProps) {
  return (
    <Pressable
      onPress={() => onSelect(shop)}
      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={selected
          ? ['rgba(99,102,241,0.18)', 'rgba(168,85,247,0.1)']
          : [Colors.bgCard, Colors.bgElevated]}
        style={[
          styles.container,
          selected && styles.selectedBorder,
        ]}
      >
        {/* Icon */}
        <View style={[styles.icon, selected && styles.iconSelected]}>
          {shop.photoUrl ? (
            <Image source={{ uri: shop.photoUrl }} style={styles.photo} />
          ) : (
            <Ionicons name="storefront" size={22} color={selected ? Colors.primary : Colors.textSecondary} />
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{shop.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.address} numberOfLines={1}>{shop.address}</Text>
          </View>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.phone}>{shop.phone}</Text>
          </View>
          {typeof shop.distanceKm === 'number' ? (
            <View style={styles.phoneRow}>
              <Ionicons name="navigate-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.phone}>{shop.distanceKm.toFixed(1)} km away</Text>
            </View>
          ) : null}
          <View style={styles.rateRow}>
            <View style={styles.rateChip}>
              <Text style={styles.rateText}>B/W ₹{shop.printRates?.bwPerPage ?? 2}/page</Text>
            </View>
            <View style={styles.rateChip}>
              <Text style={styles.rateText}>Color ₹{shop.printRates?.colorPerPage ?? 10}/page</Text>
            </View>
          </View>
        </View>

        {/* Status + select */}
        <View style={styles.right}>
          <View style={[styles.activeDot, { backgroundColor: shop.isActive ? Colors.success : Colors.error }]} />
          {selected && (
            <View style={styles.checkWrap}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  selectedBorder: {
    borderColor: Colors.primary,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconSelected: {
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    includeFontPadding: false,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  rateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  rateChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  rateText: {
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: '600',
    includeFontPadding: false,
  },
  right: {
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkWrap: {},
});
