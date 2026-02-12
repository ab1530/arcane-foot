import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPositionCoordinates, getRatingColor, formatRating } from '../../utils/performance-predictor';
import type { TeamPrediction } from '../../types/performance-predictor';

interface FormationViewProps {
  predictions: TeamPrediction[];
  onPlayerPress?: (prediction: TeamPrediction) => void;
}

const PITCH_WIDTH = Dimensions.get('window').width - 32;
const PITCH_HEIGHT = PITCH_WIDTH * 1.5; // 3:2 aspect ratio

export const FormationView: React.FC<FormationViewProps> = ({
  predictions,
  onPlayerPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Predicted Lineup</Text>

      {/* Football pitch */}
      <View style={[styles.pitch, { width: PITCH_WIDTH, height: PITCH_HEIGHT }]}>
        <LinearGradient
          colors={['#047857', '#059669']}
          style={styles.pitchGradient}
        >
          {/* Pitch markings */}
          <View style={styles.markings}>
            {/* Center line */}
            <View style={styles.centerLine} />

            {/* Center circle */}
            <View style={styles.centerCircle} />

            {/* Penalty areas */}
            <View style={[styles.penaltyBox, styles.topPenaltyBox]} />
            <View style={[styles.penaltyBox, styles.bottomPenaltyBox]} />

            {/* Goal areas */}
            <View style={[styles.goalBox, styles.topGoalBox]} />
            <View style={[styles.goalBox, styles.bottomGoalBox]} />
          </View>

          {/* Players */}
          {predictions.map((prediction, index) => {
            const position = prediction.playerPosition || 'CM';
            const coords = getPositionCoordinates(position);
            const ratingColor = getRatingColor(prediction.predictedRating);

            return (
              <TouchableOpacity
                key={prediction.playerId || index}
                style={[
                  styles.playerCircle,
                  {
                    left: coords.x * PITCH_WIDTH - 25,
                    top: coords.y * PITCH_HEIGHT - 25,
                    borderColor: ratingColor,
                  },
                ]}
                onPress={() => onPlayerPress?.(prediction)}
                activeOpacity={0.7}
              >
                <View style={[styles.playerInner, { backgroundColor: ratingColor }]}>
                  <Text style={styles.playerRating}>
                    {formatRating(prediction.predictedRating)}
                  </Text>
                </View>
                <Text style={styles.playerName} numberOfLines={1}>
                  {prediction.playerName || 'Unknown'}
                </Text>
                <View style={[styles.positionBadge, { backgroundColor: ratingColor }]}>
                  <Text style={styles.positionText}>{position}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  pitch: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pitchGradient: {
    flex: 1,
    position: 'relative',
  },
  markings: {
    ...StyleSheet.absoluteFillObject,
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginTop: -40,
    marginLeft: -40,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  penaltyBox: {
    position: 'absolute',
    left: '20%',
    width: '60%',
    height: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  topPenaltyBox: {
    top: 0,
    borderTopWidth: 0,
  },
  bottomPenaltyBox: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  goalBox: {
    position: 'absolute',
    left: '35%',
    width: '30%',
    height: '9%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  topGoalBox: {
    top: 0,
    borderTopWidth: 0,
  },
  bottomGoalBox: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  playerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
  },
  playerInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playerRating: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerName: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
  positionBadge: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  positionText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
