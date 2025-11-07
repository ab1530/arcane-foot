/**
 * Clubs List Screen
 * Displays a list of football clubs with search and filtering
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { logError } from '../../utils/logger';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

interface ClubsListScreenProps {
  navigation: any;
}

export default function ClubsListScreen({ navigation }: ClubsListScreenProps) {
  const [clubs, setClubs] = useState<any[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClubs = async () => {
    try {
      const result = await api.getClubs({ limit: 100 });
      const clubsList = result?.items ?? result?.data ?? [];
      setClubs(clubsList);
      setFilteredClubs(clubsList);
    } catch (error) {
      logError('Error fetching clubs', error, { screen: 'ClubsListScreen' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    filterClubs();
  }, [searchQuery, clubs]);

  const filterClubs = () => {
    if (!searchQuery.trim()) {
      setFilteredClubs(clubs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clubs.filter(
      (club) =>
        club.name?.toLowerCase().includes(query) ||
        club.country?.toLowerCase().includes(query) ||
        club.city?.toLowerCase().includes(query)
    );

    setFilteredClubs(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClubs();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Football Clubs</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clubs..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Clubs List */}
      <ScrollView
        style={styles.clubsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {filteredClubs.length > 0 ? (
          filteredClubs.map((club) => (
            <TouchableOpacity
              key={club.id}
              style={styles.clubCard}
              onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
            >
              <GlassCard variant="elevated">
                <View style={styles.clubHeader}>
                  <View style={styles.clubBadge}>
                    <Text style={styles.clubInitials}>
                      {club.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={styles.clubName}>{club.name}</Text>
                    <View style={styles.clubMeta}>
                      {club.country && (
                        <View style={styles.clubMetaRow}>
                          <Icon name="apps" size={14} color={colors.text.secondary} />
                          <Text style={styles.clubMetaText}>{club.country}</Text>
                        </View>
                      )}
                      {club.city && (
                        <Text style={styles.clubMetaText}>• {club.city}</Text>
                      )}
                    </View>
                  </View>
                  <Icon name="chevronForward" size={20} color={colors.brand.primary} />
                </View>

                {club.stadium && (
                  <View style={styles.clubStadium}>
                    <Text style={styles.clubStadiumLabel}>Stadium:</Text>
                    <Text style={styles.clubStadiumName}>{club.stadium}</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No clubs found for this search'
                : 'No clubs available'}
            </Text>
          </View>
        )}
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
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  resultsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  clubsList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  clubCard: {
    marginBottom: spacing.md,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubBadge: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  clubInitials: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  clubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clubMetaText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  clubStadium: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clubStadiumLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  clubStadiumName: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing["2xl"],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
