import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { theme } from '../../design/theme';
import { logger } from '../../utils/logger';

type MarketScreenProps = {
  loadingDelayMs?: number;
};

type PositionFilter = 'ALL' | 'FW' | 'MF' | 'DF' | 'GK';
type BudgetFilter = 'ALL' | 'UNDER_10' | 'MID_30' | 'OVER_30';

const MOCK_PLAYERS = [
  {
    id: 'p1',
    name: 'Marcus Silva',
    club: 'Porto',
    position: 'FW',
    value: 35000000,
    status: 'Shortlisted',
    tags: ['finisher', 'pressing'],
    watchlisted: true,
  },
  {
    id: 'p2',
    name: 'Amina Diallo',
    club: 'Lyon',
    position: 'MF',
    value: 12000000,
    status: 'Available',
    tags: ['box-to-box', 'engine'],
    watchlisted: false,
  },
  {
    id: 'p3',
    name: 'Victor Hugo',
    club: 'Marseille',
    position: 'DF',
    value: 8000000,
    status: 'Loan',
    tags: ['left-foot', 'build-up'],
    watchlisted: true,
  },
  {
    id: 'p4',
    name: 'Jonas Becker',
    club: 'Leverkusen',
    position: 'GK',
    value: 5000000,
    status: 'Target',
    tags: ['sweeper', 'reflexes'],
    watchlisted: false,
  },
];

export const MarketScreen: React.FC<MarketScreenProps> = ({ loadingDelayMs = 500 }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>('ALL');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(
    () => new Set(MOCK_PLAYERS.filter((p) => p.watchlisted).map((p) => p.id))
  );

  useEffect(() => {
    const delay = Math.max(loadingDelayMs ?? 0, 0);
    if (delay === 0) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [loadingDelayMs]);

  const toggleWatchlist = (id: string) => {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        logger.info('market', 'Removed from watchlist', { id });
      } else {
        next.add(id);
        logger.info('market', 'Added to watchlist', { id });
      }
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return MOCK_PLAYERS.filter((player) => {
      const matchesSearch =
        !query ||
        player.name.toLowerCase().includes(query) ||
        player.club.toLowerCase().includes(query) ||
        player.tags.some((tag) => tag.toLowerCase().includes(query));

      const matchesPosition = positionFilter === 'ALL' || player.position === positionFilter;

      const matchesBudget = (() => {
        switch (budgetFilter) {
          case 'UNDER_10':
            return player.value < 10_000_000;
          case 'MID_30':
            return player.value >= 10_000_000 && player.value <= 30_000_000;
          case 'OVER_30':
            return player.value > 30_000_000;
          default:
            return true;
        }
      })();

      const isWatchlisted = watchlistIds.has(player.id);
      const matchesWatchlist = !watchlistOnly || isWatchlisted;

      return matchesSearch && matchesPosition && matchesBudget && matchesWatchlist;
    }).map((player) => ({
      ...player,
      watchlisted: watchlistIds.has(player.id),
    }));
  }, [budgetFilter, positionFilter, searchQuery, watchlistIds, watchlistOnly]);

  const summary = useMemo(() => {
    const total = filteredItems.length;
    const watchlisted = filteredItems.filter((p) => p.watchlisted).length;
    const avgValue =
      total > 0
        ? filteredItems.reduce((sum, p) => sum + p.value, 0) / total
        : 0;
    return { total, watchlisted, avgValue };
  }, [filteredItems]);

  const formatValue = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k €`;
    return `${value} €`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transfer Market</Text>
        <Text style={styles.subtitle}>Player discovery, valuations, shortlists</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search players, clubs or tags..."
          placeholderTextColor={theme.colors.text.secondary}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="market-search-input"
        />
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.85}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        {(['ALL', 'FW', 'MF', 'DF', 'GK'] as PositionFilter[]).map((value) => (
          <TouchableOpacity
            key={value}
            testID={`position-filter-${value}`}
            style={[
              styles.chip,
              positionFilter === value && styles.chipActive,
            ]}
            onPress={() => setPositionFilter(value)}
          >
            <Text
              style={[
                styles.chipLabel,
                positionFilter === value && styles.chipLabelActive,
              ]}
            >
              {value === 'ALL' ? 'All' : value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filtersRow}>
        {([
          { value: 'ALL', label: 'Any budget' },
          { value: 'UNDER_10', label: '< 10M€' },
          { value: 'MID_30', label: '10-30M€' },
          { value: 'OVER_30', label: '> 30M€' },
        ] as { value: BudgetFilter; label: string }[]).map((item) => (
          <TouchableOpacity
            key={item.value}
            testID={`budget-filter-${item.value}`}
            style={[
              styles.budgetPill,
              budgetFilter === item.value && styles.budgetPillActive,
            ]}
            onPress={() => setBudgetFilter(item.value)}
          >
            <Text
              style={[
                styles.budgetLabel,
                budgetFilter === item.value && styles.budgetLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Watchlist only</Text>
        <Switch
          testID="watchlist-toggle"
          value={watchlistOnly}
          onValueChange={setWatchlistOnly}
          thumbColor={watchlistOnly ? theme.colors.brand.primary : '#e5e7eb'}
          trackColor={{ true: '#bae6fd', false: '#cbd5e1' }}
        />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Results</Text>
          <Text style={styles.summaryValue}>{summary.total}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Watchlisted</Text>
          <Text style={styles.summaryValue}>{summary.watchlisted}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Avg. Value</Text>
          <Text style={styles.summaryValue}>{summary.avgValue ? formatValue(summary.avgValue) : '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Players</Text>

        {filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>No players match these filters.</Text>
        ) : (
          filteredItems.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.playerName}>{player.name}</Text>
                <TouchableOpacity
                  testID={`watchlist-toggle-${player.id}`}
                  style={[
                    styles.watchlistChip,
                    player.watchlisted && styles.watchlistChipActive,
                  ]}
                  onPress={() => toggleWatchlist(player.id)}
                >
                  <Text
                    style={[
                      styles.watchlistLabel,
                      player.watchlisted && styles.watchlistLabelActive,
                    ]}
                  >
                    {player.watchlisted ? 'Watchlisted' : 'Shortlist'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.playerDetails}>
                {player.position} • {player.club} • {player.status}
              </Text>
              <Text style={styles.valueText}>{formatValue(player.value)}</Text>
              <View style={styles.tagsRow}>
                {player.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transfers</Text>
        <Text style={styles.emptyText}>No recent transfers</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: theme.typography.sizes.h1,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface.default,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  searchButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.brand.primary,
  },
  searchButtonText: {
    color: theme.colors.background.primary,
    fontFamily: theme.typography.fonts.semiBold,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  chipActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  chipLabel: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  chipLabelActive: {
    color: '#0f172a',
  },
  budgetPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.glassLight,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  budgetPillActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  budgetLabel: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  budgetLabelActive: {
    color: '#0f172a',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h3,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: theme.colors.surface.glass,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  playerName: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  valueText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.brand.primary,
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.glassLight,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  watchlistChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glassLight,
  },
  watchlistChipActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  watchlistLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  watchlistLabelActive: {
    color: '#0f172a',
  },
  emptyText: {
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
});

export default MarketScreen;
