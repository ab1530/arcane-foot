/**
 * DNA Radar Chart Component
 * Displays 8-dimensional player DNA profile using Victory Native
 * TODO: Migrate to victory-native v41+ API (PolarChart instead of VictoryChart)
 */

import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
// TODO: victory-native v41+ has a new API. Need to migrate from Victory* to new API
// import { VictoryPolar, VictoryChart, VictoryArea, VictoryPolarAxis, VictoryLabel } from 'victory-native';
import type { DNAProfile } from '../../types/playstyle-dna';
import { getStyleColor } from '../../utils/playStyleColors';
import { colors, typography, radius, spacing } from '../../design/theme';

interface DNARadarChartProps {
  dnaProfile: DNAProfile;
  styleColor?: string;
  size?: number;
  animated?: boolean;
  showLabels?: boolean;
}

export const DNARadarChart: React.FC<DNARadarChartProps> = ({
  dnaProfile,
  styleColor = '#E4FF3B',
  size = 250,
  animated = true,
  showLabels = true,
}) => {
  // Convert DNA profile to chart data
  const data = [
    { x: 'Technical', y: dnaProfile.technical },
    { x: 'Tactical', y: dnaProfile.tactical },
    { x: 'Physical', y: dnaProfile.physical },
    { x: 'Mental', y: dnaProfile.mental },
    { x: 'Pace', y: dnaProfile.pace },
    { x: 'Strength', y: dnaProfile.strength },
    { x: 'Creativity', y: dnaProfile.creativity },
    { x: 'Work Rate', y: dnaProfile.workRate },
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* TODO: Replace with victory-native v41+ PolarChart implementation */}
      <View style={[styles.placeholder, { backgroundColor: `${styleColor}10`, borderColor: styleColor }]}>
        <Text style={[styles.placeholderText, { color: styleColor }]}>DNA Radar Chart</Text>
        <Text style={styles.placeholderSubtext}>8-dimensional profile</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  placeholderSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
});

export default DNARadarChart;
