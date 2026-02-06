/**
 * ACHIEVEMENTS SCREEN
 * Display all achievements with search, filter, and categories
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import { useAchievements } from '../../hooks/useGamification';
import { AchievementCard } from './components';
import type { Achievement } from '../../types/gamification';
import { AchievementCategory, AchievementRarity } from '../../types/gamification';

// ============================================================================
// TYPES
// ============================================================================

type SortOption = 'recent' | 'rarity' | 'progress';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  { id: AchievementCategory.ALL, label: 'All', icon: '🏆' },
  { id: AchievementCategory.PLAYER_MILESTONE, label: 'Milestones', icon: '🎯' },
  { id: AchievementCategory.SCOUT_EXPERTISE, label: 'Scouting', icon: '🔍' },
  { id: AchievementCategory.CLUB_ACHIEVEMENT, label: 'Club', icon: '🏟️' },
  { id: AchievementCategory.SOCIAL_ENGAGEMENT, label: 'Social', icon: '👥' },
  { id: AchievementCategory.PERFORMANCE, label: 'Performance', icon: '⚡' },
];

const RARITY_ORDER = {
  [AchievementRarity.LEGENDARY]: 4,
  [AchievementRarity.EPIC]: 3,
  [AchievementRarity.RARE]: 2,
  [AchievementRarity.COMMON]: 1,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AchievementsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>(
    AchievementCategory.ALL
  );
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const { data: achievements, isLoading, refetch, isRefetching } = useAchievements();

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];

    let filtered = [...achievements];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== AchievementCategory.ALL) {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (!a.unlockedAt) return 1;
          if (!b.unlockedAt) return -1;
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        case 'rarity':
          return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        case 'progress': {
          const progressA = a.progress ? a.progress.current / a.progress.total : 0;
          const progressB = b.progress ? b.progress.current / b.progress.total : 0;
          return progressB - progressA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [achievements, searchQuery, selectedCategory, sortBy]);

  // Recently unlocked achievements
  const recentlyUnlocked = useMemo(() => {
    if (!achievements) return [];
    return achievements
      .filter((a) => !a.isLocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 3);
  }, [achievements]);

  const handleCategoryPress = (category: AchievementCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleAchievementPress = (achievement: Achievement) => {
    navigation.navigate('AchievementDetailsModal', { achievement });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {achievements?.filter((a) => !a.isLocked).length || 0} /{' '}
          {achievements?.length || 0} unlocked
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={tokens.colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search achievements..."
            placeholderTextColor={tokens.colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color={tokens.colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={tokens.colors.yellow.DEFAULT} />
        </TouchableOpacity>
      </View>

      {/* Sort Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.sortButtons}>
            <SortButton
              label="Recent"
              active={sortBy === 'recent'}
              onPress={() => setSortBy('recent')}
            />
            <SortButton
              label="Rarity"
              active={sortBy === 'rarity'}
              onPress={() => setSortBy('rarity')}
            />
            <SortButton
              label="Progress"
              active={sortBy === 'progress'}
              onPress={() => setSortBy('progress')}
            />
          </View>
        </View>
      )}

      {/* Category Tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleCategoryPress(item.id)}
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
          >
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === item.id && styles.categoryLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Recently Unlocked Section */}
      {recentlyUnlocked.length > 0 && searchQuery === '' && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently Unlocked</Text>
        </View>
      )}

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AchievementCard
            achievement={item}
            onPress={() => handleAchievementPress(item)}
            style={styles.achievementCard}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No achievements found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try a different search term'
                : 'Complete challenges to unlock achievements'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
      />
    </View>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SortButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const SortButton: React.FC<SortButtonProps> = ({ label, active, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.sortButton, active && styles.sortButtonActive]}
    >
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyBase,
    color: tokens.colors.text.primary,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  sortButtonActive: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  sortButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.gray[300],
  },
  sortButtonTextActive: {
    color: tokens.colors.arcane.black,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  categoryChipActive: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.gray[300],
  },
  categoryLabelActive: {
    color: tokens.colors.arcane.black,
  },
  recentSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.heading5,
    color: tokens.colors.yellow.DEFAULT,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  achievementCard: {
    marginBottom: 0,
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

export default AchievementsScreen;
