/**
 * LEADERBOARD ITEM COMPONENT
 * Displays individual leaderboard entry with rank, avatar, and stats
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../../design';
import type { LeaderboardEntry } from '../../../types/gamification';
import { TrendDirection } from '../../../types/gamification';

// ============================================================================
// TYPES
// ============================================================================

export interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// MEDAL CONFIG
// ============================================================================

const MEDAL_CONFIG = {
  1: { icon: '🥇', color: tokens.colors.feature.gamification },
  2: { icon: '🥈', color: tokens.colors.gray[300] },
  3: { icon: '🥉', color: '#CD7F32' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  entry,
  isCurrentUser = false,
  onPress,
  style,
}) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const formatScore = (xp: number): string => {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    }
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  };

  const periodLabel = entry.period ? entry.period.replace('-', ' · ') : '';
  const scoreMetric = (entry.scoreLabel || 'pts').toUpperCase();

  const medal = MEDAL_CONFIG[entry.rank as keyof typeof MEDAL_CONFIG];
  const showMedal = entry.rank <= 3;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        isCurrentUser && styles.containerHighlight,
        style,
      ]}
    >
      {/* Rank / Medal */}
      <View style={styles.rankContainer}>
        {showMedal ? (
          <Text style={styles.medal}>{medal.icon}</Text>
        ) : (
          <Text style={[styles.rank, isCurrentUser && styles.rankHighlight]}>
            {entry.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {entry.avatar ? (
          <Image source={{ uri: entry.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {entry.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, isCurrentUser && styles.nameHighlight]}
            numberOfLines={1}
          >
            {entry.name}
            {isCurrentUser && ' (You)'}
          </Text>
          <View style={styles.levelBadge}>
            <Trophy size={12} color={tokens.colors.gray[400]} />
            <Text style={styles.level}>{scoreMetric}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.xp}>
            {formatScore(entry.score)} {entry.scoreLabel}
          </Text>
          {periodLabel ? (
            <>
              <Text style={styles.divider}>•</Text>
              <Text style={styles.achievements}>{periodLabel}</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Trend Indicator */}
      {entry.trend && entry.trend !== TrendDirection.SAME && (
        <View style={styles.trendContainer}>
          {entry.trend === TrendDirection.UP ? (
            <TrendingUp size={16} color={tokens.colors.semantic.success} />
          ) : (
            <TrendingDown size={16} color={tokens.colors.semantic.error} />
          )}
          {entry.trendChange !== undefined && (
            <Text
              style={[
                styles.trendText,
                entry.trend === TrendDirection.UP
                  ? styles.trendUp
                  : styles.trendDown,
              ]}
            >
              {entry.trendChange}
            </Text>
          )}
        </View>
      )}
    </Container>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  containerHighlight: {
    backgroundColor: `${tokens.colors.yellow.DEFAULT}10`,
    borderColor: tokens.colors.yellow.DEFAULT,
    borderWidth: 1.5,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rank: {
    ...typography.heading4,
    color: tokens.colors.gray[400],
    fontWeight: '700',
  },
  rankHighlight: {
    color: tokens.colors.yellow.DEFAULT,
  },
  medal: {
    fontSize: 28,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: tokens.colors.surface.borderLight,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...typography.heading5,
    color: tokens.colors.gray[300],
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    ...typography.bodyBase,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  nameHighlight: {
    color: tokens.colors.yellow.DEFAULT,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.arcane.slate,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  level: {
    ...typography.caption,
    fontWeight: '600',
    color: tokens.colors.gray[300],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xp: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.yellow.DEFAULT,
  },
  divider: {
    ...typography.bodySmall,
    color: tokens.colors.gray[500],
  },
  achievements: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  trendContainer: {
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  trendUp: {
    color: tokens.colors.semantic.success,
  },
  trendDown: {
    color: tokens.colors.semantic.error,
  },
});
