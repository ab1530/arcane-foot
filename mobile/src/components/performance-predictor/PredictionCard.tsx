import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRatingColor, getRatingLabel, getConfidenceLabel, getConfidenceColor } from '../../utils/performance-predictor';

interface PredictionCardProps {
  prediction: {
    rating: number;
    interval: [number, number];
    confidence: number;
  };
  player: {
    name: string;
    position: string;
    photo?: string;
  };
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, player }) => {
  const ratingColor = getRatingColor(prediction.rating);
  const ratingLabel = getRatingLabel(prediction.rating);
  const confidenceLabel = getConfidenceLabel(prediction.confidence);
  const confidenceColor = getConfidenceColor(prediction.confidence);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        {/* Player Info */}
        <View style={styles.header}>
          {player.photo ? (
            <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
          ) : (
            <View style={[styles.playerPhoto, styles.photoPlaceholder]}>
              <Text style={styles.photoPlaceholderText}>
                {player.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
        </View>

        {/* Predicted Rating */}
        <View style={styles.ratingContainer}>
          <Text style={[styles.rating, { color: ratingColor }]}>
            {prediction.rating.toFixed(1)}
          </Text>
          <View style={[styles.labelBadge, { backgroundColor: ratingColor + '20' }]}>
            <Text style={[styles.labelText, { color: ratingColor }]}>
              {ratingLabel}
            </Text>
          </View>
        </View>

        {/* Confidence Interval */}
        <View style={styles.intervalContainer}>
          <Text style={styles.intervalLabel}>Confidence Interval</Text>
          <Text style={styles.intervalValue}>
            {prediction.interval[0].toFixed(1)} - {prediction.interval[1].toFixed(1)}
          </Text>
        </View>

        {/* Confidence Score */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceHeader}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={[styles.confidenceValue, { color: confidenceColor }]}>
              {confidenceLabel}
            </Text>
          </View>
          <View style={styles.confidenceBarContainer}>
            <View
              style={[
                styles.confidenceBar,
                {
                  width: `${prediction.confidence * 100}%`,
                  backgroundColor: confidenceColor,
                },
              ]}
            />
          </View>
          <Text style={styles.confidencePercentage}>
            {(prediction.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  playerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  photoPlaceholder: {
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerPosition: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rating: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  labelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  intervalContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  intervalLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  intervalValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBarContainer: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 4,
  },
  confidencePercentage: {
    color: '#D1D5DB',
    fontSize: 12,
    textAlign: 'right',
  },
});
