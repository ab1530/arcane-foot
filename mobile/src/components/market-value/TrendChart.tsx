import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// TODO: victory-native v41+ has a new API. Need to migrate from VictoryLine/VictoryChart to CartesianChart/Line
// import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryArea } from 'victory-native';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../ui';
import type { ValuationDataPoint } from '../../types/market-value';

const { width: screenWidth } = Dimensions.get('window');

export interface TrendChartProps {
  dataPoints: ValuationDataPoint[];
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  dataPoints,
  trend,
  changePercentage,
  height = 220,
}) => {
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="trendingUp" size={48} color={colors.text.secondary} />
        <Text style={styles.emptyText}>No historical data available</Text>
      </View>
    );
  }

  const chartData = dataPoints.map((point, index) => ({
    x: index,
    y: point.value,
  }));

  const formatDate = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTrendIcon = () => {
    if (trend === 'up') return 'trendingUp';
    if (trend === 'down') return 'trendingDown';
    return 'remove';
  };

  const getTrendColor = () => {
    if (trend === 'up') return colors.semantic.success;
    if (trend === 'down') return colors.semantic.error;
    return colors.text.secondary;
  };

  const getTrendLabel = () => {
    if (trend === 'up') return 'Increasing';
    if (trend === 'down') return 'Decreasing';
    return 'Stable';
  };

  const minValue = Math.min(...chartData.map((d) => d.y));
  const maxValue = Math.max(...chartData.map((d) => d.y));
  const padding = (maxValue - minValue) * 0.1 || 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.trendInfo}>
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: getTrendColor() + '20',
                borderColor: getTrendColor(),
              },
            ]}
          >
            <Icon name={getTrendIcon()} size={16} color={getTrendColor()} />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {getTrendLabel()}
            </Text>
          </View>
          <Text style={styles.changeText}>
            {changePercentage > 0 ? '+' : ''}
            {changePercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* TODO: Replace with victory-native v41+ CartesianChart implementation */}
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderText}>Chart visualization</Text>
          <Text style={styles.placeholderSubtext}>
            {dataPoints.length} data points
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Historical valuation trend over {dataPoints.length} data points
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  trendText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  changeText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartPlaceholder: {
    width: screenWidth - 64,
    height: 220,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  placeholderSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
