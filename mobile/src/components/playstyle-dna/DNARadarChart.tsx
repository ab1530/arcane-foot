/**
 * DNA Radar Chart Component
 * Displays 8-dimensional player DNA profile using Victory Native
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryPolar, VictoryChart, VictoryArea, VictoryPolarAxis, VictoryLabel } from 'victory-native';
import type { DNAProfile } from '../../types/playstyle-dna';
import { getStyleColor } from '../../utils/playStyleColors';

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
      <VictoryChart
        polar
        width={size}
        height={size}
        domain={{ y: [0, 10] }}
        padding={{ top: 40, bottom: 40, left: 40, right: 40 }}
      >
        {/* Background grid */}
        <VictoryPolarAxis
          dependentAxis
          style={{
            axis: { stroke: 'rgba(255, 255, 255, 0.1)' },
            grid: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
            tickLabels: { fill: 'transparent' },
          }}
          tickValues={[2, 4, 6, 8, 10]}
        />

        {/* Category axes */}
        <VictoryPolarAxis
          style={{
            axis: { stroke: 'rgba(255, 255, 255, 0.2)' },
            tickLabels: {
              fill: showLabels ? '#FFFFFF' : 'transparent',
              fontSize: 10,
              fontWeight: '600',
            },
          }}
          labelPlacement="perpendicular"
        />

        {/* DNA area chart */}
        <VictoryArea
          data={data}
          style={{
            data: {
              fill: `${styleColor}33`, // 20% opacity
              stroke: styleColor,
              strokeWidth: 2,
            },
          }}
          animate={
            animated
              ? {
                  duration: 2000,
                  onLoad: { duration: 2000 },
                }
              : undefined
          }
          interpolation="linear"
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DNARadarChart;
