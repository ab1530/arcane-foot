import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, theme.animations.springs.stiff);
    opacity.value = withTiming(0.8, { duration: 100 });
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animations.springs.bouncy);
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gradient'
            ? theme.colors.text.inverse
            : theme.colors.brand.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconContainer}>{icon}</View>
          )}
          <Text style={[
            styles.text,
            styles[`text_${size}`],
            styles[`text_${variant}`],
            textStyle,
          ]}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconContainer}>{icon}</View>
          )}
        </>
      )}
    </>
  );

  const buttonStyle = [
    styles.button,
    styles[`button_${size}`],
    styles[`button_${variant}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    animatedStyle,
    style,
  ];

  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={buttonStyle}
      >
        <LinearGradient
          colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, styles[`button_${size}`]]}
        >
          <View style={styles.buttonContent}>{buttonContent}</View>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={buttonStyle}
    >
      <View style={styles.buttonContent}>{buttonContent}</View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sizes
  button_sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 32,
  },
  button_md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 40,
  },
  button_lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 48,
  },
  button_xl: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.xl,
    minHeight: 56,
  },

  // Variants
  button_primary: {
    backgroundColor: theme.colors.brand.primary,
    ...theme.shadows.md,
  },
  button_secondary: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
  },
  button_destructive: {
    backgroundColor: theme.colors.semantic.error,
    ...theme.shadows.md,
  },
  button_gradient: {
    ...theme.shadows.lg,
  },

  // Text styles
  text: {
    fontFamily: theme.typography.fonts.semiBold,
    fontWeight: theme.typography.weights.semiBold,
  },
  text_sm: {
    fontSize: theme.typography.sizes.sm,
  },
  text_md: {
    fontSize: theme.typography.sizes.button,
  },
  text_lg: {
    fontSize: theme.typography.sizes.lg,
  },
  text_xl: {
    fontSize: theme.typography.sizes.xl,
  },

  text_primary: {
    color: theme.colors.text.inverse,
  },
  text_secondary: {
    color: theme.colors.text.primary,
  },
  text_ghost: {
    color: theme.colors.brand.primary,
  },
  text_outline: {
    color: theme.colors.brand.primary,
  },
  text_destructive: {
    color: theme.colors.text.primary,
  },
  text_gradient: {
    color: theme.colors.text.inverse,
  },

  iconContainer: {
    marginHorizontal: theme.spacing.xs,
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },
});

export default Button;