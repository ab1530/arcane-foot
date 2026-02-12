/**
 * Club Detail Screen
 * Displays detailed information about a football club
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { logError } from '../../utils/logger';

interface ClubDetailScreenProps {
  route: {
    params: {
      clubId: string;
    };
  };
  navigation: any;
}

export default function ClubDetailScreen({ route, navigation }: ClubDetailScreenProps) {
  const { clubId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [club, setClub] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  const fetchClubData = async () => {
    try {
      setLoading(true);

      // Use mock data instead of API for now
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      // Mock club data
      const mockClubs: Record<string, any> = {
        '1': {
          id: '1',
          name: 'Paris Saint-Germain',
          country: 'France',
          city: 'Paris',
          founded: 1970,
          stadium: 'Parc des Princes',
        },
        '2': {
          id: '2',
          name: 'Manchester City',
          country: 'England',
          city: 'Manchester',
          founded: 1880,
          stadium: 'Etihad Stadium',
        },
        '3': {
          id: '3',
          name: 'Real Madrid',
          country: 'Spain',
          city: 'Madrid',
          founded: 1902,
          stadium: 'Santiago Bernabéu',
        },
        '4': {
          id: '4',
          name: 'Arsenal',
          country: 'England',
          city: 'London',
          founded: 1886,
          stadium: 'Emirates Stadium',
        },
        '5': {
          id: '5',
          name: 'Barcelona',
          country: 'Spain',
          city: 'Barcelona',
          founded: 1899,
          stadium: 'Camp Nou',
        },
      };

      // Mock players data
      const mockPlayers = [
        { id: 'p1', firstName: 'Kylian', lastName: 'Mbappé', position: 'ST', jerseyNumber: 7 },
        { id: 'p2', firstName: 'Marquinhos', lastName: '', position: 'CB', jerseyNumber: 5 },
        { id: 'p3', firstName: 'Achraf', lastName: 'Hakimi', position: 'RB', jerseyNumber: 2 },
        { id: 'p4', firstName: 'Gianluigi', lastName: 'Donnarumma', position: 'GK', jerseyNumber: 99 },
        { id: 'p5', firstName: 'Vitinha', lastName: '', position: 'CM', jerseyNumber: 17 },
      ];

      const clubData = mockClubs[clubId] || mockClubs['1'];
      setClub(clubData);

      // Only set players for PSG for demo purposes
      if (clubId === '1' || !clubId) {
        setPlayers(mockPlayers);
      } else {
        setPlayers([]);
      }
    } catch (error) {
      logError('Error fetching club data', error, { screen: 'ClubDetailScreen', clubId });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [clubId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Club not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.clubBadge}>
            <Text style={styles.clubInitials}>
              {club.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.clubName}>{club.name}</Text>
        </View>

        {/* Club Info */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Club Information</Text>

          {club.country && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Country:</Text>
              <Text style={styles.infoValue}>{club.country}</Text>
            </View>
          )}

          {club.city && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City:</Text>
              <Text style={styles.infoValue}>{club.city}</Text>
            </View>
          )}

          {club.founded && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Founded:</Text>
              <Text style={styles.infoValue}>{club.founded}</Text>
            </View>
          )}

          {club.stadium && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stadium:</Text>
              <Text style={styles.infoValue}>{club.stadium}</Text>
            </View>
          )}
        </GlassCard>

        {/* Players Squad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Squad ({players.length} players)</Text>

          {players.length > 0 ? (
            <View style={styles.playersGrid}>
              {players.map((player) => (
                <TouchableOpacity
                  key={player.id || Math.random()}
                  style={styles.playerCard}
                  onPress={() => {
                    if (player.id) {
                      navigation.navigate('PlayerDetail', { playerId: player.id });
                    }
                  }}
                >
                  <GlassCard>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerInitials}>
                        {(player.user?.firstName?.[0] || player.firstName?.[0] || '') +
                          (player.user?.lastName?.[0] || player.lastName?.[0] || '')}
                      </Text>
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player.user?.firstName || player.firstName || ''}{' '}
                      {player.user?.lastName || player.lastName || ''}
                    </Text>
                    <Text style={styles.playerPosition}>{player.position}</Text>
                    {player.jerseyNumber && (
                      <Text style={styles.playerNumber}>#{player.jerseyNumber}</Text>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <GlassCard variant="elevated">
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No players in this club</Text>
              </View>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.semantic.error,
    marginBottom: spacing.lg,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  backButtonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backIconButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
    zIndex: 10,
  },
  backIcon: {
    fontSize: 32,
    color: colors.brand.primary,
  },
  clubBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.surface.border,
  },
  clubInitials: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  clubName: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  infoLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  playerCard: {
    width: '50%',
    padding: spacing.xs,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  playerInitials: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  playerName: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  playerPosition: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  playerNumber: {
    fontSize: typography.sizes.xs,
    color: colors.brand.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
});
