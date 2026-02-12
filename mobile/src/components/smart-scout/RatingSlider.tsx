import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, radius } from '../../design/theme';

interface RatingSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const RatingSlider: React.FC<RatingSliderProps> = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
}) => {
  const handleValueChange = (newValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  const getColorForValue = (val: number): string => {
    if (val < 33) return colors.status.error;
    if (val < 66) return colors.status.warning;
    return colors.status.success;
  };

  const currentColor = getColorForValue(value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.badge, { backgroundColor: currentColor }]}>
          <Text style={styles.value}>{Math.round(value)}</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        value={value}
        onValueChange={handleValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={currentColor}
        maximumTrackTintColor={colors.surface.glassLight}
        thumbTintColor={currentColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  badge: {
    minWidth: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
