import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Pressable,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  SlideInRight,
  Layout,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Text,
  Heading,
  Caption,
  theme,
} from '../../design/components';
import { usePlayers } from '../../hooks/usePlayers';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useComparison } from '../../contexts/ComparisonContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Player {
  id: string;
  name: string;
  position: string;
  club: string;
  nationality: string;
  age: number;
  rating: number;
  marketValue: string;
  avatar?: string;
  stats: {
    goals: number;
    assists: number;
    matches: number;
  };
}

// Position mappings - comprehensive list
const POSITION_CATEGORIES = {
  forwards: ['ST', 'CF', 'LW', 'RW', 'LF', 'RF'],
  midfielders: ['CAM', 'CM', 'CDM', 'LM', 'RM'],
  defenders: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  goalkeepers: ['GK'],
};

export const PlayersScreenImproved = ({ navigation }: any) => {
  const { players, loading, refreshing, refresh } = usePlayers();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInComparison, toggleComparison, comparisonCount, comparisonPlayerIds } = useComparison();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Animation values
  const searchExpanded = useSharedValue(0);

  // Mock data - in real app, this would come from API
  const mockPlayers: Player[] = [
    // Forwards
    {
      id: '1',
      name: 'Kylian Mbappé',
      position: 'ST',
      club: 'Paris Saint-Germain',
      nationality: 'France',
      age: 25,
      rating: 92,
      marketValue: '€180M',
      stats: { goals: 28, assists: 12, matches: 34 },
    },
    {
      id: '2',
      name: 'Erling Haaland',
      position: 'ST',
      club: 'Manchester City',
      nationality: 'Norway',
      age: 23,
      rating: 91,
      marketValue: '€150M',
      stats: { goals: 35, assists: 8, matches: 38 },
    },
    {
      id: '3',
      name: 'Mohamed Salah',
      position: 'RW',
      club: 'Liverpool',
      nationality: 'Egypt',
      age: 31,
      rating: 90,
      marketValue: '€65M',
      stats: { goals: 25, assists: 15, matches: 35 },
    },
    {
      id: '4',
      name: 'Vinícius Júnior',
      position: 'LW',
      club: 'Real Madrid',
      nationality: 'Brazil',
      age: 23,
      rating: 89,
      marketValue: '€120M',
      stats: { goals: 22, assists: 11, matches: 33 },
    },
    {
      id: '5',
      name: 'Robert Lewandowski',
      position: 'ST',
      club: 'Barcelona',
      nationality: 'Poland',
      age: 35,
      rating: 88,
      marketValue: '€30M',
      stats: { goals: 26, assists: 7, matches: 34 },
    },
    {
      id: '6',
      name: 'Bukayo Saka',
      position: 'RW',
      club: 'Arsenal',
      nationality: 'England',
      age: 22,
      rating: 86,
      marketValue: '€110M',
      stats: { goals: 18, assists: 12, matches: 36 },
    },
    {
      id: '7',
      name: 'Victor Osimhen',
      position: 'CF',
      club: 'Napoli',
      nationality: 'Nigeria',
      age: 25,
      rating: 87,
      marketValue: '€100M',
      stats: { goals: 24, assists: 6, matches: 30 },
    },
    // Midfielders
    {
      id: '8',
      name: 'Jude Bellingham',
      position: 'CM',
      club: 'Real Madrid',
      nationality: 'England',
      age: 20,
      rating: 88,
      marketValue: '€120M',
      stats: { goals: 15, assists: 10, matches: 32 },
    },
    {
      id: '9',
      name: 'Kevin De Bruyne',
      position: 'CAM',
      club: 'Manchester City',
      nationality: 'Belgium',
      age: 32,
      rating: 89,
      marketValue: '€60M',
      stats: { goals: 8, assists: 18, matches: 28 },
    },
    {
      id: '10',
      name: 'Rodri',
      position: 'CDM',
      club: 'Manchester City',
      nationality: 'Spain',
      age: 27,
      rating: 90,
      marketValue: '€110M',
      stats: { goals: 5, assists: 7, matches: 38 },
    },
    {
      id: '11',
      name: 'Martin Ødegaard',
      position: 'CAM',
      club: 'Arsenal',
      nationality: 'Norway',
      age: 25,
      rating: 86,
      marketValue: '€90M',
      stats: { goals: 12, assists: 14, matches: 36 },
    },
    {
      id: '12',
      name: 'Pedri',
      position: 'CM',
      club: 'Barcelona',
      nationality: 'Spain',
      age: 21,
      rating: 85,
      marketValue: '€80M',
      stats: { goals: 6, assists: 9, matches: 32 },
    },
    {
      id: '13',
      name: 'Jamal Musiala',
      position: 'CAM',
      club: 'Bayern Munich',
      nationality: 'Germany',
      age: 21,
      rating: 86,
      marketValue: '€110M',
      stats: { goals: 14, assists: 8, matches: 33 },
    },
    {
      id: '14',
      name: 'Bruno Fernandes',
      position: 'CM',
      club: 'Manchester United',
      nationality: 'Portugal',
      age: 29,
      rating: 87,
      marketValue: '€70M',
      stats: { goals: 11, assists: 13, matches: 37 },
    },
    // Defenders
    {
      id: '15',
      name: 'Virgil van Dijk',
      position: 'CB',
      club: 'Liverpool',
      nationality: 'Netherlands',
      age: 32,
      rating: 89,
      marketValue: '€45M',
      stats: { goals: 3, assists: 2, matches: 30 },
    },
    {
      id: '16',
      name: 'Rúben Dias',
      position: 'CB',
      club: 'Manchester City',
      nationality: 'Portugal',
      age: 27,
      rating: 88,
      marketValue: '€80M',
      stats: { goals: 2, assists: 1, matches: 34 },
    },
    {
      id: '17',
      name: 'Trent Alexander-Arnold',
      position: 'RB',
      club: 'Liverpool',
      nationality: 'England',
      age: 25,
      rating: 87,
      marketValue: '€75M',
      stats: { goals: 4, assists: 12, matches: 35 },
    },
    {
      id: '18',
      name: 'William Saliba',
      position: 'CB',
      club: 'Arsenal',
      nationality: 'France',
      age: 23,
      rating: 85,
      marketValue: '€65M',
      stats: { goals: 2, assists: 0, matches: 36 },
    },
    {
      id: '19',
      name: 'Alphonso Davies',
      position: 'LB',
      club: 'Bayern Munich',
      nationality: 'Canada',
      age: 23,
      rating: 86,
      marketValue: '€70M',
      stats: { goals: 3, assists: 8, matches: 31 },
    },
    {
      id: '20',
      name: 'Joško Gvardiol',
      position: 'CB',
      club: 'Manchester City',
      nationality: 'Croatia',
      age: 22,
      rating: 85,
      marketValue: '€75M',
      stats: { goals: 3, assists: 2, matches: 33 },
    },
    {
      id: '21',
      name: 'Achraf Hakimi',
      position: 'RWB',
      club: 'Paris Saint-Germain',
      nationality: 'Morocco',
      age: 25,
      rating: 86,
      marketValue: '€65M',
      stats: { goals: 5, assists: 7, matches: 35 },
    },
    // Goalkeepers
    {
      id: '22',
      name: 'Alisson Becker',
      position: 'GK',
      club: 'Liverpool',
      nationality: 'Brazil',
      age: 31,
      rating: 90,
      marketValue: '€50M',
      stats: { goals: 0, assists: 0, matches: 35 },
    },
    {
      id: '23',
      name: 'Thibaut Courtois',
      position: 'GK',
      club: 'Real Madrid',
      nationality: 'Belgium',
      age: 31,
      rating: 89,
      marketValue: '€45M',
      stats: { goals: 0, assists: 0, matches: 32 },
    },
    {
      id: '24',
      name: 'Marc-André ter Stegen',
      position: 'GK',
      club: 'Barcelona',
      nationality: 'Germany',
      age: 31,
      rating: 88,
      marketValue: '€40M',
      stats: { goals: 0, assists: 0, matches: 36 },
    },
    {
      id: '25',
      name: 'Ederson',
      position: 'GK',
      club: 'Manchester City',
      nationality: 'Brazil',
      age: 30,
      rating: 89,
      marketValue: '€50M',
      stats: { goals: 0, assists: 1, matches: 37 },
    },
  ];

  // Filter players based on active tab and selected position
  const filteredPlayers = useMemo(() => {
    let result = mockPlayers;

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter(player => isFavorite(player.id));
    }

    // Filter by tab category
    if (activeTab !== 'all') {
      const positions = POSITION_CATEGORIES[activeTab as keyof typeof POSITION_CATEGORIES];
      if (positions) {
        result = result.filter(player => positions.includes(player.position));
      }
    }

    // Filter by specific position
    if (selectedPosition) {
      result = result.filter(player => player.position === selectedPosition);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.club.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeTab, selectedPosition, searchQuery, mockPlayers, showFavoritesOnly, isFavorite]);

  // Calculate counts for tabs
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: mockPlayers.length,
    };

    Object.entries(POSITION_CATEGORIES).forEach(([category, positions]) => {
      counts[category] = mockPlayers.filter(p => positions.includes(p.position)).length;
    });

    return counts;
  }, [mockPlayers]);

  const tabs = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'forwards', label: 'Forwards', count: tabCounts.forwards },
    { key: 'midfielders', label: 'Midfielders', count: tabCounts.midfielders },
    { key: 'defenders', label: 'Defenders', count: tabCounts.defenders },
    { key: 'goalkeepers', label: 'GK', count: tabCounts.goalkeepers },
  ];

  // Position quick filters
  const positions = activeTab === 'all' ? [
    { id: 'ST', label: 'Striker', icon: 'soccer', color: theme.colors.semantic.error },
    { id: 'CAM', label: 'Attacking Mid', icon: 'trending-up', color: theme.colors.brand.primary },
    { id: 'CM', label: 'Central Mid', icon: 'compass', color: theme.colors.semantic.info },
    { id: 'CDM', label: 'Defensive Mid', icon: 'shield-half', color: theme.colors.semantic.warning },
    { id: 'CB', label: 'Center Back', icon: 'shield', color: theme.colors.semantic.success },
    { id: 'RB', label: 'Right Back', icon: 'arrow-right', color: theme.colors.text.secondary },
    { id: 'LB', label: 'Left Back', icon: 'arrow-left', color: theme.colors.text.secondary },
    { id: 'GK', label: 'Goalkeeper', icon: 'hand-back-right', color: theme.colors.brand.accent },
  ] : activeTab === 'forwards' ? [
    { id: 'ST', label: 'Striker', icon: 'soccer', color: theme.colors.semantic.error },
    { id: 'CF', label: 'Center Forward', icon: 'soccer', color: theme.colors.semantic.error },
    { id: 'RW', label: 'Right Wing', icon: 'arrow-right', color: theme.colors.brand.primary },
    { id: 'LW', label: 'Left Wing', icon: 'arrow-left', color: theme.colors.brand.primary },
  ] : activeTab === 'midfielders' ? [
    { id: 'CAM', label: 'Attacking Mid', icon: 'trending-up', color: theme.colors.brand.primary },
    { id: 'CM', label: 'Central Mid', icon: 'compass', color: theme.colors.semantic.info },
    { id: 'CDM', label: 'Defensive Mid', icon: 'shield-half', color: theme.colors.semantic.warning },
  ] : activeTab === 'defenders' ? [
    { id: 'CB', label: 'Center Back', icon: 'shield', color: theme.colors.semantic.success },
    { id: 'RB', label: 'Right Back', icon: 'arrow-right', color: theme.colors.text.secondary },
    { id: 'LB', label: 'Left Back', icon: 'arrow-left', color: theme.colors.text.secondary },
    { id: 'RWB', label: 'Right Wing Back', icon: 'trending-up', color: theme.colors.brand.accent },
    { id: 'LWB', label: 'Left Wing Back', icon: 'trending-down', color: theme.colors.brand.accent },
  ] : [];

  const handleSearchFocus = () => {
    searchExpanded.value = withSpring(1, theme.animations.springs.bouncy);
    Haptics.selectionAsync();
  };

  const handleSearchBlur = () => {
    searchExpanded.value = withSpring(0, theme.animations.springs.gentle);
  };

  const handleAddPlayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Add New Player',
      'Would you like to add a new player to the database?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Player',
          onPress: () => {
            // Navigate to AddPlayer screen when implemented
            Alert.alert('Coming Soon', 'Player addition feature will be available soon!');
          }
        },
      ]
    );
  };

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          searchExpanded.value,
          [0, 1],
          [1, 1.02],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return theme.colors.brand.primary;
    if (rating >= 75) return theme.colors.semantic.success;
    if (rating >= 65) return theme.colors.semantic.warning;
    return theme.colors.text.secondary;
  };

  const renderPlayerCard = (player: Player, index: number) => {
    const isFav = isFavorite(player.id);
    const isComp = isInComparison(player.id);

    return (
      <Animated.View
        key={player.id}
        entering={SlideInRight.delay(index * 50).springify()}
        layout={Layout.springify()}
      >
        <Card
          variant="glass"
          size="lg"
          style={styles.playerCard}
          glowOnPress
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Navigate to player passport
            navigation.navigate('PlayerPassport', {
              playerId: player.id,
              player: player
            });
          }}
        >
          <View style={styles.playerCardContent}>
            <Avatar
              source={player.avatar}
              name={player.name}
              size="lg"
              gradient
            />

            <View style={styles.playerInfo}>
              <View style={styles.playerHeader}>
                <Heading variant="h4" style={styles.playerName}>
                  {player.name}
                </Heading>
                <View
                  style={[
                    styles.ratingBadge,
                    { backgroundColor: getRatingColor(player.rating) + '20' },
                  ]}
                >
                  <Text
                    weight="bold"
                    style={[styles.ratingText, { color: getRatingColor(player.rating) }]}
                  >
                    {player.rating}
                  </Text>
                </View>
              </View>

              <View style={styles.playerMeta}>
                <Badge variant="default" size="sm">
                  {player.position}
                </Badge>
                <Caption color="secondary" style={styles.playerClub}>
                  {player.club}
                </Caption>
              </View>

              <View style={styles.playerStats}>
                <View style={styles.stat}>
                  <Ionicons name="football" size={14} color={theme.colors.text.secondary} />
                  <Caption>{player.stats.goals}</Caption>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="trending-up" size={14} color={theme.colors.text.secondary} />
                  <Caption>{player.stats.assists}</Caption>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="shirt" size={14} color={theme.colors.text.secondary} />
                  <Caption>{player.stats.matches}</Caption>
                </View>
              </View>
            </View>

            <View style={styles.playerAction}>
              <Text variant="caption" color="tertiary" style={styles.marketValue}>
                Market Value
              </Text>
              <Text weight="bold" style={styles.marketValueAmount}>
                {player.marketValue}
              </Text>

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleFavorite(player.id);
                  }}
                >
                  <Ionicons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFav ? theme.colors.semantic.error : theme.colors.text.tertiary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleComparison(player.id);
                  }}
                >
                  <MaterialCommunityIcons
                    name={isComp ? 'compare' : 'compare-horizontal'}
                    size={22}
                    color={isComp ? theme.colors.brand.primary : theme.colors.text.tertiary}
                  />
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </View>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderTabButton = (tab: any, index: number) => {
    const isActive = activeTab === tab.key;

    return (
      <Pressable
        key={tab.key}
        onPress={() => {
          Haptics.selectionAsync();
          setActiveTab(tab.key);
          setSelectedPosition(null); // Reset position filter when changing tabs
        }}
        style={[
          styles.tabButton,
          isActive && styles.tabButtonActive,
        ]}
      >
        {isActive && (
          <LinearGradient
            colors={[theme.colors.brand.primary + '30', theme.colors.brand.accent + '30']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        )}
        <Text
          variant="body"
          weight={isActive ? 'bold' : 'medium'}
          style={{
            color: isActive ? theme.colors.brand.primary : theme.colors.text.secondary,
          }}
        >
          {tab.label}
        </Text>
        {tab.count > 0 && (
          <Badge
            variant={isActive ? 'gradient' : 'subtle'}
            size="sm"
            rounded
            style={styles.tabBadge}
          >
            <Text style={styles.tabBadgeText}>{tab.count}</Text>
          </Badge>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Heading variant="h1">Players</Heading>
            <Caption color="secondary">Manage your squad</Caption>
          </View>

          <View style={styles.headerActions}>
            {/* Favorites Filter Toggle */}
            <TouchableOpacity
              style={[styles.headerButton, showFavoritesOnly && styles.headerButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
            >
              <Ionicons
                name={showFavoritesOnly ? 'heart' : 'heart-outline'}
                size={20}
                color={showFavoritesOnly ? theme.colors.semantic.error : theme.colors.text.secondary}
              />
            </TouchableOpacity>

            {/* Comparison Button */}
            {comparisonCount > 0 && (
              <TouchableOpacity
                style={[styles.headerButton, styles.comparisonButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('PlayerComparison');
                }}
              >
                <MaterialCommunityIcons
                  name="compare"
                  size={20}
                  color={theme.colors.brand.primary}
                />
                <Badge variant="gradient" size="sm" rounded style={styles.comparisonBadge}>
                  <Text style={styles.comparisonBadgeText}>{comparisonCount}</Text>
                </Badge>
              </TouchableOpacity>
            )}

            {/* Add Player Button */}
            <Button
              variant="gradient"
              size="sm"
              onPress={handleAddPlayer}
              icon={<Ionicons name="add" size={20} color={theme.colors.text.inverse} />}
            >
              Add
            </Button>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.searchContainer, searchAnimatedStyle]}
        >
          <Input
            placeholder="Search players, clubs, positions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            icon={<Ionicons name="search" size={20} color={theme.colors.text.tertiary} />}
            rightIcon={
              searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
                </Pressable>
              ) : null
            }
            variant="filled"
            size="lg"
          />
        </Animated.View>

        {/* Tabs - Improved visibility */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {tabs.map((tab, index) => renderTabButton(tab, index))}
          </ScrollView>
        </Animated.View>

        {/* Position Filter - Only show when there are positions to filter */}
        {positions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.positionsScroll}
            >
              {positions.map((position, index) => (
              <AnimatedPressable
                key={position.id}
                entering={ZoomIn.delay(index * 50)}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPosition(position.id === selectedPosition ? null : position.id);
                }}
                style={[
                  styles.positionCard,
                  selectedPosition === position.id && styles.positionCardActive,
                ]}
              >
                <LinearGradient
                  colors={
                    selectedPosition === position.id
                      ? [position.color, position.color + '80']
                      : ['transparent', 'transparent']
                  }
                  style={styles.positionGradient}
                >
                  <MaterialCommunityIcons
                    name={position.icon as any}
                    size={24}
                    color={
                      selectedPosition === position.id
                        ? theme.colors.text.inverse
                        : position.color
                    }
                  />
                  <Caption
                    color={selectedPosition === position.id ? 'inverse' : 'secondary'}
                  >
                    {position.label}
                  </Caption>
                </LinearGradient>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </Animated.View>
        )}

        {/* Players List */}
        <View style={styles.playersList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text color="secondary">Loading players...</Text>
            </View>
          ) : filteredPlayers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={theme.colors.text.tertiary} />
              <Heading variant="h3">No players found</Heading>
              <Caption color="secondary">Try adjusting your filters or search</Caption>
            </View>
          ) : (
            filteredPlayers.map((player, index) => renderPlayerCard(player, index))
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.layout.safeArea.top + theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: theme.colors.semantic.error + '20',
    borderColor: theme.colors.semantic.error + '40',
  },
  comparisonButton: {
    position: 'relative',
  },
  comparisonBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
  },
  comparisonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tabsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  tabButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginRight: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    overflow: 'hidden',
  },
  tabButtonActive: {
    borderColor: theme.colors.brand.primary + '50',
    backgroundColor: theme.colors.surface.elevated,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  positionsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  positionCard: {
    marginRight: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  positionCardActive: {
    transform: [{ scale: 1.05 }],
  },
  positionGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radius.lg,
  },
  playersList: {
    paddingHorizontal: theme.spacing.lg,
    minHeight: 200,
  },
  loadingContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  playerCard: {
    marginBottom: theme.spacing.md,
  },
  playerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  playerName: {
    flex: 1,
  },
  ratingBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radius.md,
  },
  ratingText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold as any,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  playerClub: {
    flex: 1,
  },
  playerStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  playerAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  marketValue: {
    marginBottom: theme.spacing.xxs,
  },
  marketValueAmount: {
    color: theme.colors.brand.primary,
    fontSize: theme.typography.sizes.lg,
    marginBottom: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
});

export default PlayersScreenImproved;