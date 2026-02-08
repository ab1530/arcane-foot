import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { AxiosError } from 'axios';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { Icon } from '../../components/ui';
import smartScoutApi from '../../services/api/smart-scout';
import type { PlayerInsights } from '../../types/smart-scout';
import { getFlagUrl, getClubLogo } from '../../utils/badgeHelpers';
import { trackRecentPlayer } from '../../services/recentPlayers';

export const PlayerDetailScreen = ({ route, navigation }: any) => {
  // Handle both direct params and nested params for playerId
  const playerId = route.params?.playerId || route.params?.params?.playerId || route.params?.id;
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsData, setInsightsData] = useState<PlayerInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsNotice, setInsightsNotice] = useState<string | null>(null);
  const [hardwareSummary, setHardwareSummary] = useState<{
    sessionCount: number;
    lastSessionAt?: string;
    lastDistanceKm?: number;
    lastMaxSpeed?: number;
    lastDurationMin?: number;
  } | null>(null);
  const [hardwareLoading, setHardwareLoading] = useState(false);

  useEffect(() => {
    if (playerId) {
      fetchPlayerDetails();
      fetchInsights();
      fetchHardwareSummary();
    } else {
      setError('No player ID provided');
      setLoading(false);
    }
  }, [playerId]);

  const fetchPlayerDetails = async () => {
    try {
      const data = await api.getPlayer(playerId);
      setPlayer(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching player:', error);
      setError('Failed to load player details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsNotice(null);
      setInsightsError(null);
      const data = await smartScoutApi.getInsights(playerId);
      setInsightsData(data);
    } catch (err) {
      const axiosError = err as AxiosError;
      const status = axiosError.response?.status;
      if (status === 404) {
        setInsightsData(null);
        setInsightsNotice('AI Insights require at least one scouting report for this player.');
      } else {
        console.error('Failed to fetch AI insights', err);
        setInsightsError('Unable to load live AI insights right now.');
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchHardwareSummary = async () => {
    try {
      setHardwareLoading(true);
      const sessions = await api.getHardwareSessions(playerId);
      if (!sessions || sessions.length === 0) {
        setHardwareSummary({ sessionCount: 0 });
        return;
      }
      const lastSession = sessions[0];
      const distanceKm =
        lastSession.metrics?.movementDistanceM !== undefined
          ? lastSession.metrics.movementDistanceM / 1000
          : undefined;
      const durationMin =
        lastSession.metrics?.totalTimeMin ??
        (lastSession.startedAt && lastSession.endedAt
          ? (new Date(lastSession.endedAt).getTime() - new Date(lastSession.startedAt).getTime()) /
            1000 /
            60
          : undefined);
      setHardwareSummary({
        sessionCount: sessions.length,
        lastSessionAt: lastSession.startedAt,
        lastDistanceKm: distanceKm,
        lastMaxSpeed: lastSession.metrics?.maxSpeedKmh,
        lastDurationMin: durationMin,
      });
    } catch {
      setHardwareSummary(null);
    } finally {
      setHardwareLoading(false);
    }
  };

  const heroRating =
    player?.overallRating ??
    player?.stats?.overallRating ??
    player?.ratings?.overall ??
    null;

  const clubLogo = getClubLogo(player?.club);
  const flagUrl = getFlagUrl(
    player?.nationality || player?.club?.country || player?.country
  );
  const playerDisplayName = useMemo(() => {
    const firstName = player?.user?.firstName ?? player?.firstName ?? '';
    const lastName = player?.user?.lastName ?? player?.lastName ?? '';
    return `${firstName} ${lastName}`.trim() || player?.name || 'Unknown Player';
  }, [player?.firstName, player?.lastName, player?.name, player?.user?.firstName, player?.user?.lastName]);

  const age = useMemo(() => {
    if (player?.age) return player.age;
    if (!player?.dateOfBirth) return null;
    const dob = new Date(player.dateOfBirth);
    const now = new Date();
    let calculated = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      calculated -= 1;
    }
    return calculated;
  }, [player]);

  const performanceScores = [
    {
      label: 'Attack',
      value: player?.technicalRating ?? player?.stats?.attack ?? 0,
    },
    {
      label: 'Defense',
      value: player?.tacticalRating ?? player?.stats?.defense ?? 0,
    },
    {
      label: 'Physical',
      value: player?.physicalRating ?? player?.stats?.physical ?? 0,
    },
  ];

  const seasonHighlights = [
    {
      label: 'Goals',
      value: player?.stats?.goals ?? player?.statsJson?.goals ?? 0,
      delta: '+5',
      icon: 'analytics',
    },
    {
      label: 'Assists',
      value: player?.stats?.assists ?? player?.statsJson?.assists ?? 0,
      delta: '+3',
      icon: 'fitness',
    },
    {
      label: 'Minutes',
      value: player?.stats?.minutes ?? player?.statsJson?.minutes ?? 0,
      delta: '+12',
      icon: 'time',
    },
  ];

  const insightsCards = useMemo(() => {
    const primaryGradient = [colors.brand.primary, colors.brand.accent];
    const secondaryGradient = [colors.brand.accent, colors.background.secondary];
    if (!insightsData) {
      return [
        {
          title: 'Performance Trend',
          description: 'Live insights loading…',
          colors: primaryGradient,
          icon: 'trendingUp',
        },
        {
          title: 'Scout Consensus',
          description: 'Analyzing latest reports for consensus.',
          colors: secondaryGradient,
          icon: 'star',
        },
      ];
    }

    const improving = insightsData.trends.improving?.slice(0, 3).join(', ');
    const declining = insightsData.trends.declining?.slice(0, 2).join(', ');

    return [
      {
        title: 'Performance Trend',
        description: improving
          ? `Improving areas: ${improving}${declining ? `. Watch ${declining}.` : ''}`
          : 'Stable form across recent reports.',
        colors: primaryGradient,
        icon: 'trendingUp',
      },
      {
        title: 'Scout Consensus',
        description: `${insightsData.consensus.agreementPercentage}% agreement across ${insightsData.consensus.totalReports} reports.`,
        colors: secondaryGradient,
        icon: 'star',
      },
    ];
  }, [insightsData]);

  const activityFeed =
    player?.activity ??
    [
      {
        title: 'Hat-trick vs Barcelona',
        subtitle: 'Champions League • 3 goals, 1 assist',
        date: 'Dec 18, 2024',
        status: 'success',
      },
      {
        title: 'Match vs Sevilla',
        subtitle: 'La Liga • 1 goal, 2 assists',
        date: 'Dec 14, 2024',
        status: 'default',
      },
      {
        title: 'Training Session',
        subtitle: 'Recovery & Tactical',
        date: 'Dec 10, 2024',
        status: 'muted',
      },
    ];

  const quickChips = [
    player?.position,
    player?.status === 'PROSPECT' ? 'Rising Star' : player?.status,
    age ? `Age ${age}` : null,
    player?.preferredFoot ? `${player.preferredFoot} Foot` : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!player?.id) return;
    trackRecentPlayer({
      id: player.id,
      fullName: playerDisplayName,
      position: player.position,
      clubName: player?.club?.name,
      photoUrl: player.photoUrl || player?.user?.avatar,
      lastViewedAt: new Date().toISOString(),
    });
  }, [
    player?.club?.name,
    player?.id,
    player?.photoUrl,
    player?.position,
    player?.user?.avatar,
    playerDisplayName,
  ]);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !player) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrowBack" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Icon name="alert" size={48} color={colors.text.secondary} />
          <Text style={styles.errorText}>{error || 'Player not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.background.secondary, colors.background.primary]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name='arrowBack' size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Icon name='ellipsisVertical' size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBody}>
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.accent]}
              style={styles.heroAvatar}
            >
              {clubLogo ? (
                <Image source={{ uri: clubLogo }} style={styles.heroClubLogo} />
              ) : (
                <Text style={styles.heroInitial}>
                  {playerDisplayName.charAt(0) || 'P'}
                </Text>
              )}
            </LinearGradient>

            {heroRating && (
              <View style={styles.heroRatingBadge}>
                <Text style={styles.heroRatingValue}>{heroRating}</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{playerDisplayName}</Text>
          <View style={styles.heroMetaRow}>
            <Icon name="location" size={16} color={colors.text.secondary} />
            <Text style={styles.heroMetaText}>{player?.club?.name || 'Free Agent'}</Text>
            {flagUrl && <Image source={{ uri: flagUrl }} style={styles.heroFlag} />}
            {player?.nationality && (
              <Text style={styles.heroMetaText}>{player.nationality}</Text>
            )}
          </View>

          <View style={styles.chipRow}>
            {quickChips.map((chip) => (
              <View key={chip} style={styles.heroChip}>
                <Text style={styles.heroChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.noteCard}>
          <Text style={styles.noteLabel}>✨ Highlight</Text>
          <Text style={styles.noteText}>
            Hero background supports parallax and blur effects as user scrolls.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Performance Score</Text>
        <View style={styles.scoreRow}>
          {performanceScores.map((score) => (
            <View key={score.label} style={styles.scoreCircle}>
              <View style={styles.scoreRing}>
                <Text style={styles.scoreValue}>{score.value}</Text>
              </View>
              <Text style={styles.scoreLabel}>{score.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.noteCard, styles.noteCardPurple]}>
          <Text style={styles.noteLabel}>Animation</Text>
          <Text style={styles.noteText}>
            Rings glow on 90+ ratings and animate on scroll reveal.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Season Stats 2024/25</Text>
        <View style={styles.statGrid}>
          {seasonHighlights.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Icon name={stat.icon} size={18} color={colors.brand.accent} />
                <Text style={styles.statDelta}>{stat.delta}</Text>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        </View>
        {insightsLoading && (
          <Text style={styles.insightsStatus}>Syncing latest AI context…</Text>
        )}
        {insightsNotice && (
          <Text style={styles.insightsStatus}>{insightsNotice}</Text>
        )}
        {insightsError && (
          <Text style={[styles.insightsStatus, styles.insightsStatusError]}>
            {insightsError}
          </Text>
        )}
        {insightsCards.map((card) => (
          <LinearGradient
            key={card.title}
            colors={card.colors}
            style={styles.insightCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.insightIcon}>
              <Icon name={card.icon} size={18} color={colors.background.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{card.title}</Text>
              <Text style={styles.insightDescription}>{card.description}</Text>
            </View>
          </LinearGradient>
        ))}

        <Text style={styles.sectionTitle}>Connected Devices</Text>
        <View style={styles.deviceGrid}>
          <TouchableOpacity
            style={styles.deviceCard}
            onPress={() =>
              navigation.navigate('HardwareSessions', { playerId, playerName: playerDisplayName })
            }
          >
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIcon}>
                <Icon name="foot" size={18} color={colors.brand.primary} />
              </View>
              <Text style={styles.deviceTitle}>GPS Tracker</Text>
            </View>
            <Text style={styles.deviceMetric}>
              {hardwareLoading
                ? 'Loading...'
                : hardwareSummary?.sessionCount
                ? `${hardwareSummary.sessionCount} sessions`
                : 'No sessions yet'}
            </Text>
            <Text style={styles.deviceMeta}>
              {hardwareSummary?.lastSessionAt
                ? `Last: ${formatDate(hardwareSummary.lastSessionAt)}`
                : 'Tap to view sessions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deviceCard}
            onPress={() => navigation.navigate('QCBand')}
          >
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIcon}>
                <Icon name="fitness" size={18} color={colors.brand.primary} />
              </View>
              <Text style={styles.deviceTitle}>QC Band</Text>
            </View>
            <Text style={styles.deviceMetric}>Live HR + Steps</Text>
            <Text style={styles.deviceMeta}>Connect bracelet to sync</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {activityFeed.map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.activityItem}>
              <View
                style={[
                  styles.activityIndicator,
                  item.status === 'success' && styles.activityIndicatorSuccess,
                  item.status === 'muted' && styles.activityIndicatorMuted,
                ]}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.activityDate}>{item.date}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <LinearGradient colors={[colors.brand.primary, colors.brand.accent]} style={styles.primaryAction}>
            <TouchableOpacity
              style={styles.primaryActionContent}
              onPress={() => navigation.navigate('PlayerPassport', { playerId, player })}
            >
              <Icon name="star" size={18} color={colors.background.primary} style={styles.actionButtonIcon} />
              <Text style={styles.primaryActionText}>Add to Watchlist</Text>
            </TouchableOpacity>
          </LinearGradient>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('CreateReport', { playerId })}
          >
            <Icon name="analytics" size={18} color={colors.text.primary} style={styles.actionButtonIcon} />
            <Text style={styles.secondaryActionText}>Generate Full Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tertiaryAction}
            onPress={() => navigation.navigate('PlayerHighlights', { playerId, mode: 'adminView' })}
          >
            <Icon name="videocam" size={18} color={colors.brand.primary} style={styles.actionButtonIcon} />
            <Text style={styles.tertiaryActionText}>Vidéos</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.background.primary,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    borderRadius: 32,
    padding: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroAvatar: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroClubLogo: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: 16,
    backgroundColor: colors.text.primary,
  },
  heroInitial: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.background.primary,
  },
  heroRatingBadge: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 24,
  },
  heroRatingValue: {
    fontSize: 40,
    color: colors.text.primary,
    fontWeight: '700',
  },
  heroName: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.h2,
    fontWeight: '700',
    color: colors.text.primary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heroFlag: {
    width: 24,
    height: 16,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  heroMetaText: {
    color: colors.text.secondary,
  },
  heroMetaSeparator: {
    color: colors.text.tertiary,
    marginHorizontal: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.lg,
  },
  heroChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  heroChipText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  noteCardPurple: {
    backgroundColor: colors.surface.glassMedium,
  },
  noteLabel: {
    color: colors.brand.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  noteText: {
    color: colors.text.primary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  scoreCircle: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 6,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scoreLabel: {
    color: colors.text.secondary,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.surface.border,
    padding: spacing.lg,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statDelta: {
    color: colors.brand.accent,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  statLabel: {
    color: colors.text.secondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  premiumBadge: {
    backgroundColor: colors.brand.primary + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  premiumText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  insightsStatus: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  insightsStatusError: {
    color: colors.semantic.error,
  },
  insightCard: {
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.background.primary,
  },
  insightDescription: {
    color: colors.background.primary,
    marginTop: spacing.xs,
  },
  activityList: {
    borderRadius: 24,
    backgroundColor: colors.surface.glass,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  activityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text.secondary,
    marginRight: spacing.md,
    marginTop: spacing.sm,
  },
  activityIndicatorSuccess: {
    backgroundColor: colors.semantic.success,
  },
  activityIndicatorMuted: {
    backgroundColor: colors.text.tertiary,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  activitySubtitle: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  activityDate: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  deviceGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  deviceCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  deviceMetric: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deviceMeta: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  primaryAction: {
    borderRadius: 20,
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  primaryActionText: {
    color: colors.background.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },
  secondaryAction: {
    borderRadius: 20,
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  secondaryActionText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
  tertiaryAction: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: 'transparent',
  },
  tertiaryActionText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '600',
  },
  actionButtonIcon: {
    marginRight: spacing.sm,
  },
});
