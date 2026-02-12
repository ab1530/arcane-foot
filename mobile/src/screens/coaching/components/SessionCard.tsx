/**
 * SESSION CARD COMPONENT
 * Displays coaching session information with action buttons
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
import { Calendar, Clock, MapPin, Video, X, Star, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from '../../../utils/date';
import { tokens, typography } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface SessionCardProps {
  session: {
    id: string;
    coach: {
      id: string;
      name: string;
      avatar?: string;
    };
    dateTime: string;
    duration: number;
    type: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    price: number;
    location?: string;
    meetingLink?: string;
  };
  onCancel?: () => void;
  onReview?: () => void;
  onRebook?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onCancel,
  onReview,
  onRebook,
  onPress,
  style,
}) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action();
  };

  const dateTime = parseISO(session.dateTime);
  const formattedDate = format(dateTime, 'MMM dd, yyyy');
  const formattedTime = format(dateTime, 'hh:mm a');

  const statusColor = {
    upcoming: tokens.colors.semantic.info,
    completed: tokens.colors.semantic.success,
    cancelled: tokens.colors.gray[500],
  }[session.status];

  const statusBg = {
    upcoming: tokens.colors.semantic.infoBg,
    completed: tokens.colors.semantic.successBg,
    cancelled: `${tokens.colors.gray[500]}20`,
  }[session.status];

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={handlePress}
      style={[styles.container, style]}
      disabled={!onPress}
    >
      {/* Coach Info */}
      <View style={styles.header}>
        <View style={styles.coachInfo}>
          {session.coach.avatar ? (
            <Image source={{ uri: session.coach.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {session.coach.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.coachDetails}>
            <Text style={styles.coachName} numberOfLines={1}>
              {session.coach.name}
            </Text>
            <Text style={styles.sessionType} numberOfLines={1}>
              {session.type}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {session.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Session Details */}
      <View style={styles.detailsContainer}>
        {/* Date */}
        <View style={styles.detailRow}>
          <Calendar size={16} color={tokens.colors.gray[400]} />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>

        {/* Time */}
        <View style={styles.detailRow}>
          <Clock size={16} color={tokens.colors.gray[400]} />
          <Text style={styles.detailText}>
            {formattedTime} ({session.duration} min)
          </Text>
        </View>

        {/* Location */}
        {session.location && (
          <View style={styles.detailRow}>
            <MapPin size={16} color={tokens.colors.gray[400]} />
            <Text style={styles.detailText} numberOfLines={1}>
              {session.location}
            </Text>
          </View>
        )}

        {/* Meeting Link */}
        {session.meetingLink && (
          <View style={styles.detailRow}>
            <Video size={16} color={tokens.colors.yellow.DEFAULT} />
            <Text style={styles.linkText}>Video Call</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>${session.price}</Text>
      </View>

      {/* Action Buttons */}
      {(onCancel || onReview || onRebook) && (
        <View style={styles.actionsContainer}>
          {session.status === 'upcoming' && onCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleAction(onCancel)}
            >
              <X size={16} color={tokens.colors.semantic.error} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {session.status === 'completed' && onReview && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => handleAction(onReview)}
            >
              <Star size={16} color={tokens.colors.yellow.DEFAULT} />
              <Text style={styles.reviewButtonText}>Review</Text>
            </TouchableOpacity>
          )}

          {session.status === 'completed' && onRebook && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rebookButton]}
              onPress={() => handleAction(onRebook)}
            >
              <RotateCcw size={16} color={tokens.colors.text.primary} />
              <Text style={styles.rebookButtonText}>Rebook</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  avatarInitials: {
    ...typography.heading5,
    color: tokens.colors.yellow.DEFAULT,
  },
  coachDetails: {
    flex: 1,
  },
  coachName: {
    ...typography.heading5,
    marginBottom: 4,
  },
  sessionType: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    flex: 1,
  },
  linkText: {
    ...typography.bodySmall,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: 12,
  },
  price: {
    ...typography.heading4,
    color: tokens.colors.yellow.DEFAULT,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: tokens.colors.semantic.errorBg,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.error,
  },
  cancelButtonText: {
    ...typography.buttonText,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.semantic.error,
  },
  reviewButton: {
    backgroundColor: tokens.colors.yellow.dim,
    borderWidth: 1,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  reviewButtonText: {
    ...typography.buttonText,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.yellow.DEFAULT,
  },
  rebookButton: {
    backgroundColor: tokens.colors.arcane.slate,
    borderWidth: 1,
    borderColor: tokens.colors.gray[600],
  },
  rebookButtonText: {
    ...typography.buttonText,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.primary,
  },
});
