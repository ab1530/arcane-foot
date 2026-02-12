import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import type { RatingDistribution as RatingDistributionType } from '../../types/performance-predictor';

interface RatingDistributionProps {
  distribution: RatingDistributionType;
}

const screenWidth = Dimensions.get('window').width;

export const RatingDistribution: React.FC<RatingDistributionProps> = ({ distribution }) => {
  const data = [
    {
      name: 'Excellent (8+)',
      population: distribution.excellent_8_plus,
      color: '#10B981',
      legendFontColor: '#D1D5DB',
      legendFontSize: 12,
    },
    {
      name: 'Good (7-8)',
      population: distribution.good_7_8,
      color: '#3B82F6',
      legendFontColor: '#D1D5DB',
      legendFontSize: 12,
    },
    {
      name: 'Average (5-7)',
      population: distribution.average_5_7,
      color: '#EAB308',
      legendFontColor: '#D1D5DB',
      legendFontSize: 12,
    },
    {
      name: 'Poor (0-5)',
      population: distribution.poor_0_5,
      color: '#EF4444',
      legendFontColor: '#D1D5DB',
      legendFontSize: 12,
    },
  ];

  // Find most likely category
  const mostLikely = data.reduce((prev, current) =>
    prev.population > current.population ? prev : current
  );

  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rating Probability Distribution</Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={data}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
          hasLegend={true}
        />

        {/* Center label showing most likely */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerLabelTitle}>Most Likely</Text>
          <Text style={[styles.centerLabelValue, { color: mostLikely.color }]}>
            {mostLikely.name.split(' ')[0]}
          </Text>
          <Text style={styles.centerLabelPercentage}>
            {(mostLikely.population * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Legend with percentages */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.name}</Text>
            <Text style={styles.legendPercentage}>
              {(item.population * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  centerLabel: {
    position: 'absolute',
    top: '40%',
    left: 40,
    alignItems: 'center',
  },
  centerLabelTitle: {
    color: '#9CA3AF',
    fontSize: 10,
    marginBottom: 4,
  },
  centerLabelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  centerLabelPercentage: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  legend: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
  },
  legendPercentage: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});
