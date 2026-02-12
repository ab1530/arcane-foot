/**
 * RecordButton Component
 *
 * Large circular button with microphone icon for starting/stopping audio recording.
 * Features:
 * - Pulsing animation when recording
 * - Haptic feedback on press
 * - Different states (idle, recording, recorded)
 */

import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../constants/config';
import type { RecordingState } from '../../types/voice-to-report';

interface RecordButtonProps {
  state: RecordingState;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  state,
  onPress,
  disabled = false,
  size = 100,
}) => {
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Start pulsing animation when recording
  useEffect(() => {
    if (state === 'recording') {
      // Inner button pulse
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Outer ring pulse
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [state]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    if (state === 'idle' || state === 'recorded') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    onPress();
  };

  const getButtonColor = () => {
    if (disabled) return COLORS.gray[600];
    if (state === 'recording') return COLORS.danger;
    if (state === 'recorded') return COLORS.success;
    return COLORS.arcane.accent;
  };

  const getIconName = () => {
    if (state === 'recording') return 'stop';
    if (state === 'recorded') return 'checkmark';
    return 'mic';
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Pulsing outer ring when recording */}
      {state === 'recording' && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: (size * 1.4) / 2,
              backgroundColor: COLORS.danger,
            },
            pulseAnimatedStyle,
          ]}
        />
      )}

      {/* Main button */}
      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getButtonColor(),
            },
          ]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Ionicons
            name={getIconName() as any}
            size={size * 0.5}
            color={state === 'recording' ? COLORS.white : COLORS.arcane.dark}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
  },
});

export default RecordButton;
