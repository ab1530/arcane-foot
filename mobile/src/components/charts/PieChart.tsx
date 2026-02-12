/**
 * Pie Chart Component for Mobile
 * Simple visual representation - Full charting implementation coming soon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../design/theme';

interface PieChartProps {
  title?: string;
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [colors.brand.primary, colors.semantic.info, colors.semantic.success, colors.semantic.warning, colors.semantic.error];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  colors = DEFAULT_COLORS,
  height = 250,
}) => {
  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const dataWithPercentages = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
    color: colors[index % colors.length],
  }));

  return (
    <View style={[styles.container, { minHeight: height }]}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📊</Text>
        <Text style={styles.placeholderText}>Distribution View</Text>
        <Text style={styles.placeholderSubtext}>Visual pie chart coming soon</Text>
      </View>

      {/* Display bars instead of pie */}
      <View style={styles.barsContainer}>
        {dataWithPercentages.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <View style={styles.barHeader}>
              <View style={styles.barLabelContainer}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.barLabel}>{item.name}</Text>
              </View>
              <Text style={styles.barValue}>{item.percentage}%</Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }
                ]}
              />
            </View>
            <Text style={styles.barCount}>{item.value} items</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{total}</Text>
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
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  barLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
  },
  barValue: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: 'bold',
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  totalContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    color: colors.brand.primary,
    fontWeight: 'bold',
  },
});
