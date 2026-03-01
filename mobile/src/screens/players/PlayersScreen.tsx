import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import api from '../../services/api';
import {
  playersApi,
  type DiscoveredTreeAgeCategoryNode,
  type DiscoveredTreeCountryNode,
  type DiscoveredTreeSquadType,
} from '../../services/api/players';
import { ScreenHeader } from '../../components/navigation';
import { useLocalization } from '../../contexts/LocalizationContext';
import { getFlagUrl, getClubLogo } from '../../utils/badgeHelpers';
import { useAuth } from '../../contexts/AuthContext';
import type { RecentPlayer } from '../../services/recentPlayers';
import { loadRecentPlayers } from '../../services/recentPlayers';
import { logger } from '../../utils/logger';

type FilterMode = 'ALL' | 'POSITION' | 'LEAGUE' | 'TRENDING';
type PlayerViewMode = 'LIST' | 'DISCOVERED';

export const PlayersScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Players'>>();
  const { dictionary } = useLocalization();
  const { user } = useAuth();
  const t = dictionary.players;
  const common = dictionary.common;
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(route.params?.initialSearch ?? '');
  const [activePosition, setActivePosition] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const currentRole = user?.role ?? 'PUBLIC';
  const canUseDiscoveredTree = ['SCOUT', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const [viewMode, setViewMode] = useState<PlayerViewMode>(() =>
    route.params?.viewMode
      ? route.params.viewMode
      : canUseDiscoveredTree
        ? 'DISCOVERED'
        : 'LIST',
  );
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [discoveredTree, setDiscoveredTree] = useState<DiscoveredTreeCountryNode[]>([]);
  const [discoveredLoading, setDiscoveredLoading] = useState(false);
  const [discoveredError, setDiscoveredError] = useState<string | null>(null);
  const [squadTypeFilter, setSquadTypeFilter] = useState<DiscoveredTreeSquadType>('ALL');
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [activeCompetition, setActiveCompetition] = useState<string | null>(null);
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const heroCopy = t.hero ?? {
    eyebrow: 'Arcane Roster',
    title: 'Elite Players',
    subtitle: 'Explore the latest scouting targets',
    stats: {
      players: 'Players',
      clubs: 'Clubs',
      prospects: 'Prospects',
    },
  };
  const layoutCopy = t.layout ?? {
    title: 'Joueurs scoutés',
    subtitle: 'Gérez vos prospects et watchlists',
  };
  const cardCopy = t.cards ?? {
    overall: 'Overall',
    position: 'Position',
    foot: 'Foot',
    league: 'League',
    value: 'Value',
    goals: 'Goals',
    assists: 'Assists',
  };
  const statsCopy = {
    totalLabel: t.stats?.totalLabel ?? 'Total players',
    watchlistLabel: t.stats?.watchlistLabel ?? 'In watchlist',
    delta: {
      month: t.stats?.delta?.month ?? 'this month',
      today: t.stats?.delta?.today ?? 'today',
      stableMonth: t.stats?.delta?.stableMonth ?? 'No change this month',
      stableToday: t.stats?.delta?.stableToday ?? 'No change today',
    },
  };
  const filterCopy = t.filters ?? {
    all: 'All',
    position: 'Position',
    league: 'League',
    trending: 'Trending',
    contextAll: 'All positions',
  };
  const sectionCopy = t.sections ?? {
    allPlayers: 'Tous les joueurs',
    sort: 'Trier',
  };

  const loadRecent = useCallback(async () => {
    try {
      setRecentLoading(true);
      const data = await loadRecentPlayers();
      setRecentPlayers(data);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getPlayers();
      setPlayers(response.items || response.data || []);
      logger.info('players', 'Players loaded', { count: (response.items || response.data || []).length });
    } catch (error) {
      console.error('Failed to load players:', error);
      logger.error('players', 'Failed to load players', { error: (error as Error)?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDiscoveredTree = useCallback(async () => {
    if (!canUseDiscoveredTree) return;
    try {
      setDiscoveredLoading(true);
      const response = await playersApi.getDiscoveredTree({ squadType: squadTypeFilter });
      setDiscoveredTree(response?.data ?? []);
      setDiscoveredError(null);
    } catch (error) {
      logger.error('players', 'Failed to load discovered tree', {
        error: (error as Error)?.message,
      });
      setDiscoveredError('Impossible de charger les joueurs découverts');
      setDiscoveredTree([]);
    } finally {
      setDiscoveredLoading(false);
    }
  }, [canUseDiscoveredTree, squadTypeFilter]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    if (!canUseDiscoveredTree && viewMode === 'DISCOVERED') {
      setViewMode('LIST');
    }
  }, [canUseDiscoveredTree, viewMode]);

  useEffect(() => {
    if (route.params?.viewMode) {
      setViewMode(route.params.viewMode);
    }
    if (route.params?.initialSearch !== undefined) {
      setSearchQuery(route.params.initialSearch);
    }
  }, [route.params?.viewMode, route.params?.initialSearch]);

  useEffect(() => {
    if (canUseDiscoveredTree && viewMode === 'DISCOVERED') {
      loadDiscoveredTree();
    }
  }, [canUseDiscoveredTree, loadDiscoveredTree, viewMode]);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
      loadPlayers();
      if (canUseDiscoveredTree) {
        loadDiscoveredTree();
      }
    }, [canUseDiscoveredTree, loadDiscoveredTree, loadRecent, loadPlayers]),
  );

  const uniquePositions = useMemo(() => {
    const set = new Set<string>();
    players.forEach((player) => {
      if (player.position) {
        set.add(player.position);
      }
    });
    return Array.from(set);
  }, [players]);

  const rosterStats = useMemo(() => {
    const total = players.length;
    const clubs = new Set(
      players.map((p) => p.club?.name).filter((name): name is string => !!name)
    ).size;
    const prospects = players.filter((p) => p.status === 'PROSPECT').length;
    return { total, clubs, prospects };
  }, [players]);

  const uniqueLeagues = useMemo(() => {
    const set = new Set<string>();
    players.forEach((player) => {
      const league = player.competition?.name || player.league;
      if (league) {
        set.add(league);
      }
    });
    return Array.from(set);
  }, [players]);

  const showRecentPlayers = useMemo(() => {
    const role = user?.role ?? 'PUBLIC';
    const allowedRoles = ['SCOUT', 'AGENT', 'ANALYST', 'ADMIN', 'SUPER_ADMIN', 'CLUB_CONTACT'];
    return allowedRoles.includes(role) && recentPlayers.length > 0;
  }, [recentPlayers.length, user?.role]);

  const canUseScoutQuickImport = useMemo(() => {
    const role = user?.role ?? 'PUBLIC';
    return ['SCOUT', 'ADMIN', 'SUPER_ADMIN'].includes(role);
  }, [user?.role]);

  const canManageVideoUploadForPlayer = useCallback(
    (playerId: string) => {
      const isOwner = currentRole === 'PLAYER' && !!user?.playerId && user.playerId === playerId;
      return isOwner;
    },
    [currentRole, user?.playerId],
  );

  const getPlayerRating = (player: any) => {
    return (
      player.stats?.overallRating ??
      player.statsJson?.overallRating ??
      player.ratings?.overall ??
      player.rating ??
      0
    );
  };

  const filteredPlayers = useMemo(() => {
    let result = players.filter((player) => {
      const matchesSearch = (() => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const playerName = `${player.user?.firstName || ''} ${player.user?.lastName || ''}`.toLowerCase();
        const club = player.club?.name?.toLowerCase() || '';
        const position = player.position?.toLowerCase() || '';
        const league = (player.competition?.name || player.league || '').toLowerCase();
        return (
          playerName.includes(query) ||
          club.includes(query) ||
          position.includes(query) ||
          league.includes(query)
        );
      })();

      const matchesPosition = activePosition ? player.position === activePosition : true;
      const matchesLeague = activeLeague
        ? player.competition?.name === activeLeague || player.league === activeLeague
        : true;

      return matchesSearch && matchesPosition && matchesLeague;
    });

    if (filterMode === 'TRENDING') {
      result = [...result].sort((a, b) => getPlayerRating(b) - getPlayerRating(a));
    }

    return result;
  }, [players, searchQuery, activePosition, activeLeague, filterMode]);

  const formatValue = (value?: number) => {
    if (!value || value <= 0) return common.notAvailable;
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
    return `€${value}`;
  };

  const isWatchlistedPlayer = (player: any) =>
    player?.isWatchlisted ||
    player?.watchlist === true ||
    player?.tags?.includes?.('WATCHLIST') ||
    player?.status === 'WATCHLISTED';

  const watchlistCount = useMemo(() => {
    return players.filter((player) => isWatchlistedPlayer(player)).length;
  }, [players]);

  const parseDate = (value?: string | Date | null) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const deltaLabels = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    let currentMonthNewPlayers = 0;
    let previousMonthNewPlayers = 0;
    let watchlistedToday = 0;
    let watchlistedYesterday = 0;

    players.forEach((player) => {
      const createdAt = parseDate(player.createdAt ?? player.created_at);
      if (createdAt) {
        if (createdAt >= startOfMonth) currentMonthNewPlayers += 1;
        else if (createdAt >= startOfPrevMonth && createdAt < startOfMonth) {
          previousMonthNewPlayers += 1;
        }
      }

      if (isWatchlistedPlayer(player)) {
        const watchlistReferenceDate =
          parseDate(player.watchlistUpdatedAt) ||
          parseDate(player.watchlistAddedAt) ||
          parseDate(player.updatedAt) ||
          createdAt;

        if (watchlistReferenceDate) {
          if (watchlistReferenceDate >= startOfToday) {
            watchlistedToday += 1;
          } else if (
            watchlistReferenceDate >= startOfYesterday &&
            watchlistReferenceDate < startOfToday
          ) {
            watchlistedYesterday += 1;
          }
        }
      }
    });

    const totalDelta = currentMonthNewPlayers - previousMonthNewPlayers;
    const watchlistDelta = watchlistedToday - watchlistedYesterday;

    const formatDeltaLabel = (value: number, suffix: string, stableLabel: string) => {
      if (value > 0) return `+${value} ${suffix}`;
      if (value < 0) return `-${Math.abs(value)} ${suffix}`;
      return stableLabel;
    };

    return {
      total: formatDeltaLabel(totalDelta, statsCopy.delta.month, statsCopy.delta.stableMonth),
      watchlist: formatDeltaLabel(
        watchlistDelta,
        statsCopy.delta.today,
        statsCopy.delta.stableToday
      ),
    };
  }, [players, statsCopy.delta]);

  const statCards = [
    {
      key: 'total',
      label: statsCopy.totalLabel,
      value: rosterStats.total,
      delta: deltaLabels.total,
      gradient: theme.colors.brand.gradient ?? [theme.colors.brand.primary, theme.colors.brand.accent],
    },
    {
      key: 'watchlist',
      label: statsCopy.watchlistLabel,
      value: watchlistCount,
      delta: deltaLabels.watchlist,
      gradient: [theme.colors.brand.accent, theme.colors.brand.primary],
    },
  ];

  const contextFilters =
    filterMode === 'POSITION'
      ? uniquePositions
      : filterMode === 'LEAGUE'
      ? uniqueLeagues
      : [];

  const selectedCountryNode = useMemo(
    () => discoveredTree.find((country) => country.country === activeCountry) ?? null,
    [activeCountry, discoveredTree],
  );

  const selectedCompetitionNode = useMemo(
    () =>
      selectedCountryNode?.competitions.find(
        (competition) => competition.competition === activeCompetition,
      ) ?? null,
    [activeCompetition, selectedCountryNode],
  );

  useEffect(() => {
    if (!activeCountry) return;
    const countryExists = discoveredTree.some((country) => country.country === activeCountry);
    if (!countryExists) {
      setActiveCountry(null);
      setActiveCompetition(null);
      return;
    }
    if (activeCompetition && selectedCountryNode) {
      const competitionExists = selectedCountryNode.competitions.some(
        (competition) => competition.competition === activeCompetition,
      );
      if (!competitionExists) {
        setActiveCompetition(null);
      }
    }
  }, [activeCompetition, activeCountry, discoveredTree, selectedCountryNode]);

  const treeQuery = treeSearchQuery.trim().toLowerCase();
  const visibleCountries = useMemo(() => {
    if (activeCountry) return [];
    if (!treeQuery) return discoveredTree;
    return discoveredTree.filter((country) => country.country.toLowerCase().includes(treeQuery));
  }, [activeCountry, discoveredTree, treeQuery]);

  const visibleCompetitions = useMemo(() => {
    if (!selectedCountryNode || activeCompetition) return [];
    if (!treeQuery) return selectedCountryNode.competitions;
    return selectedCountryNode.competitions.filter((competition) =>
      competition.competition.toLowerCase().includes(treeQuery),
    );
  }, [activeCompetition, selectedCountryNode, treeQuery]);

  const visibleAgeCategories = useMemo(() => {
    if (!selectedCompetitionNode) return [] as DiscoveredTreeAgeCategoryNode[];
    if (!treeQuery) return selectedCompetitionNode.ageCategories;
    return selectedCompetitionNode.ageCategories
      .map((ageCategory) => ({
        ...ageCategory,
        players: ageCategory.players.filter((player) =>
          player.fullName.toLowerCase().includes(treeQuery),
        ),
      }))
      .filter((ageCategory) => ageCategory.players.length > 0);
  }, [selectedCompetitionNode, treeQuery]);

  const discoveredTotals = useMemo(
    () => ({
      players: discoveredTree.reduce((sum, country) => sum + country.totalPlayers, 0),
      reports: discoveredTree.reduce((sum, country) => sum + country.totalReports, 0),
      countries: discoveredTree.length,
    }),
    [discoveredTree],
  );

  const formatScore = (value?: number | null) =>
    typeof value === 'number' ? value.toFixed(1) : '--';

  const ageCategoryLabel = (value: string) => {
    if (value === 'SENIOR') return 'Senior';
    if (value === 'U19') return 'U19';
    if (value === 'U17') return 'U17';
    if (value === 'U16') return 'U16';
    return value;
  };

  const renderPlayer = ({ item, index }: { item: any; index: number }) => {
    const rating = getPlayerRating(item);
    const accent =
      theme.colors.brand.gradient ?? [theme.colors.brand.primary, theme.colors.brand.accent];
    const clubLogo = getClubLogo(item.club);
    const flagUrl = getFlagUrl(item.nationality || item.country || item.club?.country);

    return (
      <TouchableOpacity
        style={styles.playerCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('PlayerDetail', { playerId: item.id })}
      >
        <View style={styles.playerCardContent}>
          <View style={styles.cardTopRow}>
            <View style={styles.playerAvatar}>
              {item.user?.avatar ? (
                <Image source={{ uri: item.user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {(item.user?.firstName?.[0] || '').toUpperCase()}
                  {(item.user?.lastName?.[0] || '').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.ratingChip}>
              <Text style={styles.ratingChipValue}>
                {rating ? rating.toFixed(0) : '--'}
              </Text>
              <Ionicons name="trending-up" size={14} color={theme.colors.background.primary} />
            </View>
          </View>

          <View style={styles.playerTileInfo}>
            <Text style={styles.playerTileName}>
              {item.user?.firstName} {item.user?.lastName}
            </Text>
            <View style={styles.clubRow}>
              {flagUrl && <Image source={{ uri: flagUrl }} style={styles.flagIcon} />}
              {clubLogo && <Image source={{ uri: clubLogo }} style={styles.clubBadge} />}
              <Text style={styles.playerTileClub}>
                {item.club?.name ?? common.notAvailable}
              </Text>
            </View>
          </View>

          <View style={styles.positionPill}>
            <Text style={styles.positionText}>{item.position || common.notAvailable}</Text>
          </View>

          <View style={styles.playerStatRow}>
            <View style={styles.playerStatBlock}>
              <Text style={styles.playerStatLabel}>{cardCopy.goals}</Text>
              <Text style={styles.playerStatValue}>
                {item.stats?.goals ?? item.statsJson?.goals ?? '—'}
              </Text>
            </View>
            <View style={styles.playerStatBlock}>
              <Text style={styles.playerStatLabel}>{cardCopy.assists}</Text>
              <Text style={styles.playerStatValue}>
                {item.stats?.assists ?? item.statsJson?.assists ?? '—'}
              </Text>
            </View>
          </View>

          {canManageVideoUploadForPlayer(item.id) ? (
            <View style={styles.playerActionRow}>
              <TouchableOpacity
                style={styles.playerVideoAction}
                onPress={(event) => {
                  event.stopPropagation();
                  navigation.navigate('PlayerHighlights', {
                    playerId: item.id,
                    mode:
                      currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN'
                        ? 'adminView'
                        : 'owner',
                  });
                }}
              >
                <Ionicons name="videocam-outline" size={14} color={theme.colors.brand.primary} />
                <Text style={styles.playerVideoActionText}>Ajouter vidéo</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        <LinearGradient colors={accent} style={styles.playerCardAccent} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </SafeAreaView>
    );
  }

  if (viewMode === 'DISCOVERED' && canUseDiscoveredTree) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader blur={false} borderBottom={false} />
        <ScrollView contentContainerStyle={styles.discoveredContent}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{layoutCopy.title}</Text>
            <Text style={styles.pageSubtitle}>
              Arborescence découverte scout: pays → championnat → catégorie d’âge
            </Text>
          </View>

          <View style={styles.viewModeRow}>
            <TouchableOpacity
              style={styles.viewModeChip}
              onPress={() => setViewMode('LIST')}
            >
              <Text style={styles.viewModeChipText}>Liste</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeChip, styles.viewModeChipActive]}
              onPress={() => setViewMode('DISCOVERED')}
            >
              <Text style={[styles.viewModeChipText, styles.viewModeChipTextActive]}>
                Découvertes
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pays</Text>
              <Text style={styles.statValue}>{discoveredTotals.countries}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Joueurs</Text>
              <Text style={styles.statValue}>{discoveredTotals.players}</Text>
            </View>
          </View>

          <View style={styles.treeFilterSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher pays, compétition ou joueur..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={treeSearchQuery}
                onChangeText={setTreeSearchQuery}
              />
            </View>

            <View style={styles.squadFilterRow}>
              {(['ALL', 'PRO', 'RESERVE'] as DiscoveredTreeSquadType[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.squadFilterChip,
                    squadTypeFilter === option && styles.squadFilterChipActive,
                  ]}
                  onPress={() => setSquadTypeFilter(option)}
                >
                  <Text
                    style={[
                      styles.squadFilterText,
                      squadTypeFilter === option && styles.squadFilterTextActive,
                    ]}
                  >
                    {option === 'ALL' ? 'Tous' : option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.breadcrumbRow}>
            <TouchableOpacity
              style={styles.breadcrumbChip}
              onPress={() => {
                setActiveCountry(null);
                setActiveCompetition(null);
              }}
            >
              <Text style={styles.breadcrumbText}>Pays</Text>
            </TouchableOpacity>
            {activeCountry ? (
              <TouchableOpacity
                style={styles.breadcrumbChip}
                onPress={() => setActiveCompetition(null)}
              >
                <Text style={styles.breadcrumbText}>{activeCountry}</Text>
              </TouchableOpacity>
            ) : null}
            {activeCompetition ? (
              <View style={styles.breadcrumbChip}>
                <Text style={styles.breadcrumbText}>{activeCompetition}</Text>
              </View>
            ) : null}
          </View>

          {discoveredLoading ? (
            <View style={styles.discoveredLoading}>
              <ActivityIndicator size="small" color={theme.colors.brand.primary} />
            </View>
          ) : discoveredError ? (
            <View style={styles.discoveredEmpty}>
              <Text style={styles.emptyText}>{discoveredError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadDiscoveredTree}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : !activeCountry ? (
            visibleCountries.length === 0 ? (
              <View style={styles.discoveredEmpty}>
                <Text style={styles.emptyText}>Aucun pays trouvé.</Text>
              </View>
            ) : (
              visibleCountries.map((country) => (
                <TouchableOpacity
                  key={country.country}
                  style={styles.treeCard}
                  onPress={() => {
                    setActiveCountry(country.country);
                    setActiveCompetition(null);
                  }}
                >
                  <Text style={styles.treeCardTitle}>{country.country}</Text>
                  <Text style={styles.treeCardMeta}>
                    {country.totalCompetitions} compétition(s) • {country.totalPlayers} joueur(s) •{' '}
                    {country.totalReports} rapport(s)
                  </Text>
                </TouchableOpacity>
              ))
            )
          ) : !activeCompetition ? (
            visibleCompetitions.length === 0 ? (
              <View style={styles.discoveredEmpty}>
                <Text style={styles.emptyText}>Aucune compétition trouvée.</Text>
              </View>
            ) : (
              visibleCompetitions.map((competition) => (
                <TouchableOpacity
                  key={competition.competition}
                  style={styles.treeCard}
                  onPress={() => setActiveCompetition(competition.competition)}
                >
                  <Text style={styles.treeCardTitle}>{competition.competition}</Text>
                  <Text style={styles.treeCardMeta}>
                    {competition.totalAgeCategories} catégorie(s) • {competition.totalPlayers} joueur(s) •{' '}
                    {competition.totalReports} rapport(s)
                  </Text>
                </TouchableOpacity>
              ))
            )
          ) : visibleAgeCategories.length === 0 ? (
            <View style={styles.discoveredEmpty}>
              <Text style={styles.emptyText}>Aucun joueur trouvé.</Text>
            </View>
          ) : (
            visibleAgeCategories.map((ageCategory) => (
              <View key={ageCategory.ageCategory} style={styles.ageCategoryCard}>
                <Text style={styles.ageCategoryTitle}>{ageCategoryLabel(ageCategory.ageCategory)}</Text>
                <Text style={styles.ageCategoryMeta}>
                  {ageCategory.totalPlayers} joueur(s) • {ageCategory.totalReports} rapport(s)
                </Text>

                {ageCategory.players.map((player) => (
                  <TouchableOpacity
                    key={player.playerId}
                    style={styles.treePlayerRow}
                    onPress={() => navigation.navigate('PlayerDetail', { playerId: player.playerId })}
                  >
                    <View style={styles.treePlayerMain}>
                      <Text style={styles.treePlayerName}>{player.fullName}</Text>
                      <Text style={styles.treePlayerMeta}>
                        {player.reportCount} rapport(s) • pondérée {formatScore(player.weightedOverallRating)} •
                        latest {formatScore(player.latestOverallRating)}
                      </Text>
                    </View>
                    <View style={styles.treePlayerActions}>
                      <View style={styles.treeSquadBadge}>
                        <Text style={styles.treeSquadText}>{player.squadType}</Text>
                      </View>
                      {canManageVideoUploadForPlayer(player.playerId) ? (
                        <TouchableOpacity
                          style={styles.treeVideoButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            navigation.navigate('PlayerHighlights', {
                              playerId: player.playerId,
                              mode:
                                currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN'
                                  ? 'adminView'
                                  : 'owner',
                            });
                          }}
                        >
                          <Ionicons name="videocam-outline" size={12} color={theme.colors.brand.primary} />
                          <Text style={styles.treeVideoText}>Ajouter vidéo</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader blur={false} borderBottom={false} />
      <FlatList
        data={filteredPlayers}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>{layoutCopy.title}</Text>
              <Text style={styles.pageSubtitle}>{layoutCopy.subtitle}</Text>
            </View>

            {canUseDiscoveredTree && (
              <View style={styles.viewModeRow}>
                <TouchableOpacity
                  style={[styles.viewModeChip, styles.viewModeChipActive]}
                  onPress={() => setViewMode('LIST')}
                >
                  <Text style={[styles.viewModeChipText, styles.viewModeChipTextActive]}>Liste</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewModeChip}
                  onPress={() => setViewMode('DISCOVERED')}
                >
                  <Text style={styles.viewModeChipText}>Découvertes</Text>
                </TouchableOpacity>
              </View>
            )}

            {canUseScoutQuickImport && (
              <TouchableOpacity
                style={styles.quickImportButton}
                onPress={() => navigation.navigate('ScoutQuickImport')}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={theme.colors.background.primary} />
                <Text style={styles.quickImportButtonText}>Import rapide (Scout)</Text>
              </TouchableOpacity>
            )}

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t.search.placeholder}
                placeholderTextColor={theme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={styles.searchFilterButton}
                onPress={() => setFilterMode((prev) => (prev === 'TRENDING' ? 'ALL' : 'TRENDING'))}
              >
                  <Ionicons
                    name="options"
                    size={20}
                    color={
                      filterMode === 'TRENDING'
                        ? theme.colors.background.primary
                        : theme.colors.text.secondary
                    }
                  />
              </TouchableOpacity>
            </View>

            <View style={styles.primaryFilters}>
              {(['ALL', 'POSITION', 'LEAGUE', 'TRENDING'] as FilterMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.primaryFilterChip,
                    filterMode === mode && styles.primaryFilterChipActive,
                  ]}
                  onPress={() => {
                    setFilterMode(mode);
                    if (mode === 'ALL') {
                      setActivePosition(null);
                      setActiveLeague(null);
                    }
                  }}
                >
                  <Text style={styles.primaryFilterText}>
                    {
                      {
                        ALL: filterCopy.all,
                        POSITION: filterCopy.position,
                        LEAGUE: filterCopy.league,
                        TRENDING: filterCopy.trending,
                      }[mode]
                    }
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {contextFilters.length > 0 && (
              <View style={styles.contextFilters}>
                <TouchableOpacity
                  style={[
                    styles.contextFilterChip,
                    !activePosition && !activeLeague && styles.contextFilterChipActive,
                  ]}
                  onPress={() => {
                    setActivePosition(null);
                    setActiveLeague(null);
                  }}
                >
                  <Text
                    style={[
                      styles.contextFilterText,
                      !activePosition && !activeLeague && styles.contextFilterTextActive,
                    ]}
                  >
                    {filterCopy.contextAll}
                  </Text>
                </TouchableOpacity>
                {contextFilters.map((item) => {
                  const isActive =
                    filterMode === 'POSITION'
                      ? activePosition === item
                      : activeLeague === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.contextFilterChip,
                        isActive && styles.contextFilterChipActive,
                      ]}
                      onPress={() => {
                        if (filterMode === 'POSITION') {
                          setActivePosition((prev) => (prev === item ? null : item));
                        } else {
                          setActiveLeague((prev) => (prev === item ? null : item));
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.contextFilterText,
                          isActive && styles.contextFilterTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {showRecentPlayers && (
              <View style={styles.recentSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Joueurs vus récemment</Text>
                  {recentLoading && (
                    <ActivityIndicator size="small" color={theme.colors.brand.primary} />
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentList}
                >
                  {recentPlayers.map((recent) => (
                    <TouchableOpacity
                      key={recent.id}
                      style={styles.recentCard}
                      onPress={() => navigation.navigate('PlayerDetail', { playerId: recent.id })}
                      activeOpacity={0.85}
                    >
                      <View style={styles.recentAvatar}>
                        {recent.photoUrl ? (
                          <Image source={{ uri: recent.photoUrl }} style={styles.recentAvatarImage} />
                        ) : (
                          <Text style={styles.recentAvatarText}>
                            {recent.fullName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.recentName} numberOfLines={1}>
                        {recent.fullName}
                      </Text>
                      <Text style={styles.recentMeta} numberOfLines={1}>
                        {recent.position || common.notAvailable} • {recent.clubName || 'Free Agent'}
                      </Text>
                      <View style={styles.recentActions}>
                        <TouchableOpacity
                          style={styles.recentActionPrimary}
                          onPress={() => navigation.navigate('PlayerDetail', { playerId: recent.id })}
                        >
                          <Text style={styles.recentActionPrimaryText}>Voir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recentActionSecondary}
                          onPress={() => navigation.navigate('CreateReport', { playerId: recent.id })}
                        >
                          <Text style={styles.recentActionSecondaryText}>Rapport</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.statsRow}>
              {statCards.map((card) => (
                <View key={card.key} style={styles.statCard}>
                  <LinearGradient colors={card.gradient} style={styles.statAccent} />
                  <Text style={styles.statLabel}>{card.label}</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statDelta}>{card.delta}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionCopy.allPlayers}</Text>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setFilterMode('TRENDING')}
              >
                <Text style={styles.sortText}>{sectionCopy.sort}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.empty.title}</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  discoveredContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    gap: 14,
  },
  columnWrapper: {
    gap: 16,
  },
  headerStack: {
    gap: 16,
    paddingBottom: 8,
  },
  pageHeader: {
    marginTop: 10,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  pageSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glass,
    paddingVertical: 10,
  },
  viewModeChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}22`,
  },
  viewModeChipText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.medium,
  },
  viewModeChipTextActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  quickImportButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  quickImportButtonText: {
    color: theme.colors.background.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.glass,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 15,
    marginLeft: 8,
    marginRight: 8,
  },
  searchFilterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.glassLight,
  },
  treeFilterSection: {
    gap: 10,
  },
  squadFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  squadFilterChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glass,
    paddingVertical: 9,
  },
  squadFilterChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}22`,
  },
  squadFilterText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.medium,
  },
  squadFilterTextActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breadcrumbChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glassLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  breadcrumbText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.medium,
  },
  discoveredLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  discoveredEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: `${theme.colors.brand.primary}1A`,
  },
  retryButtonText: {
    color: theme.colors.brand.primary,
    fontSize: 12,
    fontFamily: theme.typography.fonts.bold,
  },
  treeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  treeCardTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  treeCardMeta: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  ageCategoryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.background.secondary,
    padding: 14,
    marginBottom: 12,
  },
  ageCategoryTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  ageCategoryMeta: {
    marginTop: 4,
    marginBottom: 8,
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  treePlayerRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glass,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  treePlayerMain: {
    flex: 1,
  },
  treePlayerName: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  treePlayerMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  treePlayerActions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  treeSquadBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glassLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  treeSquadText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.bold,
  },
  treeVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  treeVideoText: {
    fontSize: 11,
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  primaryFilters: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryFilterChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    alignItems: 'center',
  },
  primaryFilterChipActive: {
    backgroundColor: `${theme.colors.brand.accent}30`,
    borderColor: theme.colors.brand.accent,
  },
  primaryFilterText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  contextFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  contextFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  contextFilterChipActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  contextFilterText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  contextFilterTextActive: {
    color: theme.colors.background.primary,
  },
  recentSection: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentList: {
    paddingRight: 16,
  },
  recentCard: {
    width: 220,
    padding: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginRight: 12,
  },
  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  recentAvatarText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  recentName: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  recentMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  recentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  recentActionPrimary: {
    flex: 1,
    backgroundColor: theme.colors.brand.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  recentActionPrimaryText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.background.primary,
  },
  recentActionSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  recentActionSecondaryText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    backgroundColor: theme.colors.background.secondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  statValue: {
    fontSize: 32,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  statDelta: {
    fontSize: 13,
    color: theme.colors.brand.accent,
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  playerCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  playerCardContent: {
    padding: 20,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: theme.colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingChipValue: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.background.primary,
  },
  playerTileInfo: {
    marginTop: 8,
  },
  playerTileName: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  playerTileClub: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagIcon: {
    width: 18,
    height: 12,
    borderRadius: 3,
  },
  clubBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.background.primary,
  },
  positionPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  positionText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  playerStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  playerStatBlock: {
    flex: 1,
  },
  playerStatLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  playerStatValue: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  playerActionRow: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  playerVideoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: `${theme.colors.brand.primary}1A`,
  },
  playerVideoActionText: {
    fontSize: 11,
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
  },
  playerCardAccent: {
    height: 6,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },
});

export default PlayersScreen;
