import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../design/theme';

interface SelectProps {
  label?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const Select: React.FC<SelectProps> = ({ label, value, placeholder, onPress, style }) => {
  const displayValue = value?.trim() || placeholder || 'Sélectionner';

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.trigger} onPress={onPress} activeOpacity={0.85}>
        <Text style={[styles.value, !value?.trim() && styles.placeholder]} numberOfLines={1}>
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  trigger: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.input.background,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '500',
  },
  placeholder: {
    color: colors.input.placeholder,
  },
});

