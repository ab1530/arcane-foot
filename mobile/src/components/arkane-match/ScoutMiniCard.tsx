import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '../../design/theme';
import type { Scout } from '../../types/arkane-match';

interface ScoutMiniCardProps {
  scout: Scout;
  onPress?: () => void;
}

export const ScoutMiniCard: React.FC<ScoutMiniCardProps> = ({ scout, onPress }) => {
  const scoutName = `${scout.users.firstName} ${scout.users.lastName}`;
  const rating = scout.stats?.avgRating || 0;
  const totalReviews = scout.stats?.totalReviews || 0;
  const hourlyRate = scout.hourlyRate || 0;
  const currency = scout.currency || 'EUR';

  // Get primary expertise (first 2 leagues or positions)
  const leagues = scout.expertise?.leagues?.slice(0, 2) || [];
  const positions = scout.expertise?.positions?.slice(0, 3) || [];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {scout.users.avatar ? (
            <Image source={{ uri: scout.users.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {scout.users.firstName[0]}{scout.users.lastName[0]}
              </Text>
            </View>
          )}
          {scout.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          {/* Name & Rating */}
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {scoutName}
            </Text>
            {rating > 0 && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>
                  {rating.toFixed(1)}
                  {totalReviews > 0 && (
                    <Text style={styles.reviewCount}> ({totalReviews})</Text>
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Headline */}
          {scout.headline && (
            <Text style={styles.headline} numberOfLines={1}>
              {scout.headline}
            </Text>
          )}

          {/* Expertise Tags */}
          <View style={styles.expertiseContainer}>
            {leagues.map((league, index) => (
              <View key={`league-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{league}</Text>
              </View>
            ))}
            {positions.map((position, index) => (
              <View key={`position-${index}`} style={[styles.tag, styles.tagSecondary]}>
                <Text style={styles.tagText}>{position}</Text>
              </View>
            ))}
          </View>

          {/* Rate */}
          {hourlyRate > 0 && (
            <Text style={styles.rate}>
              {currency}{hourlyRate}/hr
            </Text>
          )}
        </View>
      </View>

      {/* Action Indicator */}
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    ...shadows.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface.glass,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.background.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.tertiary,
  },
  verifiedIcon: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingStar: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
  },
  ratingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  reviewCount: {
    color: colors.text.tertiary,
  },
  headline: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  tagSecondary: {
    backgroundColor: colors.surface.glassMedium,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  tagText: {
    fontSize: typography.sizes.xxs,
    fontWeight: typography.weights.medium,
    color: colors.background.primary,
  },
  rate: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.brand.primary,
  },
  arrow: {
    marginLeft: spacing.sm,
  },
  arrowText: {
    fontSize: typography.sizes.xl,
    color: colors.text.tertiary,
  },
});
