/**
 * RecordingTimer Component
 *
 * Displays recording duration in MM:SS format with max time indicator.
 * Updates every second during recording.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/config';

interface RecordingTimerProps {
  isRecording: boolean;
  maxDuration?: number; // in seconds
  onMaxReached?: () => void;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({
  isRecording,
  maxDuration = 300, // 5 minutes default
  onMaxReached,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;
        if (newSeconds >= maxDuration && onMaxReached) {
          onMaxReached();
          return prev; // Don't increment past max
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, maxDuration, onMaxReached]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    const percentage = (seconds / maxDuration) * 100;
    if (percentage >= 90) return COLORS.danger;
    if (percentage >= 75) return COLORS.warning;
    return COLORS.arcane.accent;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.time, { color: getTimerColor() }]}>
        {formatTime(seconds)}
      </Text>
      <Text style={styles.maxTime}>
        / {formatTime(maxDuration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  time: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '600',
    letterSpacing: 2,
  },
  maxTime: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
    marginLeft: SPACING.xs,
  },
});

export default RecordingTimer;
