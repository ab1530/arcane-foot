import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { performancePredictorApi } from '../../../services/api/performance-predictor';
import { AccuracyMetricCard } from '../../../components/performance-predictor';
import {
  getAccuracyGrade,
  getAccuracyGradeColor,
  formatPercentage,
} from '../../../utils/performance-predictor';
import type { AccuracyMetrics } from '../../../types/performance-predictor';

const screenWidth = Dimensions.get('window').width;

export const AccuracyTab: React.FC = () => {
  const [metrics, setMetrics] = useState<AccuracyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccuracy();
  }, []);

  const loadAccuracy = async () => {
    setLoading(true);
    try {
      const data = await performancePredictorApi.getAccuracy();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load accuracy metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e6ff3c" />
        <Text style={styles.loadingText}>Loading accuracy metrics...</Text>
      </View>
    );
  }

  if (metrics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No accuracy data available yet</Text>
      </View>
    );
  }

  const latestMetrics = metrics[0];
  const grade = getAccuracyGrade(latestMetrics.avgError);
  const gradeColor = getAccuracyGradeColor(latestMetrics.avgError);

  // Prepare chart data (mock monthly trends for now)
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [0.92, 0.88, 0.85, 0.82, 0.79, latestMetrics.avgError],
        color: () => '#e6ff3c',
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#1F2937',
    backgroundGradientFrom: '#1F2937',
    backgroundGradientTo: '#111827',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(228, 255, 59, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#e6ff3c',
    },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Performance Grade */}
      <View style={styles.gradeContainer}>
        <Text style={styles.gradeLabel}>Model Performance Grade</Text>
        <Text style={[styles.gradeValue, { color: gradeColor }]}>{grade}</Text>
        <Text style={styles.gradeSubtext}>
          Based on Mean Absolute Error (MAE)
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricRow}>
          <AccuracyMetricCard
            label="Mean Error"
            value={latestMetrics.avgError.toFixed(2)}
            subtitle="Rating points"
            icon="analytics"
            color="#3B82F6"
          />
          <AccuracyMetricCard
            label="RMSE"
            value={latestMetrics.rmse.toFixed(2)}
            subtitle="Root Mean Squared"
            icon="stats-chart"
            color="#8B5CF6"
          />
        </View>
        <View style={styles.metricRow}>
          <AccuracyMetricCard
            label="Within CI"
            value={formatPercentage(latestMetrics.withinCI)}
            subtitle="95% confidence"
            icon="checkmark-circle"
            color="#10B981"
          />
          <AccuracyMetricCard
            label="Predictions"
            value={latestMetrics.totalPredictions.toString()}
            subtitle="Total made"
            icon="layers"
            color="#F59E0B"
          />
        </View>
      </View>

      {/* Trend Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Accuracy Trend (MAE)</Text>
        <Text style={styles.chartSubtitle}>
          Lower is better - tracking model improvement over time
        </Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={monthlyData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={true}
          />
        </View>
      </View>

      {/* Model Metadata */}
      <View style={styles.metadataSection}>
        <Text style={styles.sectionTitle}>Model Information</Text>

        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Model Version</Text>
          <Text style={styles.metadataValue}>{latestMetrics.modelVersion}</Text>
        </View>

        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Date Range</Text>
          <Text style={styles.metadataValue}>{latestMetrics.dateRange}</Text>
        </View>

        {latestMetrics.r2Score !== undefined && (
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>R² Score</Text>
            <Text style={styles.metadataValue}>
              {latestMetrics.r2Score.toFixed(3)}
            </Text>
          </View>
        )}

        <View style={styles.metadataItem}>
          <Text style={styles.metadataLabel}>Confidence Accuracy</Text>
          <Text style={styles.metadataValue}>
            {formatPercentage(latestMetrics.withinCI)} of predictions fall
            within 95% confidence interval
          </Text>
        </View>
      </View>

      {/* Performance Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Model Accuracy</Text>
          <Text style={styles.insightText}>
            The model achieves an average error of{' '}
            <Text style={styles.insightHighlight}>
              {latestMetrics.avgError.toFixed(2)} rating points
            </Text>
            , meaning predictions are typically within 1 point of actual
            performance.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Confidence Reliability</Text>
          <Text style={styles.insightText}>
            <Text style={styles.insightHighlight}>
              {formatPercentage(latestMetrics.withinCI)}
            </Text>{' '}
            of actual ratings fall within our predicted confidence intervals,
            demonstrating reliable uncertainty estimation.
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Data Coverage</Text>
          <Text style={styles.insightText}>
            Based on{' '}
            <Text style={styles.insightHighlight}>
              {latestMetrics.totalPredictions} historical predictions
            </Text>
            , providing robust statistical validation.
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  gradeContainer: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  gradeLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  gradeValue: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gradeSubtext: {
    color: '#6B7280',
    fontSize: 12,
  },
  metricsGrid: {
    marginHorizontal: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 8,
  },
  chart: {
    borderRadius: 16,
  },
  metadataSection: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  metadataItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  metadataLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  metadataValue: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  insightsSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  insightCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
  },
  insightHighlight: {
    color: '#e6ff3c',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
