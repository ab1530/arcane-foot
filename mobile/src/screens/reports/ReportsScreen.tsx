import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import api from '../../services/api';
import { logger, logError } from '../../utils/logger';
import type { IconName } from '../../constants/icons';

interface Report {
  id: string;
  playerId: string;
  player?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  matchId?: string;
  match?: {
    homeClub?: { name: string };
    awayClub?: { name: string };
    date: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  overallRating?: number;
  recommendation?: string;
  scoutId: string;
  scout?: {
    firstName: string;
    lastName: string;
  };
  analysis?: {
    identityCompletenessScore?: number | null;
  };
}

interface MatchGroup {
  key: string;
  label: string;
  reports: Report[];
}

interface DayGroup {
  dateKey: string;
  dateLabel: string;
  totalReports: number;
  matches: MatchGroup[];
}

const statusGradients: Record<Report['status'], [string, string]> = {
  DRAFT: [colors.surface.border, colors.surface.glass],
  SUBMITTED: [colors.semantic.info, colors.semantic.infoBg],
  APPROVED: [colors.semantic.success, colors.semantic.successBg],
  REJECTED: [colors.semantic.error, colors.semantic.errorBg],
};

export const ReportsScreen = () => {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getScoutingReports();

      // Handle different response formats
      const reportsList = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];

