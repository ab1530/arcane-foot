import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { GlassCard } from '../ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';

export interface ValuationCardProps {
  value: number; // millions EUR
  interval: [number, number];
  confidence: number; // 0-1
  loading?: boolean;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export const ValuationCard: React.FC<ValuationCardProps> = ({
  value,
  interval,
  confidence,
  loading = false,
}) => {
  const animatedValue = useSharedValue(0);
  const scaleValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 2000,
    });
    scaleValue.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, [value]);

  const animatedTextStyle = useAnimatedStyle(() => {
    const currentValue = animatedValue.value;
    return {
      transform: [{ scale: scaleValue.value }],
    };
  });

  const formatValue = (val: number) => {
    return `€${val.toFixed(1)}M`;
  };

  if (loading) {
    return (
      <GlassCard variant="elevated" style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonLarge} />
          <View style={styles.skeletonSmall} />
          <View style={styles.skeletonMedium} />
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="elevated" style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>ESTIMATED VALUE</Text>
        <Animated.View style={[styles.valueContainer, animatedTextStyle]}>
          <AnimatedText style={styles.valueText}>
            {formatValue(value)}
          </AnimatedText>
        </Animated.View>
        <View style={styles.intervalContainer}>
          <Text style={styles.intervalText}>
            Range: {formatValue(interval[0])} - {formatValue(interval[1])}
          </Text>
        </View>
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(confidence * 100)}% Confidence
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  valueContainer: {
    marginBottom: spacing.md,
  },
  valueText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.brand.primary,
    letterSpacing: -1,
  },
  intervalContainer: {
    marginBottom: spacing.md,
  },
  intervalText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  confidenceContainer: {
    marginTop: spacing.sm,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  confidenceText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  skeletonLarge: {
    width: 200,
    height: 56,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  skeletonSmall: {
    width: 120,
    height: 20,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  skeletonMedium: {
    width: 150,
    height: 32,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
  },
});
