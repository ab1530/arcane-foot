/**
 * XP BAR COMPONENT
 * Animated progress bar showing XP progress to next level
 * Features smooth spring animations and glow effects
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, typography } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
  showLabel?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  nextLevelXP,
  level,
  showLabel = true,
  animated = true,
  style,
}) => {
  const progress = useSharedValue(0);

  const progressPercent = Math.min((currentXP / nextLevelXP) * 100, 100);

  useEffect(() => {
    if (animated) {
      progress.value = withSpring(progressPercent, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      progress.value = progressPercent;
    }
  }, [progressPercent, animated]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <View style={[styles.container, style]}>
      {/* XP Labels */}
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.currentXP}>{formatNumber(currentXP)} XP</Text>
          <Text style={styles.level}>Level {level}</Text>
          <Text style={styles.nextXP}>{formatNumber(nextLevelXP)} XP</Text>
        </View>
      )}

      {/* Progress Bar Track */}
      <View style={styles.track}>
        {/* Animated Progress Fill */}
        <Animated.View style={[styles.fillContainer, animatedBarStyle]}>
          <LinearGradient
            colors={[
              tokens.colors.yellow.DEFAULT,
              tokens.colors.feature.gamification,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          >
            {/* Glow effect overlay */}
            <View style={styles.glowOverlay} />
          </LinearGradient>
        </Animated.View>

        {/* Progress percentage text */}
        <View style={styles.percentContainer}>
          <Text style={styles.percentText}>{Math.round(progressPercent)}%</Text>
        </View>
      </View>

      {/* XP to Next Level */}
      {showLabel && (
        <Text style={styles.nextLevelText}>
          {formatNumber(nextLevelXP - currentXP)} XP to Level {level + 1}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentXP: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: tokens.colors.yellow.DEFAULT,
  },
  level: {
    ...typography.bodyBase,
    fontWeight: '700',
    color: tokens.colors.text.primary,
  },
  nextXP: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  track: {
    height: 24,
    backgroundColor: tokens.colors.arcane.slate,
    borderRadius: 9999,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  fillContainer: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  fill: {
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  percentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    ...typography.caption,
    fontWeight: '700',
    color: tokens.colors.arcane.black,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nextLevelText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
  },
});
