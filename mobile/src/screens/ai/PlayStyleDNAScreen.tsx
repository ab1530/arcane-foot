/**
 * PlayStyle DNA Screen
 * Main screen for AI-powered playing style classification
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  DNARadarChart,
  StyleCard,
  SimilarPlayerCard,
  RecommendationCard,
  StyleBadge,
} from '../../components/playstyle-dna';
import { playStyleDnaApi } from '../../services/api/playstyle-dna';
import type { PlayStyleClassification, SimilarPlayer } from '../../types/playstyle-dna';
import { getStyleColor } from '../../utils/playStyleColors';
import { api } from '../../services/api';
import type { Player } from '../../types';

type Props = NativeStackScreenProps<any, 'PlayStyleDNA'>;

export const PlayStyleDNAScreen: React.FC<Props> = ({ navigation, route }) => {
  const playerId = route.params?.playerId;

  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [classification, setClassification] = useState<PlayStyleClassification | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId) {
      loadPlayer();
    }
  }, [playerId]);

  const loadPlayer = async () => {
    try {
      setLoading(true);
      setError(null);
      const playerData = await api.getPlayer(playerId);
      setPlayer(playerData);
    } catch (err) {
      console.error('Error loading player:', err);
      setError('Failed to load player data');
    } finally {
      setLoading(false);
    }
  };

  const handleClassifyStyle = async () => {
    if (!playerId) {
      Alert.alert('Error', 'No player selected');
      return;
    }

    try {
      setClassifying(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await playStyleDnaApi.classify(playerId, {
        includeRecommendations: true,
        includeSimilarPlayers: true,
        maxSimilarPlayers: 5,
      });

      setClassification(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error classifying style:', err);
      setError('Failed to classify playing style. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Classification Failed',
        'Unable to classify player style. Make sure the AI service is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setClassifying(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlayer();
    if (classification) {
      await handleClassifyStyle();
    }
    setRefreshing(false);
  };

  const handleViewSimilarPlayer = (similarPlayer: SimilarPlayer) => {
    navigation.push('PlayStyleDNA', { playerId: similarPlayer.id });
  };

  const handleViewStyleDetails = () => {
    if (classification) {
      navigation.navigate('StyleExplorer', {
        selectedStyle: classification.primaryStyle,
      });
    }
  };

  const handleCompareStyles = () => {
    if (classification && playerId) {
      navigation.navigate('PlayStyleComparison', {
        playerIds: [playerId],
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e6ff3c" />
        <Text style={styles.loadingText}>Loading player data...</Text>
      </View>
    );
  }

  if (!player && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-outline" size={64} color="#6B7280" />
        <Text style={styles.emptyTitle}>No Player Selected</Text>
        <Text style={styles.emptyText}>
          Select a player to classify their playing style
        </Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => navigation.navigate('Players')}
        >
          <Text style={styles.selectButtonText}>Browse Players</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#e6ff3c"
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#353439', '#01071d']}
        style={styles.header}
      >
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player?.user.firstName} {player?.user.lastName}
          </Text>
          <Text style={styles.playerPosition}>{player?.position}</Text>
        </View>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate('StyleExplorer')}
        >
          <Ionicons name="grid-outline" size={20} color="#e6ff3c" />
          <Text style={styles.exploreButtonText}>Explore Styles</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Classify Button */}
      {!classification && (
        <TouchableOpacity
          style={[styles.classifyButton, classifying && styles.classifyButtonLoading]}
          onPress={handleClassifyStyle}
          disabled={classifying}
        >
          <LinearGradient
            colors={['#e6ff3c', '#c9e933']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.classifyButtonGradient}
          >
            {classifying ? (
              <>
                <ActivityIndicator size="small" color="#01071d" />
                <Text style={styles.classifyButtonText}>Classifying...</Text>
              </>
            ) : (
              <>
                <Ionicons name="analytics" size={24} color="#01071d" />
                <Text style={styles.classifyButtonText}>Classify Playing Style</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Classification Results */}
      {classification && (
        <>
          {/* DNA Radar Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DNA Profile</Text>
            <View style={styles.radarContainer}>
              <DNARadarChart
                dnaProfile={classification.dnaProfile}
                styleColor={getStyleColor(classification.primaryStyle)}
                size={280}
                animated
              />
            </View>
          </View>

          {/* Style Card */}
          <View style={styles.section}>
            <StyleCard
              primaryStyle={classification.primaryStyle}
              secondaryStyle={classification.secondaryStyle}
              confidence={classification.styleConfidence}
              cluster={classification.cluster}
              realWorldExamples={classification.realWorldExamples}
              onPress={handleViewStyleDetails}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCompareStyles}
            >
              <Ionicons name="git-compare" size={20} color="#e6ff3c" />
              <Text style={styles.actionButtonText}>Compare</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClassifyStyle}
            >
              <Ionicons name="refresh" size={20} color="#e6ff3c" />
              <Text style={styles.actionButtonText}>Re-classify</Text>
            </TouchableOpacity>
          </View>

          {/* Similar Players */}
          {classification.similarPlayers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Similar Players</Text>
                <Text style={styles.sectionSubtitle}>
                  {classification.similarPlayers.length} matches found
                </Text>
              </View>

              {classification.similarPlayers.map((similarPlayer, index) => (
                <SimilarPlayerCard
                  key={index}
                  player={similarPlayer}
                  onPress={() => handleViewSimilarPlayer(similarPlayer)}
                />
              ))}
            </View>
          )}

          {/* Recommendations */}
          {classification.recommendations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Training Recommendations</Text>
                <Text style={styles.sectionSubtitle}>
                  AI-powered suggestions
                </Text>
              </View>

              {classification.recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={index}
                  recommendation={recommendation}
                  type={index % 2 === 0 ? 'technical' : 'tactical'}
                  priority={index === 0 ? 'high' : 'medium'}
                />
              ))}
            </View>
          )}
        </>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          PlayStyle DNA uses AI to analyze player attributes and classify playing styles
          into 12 distinct categories.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01071d',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#01071d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#b3afb2',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#01071d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#b3afb2',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: '#e6ff3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#01071d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 255, 59, 0.2)',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 16,
    color: '#e6ff3c',
    fontWeight: '600',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6ff3c',
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6ff3c',
  },
  classifyButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  classifyButtonLoading: {
    opacity: 0.7,
  },
  classifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  classifyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01071d',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#b3afb2',
    fontWeight: '500',
  },
  radarContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#0D1117',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.2)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(228, 255, 59, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.3)',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6ff3c',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#b3afb2',
    lineHeight: 18,
  },
});

export default PlayStyleDNAScreen;
