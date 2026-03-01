import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows } from '../../design/theme';
import type { CardVariant } from '../../types/ui';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  glowOnPress?: boolean;
  style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glowOnPress = false,
  style,
}) => {
  const resolvedVariant = variant === 'default' ? 'soft' : variant;
  const containerStyle = [
    styles.container,
    resolvedVariant === 'soft' && styles.soft,
    resolvedVariant === 'elevated' && styles.elevated,
    resolvedVariant === 'bordered' && styles.bordered,
    resolvedVariant === 'featured' && styles.featured,
    glowOnPress && styles.glowOnPress,
    style,
  ];

  if (resolvedVariant === 'elevated' || resolvedVariant === 'featured') {
    const gradientColors =
      resolvedVariant === 'featured'
        ? ['rgba(228, 255, 59, 0.12)', 'rgba(88, 230, 255, 0.08)', 'rgba(20, 27, 52, 0.92)']
        : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)'];
    return (
      <LinearGradient
        colors={gradientColors}
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
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  soft: {
    backgroundColor: colors.surface.glassLight,
  },
  elevated: {
    backgroundColor: colors.surface.glassMedium,
    ...shadows.md,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
  },
  featured: {
    backgroundColor: colors.surface.cardFeatured,
    ...shadows.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.primary + '90',
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 10,
  },
  bordered: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  glowOnPress: {
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 4,
  },
});
