import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../design/theme';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import ScoutCard from '../../components/marketplace/ScoutCard';
import FilterChip from '../../components/marketplace/FilterChip';
import FilterBottomSheet from './FilterBottomSheet';
import { marketplaceApi } from '../../services/marketplace.api';
import type { MarketplaceListing, SearchListingsFilters } from '../../types/marketplace';
import { logError } from '../../utils/logger';

const MarketplaceScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchListingsFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch listings
  const fetchListings = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await marketplaceApi.searchListings({
          ...filters,
          page: pageNum,
          limit: 20,
        });

        const newListings = response.data || response.items || [];

        if (isRefresh || pageNum === 1) {
          setListings(newListings);
        } else {
          setListings((prev) => [...prev, ...newListings]);
        }

        setHasMore(
          response.meta.page < response.meta.totalPages || newListings.length === 20
        );
        setPage(pageNum);
      } catch (error) {
        logError('Failed to fetch marketplace listings', error);
        Alert.alert('Error', 'Failed to load scout listings. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Load favorites
  const loadFavorites = useCallback(async () => {
    try {
      const favs = await marketplaceApi.getFavorites();
      const favSet = new Set(favs.map((f) => f.listingId));
      setFavorites(favSet);
    } catch (error) {
      logError('Failed to load favorites', error);
    }
  }, []);

  useEffect(() => {
    fetchListings(1);
    loadFavorites();
  }, [filters]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings(1, true);
    loadFavorites();
  }, [fetchListings, loadFavorites]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchListings(page + 1);
    }
  }, [loadingMore, hasMore, loading, page, fetchListings]);

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchQuery || undefined }));
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters.search;
      return newFilters;
    });
  }, []);

  const handleApplyFilters = useCallback((newFilters: SearchListingsFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRemoveFilter = useCallback((filterKey: keyof SearchListingsFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  }, []);

  const handleToggleFavorite = useCallback(
    async (listingId: string) => {
      try {
        const result = await marketplaceApi.toggleFavorite(listingId);
        if (result.isFavorite) {
          setFavorites((prev) => new Set(prev).add(listingId));
        } else {
          setFavorites((prev) => {
            const newSet = new Set(prev);
            newSet.delete(listingId);
            return newSet;
          });
        }
      } catch (error) {
        logError('Failed to toggle favorite', error);
        Alert.alert('Error', 'Failed to update favorite. Please try again.');
      }
    },
    []
  );

  const handleScoutPress = useCallback(
    (listing: MarketplaceListing) => {
      navigation.navigate('ScoutDetail', { listingId: listing.id });
    },
    [navigation]
  );

  const renderFilterChips = () => {
    const chips: Array<{ key: keyof SearchListingsFilters; label: string }> = [];

    if (filters.leagues && filters.leagues.length > 0) {
      chips.push({
        key: 'leagues',
        label: `Leagues: ${filters.leagues.length}`,
      });
    }
    if (filters.positions && filters.positions.length > 0) {
      chips.push({
        key: 'positions',
        label: `Positions: ${filters.positions.length}`,
      });
    }
    if (filters.ageGroup) {
      chips.push({ key: 'ageGroup', label: filters.ageGroup });
    }
    if (filters.maxBudget) {
      chips.push({ key: 'maxBudget', label: `Max €${filters.maxBudget}/hr` });
    }
    if (filters.minRating) {
      chips.push({ key: 'minRating', label: `${filters.minRating}+ ★` });
    }
    if (filters.verifiedOnly) {
      chips.push({ key: 'verifiedOnly', label: 'Verified' });
    }

    if (chips.length === 0) return null;

    return (
      <View style={styles.filterChipsContainer}>
        {chips.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            onRemove={() => handleRemoveFilter(chip.key)}
          />
        ))}
      </View>
    );
  };

  const renderListItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => (
      <ScoutCard
        listing={item}
        onPress={() => handleScoutPress(item)}
        onFavorite={() => handleToggleFavorite(item.id)}
        isFavorite={favorites.has(item.id)}
      />
    ),
    [handleScoutPress, handleToggleFavorite, favorites]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        title="No scouts found"
        description="Try adjusting your filters or search criteria"
        iconName="users"
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scout Marketplace</Text>
        <Text style={styles.headerSubtitle}>Find expert scouts for your club</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search scouts..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <SlidersHorizontal size={20} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {renderFilterChips()}

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  filterButton: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});

export default MarketplaceScreen;
