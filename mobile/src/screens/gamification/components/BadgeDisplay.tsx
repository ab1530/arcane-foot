/**
 * BADGE DISPLAY COMPONENT
 * Circular badge with shine effect and pin indicator
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Pin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, typography } from '../../../design';
import type { Badge } from '../../../types/gamification';
import { AchievementRarity } from '../../../types/gamification';

// ============================================================================
// TYPES
// ============================================================================

export interface BadgeDisplayProps {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
  showPin?: boolean;
  showName?: boolean;
  onPress?: () => void;
  onPinPress?: () => void;
  style?: ViewStyle;
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  small: {
    containerSize: 60,
    iconSize: 28,
    borderWidth: 2,
  },
  medium: {
    containerSize: 80,
    iconSize: 36,
    borderWidth: 2.5,
  },
  large: {
    containerSize: 100,
    iconSize: 44,
    borderWidth: 3,
  },
};

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

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'medium',
  showPin = true,
  showName = false,
  onPress,
  onPinPress,
  style,
}) => {
  const shinePosition = useSharedValue(-100);
  const config = SIZE_CONFIG[size];
  const rarityColor = RARITY_COLORS[badge.rarity];

  // Shine animation effect
  useEffect(() => {
    if (badge.earnedAt) {
      shinePosition.value = withRepeat(
        withSequence(
          withTiming(200, { duration: 2000, easing: Easing.linear }),
          withTiming(-100, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [badge.earnedAt]);

  const shineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shinePosition.value }],
    };
  });

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handlePinPress = () => {
    if (onPinPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPinPress();
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <View style={[styles.wrapper, style]}>
      <Container
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.container}
      >
        {/* Badge Circle */}
        <View
          style={[
            styles.badge,
            {
              width: config.containerSize,
              height: config.containerSize,
              borderRadius: config.containerSize / 2,
              borderWidth: config.borderWidth,
              borderColor: rarityColor,
            },
            !badge.earnedAt && styles.badgeLocked,
          ]}
        >
          {/* Background Gradient */}
          {badge.earnedAt && (
            <LinearGradient
              colors={[`${rarityColor}30`, `${rarityColor}10`]}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Icon */}
          <Text
            style={[
              styles.icon,
              { fontSize: config.iconSize },
              !badge.earnedAt && styles.iconLocked,
            ]}
          >
            {badge.icon}
          </Text>

          {/* Shine Effect */}
          {badge.earnedAt && (
            <Animated.View style={[styles.shine, shineStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </View>

        {/* Pin Indicator */}
        {showPin && badge.isPinned && (
          <View style={styles.pinIndicator}>
            <Pin size={12} color={tokens.colors.yellow.DEFAULT} fill={tokens.colors.yellow.DEFAULT} />
          </View>
        )}

        {/* Rarity Glow */}
        {badge.earnedAt && badge.rarity === AchievementRarity.LEGENDARY && (
          <View
            style={[
              styles.glow,
              {
                width: config.containerSize + 12,
                height: config.containerSize + 12,
                borderRadius: (config.containerSize + 12) / 2,
                borderColor: rarityColor,
              },
            ]}
          />
        )}
      </Container>

      {/* Badge Name */}
      {showName && (
        <Text
          style={[
            styles.name,
            !badge.earnedAt && styles.nameLocked,
          ]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
      )}

      {/* Earned Date */}
      {showName && badge.earnedAt && (
        <Text style={styles.earnedDate}>
          {new Date(badge.earnedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      )}

      {/* Pin Button */}
      {showPin && onPinPress && badge.earnedAt && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePinPress}
          style={styles.pinButton}
        >
          <Pin
            size={16}
            color={badge.isPinned ? tokens.colors.yellow.DEFAULT : tokens.colors.gray[400]}
            fill={badge.isPinned ? tokens.colors.yellow.DEFAULT : 'transparent'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.arcane.charcoal,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeLocked: {
    opacity: 0.4,
    backgroundColor: tokens.colors.arcane.slate,
  },
  icon: {
    zIndex: 1,
  },
  iconLocked: {
    opacity: 0.5,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: -50,
    width: 50,
    height: '100%',
  },
  pinIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: tokens.colors.yellow.DEFAULT,
    zIndex: 2,
  },
  glow: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.3,
    zIndex: -1,
  },
  name: {
    ...typography.caption,
    fontWeight: '600',
    color: tokens.colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 100,
  },
  nameLocked: {
    color: tokens.colors.gray[500],
  },
  earnedDate: {
    ...typography.caption,
    fontSize: 10,
    color: tokens.colors.gray[400],
    marginTop: 2,
  },
  pinButton: {
    marginTop: 4,
    padding: 4,
  },
});
