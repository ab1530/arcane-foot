/**
 * TIME SLOT BUTTON COMPONENT
 * Selectable time slot button for booking flow
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSlotButtonProps {
  time: string;
  available: boolean;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({
  time,
  available,
  selected,
  onPress,
  style,
}) => {
  const handlePress = () => {
    if (!available) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={!available}
      style={[
        styles.container,
        !available && styles.disabled,
        selected && styles.selected,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          !available && styles.disabledText,
          selected && styles.selectedText,
        ]}
      >
        {time}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  disabled: {
    backgroundColor: tokens.colors.arcane.anthracite,
    borderColor: tokens.colors.gray[600],
    opacity: 0.5,
  },
  selected: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
    ...tokens.shadows.glowYellow,
  },
  text: {
    ...typography.buttonText,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.primary,
  },
  disabledText: {
    color: tokens.colors.gray[500],
  },
  selectedText: {
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
});
