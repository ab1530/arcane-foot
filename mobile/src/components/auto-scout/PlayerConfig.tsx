import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import type { Player, Match } from '../../types';

interface PlayerConfigProps {
  selectedPlayerId: string | null;
  selectedMatchId: string | null;
  customContext: string;
  autoSave: boolean;
  onPlayerSelect: (playerId: string, playerName: string) => void;
  onMatchSelect: (matchId: string | null) => void;
  onCustomContextChange: (text: string) => void;
  onAutoSaveChange: (value: boolean) => void;
}

export const PlayerConfig: React.FC<PlayerConfigProps> = ({
  selectedPlayerId,
  selectedMatchId,
  customContext,
  autoSave,
  onPlayerSelect,
  onMatchSelect,
  onCustomContextChange,
  onAutoSaveChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [showMatchPicker, setShowMatchPicker] = useState(false);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const selectedPlayerName = selectedPlayer
    ? `${selectedPlayer.user.firstName} ${selectedPlayer.user.lastName}`
    : '';
  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPlayers();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerMatches();
    }
  }, [selectedPlayerId]);

  const searchPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const response = await api.getPlayers({ search: searchQuery, limit: 20 });
      setPlayers(response.items || []);
    } catch (error) {
      console.error('Failed to search players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const loadPlayerMatches = async () => {
    if (!selectedPlayerId) return;

    try {
      setLoadingMatches(true);
      const response = await api.getMatches({ limit: 10 });
      setMatches(response.items || []);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    const playerName = `${player.user.firstName} ${player.user.lastName}`;
    onPlayerSelect(player.id, playerName);
    setShowPlayerPicker(false);
    setSearchQuery('');
  };

  const handleMatchSelect = (match: Match | null) => {
    onMatchSelect(match?.id || null);
    setShowMatchPicker(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Configure Report</Text>
      <Text style={styles.subtitle}>
        Select the player and optionally a specific match to analyze
      </Text>

      {/* Player Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Player *</Text>
        {selectedPlayer ? (
          <TouchableOpacity
            style={styles.selectedItem}
            onPress={() => setShowPlayerPicker(true)}
          >
            <View style={styles.selectedItemContent}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {selectedPlayerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.selectedItemText}>
                <Text style={styles.selectedItemName}>{selectedPlayerName}</Text>
                <Text style={styles.selectedItemDetails}>
                  {selectedPlayer.position} • {selectedPlayer.nationality}
                </Text>
              </View>
            </View>
            <Icon name="chevronDown" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowPlayerPicker(true)}
          >
            <Text style={styles.pickerText}>Select a player</Text>
            <Icon name="chevronDown" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        {showPlayerPicker && (
          <View style={styles.pickerModal}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search players..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            {loadingPlayers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.brand.primary} />
              </View>
            ) : (
              <ScrollView style={styles.pickerList}>
                {players.map((player) => {
                  const playerName = `${player.user.firstName} ${player.user.lastName}`;
                  return (
                    <TouchableOpacity
                      key={player.id}
                      style={styles.pickerItem}
                      onPress={() => handlePlayerSelect(player)}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {playerName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.pickerItemText}>
                        <Text style={styles.pickerItemName}>{playerName}</Text>
                        <Text style={styles.pickerItemDetails}>
                          {player.position} • {player.nationality}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPlayerPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Match Selection (Optional) */}
      {selectedPlayerId && (
        <View style={styles.section}>
          <Text style={styles.label}>Match (Optional)</Text>
          <Text style={styles.hint}>
            Select a specific match for detailed match analysis
          </Text>

          {selectedMatch ? (
            <TouchableOpacity
              style={styles.selectedItem}
              onPress={() => setShowMatchPicker(true)}
            >
              <View style={styles.selectedItemContent}>
                <Text style={styles.selectedItemName}>
                  {selectedMatch.homeClub.name} vs {selectedMatch.awayClub.name}
                </Text>
                <Text style={styles.selectedItemDetails}>
                  {new Date(selectedMatch.scheduledAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleMatchSelect(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowMatchPicker(true)}
            >
              <Text style={styles.pickerText}>Select a match (optional)</Text>
              <Icon name="chevronDown" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}

          {showMatchPicker && (
            <View style={styles.pickerModal}>
              {loadingMatches ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.brand.primary} />
                </View>
              ) : (
                <ScrollView style={styles.pickerList}>
                  {matches.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      style={styles.pickerItem}
                      onPress={() => handleMatchSelect(match)}
                    >
                      <View style={styles.pickerItemText}>
                        <Text style={styles.pickerItemName}>
                          {match.homeClub.name} vs {match.awayClub.name}
                        </Text>
                        <Text style={styles.pickerItemDetails}>
                          {new Date(match.scheduledAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMatchPicker(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Custom Context */}
      <View style={styles.section}>
        <Text style={styles.label}>Custom Context (Optional)</Text>
        <Text style={styles.hint}>
          Add specific focus areas or requirements for the AI analysis
        </Text>
        <TextInput
          style={styles.textArea}
          placeholder="E.g., Focus on defensive capabilities and potential as central midfielder..."
          placeholderTextColor={colors.text.tertiary}
          value={customContext}
          onChangeText={onCustomContextChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Auto-save Toggle */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Auto-save Report</Text>
            <Text style={styles.hint}>
              Automatically save the report to database after generation
            </Text>
          </View>
          <Switch
            value={autoSave}
            onValueChange={onAutoSaveChange}
            trackColor={{
              false: colors.background.tertiary,
              true: colors.brand.primary,
            }}
            thumbColor={colors.background.primary}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pickerText: {
    fontSize: typography.sizes.base,
    color: colors.text.tertiary,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  selectedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedItemText: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  selectedItemDetails: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  textArea: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    minHeight: 100,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  pickerModal: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    maxHeight: 400,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  pickerItemText: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  pickerItemDetails: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  closeButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
