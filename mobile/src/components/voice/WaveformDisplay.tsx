/**
 * WaveformDisplay Component
 *
 * Animated bars showing audio levels during recording.
 * Features:
 * - Real-time animation during recording
 * - Static display after recording
 * - Smooth bar animations using react-native-reanimated
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../constants/config';

interface WaveformDisplayProps {
  isRecording: boolean;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  height?: number;
  color?: string;
}

const WaveBar: React.FC<{
  isActive: boolean;
  maxHeight: number;
  delay: number;
  color: string;
  width: number;
}> = ({ isActive, maxHeight, delay, color, width }) => {
  const height = useSharedValue(8);

  useEffect(() => {
    if (isActive) {
      // Random-ish animation for each bar with delay
      height.value = withRepeat(
        withSequence(
          withTiming(maxHeight * (0.2 + Math.random() * 0.8), {
            duration: 300 + delay * 50,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(8, {
            duration: 300 + delay * 50,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      height.value = withTiming(8, { duration: 200 });
    }
  }, [isActive, maxHeight, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          width,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  isRecording,
  barCount = 20,
  barWidth = 4,
  barSpacing = 4,
  height = 60,
  color = COLORS.arcane.accent,
}) => {
  return (
    <View style={[styles.container, { height }]}>
      {Array.from({ length: barCount }).map((_, index) => (
        <View key={index} style={{ marginHorizontal: barSpacing / 2 }}>
          <WaveBar
            isActive={isRecording}
            maxHeight={height}
            delay={index}
            color={color}
            width={barWidth}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
    minHeight: 8,
  },
});

export default WaveformDisplay;
