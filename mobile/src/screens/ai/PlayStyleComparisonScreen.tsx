/**
 * PlayStyle Comparison Screen
 * Compare playing styles of multiple players
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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VictoryChart, VictoryPolarAxis, VictoryArea, VictoryLegend } from 'victory-native';

import { StyleBadge } from '../../components/playstyle-dna';
import { playStyleDnaApi } from '../../services/api/playstyle-dna';
import type { StyleComparison } from '../../types/playstyle-dna';
import { getStyleColor, getStyleColorWithOpacity } from '../../utils/playStyleColors';
import { api } from '../../services/api';

type Props = NativeStackScreenProps<any, 'PlayStyleComparison'>;

const CHART_COLORS = ['#e6ff3c', '#3B82F6', '#EC4899', '#10B981', '#F97316'];

export const PlayStyleComparisonScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialPlayerIds = route.params?.playerIds || [];

  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initialPlayerIds);
  const [comparison, setComparison] = useState<StyleComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPlayerIds.length >= 2) {
      handleCompare();
    }
  }, []);

  const handleCompare = async () => {
    if (selectedPlayerIds.length < 2) {
      Alert.alert('Selection Required', 'Please select at least 2 players to compare');
      return;
    }

    if (selectedPlayerIds.length > 5) {
      Alert.alert('Too Many Players', 'You can compare up to 5 players at a time');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await playStyleDnaApi.compare(selectedPlayerIds, 'detailed');
      setComparison(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error comparing styles:', err);
      setError('Failed to compare playing styles. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Comparison Failed',
        'Unable to compare player styles. Make sure the AI service is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setComparing(false);
    }
  };

  const handleAddPlayer = () => {
    if (selectedPlayerIds.length >= 5) {
      Alert.alert('Maximum Reached', 'You can compare up to 5 players at a time');
      return;
    }
    navigation.navigate('Players', {
      selectionMode: true,
      onSelectPlayer: (playerId: string) => {
        if (!selectedPlayerIds.includes(playerId)) {
          setSelectedPlayerIds([...selectedPlayerIds, playerId]);
        }
      },
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    if (selectedPlayerIds.length <= 2) {
      setComparison(null);
    }
  };

  const renderRadarComparison = () => {
    if (!comparison || comparison.players.length === 0) return null;

    const chartData = comparison.players.map((player, index) => {
      const dna = player.classification.dnaProfile;
      return {
        data: [
          { x: 'Technical', y: dna.technical },
          { x: 'Tactical', y: dna.tactical },
          { x: 'Physical', y: dna.physical },
          { x: 'Mental', y: dna.mental },
          { x: 'Pace', y: dna.pace },
          { x: 'Strength', y: dna.strength },
          { x: 'Creativity', y: dna.creativity },
          { x: 'Work Rate', y: dna.workRate },
        ],
        color: CHART_COLORS[index],
        name: player.name,
      };
    });

    return (
      <View style={styles.radarContainer}>
        <VictoryChart
          polar
          width={340}
          height={340}
          domain={{ y: [0, 10] }}
          padding={{ top: 50, bottom: 50, left: 50, right: 50 }}
        >
          {/* Background grid */}
          <VictoryPolarAxis
            dependentAxis
            style={{
              axis: { stroke: 'rgba(255, 255, 255, 0.1)' },
              grid: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
              tickLabels: { fill: 'transparent' },
            }}
            tickValues={[2, 4, 6, 8, 10]}
          />

          {/* Category axes */}
          <VictoryPolarAxis
            style={{
              axis: { stroke: 'rgba(255, 255, 255, 0.2)' },
              tickLabels: {
                fill: '#FFFFFF',
                fontSize: 11,
                fontWeight: '600',
              },
            }}
            labelPlacement="perpendicular"
          />

          {/* Player areas */}
          {chartData.map((playerData, index) => (
            <VictoryArea
              key={index}
              data={playerData.data}
              style={{
                data: {
                  fill: `${playerData.color}33`,
                  stroke: playerData.color,
                  strokeWidth: 2,
                },
              }}
              interpolation="linear"
            />
          ))}
        </VictoryChart>

        {/* Legend */}
        <View style={styles.legend}>
          {chartData.map((playerData, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: playerData.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {playerData.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCompatibilityMatrix = () => {
    if (!comparison || !comparison.compatibility) return null;

    const players = comparison.players;

    return (
      <View style={styles.matrixContainer}>
        <Text style={styles.sectionTitle}>Style Compatibility</Text>
        <Text style={styles.sectionSubtitle}>
          How well these playing styles complement each other
        </Text>

        <View style={styles.matrix}>
          {players.map((player1, i) => (
            <View key={i} style={styles.matrixRow}>
              {players.map((player2, j) => {
                if (i >= j) return <View key={j} style={styles.matrixCell} />;

                const compatibility =
                  comparison.compatibility[player1.id]?.[player2.id] || 0;
                const compatibilityPercent = Math.round(compatibility * 100);
                const color =
                  compatibility >= 0.8
                    ? '#10B981'
                    : compatibility >= 0.6
                    ? '#3B82F6'
                    : compatibility >= 0.4
                    ? '#EAB308'
                    : '#EF4444';

                return (
                  <View
                    key={j}
                    style={[
                      styles.matrixCell,
                      styles.matrixCellActive,
                      { backgroundColor: `${color}20`, borderColor: color },
                    ]}
                  >
                    <Text style={[styles.matrixValue, { color }]}>
                      {compatibilityPercent}%
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.matrixLabels}>
          {players.map((player, index) => (
            <View key={index} style={styles.matrixLabel}>
              <View
                style={[
                  styles.matrixLabelDot,
                  { backgroundColor: CHART_COLORS[index] },
                ]}
              />
              <Text style={styles.matrixLabelText} numberOfLines={1}>
                {player.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    if (!comparison || !comparison.insights || comparison.insights.length === 0) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>AI Insights</Text>

        {comparison.insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <Ionicons name="bulb" size={20} color="#e6ff3c" />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTeamBalance = () => {
    if (!comparison || !comparison.teamBalance) return null;

    const balance = comparison.teamBalance;
    const balanceData = [
      { label: 'Technical', value: balance.technical, color: '#3B82F6' },
      { label: 'Physical', value: balance.physical, color: '#EF4444' },
      { label: 'Creative', value: balance.creative, color: '#EC4899' },
      { label: 'Defensive', value: balance.defensive, color: '#6B7280' },
    ];

    return (
      <View style={styles.balanceContainer}>
        <Text style={styles.sectionTitle}>Team Balance</Text>
        <Text style={styles.sectionSubtitle}>
          Overall strengths of this player combination
        </Text>

        {balanceData.map((item, index) => (
          <View key={index} style={styles.balanceItem}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>{item.label}</Text>
              <Text style={[styles.balanceValue, { color: item.color }]}>
                {Math.round(item.value * 10)}/10
              </Text>
            </View>
            <View style={styles.balanceBarBg}>
              <View
                style={[
                  styles.balanceBarFill,
                  {
                    width: `${item.value * 100}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#353439', '#01071d']} style={styles.header}>
        <Text style={styles.headerTitle}>Compare Styles</Text>
        <Text style={styles.headerSubtitle}>
          {selectedPlayerIds.length} player{selectedPlayerIds.length !== 1 ? 's' : ''} selected
        </Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Selected Players */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selected Players</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
              <Ionicons name="add" size={20} color="#e6ff3c" />
              <Text style={styles.addButtonText}>Add Player</Text>
            </TouchableOpacity>
          </View>

          {selectedPlayerIds.map((playerId, index) => (
            <View key={playerId} style={styles.playerChip}>
              <View
                style={[styles.playerDot, { backgroundColor: CHART_COLORS[index] }]}
              />
              <Text style={styles.playerChipText}>Player {index + 1}</Text>
              <TouchableOpacity onPress={() => handleRemovePlayer(playerId)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Compare Button */}
        {selectedPlayerIds.length >= 2 && !comparison && (
          <TouchableOpacity
            style={[styles.compareButton, comparing && styles.compareButtonLoading]}
            onPress={handleCompare}
            disabled={comparing}
          >
            <LinearGradient
              colors={['#e6ff3c', '#c9e933']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compareButtonGradient}
            >
              {comparing ? (
                <>
                  <ActivityIndicator size="small" color="#01071d" />
                  <Text style={styles.compareButtonText}>Comparing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="git-compare" size={24} color="#01071d" />
                  <Text style={styles.compareButtonText}>Compare Players</Text>
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

        {/* Comparison Results */}
        {comparison && (
          <>
            {renderRadarComparison()}
            {renderCompatibilityMatrix()}
            {renderTeamBalance()}
            {renderInsights()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01071d',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 255, 59, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#b3afb2',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#b3afb2',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6ff3c',
    gap: 6,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e6ff3c',
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  playerChipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  compareButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  compareButtonLoading: {
    opacity: 0.7,
  },
  compareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#01071d',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  radarContainer: {
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.2)',
  },
  legend: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  matrixContainer: {
    backgroundColor: '#0D1117',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matrix: {
    marginTop: 16,
    marginBottom: 16,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  matrixCell: {
    flex: 1,
    aspectRatio: 1,
  },
  matrixCellActive: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  matrixLabels: {
    gap: 8,
  },
  matrixLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matrixLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  matrixLabelText: {
    fontSize: 12,
    color: '#b3afb2',
    fontWeight: '500',
  },
  insightsContainer: {
    backgroundColor: '#0D1117',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(228, 255, 59, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  balanceContainer: {
    backgroundColor: '#0D1117',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceItem: {
    marginTop: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  balanceBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  balanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default PlayStyleComparisonScreen;
