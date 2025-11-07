import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Pressable,
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
  Tabs,
  Text,
  Heading,
  Caption,
  theme,
} from '../../design/components';
import { usePlayers } from '../../hooks/usePlayers';

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

export const PlayersScreenNew = ({ navigation }: any) => {
  const { players, loading, refreshing, refresh } = usePlayers();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(1);
  const searchExpanded = useSharedValue(0);

  const tabs = [
    { key: 'all', label: 'All Players', icon: <Ionicons name="people" size={16} /> },
    { key: 'forwards', label: 'Forwards', badge: 12 },
    { key: 'midfielders', label: 'Midfielders', badge: 18 },
    { key: 'defenders', label: 'Defenders', badge: 15 },
    { key: 'goalkeepers', label: 'Goalkeepers', badge: 5 },
  ];

  const positions = [
    { id: 'ST', label: 'Striker', icon: 'soccer', color: theme.colors.semantic.error },
    { id: 'CAM', label: 'Attacking Mid', icon: 'strategy', color: theme.colors.brand.primary },
    { id: 'CM', label: 'Central Mid', icon: 'compass', color: theme.colors.semantic.info },
    { id: 'CB', label: 'Center Back', icon: 'shield', color: theme.colors.semantic.success },
    { id: 'GK', label: 'Goalkeeper', icon: 'hand-back-right', color: theme.colors.brand.accent },
  ];

  const handleSearchFocus = () => {
    searchExpanded.value = withSpring(1, theme.animations.springs.bouncy);
    Haptics.selectionAsync();
  };

  const handleSearchBlur = () => {
    searchExpanded.value = withSpring(0, theme.animations.springs.gentle);
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

  const renderPlayerCard = (player: Player, index: number) => {
    const getRatingColor = (rating: number) => {
      if (rating >= 85) return theme.colors.brand.primary;
      if (rating >= 75) return theme.colors.semantic.success;
      if (rating >= 65) return theme.colors.semantic.warning;
      return theme.colors.text.secondary;
    };

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
            navigation.navigate('PlayerDetail', { playerId: player.id });
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
                  <Ionicons
                    name="football"
                    size={14}
                    color={theme.colors.text.secondary}
                  />
                  <Caption>{player.stats.goals}</Caption>
                </View>
                <View style={styles.stat}>
                  <Ionicons
                    name="trending-up"
                    size={14}
                    color={theme.colors.text.secondary}
                  />
                  <Caption>{player.stats.assists}</Caption>
                </View>
                <View style={styles.stat}>
                  <Ionicons
                    name="shirt"
                    size={14}
                    color={theme.colors.text.secondary}
                  />
                  <Caption>{player.stats.matches}</Caption>
                </View>
              </View>
            </View>

            <View style={styles.playerAction}>
              <Text
                variant="caption"
                color="tertiary"
                style={styles.marketValue}
              >
                Market Value
              </Text>
              <Text weight="bold" style={styles.marketValueAmount}>
                {player.marketValue}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.tertiary}
              />
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background */}
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
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <Heading variant="h1">Players</Heading>
          <Badge variant="gradient" rounded>
            <Text style={styles.totalBadge}>500+ Elite Players</Text>
          </Badge>
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

        {/* Position Filter */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
        >
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
                  setSelectedPosition(
                    position.id === selectedPosition ? null : position.id
                  );
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

        {/* Tabs */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.tabsContainer}
        >
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="pills"
            scrollable
          />
        </Animated.View>

        {/* Players List */}
        <View style={styles.playersList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text color="secondary">Loading players...</Text>
            </View>
          ) : (
            <>
              {/* Mock data for demonstration */}
              {[
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
                  name: 'Jude Bellingham',
                  position: 'CM',
                  club: 'Real Madrid',
                  nationality: 'England',
                  age: 20,
                  rating: 88,
                  marketValue: '€120M',
                  stats: { goals: 15, assists: 10, matches: 32 },
                },
              ].map((player, index) => renderPlayerCard(player, index))}
            </>
          )}
        </View>

        {/* Floating Action Button */}
        <Animated.View
          entering={ZoomIn.delay(500).springify()}
          style={styles.fab}
        >
          <Button
            variant="gradient"
            size="lg"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('AddPlayer');
            }}
            icon={<Ionicons name="add" size={24} color={theme.colors.text.inverse} />}
          >
            Add Player
          </Button>
        </Animated.View>
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
  totalBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  positionsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
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
  tabsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
  },
  playersList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['6xl'],
  },
  loadingContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
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
    fontWeight: theme.typography.weights.bold,
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
  fab: {
    position: 'absolute',
    bottom: theme.spacing['4xl'],
    right: theme.spacing.lg,
    ...theme.shadows.xl,
  },
});

export default PlayersScreenNew;