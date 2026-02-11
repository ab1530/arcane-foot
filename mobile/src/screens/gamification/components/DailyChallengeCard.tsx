/**
 * DAILY CHALLENGE CARD COMPONENT
 * Displays daily challenge with progress and countdown timer
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Clock, ChevronRight, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, typography } from '../../../design';
import type { DailyChallenge } from '../../../types/gamification';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  onPress?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// HELPERS
// ============================================================================

const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  challenge,
  onPress,
  style,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>(
    getTimeRemaining(challenge.expiresAt)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(challenge.expiresAt));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [challenge.expiresAt]);

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const progressCurrent = challenge.progress?.current ?? 0;
  const progressTotal = Math.max(challenge.progress?.total ?? 1, 1);
  const progressPercent = Math.min((progressCurrent / progressTotal) * 100, 100);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        challenge.isCompleted && styles.containerCompleted,
        style,
      ]}
    >
      {/* Background Gradient for completed */}
      {challenge.isCompleted && !challenge.isClaimed && (
        <LinearGradient
          colors={[
            `${tokens.colors.semantic.success}20`,
            `${tokens.colors.semantic.success}05`,
          ]}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{challenge.icon}</Text>
          {challenge.isCompleted && (
            <View style={styles.completedBadge}>
              <CheckCircle
                size={16}
                color={tokens.colors.semantic.success}
                fill={tokens.colors.semantic.success}
              />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {challenge.title}
          </Text>
          <View style={styles.timerRow}>
            <Clock size={12} color={tokens.colors.gray[400]} />
            <Text style={styles.timer}>{timeRemaining}</Text>
          </View>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpValue}>+{challenge.xpReward}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {challenge.description}
      </Text>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[
              tokens.colors.yellow.DEFAULT,
              tokens.colors.semantic.success,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {progressCurrent} / {progressTotal}
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Text style={styles.ctaText}>
          {challenge.isClaimed
            ? 'Claimed'
            : challenge.isCompleted
            ? 'Tap to claim reward'
            : 'View details'}
        </Text>
        {!challenge.isClaimed && (
          <ChevronRight size={16} color={tokens.colors.yellow.DEFAULT} />
        )}
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
    overflow: 'hidden',
  },
  containerCompleted: {
    borderColor: tokens.colors.semantic.success,
    borderWidth: 1.5,
    ...tokens.shadows.glowGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${tokens.colors.yellow.DEFAULT}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  completedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 9999,
    padding: 2,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...typography.heading5,
    marginBottom: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timer: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  xpBadge: {
    alignItems: 'flex-end',
  },
  xpValue: {
    ...typography.heading4,
    color: tokens.colors.yellow.DEFAULT,
    lineHeight: 24,
  },
  xpLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  description: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 12,
    backgroundColor: tokens.colors.arcane.slate,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  progressText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textAlign: 'right',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.yellow.DEFAULT,
  },
});
