/**
 * Line Chart Component for Mobile
 * Simple placeholder - Full charting implementation coming soon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../design/theme';

interface LineChartProps {
  title?: string;
  data: Array<{ name: string; [key: string]: any }>;
  lines: Array<{ dataKey: string; color: string; name: string }>;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  lines,
  height = 250,
}) => {
  // Calculate simple stats from data
  const getStats = () => {
    const stats: { [key: string]: { min: number; max: number; avg: number } } = {};

    lines.forEach(line => {
      const values = data.map(item => item[line.dataKey] || 0).filter(v => v > 0);
      if (values.length > 0) {
        stats[line.name] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        };
      }
    });

    return stats;
  };

  const stats = getStats();

  return (
    <View style={[styles.container, { minHeight: height }]}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📊</Text>
        <Text style={styles.placeholderText}>Chart View</Text>
        <Text style={styles.placeholderSubtext}>Visual charts coming soon</Text>
      </View>

      {/* Display stats instead */}
      <View style={styles.statsContainer}>
        {Object.entries(stats).map(([name, values], index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.legendDot, { backgroundColor: lines[index]?.color || colors.brand.primary }]} />
              <Text style={styles.statName}>{name}</Text>
            </View>
            <View style={styles.statValues}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Min</Text>
                <Text style={styles.statValue}>{values.min}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg</Text>
                <Text style={styles.statValue}>{values.avg}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max</Text>
                <Text style={styles.statValue}>{values.max}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  placeholderSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  statsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  statName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
