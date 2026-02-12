/**
 * LEADERBOARDS SCREEN
 * Display leaderboards with podium, rankings, and filters
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Filter, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import { useLeaderboard } from '../../hooks/useGamification';
import { LeaderboardItem } from './components';
import type { LeaderboardEntry } from '../../types/gamification';
import { LeaderboardType } from '../../types/gamification';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const LEADERBOARD_TABS = [
  { id: LeaderboardType.ALL_TIME, label: 'All Time XP' },
  { id: LeaderboardType.WEEKLY_SCOUT, label: 'Weekly Scouts' },
  { id: LeaderboardType.WEEKLY_OVERALL, label: 'Weekly Overall' },
  { id: LeaderboardType.MONTHLY_PLAYER, label: 'Monthly Players' },
  { id: LeaderboardType.SEASON_CLUB, label: 'Club Season' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const LeaderboardsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<LeaderboardType>(
    LeaderboardType.ALL_TIME
  );
  const [filters, setFilters] = useState<any>({});
  const flatListRef = useRef<FlatList>(null);

  const { data: entries, isLoading, refetch, isRefetching } = useLeaderboard(
    selectedTab,
    filters
  );

  const currentUserId = user?.id;

  // Find current user position
  const currentUserEntry = currentUserId
    ? entries?.find((e) => e.userId === currentUserId)
    : undefined;
  const currentUserIndex =
    currentUserId && entries
      ? entries.findIndex((e) => e.userId === currentUserId)
      : -1;

  // Top 3 for podium
  const topThree = entries?.slice(0, 3) || [];

  // Remaining entries (after top 3)
  const remainingEntries = entries?.slice(3) || [];

  const handleTabPress = (tab: LeaderboardType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  };

  const handleScrollToUser = () => {
    if (currentUserIndex !== undefined && currentUserIndex >= 0 && flatListRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Offset for podium height + current user card
      flatListRef.current.scrollToIndex({
        index: Math.max(0, currentUserIndex - 3),
        animated: true,
      });
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
          <Text style={styles.headerTitle}>Leaderboards</Text>
          <Text style={styles.headerSubtitle}>Compete with top scouts worldwide</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={tokens.colors.yellow.DEFAULT} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={LEADERBOARD_TABS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tabsContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabPress(item.id)}
            style={[
              styles.tab,
              selectedTab === item.id && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === item.id && styles.tabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        ref={flatListRef}
        data={remainingEntries}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Podium */}
            {topThree.length > 0 && (
              <View style={styles.podiumContainer}>
                <Podium entries={topThree} />
              </View>
            )}

            {/* Current User Position (Sticky) */}
                {currentUserEntry && currentUserEntry.rank > 3 && (
              <View style={styles.currentUserContainer}>
                <Text style={styles.yourPositionLabel}>Your Position</Text>
                <LeaderboardItem
                  entry={currentUserEntry}
                  isCurrentUser={true}
                  style={styles.currentUserCard}
                />
                <TouchableOpacity
                  style={styles.scrollToButton}
                  onPress={handleScrollToUser}
                >
                  <Text style={styles.scrollToText}>View in List</Text>
                </TouchableOpacity>
              </View>
            )}

            {remainingEntries.length > 0 && (
              <Text style={styles.listTitle}>All Rankings</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <LeaderboardItem
                  entry={item}
                  isCurrentUser={currentUserId === item.userId}
            onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            style={styles.leaderboardItem}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyDescription}>
              Complete activities to climb the leaderboard
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
// PODIUM COMPONENT
// ============================================================================

interface PodiumProps {
  entries: LeaderboardEntry[];
}

const Podium: React.FC<PodiumProps> = ({ entries }) => {
  const [first, second, third] = entries;

  return (
    <View style={styles.podium}>
      {/* Second Place */}
      {second && (
        <View style={[styles.podiumSlot, styles.podiumSecond]}>
          <PodiumPlace entry={second} rank={2} />
        </View>
      )}

      {/* First Place */}
      {first && (
        <View style={[styles.podiumSlot, styles.podiumFirst]}>
          <View style={styles.crown}>
            <Text style={styles.crownIcon}>👑</Text>
          </View>
          <PodiumPlace entry={first} rank={1} />
        </View>
      )}

      {/* Third Place */}
      {third && (
        <View style={[styles.podiumSlot, styles.podiumThird]}>
          <PodiumPlace entry={third} rank={3} />
        </View>
      )}
    </View>
  );
};

interface PodiumPlaceProps {
  entry: LeaderboardEntry;
  rank: number;
}

const PodiumPlace: React.FC<PodiumPlaceProps> = ({ entry, rank }) => {
  const medals = {
    1: { icon: '🥇', color: tokens.colors.feature.gamification },
    2: { icon: '🥈', color: tokens.colors.gray[300] },
    3: { icon: '🥉', color: '#CD7F32' },
  };

  const medal = medals[rank as keyof typeof medals];

  return (
    <View style={styles.podiumPlace}>
      {/* Avatar */}
      <View style={[styles.podiumAvatar, { borderColor: medal.color }]}>
        {entry.avatar ? (
          <Image source={{ uri: entry.avatar }} style={styles.podiumAvatarImage} />
        ) : (
          <View style={styles.podiumAvatarPlaceholder}>
            <Text style={styles.podiumAvatarInitial}>
              {entry.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Medal */}
      <View style={styles.podiumMedal}>
        <Text style={styles.podiumMedalIcon}>{medal.icon}</Text>
      </View>

      {/* Name */}
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.name}
      </Text>

      {/* XP */}
      <Text style={[styles.podiumXP, { color: medal.color }]}>
        {formatXP(entry.xp)} XP
      </Text>

      {/* Stand */}
      <View
        style={[
          styles.podiumStand,
          { backgroundColor: `${medal.color}20`, borderColor: medal.color },
        ]}
      >
        <Text style={[styles.podiumRank, { color: medal.color }]}>{rank}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

const formatXP = (xp: number): string => {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
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
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  tabActive: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  tabText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.gray[300],
  },
  tabTextActive: {
    color: tokens.colors.arcane.black,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  podiumContainer: {
    marginBottom: 24,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 24,
  },
  podiumSlot: {
    flex: 1,
    maxWidth: 120,
  },
  podiumFirst: {
    zIndex: 3,
  },
  podiumSecond: {
    zIndex: 2,
    marginTop: 32,
  },
  podiumThird: {
    zIndex: 1,
    marginTop: 48,
  },
  crown: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    zIndex: 10,
  },
  crownIcon: {
    fontSize: 32,
  },
  podiumPlace: {
    alignItems: 'center',
  },
  podiumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    borderWidth: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  podiumAvatarImage: {
    width: '100%',
    height: '100%',
  },
  podiumAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatarInitial: {
    ...typography.heading2,
    color: tokens.colors.gray[300],
  },
  podiumMedal: {
    position: 'absolute',
    top: 60,
    right: 4,
    backgroundColor: tokens.colors.arcane.black,
    borderRadius: 9999,
    padding: 2,
  },
  podiumMedalIcon: {
    fontSize: 24,
  },
  podiumName: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumXP: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: 8,
  },
  podiumStand: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  podiumRank: {
    ...typography.heading2,
    fontWeight: '900',
  },
  currentUserContainer: {
    marginBottom: 16,
  },
  yourPositionLabel: {
    ...typography.caption,
    color: tokens.colors.yellow.DEFAULT,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  currentUserCard: {
    marginBottom: 8,
  },
  scrollToButton: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scrollToText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textDecorationLine: 'underline',
  },
  listTitle: {
    ...typography.heading5,
    marginBottom: 12,
    color: tokens.colors.text.secondary,
  },
  leaderboardItem: {
    marginBottom: 8,
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

export default LeaderboardsScreen;
