import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const AnimatedView = Animated.createAnimatedComponent(View);

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'ghost' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  rightIcon,
  variant = 'default',
  size = 'md',
  rounded = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnimation = useSharedValue(0);
  const errorAnimation = useSharedValue(error ? 1 : 0);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnimation.value = withSpring(1, theme.animations.springs.bouncy);
    Haptics.selectionAsync();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnimation.value = withSpring(0, theme.animations.springs.gentle);
    onBlur?.();
  };

  const handlePressContainer = () => {
    inputRef.current?.focus();
  };

  React.useEffect(() => {
    errorAnimation.value = withTiming(error ? 1 : 0, {
      duration: theme.animations.durations.fast,
    });
  }, [error]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnimation.value,
      [0, 1],
      [
        error ? theme.colors.semantic.error : theme.colors.surface.border,
        error ? theme.colors.semantic.error : theme.colors.brand.primary,
      ]
    );

    return {
      borderColor,
      transform: [
        {
          scale: withTiming(isFocused ? 1.01 : 1, {
            duration: theme.animations.durations.fast,
          }),
        },
      ],
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      focusAnimation.value,
      [0, 1],
      [theme.colors.text.secondary, theme.colors.brand.primary]
    ),
    transform: [
      {
        scale: withTiming(isFocused || props.value ? 0.85 : 1, {
          duration: theme.animations.durations.fast,
        }),
      },
      {
        translateY: withTiming(isFocused || props.value ? -24 : 0, {
          duration: theme.animations.durations.fast,
        }),
      },
    ],
  }));

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Animated.Text style={[styles.label, labelAnimatedStyle]}>
          {label}
        </Animated.Text>
      )}

      <Pressable onPress={handlePressContainer}>
        <AnimatedView
          style={[
            styles.container,
            styles[`container_${variant}`],
            styles[`container_${size}`],
            rounded && styles.rounded,
            error && styles.errorContainer,
            !editable && styles.disabled,
            containerAnimatedStyle,
          ]}
        >
          {icon && <View style={styles.iconLeft}>{icon}</View>}

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              styles[`input_${size}`],
              styles[`input_${variant}`],
              inputStyle,
            ]}
            placeholderTextColor={theme.colors.text.tertiary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={editable}
            {...props}
          />

          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </AnimatedView>
      </Pressable>

      {(error || helper) && (
        <Animated.Text
          style={[
            styles.helperText,
            error && styles.errorText,
            { opacity: errorAnimation.value },
          ]}
        >
          {error || helper}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: theme.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    left: theme.spacing.lg,
    top: theme.spacing.lg,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.xs,
    zIndex: 1,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.regular,
  },

  // Variants
  container_default: {
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  container_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  container_filled: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  container_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.surface.border,
  },

  // Sizes
  container_sm: {
    paddingHorizontal: theme.spacing.md,
    minHeight: 40,
  },
  container_md: {
    paddingHorizontal: theme.spacing.lg,
    minHeight: 48,
  },
  container_lg: {
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },

  input_sm: {
    fontSize: theme.typography.sizes.sm,
    paddingVertical: theme.spacing.sm,
  },
  input_md: {
    fontSize: theme.typography.sizes.base,
    paddingVertical: theme.spacing.md,
  },
  input_lg: {
    fontSize: theme.typography.sizes.lg,
    paddingVertical: theme.spacing.lg,
  },

  // Input variant styles
  input_default: {},
  input_ghost: {},
  input_filled: {},
  input_outline: {},

  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },

  rounded: {
    borderRadius: 999,
  },

  disabled: {
    opacity: 0.5,
  },

  errorContainer: {
    borderColor: theme.colors.semantic.error,
  },

  helperText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.lg,
  },

  errorText: {
    color: theme.colors.semantic.error,
  },
});

export default Input;