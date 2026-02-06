/**
 * DAILY CHALLENGE MODAL
 * Full-screen modal for daily challenge details and claiming rewards
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
  Dimensions,
} from 'react-native';
import { X, Clock, CheckCircle, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, typography } from '../../design';
import { useCompleteChallenge } from '../../hooks/useGamification';
import { ConfettiAnimation } from './components';
import type { DailyChallenge } from '../../types/gamification';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ============================================================================
// TYPES
// ============================================================================

interface DailyChallengeModalProps {
  visible: boolean;
  challenge: DailyChallenge | null;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  visible,
  challenge,
  onClose,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const scale = useSharedValue(0);

  const completeMutation = useCompleteChallenge();

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15 });
    } else {
      scale.value = 0;
    }
  }, [visible]);

  useEffect(() => {
    if (!challenge) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(challenge.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleClaimReward = async () => {
    if (!challenge || !challenge.isCompleted || challenge.isClaimed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfetti(true);

    try {
      await completeMutation.mutateAsync();

      // Auto-close after celebration
      setTimeout(() => {
        onClose();
        setShowConfetti(false);
      }, 3000);
    } catch (error) {
      setShowConfetti(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
  };

  if (!challenge) return null;

  const progressCurrent = challenge.progress?.current ?? 0;
  const progressTotal = Math.max(challenge.progress?.total ?? 1, 1);
  const progressPercent = Math.min((progressCurrent / progressTotal) * 100, 100);

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
            {/* Challenge Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[
                  `${tokens.colors.yellow.DEFAULT}30`,
                  `${tokens.colors.semantic.success}30`,
                ]}
                style={styles.iconBackground}
              >
                <Text style={styles.icon}>{challenge.icon}</Text>
              </LinearGradient>

              {challenge.isCompleted && (
                <View style={styles.completedBadge}>
                  <CheckCircle
                    size={32}
                    color={tokens.colors.semantic.success}
                    fill={tokens.colors.semantic.success}
                  />
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{challenge.title}</Text>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Clock size={20} color={tokens.colors.gray[300]} />
              <Text style={styles.timer}>{timeRemaining} remaining</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Challenge Description</Text>
            <Text style={styles.description}>{challenge.description}</Text>
          </View>

          {/* Progress Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>

            <View style={styles.progressContainer}>
              {/* Circular Progress */}
              <View style={styles.progressCircle}>
                <LinearGradient
                  colors={[
                    tokens.colors.yellow.DEFAULT,
                    tokens.colors.semantic.success,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.progressRing,
                    { transform: [{ rotate: `${(progressPercent / 100) * 360}deg` }] },
                  ]}
                />
                <View style={styles.progressInner}>
                  <Text style={styles.progressPercent}>
                    {Math.round(progressPercent)}%
                  </Text>
                  <Text style={styles.progressLabel}>Complete</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{progressCurrent}</Text>
                  <Text style={styles.statLabel}>Current</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{progressTotal}</Text>
                  <Text style={styles.statLabel}>Goal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reward Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reward</Text>
            <View style={styles.rewardCard}>
              <Trophy size={32} color={tokens.colors.yellow.DEFAULT} />
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardXP}>+{challenge.xpReward} XP</Text>
                <Text style={styles.rewardText}>Experience Points</Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={
              challenge.isClaimed
                ? handleClose
                : challenge.isCompleted
                ? handleClaimReward
                : handleClose
            }
            disabled={completeMutation.isPending}
            style={[
              styles.actionButton,
              challenge.isCompleted && !challenge.isClaimed && styles.actionButtonActive,
              (challenge.isClaimed || completeMutation.isPending) && styles.actionButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={
                challenge.isCompleted && !challenge.isClaimed
                  ? [tokens.colors.yellow.DEFAULT, tokens.colors.semantic.success]
                  : [tokens.colors.arcane.slate, tokens.colors.arcane.slate]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  challenge.isCompleted &&
                    !challenge.isClaimed &&
                    styles.actionButtonTextActive,
                ]}
              >
                {completeMutation.isPending
                  ? 'Claiming...'
                  : challenge.isClaimed
                  ? 'Reward Claimed ✓'
                  : challenge.isCompleted
                  ? 'Claim Reward'
                  : 'Keep Going!'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tips */}
          {!challenge.isCompleted && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>💡 Tips</Text>
              <Text style={styles.tipsText}>
                Complete more scouting reports to progress this challenge faster!
              </Text>
            </View>
          )}
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
    marginBottom: 16,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
  },
  completedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 9999,
    padding: 4,
  },
  title: {
    ...typography.display3,
    textAlign: 'center',
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.arcane.slate,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  timer: {
    ...typography.bodyBase,
    fontWeight: '600',
    color: tokens.colors.gray[300],
  },
  section: {
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 9999,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderWidth: 8,
    borderColor: 'transparent',
  },
  progressInner: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    ...typography.heading2,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '900',
  },
  progressLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  progressStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading2,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: tokens.colors.surface.borderLight,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${tokens.colors.yellow.DEFAULT}10`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardXP: {
    ...typography.heading3,
    color: tokens.colors.yellow.DEFAULT,
    marginBottom: 4,
  },
  rewardText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionButtonActive: {
    ...tokens.shadows.glowYellow,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.heading5,
    color: tokens.colors.gray[300],
    fontWeight: '700',
  },
  actionButtonTextActive: {
    color: tokens.colors.arcane.black,
  },
  tipsContainer: {
    backgroundColor: `${tokens.colors.semantic.info}10`,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.info,
  },
  tipsTitle: {
    ...typography.bodyBase,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipsText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
  },
});

export default DailyChallengeModal;
