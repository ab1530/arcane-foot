import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { InputState } from '../../types/ui';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  state?: InputState;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  state,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const resolvedState: InputState = error
    ? 'error'
    : props.editable === false
    ? 'disabled'
    : state ?? (isFocused ? 'focused' : 'default');
  const inputStyles: StyleProp<TextStyle> = [
    styles.input,
    icon ? styles.inputWithIcon : null,
    resolvedState === 'disabled' ? styles.inputDisabled : null,
    style,
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          resolvedState === 'focused' && styles.inputFocused,
          resolvedState === 'error' && styles.inputError,
          resolvedState === 'disabled' && styles.inputContainerDisabled,
        ]}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          style={inputStyles}
          placeholderTextColor={colors.input.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconRight}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: colors.border.focus,
    borderWidth: 1.5,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 3,
  },
  inputError: {
    borderColor: colors.border.danger,
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputDisabled: {
    color: colors.text.disabled,
  },
  iconLeft: {
    paddingLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    paddingRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
});
