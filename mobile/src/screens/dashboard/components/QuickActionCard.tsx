/**
 * ARCANE QUICK ACTION CARD
 * Premium quick action card with icon, label, and haptic feedback
 *
 * Features:
 * - Icon + label layout
 * - Yellow/white color variants
 * - Haptic feedback on press
 * - Glow effect for primary actions
 * - Smooth press animation
 *
 * @version 1.0.0
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../../design/tokens';
import { typographyPresets as typography } from '../../../design/typography';

// ============================================================================
// TYPES
// ============================================================================

export type QuickActionVariant = 'primary' | 'secondary';

export interface QuickActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: QuickActionVariant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

// ============================================================================
// QUICK ACTION CARD COMPONENT
// ============================================================================

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  style,
  testID,
}) => {
  const [scaleAnim] = React.useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: tokens.easing.spring.damping,
      stiffness: tokens.easing.spring.stiffness,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: tokens.easing.spring.damping,
      stiffness: tokens.easing.spring.stiffness,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const isPrimary = variant === 'primary';

  const containerStyle = [
    styles.container,
    isPrimary ? styles.containerPrimary : styles.containerSecondary,
    disabled && styles.containerDisabled,
    style,
  ];

  const iconColor = isPrimary
    ? tokens.colors.arcane.black
    : tokens.colors.yellow.DEFAULT;

  const labelStyle = [
    styles.label,
    isPrimary ? styles.labelPrimary : styles.labelSecondary,
    disabled && styles.labelDisabled,
  ];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={containerStyle}
        testID={testID}
      >
        {/* Background Glow for Primary */}
        {isPrimary && !disabled && (
          <View style={styles.glowBackground} />
        )}

        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            isPrimary ? styles.iconContainerPrimary : styles.iconContainerSecondary,
          ]}
        >
          <Ionicons name={icon} size={tokens.iconSize.md} color={iconColor} />
        </View>

        {/* Label */}
        <Text style={labelStyle} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  containerPrimary: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.bright,
    ...tokens.shadows.glowYellow,
  },
  containerSecondary: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderColor: tokens.colors.arcane.slate + '60',
    ...tokens.shadows.md,
  },
  containerDisabled: {
    opacity: 0.5,
    backgroundColor: tokens.colors.arcane.anthracite,
    borderColor: tokens.colors.arcane.slate + '40',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colors.yellow.glow,
    opacity: 0.3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerPrimary: {
    backgroundColor: tokens.colors.arcane.black + '20',
  },
  iconContainerSecondary: {
    backgroundColor: tokens.colors.yellow.dim,
  },
  label: {
    ...typography.caption,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: tokens.fontSize.sm,
    textAlign: 'center',
  },
  labelPrimary: {
    color: tokens.colors.arcane.black,
  },
  labelSecondary: {
    color: tokens.colors.gray[200],
  },
  labelDisabled: {
    color: tokens.colors.gray[500],
  },
});

export default QuickActionCard;
