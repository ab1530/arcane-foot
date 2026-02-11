/**
 * ACHIEVEMENT DETAILS MODAL
 * Display achievement details with sharing and claiming functionality
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
  Modal,
  Share,
  Dimensions,
} from 'react-native';
import { X, Share2, Lock, CheckCircle, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { tokens, typography } from '../../design';
import { useClaimAchievement } from '../../hooks/useGamification';
import { RarityBadge, ConfettiAnimation } from './components';
import type { Achievement } from '../../types/gamification';
import { AchievementRarity } from '../../types/gamification';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ============================================================================
// TYPES
// ============================================================================

interface AchievementDetailsModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
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

export const AchievementDetailsModal: React.FC<AchievementDetailsModalProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const scale = useSharedValue(0);
  const iconScale = useSharedValue(1);

  const claimMutation = useClaimAchievement();

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15 });
      // Celebration animation for icon
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    } else {
      scale.value = 0;
      iconScale.value = 1;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  const handleClaimAchievement = async () => {
    if (!achievement || achievement.isLocked) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfetti(true);

    try {
      await claimMutation.mutateAsync(achievement.id);

      // Auto-close after celebration
      setTimeout(() => {
        onClose();
        setShowConfetti(false);
      }, 3000);
    } catch (error) {
      setShowConfetti(false);
    }
  };

  const handleShare = async () => {
    if (!achievement) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Share.share({
        message: `I just unlocked the "${achievement.title}" achievement! 🏆 +${achievement.xpReward} XP`,
        title: 'Achievement Unlocked!',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!achievement) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(`ACHIEVEMENT_${achievement.id}`);

    Toast.show({
      type: 'success',
      text1: 'Copied!',
      text2: 'Achievement code copied to clipboard',
      visibilityTime: 2000,
    });
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
  };

  if (!achievement) return null;

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const progressPercent = achievement.progress
    ? (achievement.progress.current / achievement.progress.total) * 100
    : 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, animatedStyle]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            {/* Achievement Icon with Rarity Background */}
            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
              <LinearGradient
                colors={[`${rarityColor}40`, `${rarityColor}10`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconBackground,
                  { borderColor: rarityColor },
                  achievement.isLocked && styles.iconBackgroundLocked,
                ]}
              >
                <Text
                  style={[
                    styles.icon,
                    achievement.isLocked && styles.iconLocked,
                  ]}
                >
                  {achievement.icon}
                </Text>
              </LinearGradient>

              {/* Status Badge */}
              <View style={styles.statusBadge}>
                {achievement.isLocked ? (
                  <Lock size={24} color={tokens.colors.gray[500]} />
                ) : (
                  <CheckCircle
                    size={24}
                    color={tokens.colors.semantic.success}
                    fill={tokens.colors.semantic.success}
                  />
                )}
              </View>
            </Animated.View>

            {/* Rarity Badge */}
            <View style={styles.rarityContainer}>
              <RarityBadge rarity={achievement.rarity} size="medium" />
            </View>

            {/* Title */}
            <Text style={styles.title}>{achievement.title}</Text>

            {/* Unlock Date or Locked Status */}
            {achievement.unlockedAt ? (
              <Text style={styles.unlockedDate}>
                Unlocked on{' '}
                {new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            ) : (
              <View style={styles.lockedBadge}>
                <Lock size={14} color={tokens.colors.gray[400]} />
                <Text style={styles.lockedText}>Locked</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{achievement.description}</Text>
          </View>

          {/* Progress (if incremental) */}
          {achievement.progress && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[rarityColor, `${rarityColor}80`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressStats}>
                  <Text style={styles.progressText}>
                    {achievement.progress.current} / {achievement.progress.total}
                  </Text>
                  <Text style={[styles.progressPercent, { color: rarityColor }]}>
                    {Math.round(progressPercent)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Reward */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reward</Text>
            <View style={[styles.rewardCard, { borderColor: rarityColor }]}>
              <Trophy size={32} color={rarityColor} />
              <View style={styles.rewardInfo}>
                <Text style={[styles.rewardXP, { color: rarityColor }]}>
                  +{achievement.xpReward} XP
                </Text>
                <Text style={styles.rewardText}>Experience Points</Text>
              </View>
            </View>
          </View>

          {/* Tips to Unlock (if locked) */}
          {achievement.isLocked && achievement.tips && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to Unlock</Text>
              {achievement.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>💡</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!achievement.isLocked && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleShare}
                style={styles.shareButton}
              >
                <Share2 size={20} color={tokens.colors.text.primary} />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            )}

            {achievement.isLocked ? (
              <View style={styles.lockedButton}>
                <Lock size={20} color={tokens.colors.gray[500]} />
                <Text style={styles.lockedButtonText}>Keep Working!</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClose}
                style={[styles.primaryButton, { backgroundColor: rarityColor }]}
              >
                <Text style={styles.primaryButtonText}>Awesome!</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Copy Code Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCopyCode}
            style={styles.copyButton}
          >
            <Text style={styles.copyButtonText}>Copy Achievement Code</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Confetti */}
      <ConfettiAnimation
        visible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 16,
    padding: 24,
    ...tokens.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackgroundLocked: {
    opacity: 0.5,
    backgroundColor: tokens.colors.arcane.slate,
  },
  icon: {
    fontSize: 72,
  },
  iconLocked: {
    opacity: 0.4,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 9999,
    padding: 6,
    borderWidth: 2,
    borderColor: tokens.colors.arcane.black,
  },
  rarityContainer: {
    marginBottom: 12,
  },
  title: {
    ...typography.display3,
    textAlign: 'center',
    marginBottom: 8,
  },
  unlockedDate: {
    ...typography.bodySmall,
    color: tokens.colors.semantic.success,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.arcane.slate,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  lockedText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.heading5,
    marginBottom: 12,
    color: tokens.colors.yellow.DEFAULT,
  },
  description: {
    ...typography.bodyBase,
    color: tokens.colors.gray[300],
    lineHeight: 24,
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 16,
    backgroundColor: tokens.colors.arcane.slate,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  progressPercent: {
    ...typography.bodyBase,
    fontWeight: '700',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.colors.arcane.slate,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardXP: {
    ...typography.heading3,
    marginBottom: 4,
  },
  rewardText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
  },
  tipText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[300],
    flex: 1,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: tokens.colors.arcane.slate,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  shareButtonText: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.bodyBase,
    fontWeight: '700',
    color: tokens.colors.arcane.black,
  },
  lockedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: tokens.colors.arcane.slate,
    paddingVertical: 12,
    borderRadius: 12,
    opacity: 0.6,
  },
  lockedButtonText: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.gray[400],
  },
  copyButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textDecorationLine: 'underline',
  },
});

export default AchievementDetailsModal;
