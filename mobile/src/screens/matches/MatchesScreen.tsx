import React, { useEffect, useState } from 'react';
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
import api from '../../services/api';
import { Match, MatchStatus } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

type FilterTab = 'ALL' | MatchStatus;

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fetchMatches = async () => {
    try {
      const result = await api.getMatches();
      const list = result.items ?? result.data ?? [];
      setMatches(list);
      setFilteredMatches(list);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [searchQuery, activeTab, matches]);

  const filterMatches = () => {
    let filtered = matches;

    // Filter by status
    if (activeTab !== 'ALL') {
      filtered = filtered.filter((match) => match.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (match) =>
          match.homeClub.name.toLowerCase().includes(query) ||
          match.awayClub.name.toLowerCase().includes(query) ||
          match.competition?.toLowerCase().includes(query)
      );
    }

    setFilteredMatches(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const getStatusBadgeColor = (status: MatchStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return COLORS.primary;
      case 'LIVE':
        return COLORS.danger;
      case 'HALF_TIME':
        return COLORS.warning;
      case 'COMPLETED':
        return COLORS.success;
      case 'POSTPONED':
      case 'CANCELLED':
        return COLORS.gray[500];
      default:
        return COLORS.gray[400];
    }
  };

  const getStatusLabel = (status: MatchStatus) => {
    const labels: Record<MatchStatus, string> = {
      SCHEDULED: 'Programmé',
      LIVE: 'EN DIRECT',
      HALF_TIME: 'Mi-temps',
      COMPLETED: 'Terminé',
      POSTPONED: 'Reporté',
      CANCELLED: 'Annulé',
    };
    return labels[status];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un match, un club..."
          placeholderTextColor={COLORS.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <FilterTab
          label="Tous"
          isActive={activeTab === 'ALL'}
          onPress={() => setActiveTab('ALL')}
        />
        <FilterTab
          label="Programmés"
          isActive={activeTab === MatchStatus.SCHEDULED}
          onPress={() => setActiveTab(MatchStatus.SCHEDULED)}
        />
        <FilterTab
          label="En direct"
          isActive={activeTab === MatchStatus.LIVE}
          onPress={() => setActiveTab(MatchStatus.LIVE)}
        />
        <FilterTab
          label="Terminés"
          isActive={activeTab === MatchStatus.COMPLETED}
          onPress={() => setActiveTab(MatchStatus.COMPLETED)}
        />
      </ScrollView>

      {/* Matches List */}
      <ScrollView
        style={styles.matchesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              getStatusBadgeColor={getStatusBadgeColor}
              getStatusLabel={getStatusLabel}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Aucun match trouvé pour cette recherche'
                : 'Aucun match disponible'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const FilterTab = ({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const MatchCard = ({
  match,
  getStatusBadgeColor,
  getStatusLabel,
}: {
  match: Match;
  getStatusBadgeColor: (status: MatchStatus) => string;
  getStatusLabel: (status: MatchStatus) => string;
}) => (
  <TouchableOpacity style={styles.matchCard}>
    {/* Status Badge */}
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: getStatusBadgeColor(match.status) },
      ]}
    >
      <Text style={styles.statusText}>{getStatusLabel(match.status)}</Text>
    </View>

    {/* Match Info */}
    <View style={styles.matchHeader}>
      <Text style={styles.competition}>{match.competition || 'Match amical'}</Text>
      <Text style={styles.matchDate}>
        {new Date(match.scheduledAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })}
      </Text>
    </View>

    {/* Teams */}
    <View style={styles.teamsContainer}>
      {/* Home Team */}
      <View style={styles.teamSection}>
        <Text style={styles.teamName} numberOfLines={2}>
          {match.homeClub.name}
        </Text>
        {match.status === 'COMPLETED' || match.status === 'LIVE' ? (
          <Text style={styles.score}>{match.homeScore ?? 0}</Text>
        ) : null}
      </View>

      {/* VS or Score Separator */}
      <View style={styles.separator}>
        {match.status === 'COMPLETED' || match.status === 'LIVE' ? (
          <Text style={styles.scoreSeparator}>-</Text>
        ) : (
          <Text style={styles.vs}>vs</Text>
        )}
        <Text style={styles.matchTime}>
          {new Date(match.scheduledAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Away Team */}
      <View style={styles.teamSection}>
        <Text style={styles.teamName} numberOfLines={2}>
          {match.awayClub.name}
        </Text>
        {match.status === 'COMPLETED' || match.status === 'LIVE' ? (
          <Text style={styles.score}>{match.awayScore ?? 0}</Text>
        ) : null}
      </View>
    </View>

    {/* Additional Info */}
    {match.venue && (
      <View style={styles.venueContainer}>
        <Icon name="location" size={14} color={COLORS.gray[500]} />
        <Text style={styles.venue}>{match.venue}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.dark,
  },
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tabsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    marginRight: SPACING.sm,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  matchesList: {
    flex: 1,
  },
  matchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingRight: 80,
  },
  competition: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    fontWeight: '600',
  },
  matchDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  score: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  separator: {
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  vs: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[400],
    fontWeight: '600',
  },
  scoreSeparator: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.gray[400],
    fontWeight: '300',
  },
  matchTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  venue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[400],
    textAlign: 'center',
  },
});
