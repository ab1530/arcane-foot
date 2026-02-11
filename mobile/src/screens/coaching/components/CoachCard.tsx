/**
 * COACH CARD COMPONENT
 * Displays coach information in a compact card format
 * Used in coach listings and featured coaches sections
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
import { MapPin, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../../design';
import { ExpertiseBadge } from './ExpertiseBadge';

// ============================================================================
// TYPES
// ============================================================================

export interface CoachCardProps {
  coach: {
    id: string;
    name: string;
    title: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    expertise: string[];
    hourlyRate: number;
    location: string;
    available?: boolean;
  };
  onPress: () => void;
  featured?: boolean;
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  onPress,
  featured = false,
  style,
}) => {
  // Add null safety checks
  if (!coach || !coach.id) {
    return null;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const displayExpertise = (coach.expertise || []).slice(0, 3);
  const coachName = coach.name || 'Unknown Coach';
  const coachTitle = coach.title || 'Coach';
  const coachLocation = coach.location || 'Unknown';
  const coachRating = coach.rating || 0;
  const reviewCount = coach.reviewCount || 0;
  const hourlyRate = coach.hourlyRate || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        featured && styles.featuredContainer,
        style,
      ]}
    >
      {/* Featured Badge */}
      {featured && (
        <View style={styles.featuredBadge}>
          <Star size={12} color={tokens.colors.arcane.black} fill={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.featuredText}>FEATURED</Text>
        </View>
      )}

      {/* Coach Avatar */}
      <View style={styles.avatarContainer}>
        {coach.avatar ? (
          <Image source={{ uri: coach.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {coachName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {coach.available && <View style={styles.availableDot} />}
      </View>

      {/* Coach Info */}
      <View style={styles.infoContainer}>
        {/* Name and Title */}
        <Text style={styles.name} numberOfLines={1}>
          {coachName}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {coachTitle}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={14} color={tokens.colors.gray[400]} />
          <Text style={styles.location} numberOfLines={1}>
            {coachLocation}
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Star size={16} color={tokens.colors.yellow.DEFAULT} fill={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.rating}>{coachRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>

        {/* Expertise Badges */}
        <View style={styles.expertiseContainer}>
          {displayExpertise.map((exp, index) => (
            <ExpertiseBadge key={index} expertise={exp} variant="outlined" />
          ))}
          {(coach.expertise || []).length > 3 && (
            <View style={styles.moreBadge}>
              <Text style={styles.moreText}>+{(coach.expertise || []).length - 3}</Text>
            </View>
          )}
        </View>

        {/* Hourly Rate */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${hourlyRate}</Text>
          <Text style={styles.priceUnit}>/hour</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    ...tokens.shadows.md,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  featuredContainer: {
    borderColor: tokens.colors.yellow.DEFAULT,
    borderWidth: 1.5,
    ...tokens.shadows.glowYellow,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  featuredText: {
    ...typography.overline,
    fontSize: 10,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  avatarInitials: {
    ...typography.heading2,
    color: tokens.colors.yellow.DEFAULT,
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: tokens.colors.semantic.success,
    borderWidth: 2,
    borderColor: tokens.colors.arcane.charcoal,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    ...typography.heading4,
    marginBottom: 4,
  },
  title: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  rating: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  reviewCount: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  moreBadge: {
    backgroundColor: tokens.colors.arcane.slate,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreText: {
    ...typography.caption,
    color: tokens.colors.gray[300],
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    ...typography.heading3,
    color: tokens.colors.yellow.DEFAULT,
  },
  priceUnit: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
});
