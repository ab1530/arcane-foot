import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '../../design/theme';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  glowOnPress?: boolean;
  style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glowOnPress = false,
  style,
}) => {
  const containerStyle = [
    styles.container,
    variant === 'elevated' && styles.elevated,
    variant === 'bordered' && styles.bordered,
    glowOnPress && styles.glowOnPress,
    style,
  ];

  if (variant === 'elevated') {
    return (
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.08)',
          'rgba(255, 255, 255, 0.03)',
        ]}
        style={containerStyle}
      >
        {children}
      </LinearGradient>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    overflow: 'hidden',
  },
  elevated: {
    ...shadows.md,
    borderWidth: 1.5,
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  glowOnPress: {
    ...shadows.glow,
  },
});
