import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConfidenceIntervalProps {
  interval: [number, number];
  predictedValue: number;
}

export const ConfidenceInterval: React.FC<ConfidenceIntervalProps> = ({
  interval,
  predictedValue,
}) => {
  const min = 0;
  const max = 10;
  const range = max - min;

  // Calculate positions (0-100%)
  const lowPosition = ((interval[0] - min) / range) * 100;
  const highPosition = ((interval[1] - min) / range) * 100;
  const predictedPosition = ((predictedValue - min) / range) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>95% Confidence Interval</Text>

      {/* Scale labels */}
      <View style={styles.scaleContainer}>
        <Text style={styles.scaleLabel}>0</Text>
        <Text style={styles.scaleLabel}>5</Text>
        <Text style={styles.scaleLabel}>10</Text>
      </View>

      {/* Slider track */}
      <View style={styles.track}>
        {/* Confidence interval range */}
        <View
          style={[
            styles.intervalRange,
            {
              left: `${lowPosition}%`,
              width: `${highPosition - lowPosition}%`,
            },
          ]}
        />

        {/* Predicted value marker */}
        <View
          style={[
            styles.predictedMarker,
            {
              left: `${predictedPosition}%`,
            },
          ]}
        >
          <View style={styles.markerDot} />
          <View style={styles.markerLine} />
        </View>

        {/* Interval endpoints */}
        <View
          style={[
            styles.endpointMarker,
            {
              left: `${lowPosition}%`,
            },
          ]}
        />
        <View
          style={[
            styles.endpointMarker,
            {
              left: `${highPosition}%`,
            },
          ]}
        />
      </View>

      {/* Values display */}
      <View style={styles.valuesContainer}>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Low</Text>
          <Text style={styles.valueText}>{interval[0].toFixed(1)}</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Predicted</Text>
          <Text style={[styles.valueText, styles.predictedText]}>
            {predictedValue.toFixed(1)}
          </Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>High</Text>
          <Text style={styles.valueText}>{interval[1].toFixed(1)}</Text>
        </View>
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
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scaleLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  track: {
    height: 40,
    backgroundColor: '#374151',
    borderRadius: 20,
    position: 'relative',
    marginBottom: 16,
  },
  intervalRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#3B82F6',
    opacity: 0.3,
    borderRadius: 20,
  },
  predictedMarker: {
    position: 'absolute',
    top: -4,
    height: 48,
    width: 4,
    alignItems: 'center',
    marginLeft: -2,
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E4FF3B',
    borderWidth: 3,
    borderColor: '#1F2937',
  },
  markerLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#E4FF3B',
    opacity: 0.5,
  },
  endpointMarker: {
    position: 'absolute',
    top: 12,
    width: 12,
    height: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    marginLeft: -6,
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  valueItem: {
    alignItems: 'center',
  },
  valueLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 4,
  },
  valueText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  },
  predictedText: {
    color: '#E4FF3B',
  },
});
