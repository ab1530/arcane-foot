import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
  runOnJS,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import {
  Card,
  Text,
  Heading,
  Caption,
  Badge,
  Button,
  theme,
} from '../../design/components';
import { useMarket, useMarketStats } from '../../hooks/useMarket';
import type { Player } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MarketScreenNew = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Animation values
  const scrollY = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const searchFocused = useSharedValue(0);

  // Fetch market data
  const {
    players,
    loading,
    error,
    updateFilters,
    refresh,
    totalCount,
  } = useMarket();

  // Fetch market statistics
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = useMarketStats();

  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'FORWARD', label: 'FW', icon: 'trending-up' },
    { id: 'MIDFIELDER', label: 'MID', icon: 'repeat' },
    { id: 'DEFENDER', label: 'DEF', icon: 'shield' },
    { id: 'GOALKEEPER', label: 'GK', icon: 'hand-left-outline' },
  ];

  // Helper functions
  const getPlayerName = (player: Player): string => {
    return `${player.user?.firstName || ''} ${player.user?.lastName || ''}`.trim() || 'Unknown Player';
  };

  const getPlayerAge = (player: Player): number | null => {
    if (!player.dateOfBirth) return null;
    const birthDate = new Date(player.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatMarketValue = (value?: number): string => {
    if (!value) return 'N/A';
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const getPlayerRating = (player: Player): string => {
    if (player.statsJson && typeof player.statsJson === 'object') {
      const stats = player.statsJson;
      if (stats.overall) return stats.overall.toFixed(1);
      if (stats.rating) return stats.rating.toFixed(1);
    }
    return '75';
  };

  // Update filters when category or search changes
  const handleCategoryChange = useCallback((category: string) => {
    Haptics.selectionChanged();
    setSelectedCategory(category);
    updateFilters({
      position: category === 'all' ? undefined : category,
    });
  }, [updateFilters]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Debounced search effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({
        search: searchQuery || undefined,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, updateFilters]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    refresh();
    refreshStats();
  }, [refresh, refreshStats]);

  const handlePlayerPress = (playerId: string) => {
    Haptics.mediumImpact();
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  const navigateToPlayer = (playerId: string) => {
    Haptics.lightImpact();
    // navigation.navigate('PlayerDetail', { id: playerId });
  };

  // Animated header
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -50],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  // Search bar animation
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          searchFocused.value,
          [0, 1],
          [1, 1.02],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const renderPlayerCard = (player: Player, index: number) => {
    const playerName = getPlayerName(player);
    const playerAge = getPlayerAge(player);
    const playerRating = getPlayerRating(player);
    const marketValue = formatMarketValue(player.marketValue);
    const isExpanded = expandedPlayer === player.id;

    return (
      <Animated.View
        key={player.id}
        entering={SlideInRight.delay(index * 50).springify()}
        style={styles.playerCardWrapper}
      >
        <Pressable onPress={() => handlePlayerPress(player.id)}>
          <Card variant="glass" size="lg" style={styles.playerCard}>
            {/* Player Header */}
            <View style={styles.playerHeader}>
              <View style={styles.playerLeft}>
                <LinearGradient
                  colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
                  style={styles.playerAvatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.playerInitial}>
                    {playerName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.playerInfo}>
                  <Heading variant="h3" style={styles.playerName}>
                    {playerName}
                  </Heading>
                  <View style={styles.playerMeta}>
                    <Badge variant="subtle" size="sm" rounded>
                      <Caption color="secondary">{player.position || 'N/A'}</Caption>
                    </Badge>
                    {playerAge && (
                      <Caption color="tertiary">• {playerAge} yrs</Caption>
                    )}
                  </View>
                  <Caption color="accent" style={styles.playerClub}>
                    {player.club?.name || 'Free Agent'}
                  </Caption>
                </View>
              </View>

              <View style={styles.playerRight}>
                <View style={styles.ratingContainer}>
                  <LinearGradient
                    colors={[theme.colors.brand.primary + '20', theme.colors.brand.accent + '20']}
                    style={styles.ratingBg}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.ratingText}>{playerRating}</Text>
                  <Caption color="secondary" style={styles.ratingLabel}>
                    RATING
                  </Caption>
                </View>
                <Heading variant="h3" style={styles.priceText}>
                  {marketValue}
                </Heading>
              </View>
            </View>

            {/* Expanded Content */}
            {isExpanded && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={styles.expandedContent}
              >
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="speed"
                      size={20}
                      color={theme.colors.brand.primary}
                    />
                    <Caption color="secondary">Pace</Caption>
                    <Text variant="body" style={styles.statValue}>85</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="sports-soccer"
                      size={20}
                      color={theme.colors.brand.primary}
                    />
                    <Caption color="secondary">Shooting</Caption>
                    <Text variant="body" style={styles.statValue}>78</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="psychology"
                      size={20}
                      color={theme.colors.brand.primary}
                    />
                    <Caption color="secondary">Passing</Caption>
                    <Text variant="body" style={styles.statValue}>82</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="fitness-center"
                      size={20}
                      color={theme.colors.brand.primary}
                    />
                    <Caption color="secondary">Physical</Caption>
                    <Text variant="body" style={styles.statValue}>76</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => navigateToPlayer(player.id)}
                    style={styles.actionButton}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    onPress={() => Haptics.successFeedback()}
                    style={styles.actionButton}
                  >
                    Make Offer
                  </Button>
                </View>
              </Animated.View>
            )}
          </Card>
        </Pressable>
      </Animated.View>
    );
  };

  const renderMarketStats = () => {
    if (statsLoading) {
      return (
        <View style={styles.statsLoadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.brand.primary} />
        </View>
      );
    }

    const statCards = [
      {
        label: 'Total Players',
        value: stats?.availablePlayers || totalCount || 0,
        icon: 'people',
        color: theme.colors.brand.primary,
      },
      {
        label: 'Market Value',
        value: stats?.totalValue || 'N/A',
        icon: 'trending-up',
        color: theme.colors.brand.accent,
      },
      {
        label: 'Avg. Rating',
        value: '78.5',
        icon: 'star',
        color: theme.colors.semantic.warning,
      },
      {
        label: 'New Today',
        value: '+12',
        icon: 'add-circle',
        color: theme.colors.semantic.success,
      },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScroll}
      >
        {statCards.map((stat, index) => (
          <Animated.View
            key={index}
            entering={ZoomIn.delay(index * 100).springify()}
          >
            <Card variant="glass" size="sm" style={styles.statCard}>
              <Ionicons
                name={stat.icon as any}
                size={24}
                color={stat.color}
                style={styles.statIcon}
              />
              <Heading variant="h2" style={styles.statValue}>
                {stat.value}
              </Heading>
              <Caption color="secondary">{stat.label}</Caption>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <View>
              <Heading variant="h1">Transfer Market</Heading>
              <Caption color="secondary">Find your next superstar</Caption>
            </View>
            <Pressable
              onPress={() => {
                Haptics.lightImpact();
                // navigation.navigate('Filters');
              }}
            >
              <Ionicons
                name="options"
                size={24}
                color={theme.colors.text.secondary}
              />
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && players.length > 0}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brand.primary}
          />
        }
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Search Bar */}
        <Animated.View
          style={[styles.searchContainer, searchAnimatedStyle]}
          entering={FadeInDown.delay(200).springify()}
        >
          <Card variant="glass" size="md">
            <View style={styles.searchContent}>
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.text.tertiary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search players..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => {
                  searchFocused.value = withSpring(1);
                }}
                onBlur={() => {
                  searchFocused.value = withSpring(0);
                }}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.lightImpact();
                    setSearchQuery('');
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.colors.text.tertiary}
                  />
                </Pressable>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* Category Filter */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category, index) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryChange(category.id)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
              >
                <LinearGradient
                  colors={
                    selectedCategory === category.id
                      ? [theme.colors.brand.primary, theme.colors.brand.accent]
                      : ['transparent', 'transparent']
                  }
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={
                    selectedCategory === category.id
                      ? theme.colors.text.inverse
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  variant="caption"
                  style={{
                    color:
                      selectedCategory === category.id
                        ? theme.colors.text.inverse
                        : theme.colors.text.secondary,
                  }}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Market Stats */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.statsSection}
        >
          <Heading variant="h3" style={styles.sectionTitle}>
            Market Overview
          </Heading>
          {renderMarketStats()}
        </Animated.View>

        {/* Players List */}
        <View style={styles.playersSection}>
          <View style={styles.sectionHeader}>
            <Heading variant="h3">Available Players</Heading>
            {totalCount > 0 && (
              <Badge variant="gradient" rounded size="sm">
                <Caption style={{ color: theme.colors.text.inverse }}>
                  {totalCount} total
                </Caption>
              </Badge>
            )}
          </View>

          {/* Loading State */}
          {loading && players.length === 0 && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={theme.colors.brand.primary} />
              <Text variant="body" style={styles.loadingText}>
                Loading players...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card variant="glass" size="lg" style={styles.errorState}>
              <Ionicons
                name="alert-circle"
                size={48}
                color={theme.colors.semantic.error}
              />
              <Heading variant="h3">Failed to load players</Heading>
              <Caption color="secondary">{error}</Caption>
              <Button
                variant="primary"
                size="md"
                onPress={handleRefresh}
                style={styles.retryButton}
              >
                Retry
              </Button>
            </Card>
          )}

          {/* Players List */}
          {!loading && !error && players.length > 0 && (
            <View style={styles.playersList}>
              {players.map((player, index) => renderPlayerCard(player, index))}
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && players.length === 0 && (
            <Card variant="glass" size="lg" style={styles.emptyState}>
              <Ionicons
                name="search"
                size={48}
                color={theme.colors.text.tertiary}
              />
              <Heading variant="h3">No players found</Heading>
              <Caption color="secondary" style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No players available at the moment'}
              </Caption>
            </Card>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    paddingTop: theme.layout.safeArea.top,
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  searchContainer: {
    marginTop: theme.layout.safeArea.top + 80,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  categoryContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    minWidth: 100,
    marginRight: theme.spacing.md,
  },
  statIcon: {
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    marginVertical: theme.spacing.xs,
  },
  playersSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  playersList: {
    gap: theme.spacing.md,
  },
  playerCardWrapper: {
    marginBottom: theme.spacing.md,
  },
  playerCard: {
    padding: theme.spacing.lg,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.md,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  playerInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  playerName: {
    marginBottom: theme.spacing.xxs,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  playerClub: {
    marginTop: theme.spacing.xxs,
  },
  playerRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  ratingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  ratingBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.lg,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.brand.primary,
  },
  ratingLabel: {
    fontSize: 8,
    letterSpacing: 1,
    marginTop: theme.spacing.xxs,
  },
  priceText: {
    color: theme.colors.brand.accent,
  },
  expandedContent: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    fontWeight: '700',
    color: theme.colors.brand.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  retryButton: {
    marginTop: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
});

export default MarketScreenNew;