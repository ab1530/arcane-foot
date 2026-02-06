/**
 * BADGES SCREEN
 * Display badge collection with filtering, pinning, and progress
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { Search, X, Edit3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import { useBadges, usePinBadge, useUnpinBadge } from '../../hooks/useGamification';
import { BadgeDisplay, RarityBadge } from './components';
import type { Badge } from '../../types/gamification';
import { AchievementRarity } from '../../types/gamification';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BADGE_SIZE = (SCREEN_WIDTH - 16 * 2 - 12 * 2) / 3;

// ============================================================================
// CONSTANTS
// ============================================================================

const RARITY_FILTERS = [
  { id: 'all', label: 'All', color: tokens.colors.gray[400] },
  { id: AchievementRarity.COMMON, label: 'Common', color: tokens.colors.gray[500] },
  { id: AchievementRarity.RARE, label: 'Rare', color: tokens.colors.semantic.info },
  { id: AchievementRarity.EPIC, label: 'Epic', color: tokens.colors.feature.ai },
  { id: AchievementRarity.LEGENDARY, label: 'Legendary', color: tokens.colors.feature.gamification },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const BadgesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  const { data: badges, isLoading, refetch, isRefetching } = useBadges();
  const pinBadgeMutation = usePinBadge();
  const unpinBadgeMutation = useUnpinBadge();

  // Calculate collection stats
  const stats = useMemo(() => {
    if (!badges) return { earned: 0, total: 0, byRarity: {} };

    const earned = badges.filter((b) => b.earnedAt).length;
    const byRarity = badges.reduce((acc, badge) => {
      if (badge.earnedAt) {
        acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return { earned, total: badges.length, byRarity };
  }, [badges]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    if (!badges) return [];

    let filtered = [...badges];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description.toLowerCase().includes(query)
      );
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter((b) => b.rarity === selectedRarity);
    }

    // Sort: earned first, then by rarity
    filtered.sort((a, b) => {
      if (a.earnedAt && !b.earnedAt) return -1;
      if (!a.earnedAt && b.earnedAt) return 1;
      return 0;
    });

    return filtered;
  }, [badges, searchQuery, selectedRarity]);

  // Recently earned badges
  const recentBadges = useMemo(() => {
    if (!badges) return [];
    return badges
      .filter((b) => b.earnedAt)
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
      .slice(0, 5);
  }, [badges]);

  // Pinned badges
  const pinnedBadges = useMemo(() => {
    if (!badges) return [];
    return badges.filter((b) => b.isPinned);
  }, [badges]);

  const handlePinToggle = (badge: Badge) => {
    if (badge.isPinned) {
      unpinBadgeMutation.mutate(badge.id);
    } else {
      if (pinnedBadges.length >= 5) {
        // Show toast: maximum 5 pinned badges
        return;
      }
      pinBadgeMutation.mutate(badge.id);
    }
  };

  const handleBadgePress = (badge: Badge) => {
    if (editMode && badge.earnedAt) {
      handlePinToggle(badge);
    } else {
      navigation.navigate('BadgeDetailsModal', { badge });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Badges</Text>
          <Text style={styles.headerSubtitle}>
            {stats.earned} / {stats.total} collected
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
      >
        {/* Collection Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>
                {Math.round((stats.earned / stats.total) * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.rarityBreakdown}>
            <Text style={styles.rarityTitle}>Collection by Rarity</Text>
            {RARITY_FILTERS.slice(1).map((rarity) => (
              <View key={rarity.id} style={styles.rarityRow}>
                <View style={[styles.rarityDot, { backgroundColor: rarity.color }]} />
                <Text style={styles.rarityLabel}>{rarity.label}</Text>
                <Text style={styles.rarityCount}>
                  {stats.byRarity[rarity.id] || 0}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={20} color={tokens.colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search badges..."
            placeholderTextColor={tokens.colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={tokens.colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Rarity Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {RARITY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRarity(filter.id);
              }}
              style={[
                styles.filterChip,
                selectedRarity === filter.id && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  selectedRarity === filter.id && { color: filter.color },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recently Earned */}
        {recentBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Earned</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recentBadges.map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  size="large"
                  showName={true}
                  onPress={() => handleBadgePress(badge)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Pinned Badges */}
        {pinnedBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Pinned Badges ({pinnedBadges.length}/5)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditMode(!editMode);
                }}
                style={styles.editButton}
              >
                <Edit3 size={16} color={tokens.colors.yellow.DEFAULT} />
                <Text style={styles.editText}>{editMode ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pinnedGrid}>
              {pinnedBadges.map((badge) => (
                <BadgeDisplay
                  key={badge.id}
                  badge={badge}
                  size="medium"
                  showPin={true}
                  showName={false}
                  onPress={() => handleBadgePress(badge)}
                />
              ))}
            </View>
          </View>
        )}

        {/* All Badges Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Badges</Text>
          <View style={styles.badgesGrid}>
            {filteredBadges.map((badge) => (
              <BadgeDisplay
                key={badge.id}
                badge={badge}
                size="medium"
                showName={true}
                showPin={false}
                onPress={() => handleBadgePress(badge)}
                style={{ width: BADGE_SIZE }}
              />
            ))}
          </View>

          {filteredBadges.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏅</Text>
              <Text style={styles.emptyTitle}>No badges found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Earn badges by completing achievements'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.arcane.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    ...typography.display3,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[300],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  progressCircleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    borderWidth: 6,
    borderColor: tokens.colors.yellow.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${tokens.colors.yellow.DEFAULT}10`,
  },
  progressPercent: {
    ...typography.heading3,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '900',
  },
  rarityBreakdown: {
    flex: 1,
  },
  rarityTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 8,
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
  rarityLabel: {
    ...typography.caption,
    color: tokens.colors.gray[300],
    flex: 1,
  },
  rarityCount: {
    ...typography.caption,
    fontWeight: '700',
    color: tokens.colors.text.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyBase,
    color: tokens.colors.text.primary,
  },
  filtersContent: {
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  filterChipActive: {
    backgroundColor: `${tokens.colors.yellow.DEFAULT}15`,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  filterLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.gray[300],
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.heading5,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.yellow.DEFAULT,
  },
  recentScrollContent: {
    gap: 16,
    paddingRight: 16,
  },
  pinnedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    ...typography.heading4,
    marginBottom: 8,
  },
  emptyDescription: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    textAlign: 'center',
  },
});

export default BadgesScreen;
