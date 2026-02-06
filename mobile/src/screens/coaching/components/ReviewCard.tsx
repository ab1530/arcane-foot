/**
 * REVIEW CARD COMPONENT
 * Displays user reviews for coaches
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { formatDistanceToNow, parseISO } from '../../../utils/date';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { tokens, typography } from '../../../design';
import { RatingStars } from './RatingStars';

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewCardProps {
  review: {
    id: string;
    user: {
      name: string;
      avatar?: string;
    };
    rating: number;
    date: string;
    comment: string;
  };
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, style }) => {
  const [expanded, setExpanded] = useState(false);

  const relativeDate = formatDistanceToNow(parseISO(review.date), {
    addSuffix: true,
  });

  const shouldTruncate = review.comment.length > 150;
  const displayComment =
    !expanded && shouldTruncate
      ? `${review.comment.substring(0, 150)}...`
      : review.comment;

  return (
    <View style={[styles.container, style]}>
      {/* User Info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.user.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {review.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {review.user.name}
            </Text>
            <Text style={styles.date}>{relativeDate}</Text>
          </View>
        </View>

        {/* Rating */}
        <RatingStars rating={review.rating} size={16} />
      </View>

      {/* Review Comment */}
      <Text style={styles.comment}>{displayComment}</Text>

      {/* Expand/Collapse Button */}
      {shouldTruncate && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
          {expanded ? (
            <ChevronUp size={16} color={tokens.colors.yellow.DEFAULT} />
          ) : (
            <ChevronDown size={16} color={tokens.colors.yellow.DEFAULT} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.arcane.anthracite,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...typography.bodyBase,
    fontWeight: '700',
    color: tokens.colors.gray[300],
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.bodyBase,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  comment: {
    ...typography.bodyBase,
    lineHeight: tokens.fontSize.base * 1.6,
    color: tokens.colors.gray[300],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  expandText: {
    ...typography.bodySmall,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '600',
  },
});
