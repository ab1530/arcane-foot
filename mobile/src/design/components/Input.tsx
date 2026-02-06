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
    marginVertical: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    left: 24,
    top: 24,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 4,
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
    paddingHorizontal: 16,
    minHeight: 40,
  },
  container_md: {
    paddingHorizontal: 24,
    minHeight: 48,
  },
  container_lg: {
    paddingHorizontal: 32,
    minHeight: 56,
  },

  input_sm: {
    fontSize: theme.typography.sizes.sm,
    paddingVertical: 8,
  },
  input_md: {
    fontSize: theme.typography.sizes.base,
    paddingVertical: 16,
  },
  input_lg: {
    fontSize: theme.typography.sizes.lg,
    paddingVertical: 24,
  },

  // Input variant styles
  input_default: {},
  input_ghost: {},
  input_filled: {},
  input_outline: {},

  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
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
    marginTop: 4,
    marginLeft: 24,
  },

  errorText: {
    color: theme.colors.semantic.error,
  },
});

export default Input;