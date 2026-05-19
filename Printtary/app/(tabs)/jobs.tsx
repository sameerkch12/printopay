import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrintJobCard } from '@/components/feature/PrintJobCard';
import { usePrint } from '@/hooks/usePrint';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const FILTERS = ['All', 'Pending', 'Printing', 'Completed', 'Failed'];

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { jobHistory } = usePrint();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? jobHistory
    : jobHistory.filter(j => j.status.toLowerCase() === activeFilter.toLowerCase());

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Print</Text>
          <Text style={styles.headerSub}>{jobHistory.length} total jobs</Text>
        </View>
        <View style={styles.headerBadge}>
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            style={styles.headerBadgeGradient}
          >
            <Text style={styles.headerBadgeText}>{jobHistory.length}</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          keyExtractor={item => item}
          renderItem={({ item }) => {
            const isActive = item === activeFilter;
            const count = item === 'All'
              ? jobHistory.length
              : jobHistory.filter(j => j.status.toLowerCase() === item.toLowerCase()).length;
            return (
              <Pressable
                onPress={() => setActiveFilter(item)}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterChipActive}
                  >
                    <Text style={styles.filterLabelActive}>{item}</Text>
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>{count}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterChip}>
                    <Text style={styles.filterLabel}>{item}</Text>
                    {count > 0 && (
                      <View style={[styles.filterCount, styles.filterCountInactive]}>
                        <Text style={styles.filterCountTextInactive}>{count}</Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* Jobs list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyImagePlaceholder}>
            <Ionicons name="print-outline" size={56} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} jobs</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'All'
              ? 'Start a new print job by scanning a QR code'
              : `No ${activeFilter.toLowerCase()} jobs found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PrintJobCard job={item} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
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
  headerSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    includeFontPadding: false,
    marginTop: 2,
  },
  headerBadge: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  headerBadgeGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerBadgeText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#fff',
    includeFontPadding: false,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    includeFontPadding: false,
  },
  filterLabelActive: {
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: '600',
    includeFontPadding: false,
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountInactive: {
    backgroundColor: Colors.border,
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    includeFontPadding: false,
  },
  filterCountTextInactive: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    includeFontPadding: false,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    includeFontPadding: false,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    includeFontPadding: false,
  },
});
