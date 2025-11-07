/**
 * AnimatedBadge Component - Animated badge with pulse and scale effects
 * Provides attention-grabbing badges for notifications and status indicators
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, typography, spacing } from '../../design/theme';

interface AnimatedBadgeProps {
  /**
   * Badge content (text or number)
   */
  children?: React.ReactNode;

  /**
   * Badge count (alternative to children)
   */
  count?: number;

  /**
   * Background color
   * @default colors.semantic.error
   */
  color?: string;

  /**
   * Text color
   * @default colors.text.primary
   */
  textColor?: string;

  /**
   * Badge size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Animation type
   * @default 'pulse'
   */
  animation?: 'pulse' | 'bounce' | 'none';

  /**
   * Show badge
   * @default true
   */
  visible?: boolean;

  /**
   * Maximum count to display (shows 99+ if exceeded)
   * @default 99
   */
  maxCount?: number;

  /**
   * Additional container styles
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional text styles
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Badge variant
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined' | 'dot';
}

/**
 * AnimatedBadge component for notifications and status
 *
 * @example
 * <AnimatedBadge count={5} />
 * <AnimatedBadge count={150} maxCount={99} />
 * <AnimatedBadge variant="dot" animation="pulse" />
 * <AnimatedBadge variant="outlined" color={colors.semantic.success}>New</AnimatedBadge>
 */
export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  count,
  color = colors.semantic.error,
  textColor = colors.text.primary,
  size = 'md',
  animation = 'pulse',
  visible = true,
  maxCount = 99,
  style,
  textStyle,
  variant = 'filled',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible || animation === 'none') return;

    let animationSequence: Animated.CompositeAnimation | undefined;

    if (animation === 'pulse') {
      animationSequence = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    } else if (animation === 'bounce') {
      animationSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ])
      );
    }

    if (animationSequence) {
      animationSequence.start();
      return () => animationSequence.stop();
    }
  }, [visible, animation, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const displayContent = children ?? (count !== undefined ? (count > maxCount ? `${maxCount}+` : count.toString()) : null);

  if (!displayContent && variant !== 'dot') return null;

  const getSizeStyle = () => {
    if (variant === 'dot') {
      const sizes = { sm: 8, md: 10, lg: 12 };
      const dotSize = sizes[size];
      return {
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
      };
    }

    const sizes = {
      sm: { minWidth: 16, height: 16, paddingHorizontal: 4 },
      md: { minWidth: 20, height: 20, paddingHorizontal: 6 },
      lg: { minWidth: 24, height: 24, paddingHorizontal: 8 },
    };
    return sizes[size];
  };

  const getTextSize = () => {
    const sizes = {
      sm: typography.sizes.xs,
      md: typography.sizes.sm,
      lg: typography.sizes.base,
    };
    return sizes[size];
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: color,
        };
      case 'dot':
        return {
          backgroundColor: color,
        };
      default:
        return {
          backgroundColor: color,
        };
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.badge,
          getSizeStyle(),
          getVariantStyle(),
          {
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {variant !== 'dot' && displayContent && (
          <Text
            style={[
              styles.text,
              {
                color: variant === 'outlined' ? color : textColor,
                fontSize: getTextSize(),
              },
              textStyle,
            ]}
          >
            {displayContent}
          </Text>
        )}
      </Animated.View>

      {animation === 'pulse' && variant === 'dot' && (
        <Animated.View
          style={[
            styles.pulseRing,
            getSizeStyle(),
            {
              borderColor: color,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.fonts.bold,
    fontWeight: '700',
    textAlign: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
});

export default AnimatedBadge;
