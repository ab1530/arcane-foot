import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Star, Heart, MapPin, BadgeCheck } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design/theme';
import ExpertiseBadge from './ExpertiseBadge';
import type { MarketplaceListing } from '../../types/marketplace';

interface ScoutCardProps {
  listing: MarketplaceListing;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

const ScoutCard: React.FC<ScoutCardProps> = ({
  listing,
  onPress,
  onFavorite,
  isFavorite = false,
}) => {
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleFavorite = () => {
    favoriteScale.value = withSpring(1.3, { damping: 8, stiffness: 200 }, () => {
      favoriteScale.value = withSpring(1, { damping: 10, stiffness: 180 });
    });
    onFavorite?.();
  };

  const formatPrice = () => {
    const { pricing } = listing;
    if (pricing.hourlyRate) {
      return `${pricing.currency} ${pricing.hourlyRate}/hr`;
    }
    if (pricing.matchRate) {
      return `${pricing.currency} ${pricing.matchRate}/match`;
    }
    if (pricing.reportRate) {
      return `${pricing.currency} ${pricing.reportRate}/report`;
    }
    return 'Contact for pricing';
  };

  const getAvatarUri = () => {
    return listing.scout.user.avatar || `https://ui-avatars.com/api/?name=${listing.scout.user.firstName}+${listing.scout.user.lastName}&background=E4FF3B&color=080C1D&size=200`;
  };

  const displayExpertise = listing.expertise.leagues.slice(0, 3);
  const moreCount = listing.expertise.leagues.length - 3;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Header with Avatar and Basic Info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: getAvatarUri() }}
              style={styles.avatar}
              resizeMode="cover"
            />
            {listing.scout.isVerified && (
              <View style={styles.verifiedBadge}>
                <BadgeCheck size={16} color={colors.brand.primary} fill={colors.brand.primary} />
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {listing.scout.user.firstName} {listing.scout.user.lastName}
            </Text>
            <Text style={styles.headline} numberOfLines={2}>
              {listing.headline}
            </Text>

            {/* Location */}
            {listing.scout.user.country && (
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.text.tertiary} />
                <Text style={styles.locationText}>{listing.scout.user.country}</Text>
              </View>
            )}
          </View>

          {/* Favorite Button */}
          {onFavorite && (
            <Animated.View style={favoriteAnimatedStyle}>
              <TouchableOpacity
                onPress={handleFavorite}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.favoriteButton}
              >
                <Heart
                  size={20}
                  color={isFavorite ? colors.semantic.error : colors.text.tertiary}
                  fill={isFavorite ? colors.semantic.error : 'transparent'}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Star size={14} color={colors.semantic.warning} fill={colors.semantic.warning} />
            <Text style={styles.statText}>
              {listing.stats.avgRating.toFixed(1)} ({listing.stats.totalReviews})
            </Text>
          </View>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statText}>{listing.stats.totalReports} reports</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statText}>{listing.stats.completedOffers} completed</Text>
        </View>

        {/* Expertise Tags */}
        <View style={styles.expertiseContainer}>
          {displayExpertise.map((league, index) => (
            <ExpertiseBadge key={index} label={league} type="league" size="sm" />
          ))}
          {moreCount > 0 && (
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>+{moreCount}</Text>
            </View>
          )}
        </View>

        {/* Price Badge */}
        <View style={styles.footer}>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice()}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.surface.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.background.primary,
    borderRadius: radius.full,
    padding: 2,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  headline: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  locationText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
  },
  favoriteButton: {
    padding: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  statText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  statDivider: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  moreTag: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreTagText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    fontWeight: typography.weights.medium,
    color: colors.text.tertiary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    backgroundColor: 'rgba(228, 255, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  priceText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.brand.primary,
  },
});

export default ScoutCard;
