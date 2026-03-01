import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../design/theme';
import type { SegmentOption } from '../../types/ui';

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.segment, active && styles.segmentActive, option.disabled && styles.segmentDisabled]}
            onPress={() => !option.disabled && onChange(option.key)}
            activeOpacity={0.85}
            disabled={option.disabled}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 4,
    gap: 6,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  segmentLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: colors.background.primary,
  },
});