      logger.info('reports', 'Reports fetched', { count: reportsList.length });
      setReports(reportsList);
    } catch (error) {
      logError('Failed to fetch reports', error);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return colors.semantic.success;
      case 'REJECTED':
        return colors.semantic.error;
      case 'SUBMITTED':
        return colors.semantic.info;
      case 'DRAFT':
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string): IconName => {
    switch (status) {
      case 'APPROVED':
        return 'checkCircle';
      case 'REJECTED':
        return 'close';
      case 'SUBMITTED':
        return 'time';
      case 'DRAFT':
      default:
        return 'edit';
    }
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return colors.text.secondary;
    if (rating >= 80) return colors.semantic.success;
    if (rating >= 60) return colors.brand.primary;
    if (rating >= 40) return colors.semantic.warning;
    return colors.semantic.error;
  };

  const getCompletenessBadge = (score?: number | null) => {
    if (typeof score !== 'number') {
      return null;
    }
    if (score >= 80) {
      return { label: 'Complet', color: colors.semantic.success };
    }
    if (score >= 40) {
      return { label: 'Partiel', color: colors.semantic.warning };
    }
    return { label: 'Minimal', color: colors.text.secondary };
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' ||
      report.player?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.player?.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.match?.homeClub?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.match?.awayClub?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const groupedReports = useMemo<DayGroup[]>(() => {
    const sorted = [...filteredReports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const dayMap = new Map<
      string,
      { dateLabel: string; totalReports: number; matches: Map<string, MatchGroup> }
    >();

    sorted.forEach((report) => {
      const createdAt = new Date(report.createdAt);
      const dateKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(
        createdAt.getDate(),
      ).padStart(2, '0')}`;
      const dateLabel = createdAt.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const matchLabel = report.match
        ? `${report.match.homeClub?.name || 'Home'} vs ${report.match.awayClub?.name || 'Away'}`
        : 'Match non renseigné';
      const matchKey = report.matchId ? `match-${report.matchId}` : `fallback-${matchLabel}`;

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { dateLabel, totalReports: 0, matches: new Map<string, MatchGroup>() });
      }

      const day = dayMap.get(dateKey)!;
      if (!day.matches.has(matchKey)) {
        day.matches.set(matchKey, { key: matchKey, label: matchLabel, reports: [] });
      }

      day.matches.get(matchKey)!.reports.push(report);
      day.totalReports += 1;
    });

    return Array.from(dayMap.entries()).map(([dateKey, day]) => ({
      dateKey,
      dateLabel: day.dateLabel,
      totalReports: day.totalReports,
      matches: Array.from(day.matches.values()),
    }));
  }, [filteredReports]);

  const statuses = ['all', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];
  const statusCounts = reports.reduce(
    (acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    },
    {
      DRAFT: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
    } as Record<Report['status'], number>
  );

  const heroStats = [
    { label: 'Rapports', value: reports.length },
    { label: 'Validés', value: statusCounts.APPROVED },
    { label: 'En attente', value: statusCounts.SUBMITTED },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Rapports" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Rapports de scouting"
        blur={false}
        borderBottom={false}
        rightActions={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateReport')}
          >
            <Icon name="add" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.heroSection}>
        <Text style={styles.heroEyebrow}>Arcane Insights</Text>
        <Text style={styles.heroTitle}>Scouting Reports</Text>
        <Text style={styles.heroSubtitle}>
          Consolidez vos décisions grâce aux rapports déposés par vos scouts. Filtrez, révisez et validez en un clin d’œil.
        </Text>
        <View style={styles.heroStatsRow}>
          {heroStats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search" size={18} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur, un club..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'Tous' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {filteredReports.length === 0 ? (
          <GlassCard variant="elevated" style={styles.emptyCard}>
            <Icon name="analytics" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first scouting report'}
            </Text>
          </GlassCard>
        ) : (
          groupedReports.map((dayGroup) => (
            <View key={dayGroup.dateKey} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{dayGroup.dateLabel}</Text>
                <Text style={styles.dayCount}>{dayGroup.totalReports} rapport(s)</Text>
              </View>

              {dayGroup.matches.map((matchGroup) => (
                <View key={matchGroup.key} style={styles.matchGroup}>
                  <View style={styles.matchGroupHeader}>
                    <Text style={styles.matchGroupTitle}>{matchGroup.label}</Text>
                    <Text style={styles.matchGroupCount}>{matchGroup.reports.length} joueur(s)</Text>
                  </View>

                  {matchGroup.reports.map((report, index) => (
                    <TouchableOpacity
                      key={report.id}
                      activeOpacity={0.92}
                      onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
                    >
                      <View style={styles.reportTile}>
                        <LinearGradient
                          colors={statusGradients[report.status] || [colors.surface.border, colors.surface.glass]}
                          style={styles.statusRibbon}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Icon name={getStatusIcon(report.status)} size={16} color={colors.background.primary} />
                          <Text style={styles.statusRibbonText}>{report.status}</Text>
                        </LinearGradient>

                        <View style={styles.tileHeader}>
                          <View style={styles.playerMeta}>
                            <Text style={styles.playerName}>
                              {report.player?.user?.firstName} {report.player?.user?.lastName}
                            </Text>
                            <Text style={styles.reportDate}>
                              {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                        </View>

                        {(() => {
                          const badge = getCompletenessBadge(report.analysis?.identityCompletenessScore);
                          if (!badge) return null;
                          return (
                            <View
                              style={[
                                styles.identityBadge,
                                { borderColor: badge.color, backgroundColor: `${badge.color}22` },
                              ]}
                            >
                              <Text style={[styles.identityBadgeText, { color: badge.color }]}>
                                {badge.label} ({Math.round(report.analysis?.identityCompletenessScore || 0)}%)
                              </Text>
                            </View>
                          );
                        })()}

                        {report.overallRating && (
                          <View style={styles.ratingWrap}>
                            <Text style={styles.ratingLabel}>Overall</Text>
                            <View style={styles.ratingBubble}>
                              <Text
                                style={[
                                  styles.ratingBubbleValue,
                                  { color: getRatingColor(report.overallRating) },
                                ]}
                              >
                                {report.overallRating}
                              </Text>
                            </View>
                          </View>
                        )}

                        {report.match && (
                          <View style={styles.matchupRow}>
                            <View style={styles.teamPill}>
                              <Text style={styles.teamText} numberOfLines={1}>
                                {report.match.homeClub?.name || 'Home'}
                              </Text>
                            </View>
                            <Text style={styles.vsText}>vs</Text>
                            <View style={styles.teamPill}>
                              <Text style={styles.teamText} numberOfLines={1}>
                                {report.match.awayClub?.name || 'Away'}
                              </Text>
                            </View>
                          </View>
                        )}

                        {report.recommendation && (
                          <View style={styles.recommendationRow}>
                            <Icon name="sparkles" size={16} color={colors.brand.primary} />
                            <Text style={styles.recommendationText}>
                              {report.recommendation.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        )}

                        <View style={styles.tileFooter}>
                          <View style={styles.scoutInfo}>
                            <View style={styles.scoutAvatar}>
                              <Text style={styles.scoutAvatarText}>
                                {report.scout?.firstName?.[0]}
                                {report.scout?.lastName?.[0]}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.scoutLabel}>Scout</Text>
                              <Text style={styles.scoutName}>
                                {report.scout?.firstName} {report.scout?.lastName}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.tileActions}>
                            <TouchableOpacity style={styles.actionButton}>
                              <Icon name="share" size={16} color={colors.text.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                              <Icon name="document" size={16} color={colors.text.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <LinearGradient
                          colors={index % 2 === 0 ? colors.brand.gradient : [colors.brand.accent, colors.brand.primary]}
                          style={styles.tileAccent}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroEyebrow: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.background.secondary,
  },
  statValue: {
    fontSize: 24,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  statLabel: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  searchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  filterContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  emptyCard: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  daySection: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dayTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  dayCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  matchGroup: {
    marginBottom: spacing.md,
  },
  matchGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  matchGroupTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
  },
  matchGroupCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  reportTile: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    gap: spacing.md,
  },
  statusRibbon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusRibbonText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.background.primary,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  playerMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  playerName: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  reportDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  identityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  identityBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  ratingLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingBubble: {
    minWidth: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  ratingBubbleValue: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  teamPill: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
  },
  teamText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  vsText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: `${colors.brand.primary}1A`,
  },
  recommendationText: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    textTransform: 'capitalize',
  },
  tileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surface.borderLight,
    paddingTop: spacing.md,
  },
  scoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoutAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutAvatarText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  scoutLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  scoutName: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
  },
  tileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileAccent: {
    height: 6,
    borderRadius: radius.full,
  },
});

export default ReportsScreen;
