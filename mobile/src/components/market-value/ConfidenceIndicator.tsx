import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography } from '../../design/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ConfidenceIndicatorProps {
  confidence: number; // 0-1
  size?: number;
  strokeWidth?: number;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  size = 120,
  strokeWidth = 12,
}) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);

  const percentage = Math.round(confidence * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    progress.value = withTiming(confidence, {
      duration: 1500,
    });
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, [confidence]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return colors.semantic.success;
    if (confidence >= 0.6) return colors.semantic.warning;
    return colors.semantic.error;
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const confidenceColor = getConfidenceColor();
  const confidenceLabel = getConfidenceLabel();

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surface.glassLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={confidenceColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.centerContent}>
          <Text style={[styles.percentageText, { color: confidenceColor }]}>
            {percentage}%
          </Text>
          <Text style={styles.labelText}>{confidenceLabel}</Text>
        </View>
      </View>
      <Text style={styles.titleText}>Confidence Score</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs / 2,
  },
  labelText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  titleText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
