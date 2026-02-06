/**
 * Skeleton Component - Loading placeholder with shimmer animation
 * Provides elegant loading states following iOS design patterns
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { colors, radius } from '../../design/theme';

const BORDER_RADIUS = {
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  '2xl': radius['2xl'],
  full: radius.full,
} as const;

interface SkeletonProps {
  /**
   * Width of the skeleton
   * @default '100%'
   */
  width?: number | string;

  /**
   * Height of the skeleton
   * @default 20
   */
  height?: number;

  /**
   * Border radius
   * @default 'sm'
   */
  borderRadius?: keyof typeof BORDER_RADIUS | number;

  /**
   * Additional styles
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Variant for different skeleton types
   * @default 'rect'
   */
  variant?: 'rect' | 'circle' | 'text';
}

/**
 * Skeleton component with shimmer animation
 *
 * @example
 * <Skeleton width={200} height={20} />
 * <Skeleton variant="circle" width={50} height={50} />
 * <Skeleton variant="text" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 'sm',
  style,
  variant = 'rect',
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getVariantStyle = () => {
    switch (variant) {
      case 'circle':
        return {
          width: typeof width === 'number' ? width : 50,
          height: typeof height === 'number' ? height : 50,
          borderRadius: (typeof width === 'number' ? width : 50) / 2,
        };
      case 'text':
        return {
          height: 16,
          borderRadius: radius.sm,
        };
      default:
        return {
          borderRadius:
            typeof borderRadius === 'number'
              ? borderRadius
              : BORDER_RADIUS[borderRadius],
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        getVariantStyle(),
        {
          width,
          height,
        },
        style,
        {
          opacity,
        },
      ]}
    />
  );
};

/**
 * Skeleton group for multiple loading elements
 */
interface SkeletonGroupProps {
  count?: number;
  spacing?: number;
  children?: React.ReactNode;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  spacing = 12,
  children,
}) => {
  if (children) {
    return (
      <View style={[styles.group, { gap: spacing }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.group, { gap: spacing }]}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Pre-built skeleton for common use cases
 */
export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton variant="circle" width={50} height={50} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
    <View style={styles.cardBody}>
      <Skeleton width="100%" height={12} />
      <Skeleton width="90%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
    </View>
  </View>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  group: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: colors.surface.glass,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardBody: {
    gap: 8,
  },
  list: {
    gap: 12,
  },
});

export default Skeleton;
