import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from '../../design/theme';

export interface FactorBarProps {
  name: string;
  value: number;
  maxValue: number;
  index?: number;
}

export const FactorBar: React.FC<FactorBarProps> = ({
  name,
  value,
  maxValue,
  index = 0,
}) => {
  const widthValue = useSharedValue(0);

  useEffect(() => {
    widthValue.value = withDelay(
      index * 100,
      withTiming((value / maxValue) * 100, {
        duration: 800,
      })
    );
  }, [value, maxValue, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${widthValue.value}%`,
    };
  });

  const formatFactorName = (factorName: string) => {
    return factorName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getGradientColors = (): [string, string] => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return [colors.semantic.success, colors.semantic.success + '80'];
    if (percentage >= 60) return [colors.brand.primary, colors.brand.primaryLight];
    if (percentage >= 40) return [colors.semantic.warning, colors.semantic.warning + '80'];
    return [colors.semantic.error, colors.semantic.error + '80'];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nameText}>{formatFactorName(name)}</Text>
        <Text style={styles.valueText}>{value.toFixed(1)}</Text>
      </View>
      <View style={styles.barContainer}>
        <Animated.View style={[styles.barFill, animatedStyle]}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nameText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  valueText: {
    fontSize: typography.sizes.base,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  gradient: {
    flex: 1,
  },
});
