import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Text, Heading, Caption, Badge, theme } from '../../design/components';
import type { Player } from '../../types';

interface PlayerCardProps {
  player: Player;
  onPress?: (playerId: string) => void;
  testID?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onPress, testID }) => {
  const getPlayerName = (): string => {
    return `${player.user?.firstName || ''} ${player.user?.lastName || ''}`.trim() || 'Unknown Player';
  };

  const getPlayerAge = (): number | null => {
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

  const formatMarketValue = (): string => {
    const value = player.marketValue;
    if (!value) return 'N/A';
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const getPlayerRating = (): string => {
    if (player.statsJson && typeof player.statsJson === 'object') {
      const stats = player.statsJson;
      if (stats.overall) return stats.overall.toFixed(1);
      if (stats.rating) return stats.rating.toFixed(1);
    }
    return '75';
  };

  const playerName = getPlayerName();
  const playerAge = getPlayerAge();
  const playerRating = getPlayerRating();
  const marketValue = formatMarketValue();

  return (
    <Pressable
      onPress={() => onPress?.(player.id)}
      testID={testID}
      accessible={true}
      accessibilityLabel={`Player card for ${playerName}`}
    >
      <Card variant="glass" size="lg" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.left}>
            <LinearGradient
              colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.initial} testID={`${testID}-initial`}>
                {playerName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.info}>
              <Heading variant="h3" style={styles.name} testID={`${testID}-name`}>
                {playerName}
              </Heading>
              <View style={styles.meta}>
                <Badge variant="subtle" size="sm" rounded testID={`${testID}-position`}>
                  <Caption color="secondary">{player.position || 'N/A'}</Caption>
                </Badge>
                {playerAge && (
                  <Caption color="tertiary" testID={`${testID}-age`}>
                    • {playerAge} yrs
                  </Caption>
                )}
              </View>
              <Caption color="accent" style={styles.club} testID={`${testID}-club`}>
                {player.club?.name || 'Free Agent'}
              </Caption>
            </View>
          </View>

          <View style={styles.right}>
            <View style={styles.ratingContainer}>
              <LinearGradient
                colors={[theme.colors.brand.primary + '20', theme.colors.brand.accent + '20']}
                style={styles.ratingBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.ratingText} testID={`${testID}-rating`}>
                {playerRating}
              </Text>
              <Caption color="secondary" style={styles.ratingLabel}>
                RATING
              </Caption>
            </View>
            <Heading variant="h3" style={styles.priceText} testID={`${testID}-value`}>
              {marketValue}
            </Heading>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  info: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  name: {
    marginBottom: theme.spacing.xxs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  club: {
    marginTop: theme.spacing.xxs,
  },
  right: {
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
});
