/**
 * LEVEL BADGE COMPONENT
 * Circular badge displaying user level with animations
 * Features gradient background, glow effects, and level-up animation
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
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, typography } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  style?: ViewStyle;
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  small: {
    containerSize: 60,
    fontSize: 24,
    titleFontSize: 10,
  },
  medium: {
    containerSize: 100,
    fontSize: 36,
    titleFontSize: 12,
  },
  large: {
    containerSize: 140,
    fontSize: 48,
    titleFontSize: 14,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  title,
  size = 'medium',
  animated = false,
  style,
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const config = SIZE_CONFIG[size];

  useEffect(() => {
    if (animated) {
      // Level up animation: scale + rotate
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      rotate.value = withTiming(360, { duration: 800 });
    }
  }, [level, animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[animatedStyle]}>
        <LinearGradient
          colors={[
            tokens.colors.yellow.DEFAULT,
            tokens.colors.feature.gamification,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            {
              width: config.containerSize,
              height: config.containerSize,
              borderRadius: config.containerSize / 2,
            },
          ]}
        >
          {/* Glow effect */}
          <View style={styles.glowInner} />

          {/* Level number */}
          <Text
            style={[
              styles.level,
              {
                fontSize: config.fontSize,
                lineHeight: config.fontSize * 1.2,
              },
            ]}
          >
            {level}
          </Text>
        </LinearGradient>

        {/* Outer glow ring */}
        <View
          style={[
            styles.glowRing,
            {
              width: config.containerSize + 8,
              height: config.containerSize + 8,
              borderRadius: (config.containerSize + 8) / 2,
            },
          ]}
        />
      </Animated.View>

      {/* Level title */}
      {title && (
        <Text
          style={[
            styles.title,
            { fontSize: config.titleFontSize },
          ]}
        >
          {title}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...tokens.shadows.glowYellow,
  },
  glowInner: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
  },
  glowRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: `${tokens.colors.yellow.DEFAULT}40`,
    zIndex: -1,
  },
  level: {
    fontWeight: '900',
    color: tokens.colors.arcane.black,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    ...typography.overline,
    fontWeight: '700',
    color: tokens.colors.yellow.DEFAULT,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
