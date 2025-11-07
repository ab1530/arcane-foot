import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryArea } from 'victory-native';
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
        <VictoryChart
          width={screenWidth - 32}
          height={height}
          padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
          theme={VictoryTheme.material}
        >
          {/* Y-axis */}
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: colors.surface.border },
              tickLabels: {
                fill: colors.text.secondary,
                fontSize: 10,
              },
              grid: {
                stroke: colors.surface.borderLight,
                strokeDasharray: '4,4',
              },
            }}
            tickFormat={(t) => `€${t}M`}
          />

          {/* X-axis */}
          <VictoryAxis
            style={{
              axis: { stroke: colors.surface.border },
              tickLabels: {
                fill: colors.text.secondary,
                fontSize: 10,
                angle: -45,
                textAnchor: 'end',
              },
            }}
            tickFormat={(t) => {
              const index = Math.round(t);
              if (index >= 0 && index < dataPoints.length) {
                return formatDate(dataPoints[index].timestamp);
              }
              return '';
            }}
            tickCount={Math.min(5, dataPoints.length)}
          />

          {/* Area gradient */}
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: `url(#gradient)`,
                opacity: 0.2,
              },
            }}
            interpolation="natural"
          />

          {/* Line */}
          <VictoryLine
            data={chartData}
            style={{
              data: {
                stroke: colors.brand.primary,
                strokeWidth: 3,
              },
            }}
            interpolation="natural"
          />
        </VictoryChart>
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
