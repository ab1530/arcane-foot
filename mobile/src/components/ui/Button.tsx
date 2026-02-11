import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius, shadows } from '../../design/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button];

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.push(styles.sm);
        break;
      case 'lg':
        baseStyle.push(styles.lg);
        break;
      default:
        baseStyle.push(styles.md);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
    }

    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: TextStyle[] = [styles.text];

    switch (size) {
      case 'sm':
        baseStyle.push(styles.textSm);
        break;
      case 'lg':
        baseStyle.push(styles.textLg);
        break;
      default:
        baseStyle.push(styles.textMd);
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        baseStyle.push(styles.textOutline);
        break;
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    }

    return baseStyle;
  };

  const content = (
    <>
      {loading && <ActivityIndicator color={variant === 'default' ? colors.background.primary : colors.brand.primary} style={{ marginRight: spacing.sm }} />}
      {!loading && icon && icon}
      <Text style={[...getTextStyle(), textStyle]}>{children}</Text>
    </>
  );

  if (variant === 'default' && !disabled) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={style} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[...getButtonStyle(), { borderWidth: 0 }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[...getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    ...shadows.md,
  },
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  secondary: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
    color: colors.background.primary,
  },
  textSm: {
    fontSize: typography.sizes.sm,
  },
  textMd: {
    fontSize: typography.sizes.base,
  },
  textLg: {
    fontSize: typography.sizes.lg,
  },
  textOutline: {
    color: colors.brand.primary,
  },
  textDisabled: {
    color: colors.text.muted,
  },
});
