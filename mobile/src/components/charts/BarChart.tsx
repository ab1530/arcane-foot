/**
 * Bar Chart Component for Mobile
 * Simple horizontal bars - Full charting implementation coming soon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../design/theme';

interface BarChartProps {
  title?: string;
  data: Array<{ name: string; [key: string]: any }>;
  bars: Array<{ dataKey: string; color: string; name: string }>;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  bars,
  height = 250,
}) => {
  // Calculate max value for scaling
  const barData = bars[0];
  const values = data.map(item => item[barData.dataKey] || 0);
  const maxValue = Math.max(...values, 1);

  return (
    <View style={[styles.container, { minHeight: height }]}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📊</Text>
        <Text style={styles.placeholderText}>Bar Chart View</Text>
        <Text style={styles.placeholderSubtext}>Visual bar chart coming soon</Text>
      </View>

      {/* Display horizontal bars */}
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const value = item[barData.dataKey] || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <View key={index} style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.barValue}>{value}</Text>
              </View>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: barData.color,
                    }
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: barData.color }]} />
          <Text style={styles.legendText}>{barData.name}</Text>
        </View>
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
    paddingVertical: spacing.lg,
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
  barsContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  barItem: {
    gap: spacing.xs,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  barValue: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  barBackground: {
    height: 24,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
