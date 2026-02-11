import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { ComparablePlayer } from '../../types/market-value';

export interface ComparablePlayerCardProps {
  player: ComparablePlayer;
  onPress?: () => void;
}

export const ComparablePlayerCard: React.FC<ComparablePlayerCardProps> = ({
  player,
  onPress,
}) => {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.85) return colors.semantic.success;
    if (similarity >= 0.7) return colors.brand.primary;
    if (similarity >= 0.5) return colors.semantic.warning;
    return colors.semantic.error;
  };

  const formatValue = (value: number) => {
    return `€${value.toFixed(1)}M`;
  };

  const similarityPercentage = Math.round(player.similarity_score * 100);
  const similarityColor = getSimilarityColor(player.similarity_score);

  const CardContent = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.playerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {player.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.nameText} numberOfLines={1}>
              {player.name}
            </Text>
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>{player.position}</Text>
              <View style={styles.separator} />
              <Text style={styles.metaText}>{player.age} yrs</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>Value</Text>
          <Text style={styles.valueText}>{formatValue(player.market_value)}</Text>
        </View>

        <View style={styles.similarityContainer}>
          <View
            style={[
              styles.similarityBadge,
              { backgroundColor: similarityColor + '20', borderColor: similarityColor },
            ]}
          >
            <Text style={[styles.similarityText, { color: similarityColor }]}>
              {similarityPercentage}% Match
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.wrapper}>
        <GlassCard variant="bordered">{CardContent}</GlassCard>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrapper}>
      <GlassCard variant="bordered">{CardContent}</GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  container: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  details: {
    flex: 1,
  },
  nameText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  valueContainer: {
    flex: 1,
  },
  valueLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  similarityContainer: {
    alignItems: 'flex-end',
  },
  similarityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  similarityText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
});
