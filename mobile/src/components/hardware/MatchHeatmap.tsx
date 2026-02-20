import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import type { ThermalTrajectoryMap } from '../../types/hardware';

interface MatchHeatmapProps {
  thermalTrajectoryMap?: ThermalTrajectoryMap | null;
  width?: number;
  height?: number;
  showLegend?: boolean;
}

const colorFromIntensity = (intensity: number) => {
  const clamped = Math.max(0, Math.min(1, intensity));
  const alpha = 0.12 + clamped * 0.72;
  const green = Math.round(228 - clamped * 170);
  return `rgba(255, ${green}, 49, ${alpha})`;
};

export const MatchHeatmap: React.FC<MatchHeatmapProps> = ({
  thermalTrajectoryMap,
  width = 280,
  height,
  showLegend = true,
}) => {
  const pitchHeight = height ?? Math.round((width * 68) / 105);

  const normalized = useMemo(() => {
    if (!thermalTrajectoryMap) {
      return {
        gridCols: 25,
        gridRows: 25,
        cells: [],
      };
    }

    return {
      gridCols: thermalTrajectoryMap.gridCols || 25,
      gridRows: thermalTrajectoryMap.gridRows || 25,
      cells: thermalTrajectoryMap.cells || [],
    };
  }, [thermalTrajectoryMap]);

  const cellWidth = width / normalized.gridCols;
  const cellHeight = pitchHeight / normalized.gridRows;

  if (!thermalTrajectoryMap || normalized.cells.length === 0) {
    return (
      <View style={[styles.container, { width }]}> 
        <View style={[styles.emptyField, { width, height: pitchHeight }]}> 
          <Text style={styles.emptyText}>Heatmap indisponible</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width }]}> 
      <Svg width={width} height={pitchHeight}>
        <Rect x={0} y={0} width={width} height={pitchHeight} rx={10} fill="#0b6d42" />

        {normalized.cells.map((cell) => (
          <Rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x * cellWidth}
            y={cell.y * cellHeight}
            width={cellWidth}
            height={cellHeight}
            fill={colorFromIntensity(cell.intensity ?? 0)}
          />
        ))}

        {/* pitch markings */}
        <Rect
          x={2}
          y={2}
          width={width - 4}
          height={pitchHeight - 4}
          rx={10}
          fill="transparent"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.5}
        />
        <Line
          x1={width / 2}
          y1={2}
          x2={width / 2}
          y2={pitchHeight - 2}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.2}
        />
        <Circle
          cx={width / 2}
          cy={pitchHeight / 2}
          r={Math.min(width, pitchHeight) * 0.1}
          fill="transparent"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.2}
        />
      </Svg>

      {showLegend ? (
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Faible</Text>
          <View style={styles.legendBar}>
            {Array.from({ length: 12 }).map((_, idx) => (
              <View
                key={`legend-${idx}`}
                style={[
                  styles.legendSlice,
                  { backgroundColor: colorFromIntensity(idx / 11) },
                ]}
              />
            ))}
          </View>
          <Text style={styles.legendText}>Élevée</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  emptyField: {
    borderRadius: 10,
    backgroundColor: '#144f36',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBar: {
    flex: 1,
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  legendSlice: {
    flex: 1,
  },
  legendText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
});
