/**
 * ACHIEVEMENT CARD COMPONENT
 * Displays achievement information with rarity, progress, and lock states
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Lock, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, typography } from '../../../design';
import { RarityBadge } from './RarityBadge';
import type { Achievement } from '../../../types/gamification';
import { AchievementRarity } from '../../../types/gamification';

// ============================================================================
// TYPES
// ============================================================================

export interface AchievementCardProps {
  achievement: Achievement;
  onPress: () => void;
  style?: ViewStyle;
}

// ============================================================================
// RARITY COLORS
// ============================================================================

const RARITY_COLORS: Record<AchievementRarity, string> = {
  [AchievementRarity.COMMON]: tokens.colors.gray[500],
  [AchievementRarity.RARE]: tokens.colors.semantic.info,
  [AchievementRarity.EPIC]: tokens.colors.feature.ai,
  [AchievementRarity.LEGENDARY]: tokens.colors.feature.gamification,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  style,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const progressPercent = achievement.progress
    ? (achievement.progress.current / achievement.progress.total) * 100
    : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.container,
        achievement.isLocked && styles.containerLocked,
        { borderColor: rarityColor },
        style,
      ]}
    >
      {/* Icon Container */}
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${rarityColor}20` },
            achievement.isLocked && styles.iconCircleLocked,
          ]}
        >
          <Text style={[styles.icon, achievement.isLocked && styles.iconLocked]}>
            {achievement.icon}
          </Text>
        </View>

        {/* Lock/Check Badge */}
        <View style={styles.statusBadge}>
          {achievement.isLocked ? (
            <Lock size={14} color={tokens.colors.gray[500]} />
          ) : (
            <CheckCircle size={14} color={tokens.colors.semantic.success} />
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Rarity */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              achievement.isLocked && styles.titleLocked,
            ]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
          <RarityBadge rarity={achievement.rarity} size="small" />
        </View>

        {/* Description */}
        <Text
          style={[
            styles.description,
            achievement.isLocked && styles.descriptionLocked,
          ]}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>

        {/* Progress Bar (if incremental) */}
        {achievement.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: rarityColor },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress.current} / {achievement.progress.total}
            </Text>
          </View>
        )}

        {/* XP Reward */}
        <View style={styles.footer}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpValue}>+{achievement.xpReward}</Text>
            <Text style={styles.xpLabel}>XP</Text>
          </View>

          {achievement.unlockedAt && (
            <Text style={styles.unlockedDate}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
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
    flexDirection: 'row',
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    ...tokens.shadows.md,
    borderWidth: 1.5,
    gap: 12,
  },
  containerLocked: {
    opacity: 0.6,
  },
  iconContainer: {
    position: 'relative',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleLocked: {
    backgroundColor: tokens.colors.arcane.slate,
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.4,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.arcane.black,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    ...typography.heading5,
    flex: 1,
  },
  titleLocked: {
    color: tokens.colors.gray[400],
  },
  description: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    marginBottom: 12,
  },
  descriptionLocked: {
    color: tokens.colors.gray[500],
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  xpValue: {
    ...typography.heading5,
    color: tokens.colors.yellow.DEFAULT,
  },
  xpLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  unlockedDate: {
    ...typography.caption,
    color: tokens.colors.semantic.success,
  },
});
