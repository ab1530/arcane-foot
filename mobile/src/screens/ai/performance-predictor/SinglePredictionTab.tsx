import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { performancePredictorApi } from '../../../services/api/performance-predictor';
import api from '../../../services/api';
import {
  PredictionCard,
  RatingDistribution,
  KeyFactorItem,
  RecommendationCard,
  ConfidenceInterval,
} from '../../../components/performance-predictor';
import type { PerformancePrediction } from '../../../types/performance-predictor';

export const SinglePredictionTab: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerPicking, setPlayerPicking] = useState(false);
  const [matchPicking, setMatchPicking] = useState(false);

  const handleSelectPlayer = async () => {
    try {
      setPlayerPicking(true);
      const response = await api.getPlayers({ limit: 1 });
      const candidate =
        response?.data?.[0] ??
        response?.items?.[0] ??
        (response as any)?.players?.[0];

      if (!candidate) {
        throw new Error('No players available');
      }

      const id =
        candidate.id ??
        candidate.playerId ??
        candidate.player?.id;
      if (!id) {
        throw new Error('Missing player identifier');
      }

      const name =
        `${candidate.user?.firstName ?? candidate.users?.firstName ?? ''} ${
          candidate.user?.lastName ?? candidate.users?.lastName ?? ''
        }`.trim() || candidate.playerName || 'Unknown Player';

      setSelectedPlayer({
        id,
        name,
        position: candidate.position || candidate.player?.position || 'N/A',
        photo: candidate.user?.avatar ?? candidate.users?.avatar,
      });
      Toast.show({ type: 'success', text1: 'Player Selected', text2: name });
    } catch (error) {
      console.error('Failed to pick player', error);
      Alert.alert('Player Picker', 'Unable to load players right now.');
    } finally {
      setPlayerPicking(false);
    }
  };

  const handleSelectMatch = async () => {
    try {
      setMatchPicking(true);
      const response = await api.getMatches({ limit: 1 });
      const candidate =
        response?.data?.[0] ??
        response?.items?.[0] ??
        (response as any)?.matches?.[0];

      if (!candidate) {
        throw new Error('No matches available');
      }

      const id = candidate.id || candidate.matchId;
      if (!id) {
        throw new Error('Missing match identifier');
      }

      const home = candidate.homeClub?.name ?? candidate.clubs?.home?.name ?? 'Home';
      const away = candidate.awayClub?.name ?? candidate.clubs?.away?.name ?? 'Away';
      const matchName = `${home} vs ${away}`;

      setSelectedMatch({
        id,
        name: matchName,
        date: candidate.scheduledAt || candidate.date,
      });
      Toast.show({ type: 'success', text1: 'Match Selected', text2: matchName });
    } catch (error) {
      console.error('Failed to pick match', error);
      Alert.alert('Match Picker', 'Unable to load matches right now.');
    } finally {
      setMatchPicking(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedPlayer || !selectedMatch) {
      Alert.alert('Missing Selection', 'Please select both a player and a match.');
      return;
    }

    setLoading(true);
    try {
      const result = await performancePredictorApi.predict(
        selectedPlayer.id,
        selectedMatch.id
      );
      setPrediction(result);
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert(
        'Prediction Failed',
        'Unable to generate prediction. The ML service may be unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Player Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Player</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={handleSelectPlayer}
          disabled={playerPicking}
        >
          {playerPicking ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <Ionicons name="person" size={20} color="#9CA3AF" />
          )}
          <Text style={styles.pickerText}>
            {selectedPlayer ? selectedPlayer.name : 'Choose a player...'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Match Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Match</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={handleSelectMatch}
          disabled={matchPicking}
        >
          {matchPicking ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <Ionicons name="football" size={20} color="#9CA3AF" />
          )}
          <Text style={styles.pickerText}>
            {selectedMatch ? selectedMatch.name : 'Choose a match...'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Predict Button */}
      <TouchableOpacity
        style={[
          styles.predictButton,
          (!selectedPlayer || !selectedMatch) && styles.predictButtonDisabled,
        ]}
        onPress={handlePredict}
        disabled={!selectedPlayer || !selectedMatch || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <>
            <Ionicons name="analytics" size={20} color="#000000" />
            <Text style={styles.predictButtonText}>Predict Performance</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Prediction Results */}
      {prediction && (
        <>
          {/* Main Prediction Card */}
          <PredictionCard
            prediction={{
              rating: prediction.predictedRating,
              interval: prediction.confidenceInterval as [number, number],
              confidence: prediction.confidence,
            }}
            player={{
              name: selectedPlayer?.name || 'Unknown Player',
              position: selectedPlayer?.position || 'N/A',
              photo: selectedPlayer?.photo,
            }}
          />

          {/* Confidence Interval */}
          <ConfidenceInterval
            interval={prediction.confidenceInterval as [number, number]}
            predictedValue={prediction.predictedRating}
          />

          {/* Rating Distribution */}
          <RatingDistribution distribution={prediction.ratingDistribution} />

          {/* Key Factors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Performance Factors</Text>
            <Text style={styles.sectionSubtitle}>
              Top {prediction.keyFactors.length} factors influencing this prediction
            </Text>
            {prediction.keyFactors.map((factor, index) => (
              <KeyFactorItem key={index} factor={factor} rank={index + 1} />
            ))}
          </View>

          {/* Recommendations */}
          {prediction.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {prediction.recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={index}
                  recommendation={recommendation}
                  index={index}
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* Empty State */}
      {!prediction && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color="#374151" />
          <Text style={styles.emptyStateTitle}>No Prediction Yet</Text>
          <Text style={styles.emptyStateText}>
            Select a player and match to generate a performance prediction
          </Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 15,
    marginLeft: 12,
  },
  predictButton: {
    backgroundColor: '#E4FF3B',
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictButtonDisabled: {
    opacity: 0.5,
  },
  predictButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomSpacer: {
    height: 40,
  },
});
