/**
 * COACHING HUB SCREEN
 * Main screen for discovering and browsing coaches
 *
 * Features:
 * - Search bar with debounced search
 * - Filter button (opens FilterModal)
 * - Featured coaches horizontal scroll
 * - All coaches list with pagination
 * - Pull-to-refresh
 * - Loading and empty states
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  X,
  UserPlus,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDebounce } from '../../hooks/useDebounce';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import { useCoaches, useFeaturedCoaches } from '../../hooks/useCoaching';
import { CoachCard } from './components';
import type { Coach, CoachFilters } from '../../types/coaching';
import type { AppStackParamList } from '../../types/navigation';
import { useLocalization } from '../../contexts/LocalizationContext';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// ============================================================================
// COMPONENT
// ============================================================================

export const CoachingHubScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { dictionary } = useLocalization();
  const t = dictionary.coaching || {
    hub: {
      title: 'Coaching Hub',
      subtitle: 'Find expert coaches to improve your game',
    },
    search: {
      placeholder: 'Search coaches...',
    },
    sections: {
      featured: 'Featured Coaches',
      all: 'All Coaches',
      coachCount: 'coaches',
    },
    loading: {
      message: 'Loading coaches...',
    },
    empty: {
      title: 'No coaches found',
      subtitle: 'Try adjusting your search or filters',
    },
    cta: {
      becomeCoach: 'Become a Coach',
    },
  };

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CoachFilters>({});
  const [refreshing, setRefreshing] = useState(false);

  // Debounced search
  const [debouncedSearch] = useDebounce(searchQuery, 500);

  // Queries
  const {
    data: featuredCoachesData,
    isLoading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured,
  } = useFeaturedCoaches();

  const {
    data: coachesData,
    isLoading: coachesLoading,
    error: coachesError,
    refetch: refetchCoaches,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCoaches({
    ...filters,
    search: debouncedSearch || undefined,
  });

  const featuredCoaches = useMemo(() => {
    if (!featuredCoachesData) return [];
    if (Array.isArray(featuredCoachesData)) return featuredCoachesData;
    return featuredCoachesData?.data || [];
  }, [featuredCoachesData]);

  const coaches = useMemo(() => {
    if (!coachesData) return [];
    if (Array.isArray(coachesData)) return coachesData;
    if (!coachesData?.pages) return [];
    return coachesData.pages.flatMap((page) => {
      if (!page) return [];
      if (Array.isArray(page)) return page;
      return page.data || [];
    });
  }, [coachesData]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeatured(), refetchCoaches()]);
    setRefreshing(false);
  }, [refetchFeatured, refetchCoaches]);

  const handleCoachPress = useCallback(
    (coachId: string) => {
      navigation.navigate('CoachProfile', { coachId });
    },
    [navigation]
  );

  const handleFilterPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('FilterModal' as any, { currentFilters: filters });
  }, [navigation, filters]);

  const handleBecomeCoachPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to become coach flow
    // navigation.navigate('BecomeCoach');
  }, []);

  const handleClearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
  }, []);

  const handleLoadMore = useCallback(() => {
    if (fetchNextPage && typeof fetchNextPage === 'function' && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.expertise?.length) count++;
    if (filters.minRating) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.languages?.length) count++;
    return count;
  }, [filters]);

  // Render Methods
  const renderFeaturedCoach = useCallback(
    ({ item }: { item: Coach }) => (
      <CoachCard
        coach={item}
        onPress={() => handleCoachPress(item?.id || '')}
        featured
        style={styles.featuredCard}
      />
    ),
    [handleCoachPress]
  );

  const renderCoach = useCallback(
    ({ item }: { item: Coach }) => (
      <CoachCard
        coach={item}
        onPress={() => handleCoachPress(item?.id || '')}
        style={styles.coachCard}
      />
    ),
    [handleCoachPress]
  );

  const keyExtractor = useCallback((item: Coach, index: number) => {
    return item?.id || `coach-${index}`;
  }, []);

  const renderListHeader = useCallback(() => {
    return (
      <>
        {/* Featured Coaches Section */}
        {featuredCoaches.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={20} color={tokens.colors.yellow.DEFAULT} />
                <Text style={styles.sectionTitle}>{t?.sections?.featured || 'Featured Coaches'}</Text>
              </View>
              <ChevronRight size={20} color={tokens.colors.gray[400]} />
            </View>

            <FlatList
              data={featuredCoaches}
              renderItem={renderFeaturedCoach}
              keyExtractor={(item, index) => `featured-${item?.id || index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* All Coaches Header */}
        <View style={styles.allCoachesHeader}>
          <Text style={styles.sectionTitle}>{t?.sections?.all || 'All Coaches'}</Text>
          <Text style={styles.coachCount}>
            {coaches.length} {t?.sections?.coachCount || 'coaches'}
          </Text>
        </View>
      </>
    );
  }, [featuredCoaches, coaches, renderFeaturedCoach, t]);

  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={tokens.colors.yellow.DEFAULT} />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (coachesLoading || featuredLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.loadingText}>{t?.loading?.message || 'Loading coaches...'}</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Search size={48} color={tokens.colors.gray[500]} />
        <Text style={styles.emptyTitle}>{t?.empty?.title || 'No coaches found'}</Text>
        <Text style={styles.emptySubtitle}>
          {t?.empty?.subtitle || 'Try adjusting your search or filters'}
        </Text>
      </View>
    );
  }, [coachesLoading, featuredLoading, t]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t?.hub?.title || 'Coaching Hub'}</Text>
        <Text style={styles.headerSubtitle}>
          {t?.hub?.subtitle || 'Find expert coaches to improve your game'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={tokens.colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder={t?.search?.placeholder || 'Search coaches...'}
            placeholderTextColor={tokens.colors.gray[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color={tokens.colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
        >
          <Filter size={20} color={tokens.colors.text.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Coaches List */}
      <FlatList
        data={coaches}
        renderItem={renderCoach}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          coaches.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      {/* Become a Coach CTA */}
      <TouchableOpacity
        style={styles.becomeCoachButton}
        onPress={handleBecomeCoachPress}
      >
        <UserPlus size={20} color={tokens.colors.arcane.black} />
        <Text style={styles.becomeCoachText}>{t?.cta?.becomeCoach || 'Become a Coach'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    ...typography.heading1,
    fontSize: tokens.fontSize['4xl'],
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyBase,
    color: tokens.colors.text.primary,
  },
  filterButton: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderRadius: 9999,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.arcane.black,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  featuredSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...typography.heading3,
  },
  featuredList: {
    gap: 16,
  },
  featuredCard: {
    width: 280,
  },
  allCoachesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachCount: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  coachCard: {
    marginBottom: 16,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    marginTop: 12,
  },
  emptyTitle: {
    ...typography.heading3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    textAlign: 'center',
  },
  becomeCoachButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    ...tokens.shadows.glowYellow,
  },
  becomeCoachText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
});

export default CoachingHubScreen;
