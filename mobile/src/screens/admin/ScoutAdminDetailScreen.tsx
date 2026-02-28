import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import api, { extractPayloadItems, pickDateValue } from '../../services/api';

type Props = NativeStackScreenProps<AppStackParamList, 'ScoutAdminDetail'>;

type MatchPreview = {
  id: string;
  title: string;
  scheduledAt: string;
  location?: string | null;
};

type ReportPreview = {
  id: string;
  createdAt: string;
  playerName: string;
  overallRating?: number | null;
  matchLabel: string;
};

const toShortDateTime = (input?: string | null) => {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toShortDate = (input?: string | null) => {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const buildMatchLabel = (row: any) => {
  const home =
    row?.homeClub?.name ??
    row?.clubs_matches_homeClubIdToclubs?.name ??
    row?.matches?.clubs_matches_homeClubIdToclubs?.name ??
    'Club A';
  const away =
    row?.awayClub?.name ??
    row?.clubs_matches_awayClubIdToclubs?.name ??
    row?.matches?.clubs_matches_awayClubIdToclubs?.name ??
    'Club B';
  return `${home} vs ${away}`;
};

const toMatchPreview = (row: any): MatchPreview | null => {
  const id = String(row?.id ?? '').trim();
  if (!id) return null;
  const scheduledAt = pickDateValue(row, ['scheduledAt', 'matchDate', 'date', 'createdAt']) ?? '';
  return {
    id,
    title: buildMatchLabel(row),
    scheduledAt,
    location: row?.venue?.name ?? row?.venueOld ?? null,
  };
};

const toReportPreview = (row: any): ReportPreview | null => {
  const id = String(row?.id ?? '').trim();
  if (!id) return null;
  const playerFirstName =
    row?.players?.users?.firstName ?? row?.player?.user?.firstName ?? row?.player?.firstName ?? '';
  const playerLastName =
    row?.players?.users?.lastName ?? row?.player?.user?.lastName ?? row?.player?.lastName ?? '';
  const playerName = `${playerFirstName} ${playerLastName}`.trim() || 'Joueur non renseigné';
  const matchLabel = buildMatchLabel(row?.matches ?? row?.match ?? row);
  return {
    id,
    createdAt: String(row?.createdAt ?? row?.submittedAt ?? ''),
    playerName,
    overallRating:
      typeof row?.overallRating === 'number'
        ? row.overallRating
        : typeof row?.weightedOverallRating === 'number'
        ? row.weightedOverallRating
        : null,
    matchLabel,
  };
};

export default function ScoutAdminDetailScreen({ navigation, route }: Props) {
  const scout = route.params.scout;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchPreview[]>([]);
  const [recentReports, setRecentReports] = useState<ReportPreview[]>([]);
  const [totalReports, setTotalReports] = useState<number>(scout.reportsCount ?? 0);

  const loadScoutDetails = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [matchesPayload, reportsPayload] = await Promise.all([
        api.getMatches({
          scoutId: scout.id,
          from: new Date().toISOString(),
          limit: 20,
        }),
        api.getScoutingReports({
          scoutId: scout.id,
          page: 1,
          limit: 10,
        }),
      ]);

      const matchesRows = extractPayloadItems<any>(matchesPayload)
        .map(toMatchPreview)
        .filter(Boolean) as MatchPreview[];
      const reportRows = extractPayloadItems<any>(reportsPayload)
        .map(toReportPreview)
        .filter(Boolean) as ReportPreview[];

      setUpcomingMatches(matchesRows.slice(0, 8));
      setRecentReports(reportRows.slice(0, 8));
      setTotalReports(
        Number.isFinite(reportsPayload?.meta?.total)
          ? Number(reportsPayload.meta.total)
          : Math.max(scout.reportsCount ?? 0, reportRows.length),
      );
    } catch (error) {
      console.error('Impossible de charger les détails du scout', error);
      setUpcomingMatches([]);
      setRecentReports([]);
      setTotalReports(scout.reportsCount ?? 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scout.id, scout.reportsCount]);

  useEffect(() => {
    void loadScoutDetails(false);
  }, [loadScoutDetails]);

  const onRefresh = useCallback(async () => {
    await loadScoutDetails(true);
  }, [loadScoutDetails]);

  const fullName = useMemo(
    () => `${scout.firstName ?? ''} ${scout.lastName ?? ''}`.trim() || 'Scout',
    [scout.firstName, scout.lastName],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text style={styles.loadingText}>Chargement du scout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.brand.primary} />
          <Text style={styles.backLabel}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>
              {`${scout.firstName?.[0] ?? ''}${scout.lastName?.[0] ?? ''}`.toUpperCase() || 'SC'}
            </Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroName}>{fullName}</Text>
            <Text style={styles.heroEmail}>{scout.email}</Text>
            <Text style={styles.heroMeta}>
              Inscrit le {toShortDate(scout.createdAt)} • Dernière connexion {toShortDate(scout.lastLoginAt)}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalReports}</Text>
            <Text style={styles.statLabel}>Rapports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcomingMatches.length}</Text>
            <Text style={styles.statLabel}>Matchs à venir</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{recentReports.length}</Text>
            <Text style={styles.statLabel}>Rapports récents</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Prochains matchs assignés</Text>
          {upcomingMatches.length === 0 ? (
            <Text style={styles.emptyText}>Aucun match assigné à venir.</Text>
          ) : (
            upcomingMatches.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.rowItem}
                onPress={() => navigation.navigate('MatchDetail', { matchId: match.id })}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{match.title}</Text>
                  <Text style={styles.rowSub}>
                    {toShortDateTime(match.scheduledAt)}
                    {match.location ? ` • ${match.location}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Derniers rapports</Text>
          {recentReports.length === 0 ? (
            <Text style={styles.emptyText}>Aucun rapport récent pour ce scout.</Text>
          ) : (
            recentReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.rowItem}
                onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{report.playerName}</Text>
                  <Text style={styles.rowSub}>
                    {report.matchLabel} • {toShortDateTime(report.createdAt)}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.ratingText}>
                    {typeof report.overallRating === 'number'
                      ? report.overallRating.toFixed(1)
                      : '—'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLabel: {
    color: theme.colors.brand.primary,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 255, 74, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(233, 255, 74, 0.55)',
  },
  avatarLabel: {
    color: theme.colors.brand.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  heroBody: {
    flex: 1,
  },
  heroName: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  heroEmail: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: 13,
  },
  heroMeta: {
    color: theme.colors.text.secondary,
    marginTop: 6,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  rowItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    backgroundColor: 'rgba(2, 6, 23, 0.52)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    color: theme.colors.brand.primary,
    fontWeight: '800',
    fontSize: 13,
    minWidth: 26,
    textAlign: 'right',
  },
});
