import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { performancePredictorApi } from '../../../services/api/performance-predictor';
import api from '../../../services/api';
import { FormationView, PredictionCard } from '../../../components/performance-predictor';
import { calculateTeamRating, getRatingColor } from '../../../utils/performance-predictor';
import type { TeamPrediction } from '../../../types/performance-predictor';

export const TeamLineupTab: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [predictions, setPredictions] = useState<TeamPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'position'>('rating');
  const [selectedPlayer, setSelectedPlayer] = useState<TeamPrediction | null>(null);
  const [matchPicking, setMatchPicking] = useState(false);

  const handlePredict = async () => {
    if (!selectedMatch) {
      Alert.alert('Missing Selection', 'Please select a match.');
      return;
    }

    setLoading(true);
    try {
      const results = await performancePredictorApi.batchPredict(selectedMatch.id);
      const playerMap = new Map<string, any>();
      try {
        const rosterResponse = await api.getPlayers({ limit: 200 });
        const roster =
          rosterResponse?.data ??
          rosterResponse?.items ??
          (rosterResponse as any)?.players ??
          [];
        roster.forEach((player: any) => {
          const id = player.id ?? player.playerId ?? player.player?.id;
          if (id) {
            playerMap.set(id, player);
          }
        });
      } catch (error) {
        console.warn('Unable to fetch player metadata for predictions', error);
      }

      const enrichedResults: TeamPrediction[] = results.map((pred) => {
        const info = playerMap.get(pred.playerId);
        const name =
          info
            ? `${info.user?.firstName ?? info.users?.firstName ?? ''} ${
                info.user?.lastName ?? info.users?.lastName ?? ''
              }`.trim()
            : pred.playerName || `Player ${pred.playerId?.substring(0, 6) || ''}`;

        return {
          ...pred,
          playerName: name || 'Unknown Player',
          playerPosition: info?.position || info?.player?.position || pred.playerPosition || 'N/A',
          playerPhoto: info?.user?.avatar ?? info?.users?.avatar ?? pred.playerPhoto,
        };
      });

      setPredictions(enrichedResults);
    } catch (error) {
      console.error('Batch prediction error:', error);
      Alert.alert(
        'Prediction Failed',
        'Unable to generate team predictions. The ML service may be unavailable.'
      );
    } finally {
      setLoading(false);
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

  const sortedPredictions = [...predictions].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.predictedRating - a.predictedRating;
    }
    return (a.playerPosition || '').localeCompare(b.playerPosition || '');
  });

  const teamRating = calculateTeamRating(
    predictions.map((p) => p.predictedRating)
  );

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            !selectedMatch && styles.predictButtonDisabled,
          ]}
          onPress={handlePredict}
          disabled={!selectedMatch || loading}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Ionicons name="people" size={20} color="#000000" />
              <Text style={styles.predictButtonText}>Predict Team Performance</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {predictions.length > 0 && (
          <>
            {/* Team Rating Summary */}
            <View style={styles.teamSummary}>
              <Text style={styles.teamSummaryLabel}>Expected Team Rating</Text>
              <Text
                style={[
                  styles.teamSummaryValue,
                  { color: getRatingColor(teamRating) },
                ]}
              >
                {teamRating.toFixed(1)}
              </Text>
              <Text style={styles.teamSummarySubtext}>
                Based on {predictions.length} players
              </Text>
            </View>

            {/* Formation View */}
            <FormationView
              predictions={predictions}
              onPlayerPress={setSelectedPlayer}
            />

            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'rating' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('rating')}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === 'rating' && styles.sortButtonTextActive,
                    ]}
                  >
                    Rating
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'position' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('position')}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortBy === 'position' && styles.sortButtonTextActive,
                    ]}
                  >
                    Position
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Player List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Player Predictions</Text>
              {sortedPredictions.map((prediction, index) => (
                <TouchableOpacity
                  key={prediction.playerId || index}
                  style={[
                    styles.playerItem,
                    { borderLeftColor: getRatingColor(prediction.predictedRating) },
                  ]}
                  onPress={() => setSelectedPlayer(prediction)}
                >
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {prediction.playerName || 'Unknown'}
                    </Text>
                    <Text style={styles.playerPosition}>
                      {prediction.playerPosition || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.playerRating}>
                    <Text
                      style={[
                        styles.ratingValue,
                        { color: getRatingColor(prediction.predictedRating) },
                      ]}
                    >
                      {prediction.predictedRating.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingLabel}>Rating</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {predictions.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#374151" />
            <Text style={styles.emptyStateTitle}>No Team Predictions</Text>
            <Text style={styles.emptyStateText}>
              Select a match to generate predictions for all players
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Player Detail Modal */}
      <Modal
        visible={selectedPlayer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Player Details</Text>
            <TouchableOpacity onPress={() => setSelectedPlayer(null)}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {selectedPlayer && (
              <PredictionCard
                prediction={{
                  rating: selectedPlayer.predictedRating,
                  interval: selectedPlayer.confidenceInterval as [number, number],
                  confidence: selectedPlayer.confidence,
                }}
                player={{
                  name: selectedPlayer.playerName || 'Unknown',
                  position: selectedPlayer.playerPosition || 'N/A',
                  photo: selectedPlayer.playerPhoto,
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
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
    backgroundColor: '#e6ff3c',
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
  teamSummary: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  teamSummaryLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  teamSummaryValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamSummarySubtext: {
    color: '#6B7280',
    fontSize: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sortLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  sortButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#e6ff3c',
  },
  sortButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#000000',
  },
  playerItem: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  playerPosition: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  playerRating: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ratingLabel: {
    color: '#6B7280',
    fontSize: 11,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
