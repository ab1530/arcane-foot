/**
 * AudioPlayer Component
 *
 * Playback controls for recorded audio with progress slider and speed control.
 * Features:
 * - Play/pause button
 * - Progress slider
 * - Duration display
 * - Playback speed control (1x, 1.5x, 2x)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/config';

interface AudioPlayerProps {
  audioUri: string;
  duration: number; // in seconds
  onPlaybackComplete?: () => void;
}

const PLAYBACK_SPEEDS = [1.0, 1.5, 2.0];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUri,
  duration,
  onPlaybackComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);

  // Note: Actual audio playback would require expo-av or similar
  // This is a UI component with placeholder logic

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback using expo-av
  };

  const handleSliderChange = (value: number) => {
    setCurrentPosition(value);
    // TODO: Seek to position in audio
  };

  const handleSpeedChange = () => {
    const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIndex);
    // TODO: Change playback speed
  };

  return (
    <View style={styles.container}>
      {/* Play/Pause button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={28}
          color={COLORS.arcane.dark}
        />
      </TouchableOpacity>

      {/* Progress section */}
      <View style={styles.progressContainer}>
        {/* Time display */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Progress slider */}
        <Slider
          style={styles.slider}
          value={currentPosition}
          minimumValue={0}
          maximumValue={duration}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={COLORS.arcane.accent}
          maximumTrackTintColor={COLORS.gray[400]}
          thumbTintColor={COLORS.arcane.accent}
        />
      </View>

      {/* Speed control */}
      <TouchableOpacity
        style={styles.speedButton}
        onPress={handleSpeedChange}
        activeOpacity={0.7}
      >
        <Text style={styles.speedText}>
          {PLAYBACK_SPEEDS[speedIndex]}x
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.arcane.darkAlt,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.arcane.darkBorder,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.arcane.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  progressContainer: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[600],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  speedButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.arcane.darkBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  speedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.arcane.accent,
  },
});

export default AudioPlayer;
