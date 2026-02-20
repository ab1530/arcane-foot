/**
 * ARCANE DASHBOARD SCREEN
 * Premium mobile dashboard with world-class UX
 *
 * Features:
 * - Hero section with personalized greeting and XP progress
 * - 2x2 stat cards grid with trend indicators
 * - Quick actions horizontal scroll
 * - Recent activity list
 * - AI insights card with visualization
 * - Today's challenge with gamification
 * - Upcoming matches list
 * - Pull-to-refresh functionality
 * - Smooth scroll animations
 * - Loading states
 *
 * @version 2.0.0
 * @design Arcane Design System 2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../design/tokens';
import { typographyPresets as typography } from '../../design/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import api from '../../services/api';
import { logError } from '../../utils/logger';
import { StatCard, QuickActionCard, ActivityItem } from './components';
import type { HardwareSession } from '../../types/hardware';
import type { MobileHomeDashboardResponse, Player } from '../../types';
import { DEFAULT_ROLE, isCategoryARole } from '../../lib/roles';
import type { UserRole } from '../../lib/roles';
import { isFeatureEnabled } from '../../constants/features';
import { qcBand, formatBatteryPercent, formatDistanceKm } from '../../services/wearables/qcBand';

type DashboardCardMetricKey =
  | 'reports'
  | 'players'
  | 'calendar'
  | 'transfermarkt'
  | 'scouts'
  | 'agentRequests';

type DashboardCardDescriptor = {
  key: DashboardCardMetricKey;
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  target?: string;
  trendValue: string;
  trendLabel: string;
};

const NON_PLAYER_CARD_MATRIX: Record<UserRole, DashboardCardMetricKey[]> = {
  SUPER_ADMIN: ['calendar', 'transfermarkt', 'players', 'scouts'],
  ADMIN: ['calendar', 'transfermarkt', 'players', 'scouts'],
  SCOUT: ['reports', 'players', 'calendar', 'agentRequests'],
  AGENT: ['reports', 'players', 'calendar', 'agentRequests'],
  ANALYST: ['reports', 'players', 'calendar', 'agentRequests'],
  CLUB_CONTACT: ['reports', 'players', 'calendar', 'agentRequests'],
  PLAYER: ['reports', 'players', 'calendar', 'agentRequests'],
  PUBLIC: ['reports', 'players', 'calendar', 'agentRequests'],
};

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
  totalReports: number;
  playersScouted: number;
  matchesAttended: number;
  openDemandRequests: number;
  totalXP: number;
}

interface Activity {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;
}

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
}

type BraceletStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'error';

interface PlayerPerformanceSummary {
  totalDistanceM: number;
  totalDurationMin: number;
  maxSpeedKmh: number;
}

const EMPTY_PLAYER_SUMMARY: PlayerPerformanceSummary = {
  totalDistanceM: 0,
  totalDurationMin: 0,
  maxSpeedKmh: 0,
};

const computeAgeFromDate = (dateOfBirth?: string | null): number | null => {
  if (!dateOfBirth) {
    return null;
  }
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age > 0 ? age : null;
};

const computePlayerPerformance = (sessions: HardwareSession[]): PlayerPerformanceSummary => {
  return sessions.reduce<PlayerPerformanceSummary>(
    (accumulator, session) => {
      const metrics = session.metrics || {};
      return {
        totalDistanceM: accumulator.totalDistanceM + (metrics.movementDistanceM ?? 0),
        totalDurationMin: accumulator.totalDurationMin + (metrics.totalTimeMin ?? 0),
        maxSpeedKmh: Math.max(accumulator.maxSpeedKmh, metrics.maxSpeedKmh ?? 0),
      };
    },
    { ...EMPTY_PLAYER_SUMMARY },
  );
};

const formatDistance = (distanceM: number) => `${(distanceM / 1000).toFixed(1)} km`;
const formatDuration = (durationMin: number) => `${Math.round(durationMin)} min`;
const formatSpeed = (speedKmh: number) => `${speedKmh.toFixed(1)} km/h`;
const formatLastSync = (value?: string | null) =>
  value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

const resolveCollectionTotal = (payload: any): number | null => {
  if (!payload) return null;
  if (typeof payload?.meta?.total === 'number') return payload.meta.total;
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.data)) return payload.data.length;
  if (Array.isArray(payload?.items)) return payload.items.length;
  return null;
};

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

// ============================================================================
// DASHBOARD SCREEN COMPONENT
// ============================================================================

export const DashboardScreen = ({ navigation }: any) => {
  const { user, activeRole } = useAuth();
  const { dictionary, t } = useLocalization();
  const dashboardCopy = dictionary.dashboard;
  const playerCopy = dashboardCopy.player;
  const effectiveRole = (activeRole ?? user?.role ?? DEFAULT_ROLE) as UserRole;
  const isPlayerRole = effectiveRole === 'PLAYER';
  const isAdminRole = isCategoryARole(effectiveRole);
  const showLevelBar = false; // Demo: remove gamification "level/XP" bar from dashboard
  const showDailyChallenge = false; // Demo: remove "defi du jour"
  const playerDashboardV2Enabled = isFeatureEnabled('playerDashboardV2');
  const braceletCardEnabled = isFeatureEnabled('playerBraceletCard');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clubNeedsCount, setClubNeedsCount] = useState<number | null>(null);
  const [marketRequestsCount, setMarketRequestsCount] = useState<number | null>(null);
  const [scoutsCount, setScoutsCount] = useState<number | null>(null);
  const [mobileHome, setMobileHome] = useState<MobileHomeDashboardResponse | null>(null);

  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    playersScouted: 0,
    matchesAttended: 0,
    openDemandRequests: 0,
    totalXP: 0,
  });

  const [userLevel, setUserLevel] = useState({
    level: 1,
    currentXP: 0,
    nextLevelXP: 1000,
  });

  const [recentActivities, setRecentActivities] = useState<Activity[]>(
    dashboardCopy.activity.samples,
  );

  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>(
    dashboardCopy.matches.samples,
  );
  const [playerSessions, setPlayerSessions] = useState<HardwareSession[]>([]);
  const [playerSummary, setPlayerSummary] =
    useState<PlayerPerformanceSummary>(EMPTY_PLAYER_SUMMARY);
  const [playerProfile, setPlayerProfile] = useState<Partial<Player> | null>(null);
  const [braceletStatus, setBraceletStatus] = useState<BraceletStatus>('unsupported');
  const [braceletBatteryPercent, setBraceletBatteryPercent] = useState<number | undefined>();
  const [braceletSteps, setBraceletSteps] = useState<number | undefined>();
  const [braceletDistanceKm, setBraceletDistanceKm] = useState<string | undefined>();
  const [braceletHr, setBraceletHr] = useState<number | null>(null);
  const [braceletLastSync, setBraceletLastSync] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const handleApiFailure = useCallback((error: unknown, scope: string) => {
    logError('Error fetching dashboard data', error, { screen: 'DashboardScreen', scope });
  }, []);

  const resetBraceletMetrics = useCallback(() => {
    setBraceletBatteryPercent(undefined);
    setBraceletSteps(undefined);
    setBraceletDistanceKm(undefined);
    setBraceletHr(null);
    setBraceletLastSync(null);
  }, []);

  const refreshBraceletMetrics = useCallback(async () => {
    if (!braceletCardEnabled) {
      return;
    }
    if (Platform.OS !== 'ios') {
      setBraceletStatus('unsupported');
      return;
    }

    try {
      const [battery, currentSteps, todayStats] = await Promise.all([
        withTimeout(qcBand.getBattery(), 2000, 'Battery timeout'),
        withTimeout(qcBand.getCurrentSteps(), 2000, 'Steps timeout'),
        withTimeout(qcBand.getTodayStats(), 2000, 'Today stats timeout'),
      ]);

      setBraceletBatteryPercent(
        formatBatteryPercent(battery?.level) ?? battery?.percent ?? undefined,
      );
      setBraceletSteps(currentSteps?.steps ?? todayStats?.steps ?? undefined);
      const distanceSource = todayStats?.distanceM ?? currentSteps?.distanceM ?? 0;
      setBraceletDistanceKm(formatDistanceKm(distanceSource));
      setBraceletStatus('connected');
      setBraceletLastSync(new Date().toISOString());
    } catch (error) {
      handleApiFailure(error, 'playerDashboard.bracelet.refresh');
      setBraceletStatus('error');
    }
  }, [braceletCardEnabled, handleApiFailure]);

  const bootstrapBraceletCard = useCallback(async () => {
    if (!braceletCardEnabled) {
      return;
    }
    if (Platform.OS !== 'ios') {
      setBraceletStatus('unsupported');
      return;
    }
    try {
      const lastSeen = await withTimeout(
        qcBand.getLastSeenDevice(),
        1200,
        'Last seen device timeout',
      );
      if (!lastSeen?.id) {
        setBraceletStatus('disconnected');
        return;
      }
      setBraceletStatus('disconnected');
    } catch (error) {
      handleApiFailure(error, 'playerDashboard.bracelet.bootstrap');
      setBraceletStatus('error');
    }
  }, [braceletCardEnabled, handleApiFailure]);

  const connectBracelet = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return;
    }
    setBraceletStatus('connecting');
    try {
      await withTimeout(qcBand.connectLastSeen(), 2000, 'Connect last seen timeout');
      await refreshBraceletMetrics();
    } catch (error) {
      handleApiFailure(error, 'playerDashboard.bracelet.connect');
      setBraceletStatus('error');
    }
  }, [refreshBraceletMetrics, handleApiFailure]);

  const fetchDashboardData = async () => {
    try {
      if (isPlayerRole) {
        setMobileHome(null);
        const currentPlayerId = user?.playerId;
        if (!currentPlayerId) {
          setPlayerSessions([]);
          setPlayerSummary(EMPTY_PLAYER_SUMMARY);
          setPlayerProfile(null);
          if (braceletCardEnabled) {
            if (Platform.OS === 'ios') {
              setBraceletStatus('disconnected');
            } else {
              setBraceletStatus('unsupported');
            }
            resetBraceletMetrics();
          }
          return;
        }

        const [playerData, sessions] = await Promise.all([
          api.getPlayer(currentPlayerId).catch(error => {
            handleApiFailure(error, 'getPlayer');
            return null;
          }),
          api.getHardwareSessions(currentPlayerId).catch(error => {
            handleApiFailure(error, 'getHardwareSessions');
            return [] as HardwareSession[];
          }),
        ]);

        const safeSessions = Array.isArray(sessions) ? sessions : [];
        setPlayerProfile(playerData);
        setPlayerSessions(safeSessions);
        setPlayerSummary(computePlayerPerformance(safeSessions));
        if (braceletCardEnabled) {
          await bootstrapBraceletCard();
        }
        return;
      }

      const mobileScope =
        effectiveRole === 'SUPER_ADMIN' ||
        effectiveRole === 'ADMIN' ||
        effectiveRole === 'AGENT' ||
        effectiveRole === 'SCOUT'
          ? effectiveRole
          : undefined;

      const [mobileHomeData, overviewData, playersData, reportsData, marketData, scoutsData, clubNeedsData] =
        await Promise.all([
        api.getDashboardMobileHome(mobileScope ? { scope: mobileScope } : undefined).catch(error => {
          handleApiFailure(error, 'getDashboardMobileHome');
          return null;
        }),
        api.getDashboardStats().catch(error => {
          handleApiFailure(error, 'getDashboardStats');
          return null;
        }),
        api.getPlayers().catch(error => {
          handleApiFailure(error, 'getPlayers');
          return { items: [], data: [] };
        }),
        api.getReports().catch(error => {
          handleApiFailure(error, 'getReports');
          return { items: [], data: [] };
        }),
        (api as any).getMarket?.({ limit: 1 }).catch((error: any) => {
          handleApiFailure(error, 'getMarket');
          return null;
        }),
        (api as any).getUsers?.({ role: 'SCOUT', page: 1, limit: 1 }).catch((error: any) => {
          handleApiFailure(error, 'getUsers');
          return null;
        }),
        isAdminRole
          ? (api as any).listClubNeedRequests(1, 1).catch((error: any) => {
              handleApiFailure(error, 'listClubNeedRequests');
              return null;
            })
          : Promise.resolve(null),
      ]);

      const players = playersData?.items ?? playersData?.data ?? [];
      const reports = reportsData?.items ?? reportsData?.data ?? [];
      setMobileHome(mobileHomeData);

      const cardsById = new Map((mobileHomeData?.cards ?? []).map((card) => [card.id, card]));
      const reportsCard = cardsById.get('reports');
      const playersCard = cardsById.get('playersScouted');
      const calendarCard = cardsById.get('calendar');
      const requestsCard = cardsById.get('agentRequests');

      setMarketRequestsCount(
        mobileHomeData?.pending?.clubRequests ?? resolveCollectionTotal(marketData),
      );
      setScoutsCount(
        mobileHomeData?.meta?.totalScouts ?? resolveCollectionTotal(scoutsData),
      );
      setClubNeedsCount(
        isAdminRole
          ? mobileHomeData?.pending?.clubRequests ?? resolveCollectionTotal(clubNeedsData)
          : null,
      );

      setStats({
        totalReports: reportsCard?.value ?? overviewData?.totalReports ?? reports.length,
        playersScouted:
          playersCard?.value ?? overviewData?.playersScouted ?? overviewData?.totalPlayers ?? players.length,
        matchesAttended:
          calendarCard?.value ?? overviewData?.matchesAttended ?? Math.floor(reports.length * 0.8),
        openDemandRequests:
          requestsCard?.value ?? mobileHomeData?.pending?.agentRequests ?? overviewData?.openDemandRequests ?? 0,
        totalXP: overviewData?.totalXP ?? reports.length * 100 + players.length * 50,
      });

      // Calculate user level based on XP
      const totalXP = reports.length * 100 + players.length * 50;
      const level = Math.floor(totalXP / 1000) + 1;
      const currentXP = totalXP % 1000;
      const nextLevelXP = 1000;

      setUserLevel({ level, currentXP, nextLevelXP });
    } catch (error) {
      logError('Error fetching dashboard data', error, { screen: 'DashboardScreen' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [
    isPlayerRole,
    isAdminRole,
    effectiveRole,
    user?.playerId,
    braceletCardEnabled,
    bootstrapBraceletCard,
    resetBraceletMetrics,
  ]);

  useEffect(() => {
    if (!isPlayerRole || !braceletCardEnabled || Platform.OS !== 'ios') {
      return;
    }
    const subscription = qcBand.addHeartRateListener((bpm) => {
      setBraceletHr(bpm);
    });
    return () => {
      subscription.remove();
    };
  }, [isPlayerRole, braceletCardEnabled]);

  const displayName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    }
    return t('dashboard.hero.defaultName');
  }, [t, user?.firstName, user?.lastName]);

  const avatarFallback = useMemo(
    () =>
      user?.firstName?.charAt(0) ||
      user?.lastName?.charAt(0) ||
      t('profile.fallbacks.avatarInitial'),
    [t, user?.firstName, user?.lastName],
  );

  const playerPosition = useMemo(
    () => playerProfile?.position || (user as any)?.position || null,
    [playerProfile?.position, user],
  );

  const playerAge = useMemo(() => {
    const fromProfile = computeAgeFromDate(playerProfile?.dateOfBirth ?? null);
    if (fromProfile) {
      return fromProfile;
    }
    return computeAgeFromDate((user as any)?.dateOfBirth ?? null);
  }, [playerProfile?.dateOfBirth, user]);

  const braceletStateCopy = useMemo(() => {
    const fallback = {
      unsupported: 'Live bracelet available on iOS',
      disconnected: 'Bracelet disconnected',
      connecting: 'Connecting...',
      connected: 'Bracelet connected',
      error: 'Bracelet unavailable',
    };
    return {
      unsupported: playerCopy?.braceletStateUnsupported || fallback.unsupported,
      disconnected: playerCopy?.braceletStateDisconnected || fallback.disconnected,
      connecting: playerCopy?.braceletStateConnecting || fallback.connecting,
      connected: playerCopy?.braceletStateConnected || fallback.connected,
      error: playerCopy?.braceletStateError || fallback.error,
    };
  }, [playerCopy]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    if (isPlayerRole && braceletCardEnabled && Platform.OS === 'ios' && braceletStatus === 'connected') {
      await refreshBraceletMetrics();
    }
    setRefreshing(false);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNavigate = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen);
  };

  const quickActions = useMemo(() => {
    if (!isPlayerRole && Array.isArray(mobileHome?.quickActions) && mobileHome.quickActions.length > 0) {
      return mobileHome.quickActions.map((action) => ({
        label: action.label,
        icon: action.icon,
        target: action.target,
        variant: action.variant,
      }));
    }

    const base = Array.isArray(dashboardCopy.quickActions?.items)
      ? [...dashboardCopy.quickActions.items]
      : [];

    const filtered = base.filter((a: any) => a?.target !== 'ClubNeeds');
    if (isPlayerRole) {
      return filtered.slice(0, 3);
    }
    return filtered.slice(0, 3);
  }, [dashboardCopy.quickActions?.items, isPlayerRole, mobileHome?.quickActions]);

  const statCards = useMemo<DashboardCardDescriptor[]>(() => {
    if (isPlayerRole) return [];

    if (Array.isArray(mobileHome?.cards) && mobileHome.cards.length > 0) {
      const iconByCardId: Record<string, keyof typeof Ionicons.glyphMap> = {
        reports: 'document-text',
        playersScouted: 'people',
        calendar: 'calendar',
        agentRequests: 'clipboard-outline',
        transfermarkt: 'briefcase',
        scouts: 'person-add',
      };
      const colorByStatus: Record<string, string> = {
        yellow: tokens.colors.yellow.DEFAULT,
        blue: tokens.colors.brand.primary,
        green: tokens.colors.semantic.success,
        indigo: '#5A82FF',
      };
      const targetByCardId: Record<string, string> = {
        reports: 'Reports',
        playersScouted: 'Players',
        calendar: 'Calendar',
        agentRequests: 'AgentRequests',
        transfermarkt: 'Market',
        scouts: 'GlobalSearch',
      };

      return mobileHome.cards.map((card) => ({
        key:
          card.id === 'playersScouted'
            ? 'players'
            : card.id === 'agentRequests'
            ? 'agentRequests'
            : (card.id as DashboardCardMetricKey),
        title: card.label,
        value: card.value,
        icon: iconByCardId[card.id] ?? 'analytics',
        color: colorByStatus[card.statusColor] ?? tokens.colors.brand.primary,
        target: targetByCardId[card.id],
        trendValue: `+${card.delta}`,
        trendLabel: card.period === 'month' ? 'ce mois-ci' : 'cette semaine',
      }));
    }

    const roleCards =
      NON_PLAYER_CARD_MATRIX[effectiveRole] ?? NON_PLAYER_CARD_MATRIX.SCOUT;

    const roleLabels = dashboardCopy?.stats?.roleCards ?? {};
    const trendCards = Array.isArray(dashboardCopy?.stats?.cards)
      ? dashboardCopy.stats.cards
      : [];
    const trendLabelByKey = trendCards.reduce<Record<string, string>>((acc, item: any) => {
      if (item?.key) {
        acc[item.key] = item?.trendLabel ?? '';
      }
      return acc;
    }, {});

    const cardMap: Record<DashboardCardMetricKey, DashboardCardDescriptor> = {
      reports: {
        key: 'reports',
        title: roleLabels?.reports ?? 'Reports',
        value: stats.totalReports,
        icon: 'document-text',
        color: tokens.colors.yellow.DEFAULT,
        target: 'Reports',
        trendValue: '+12%',
        trendLabel: trendLabelByKey.reports || '',
      },
      players: {
        key: 'players',
        title: roleLabels?.players ?? 'Players scouted',
        value: stats.playersScouted,
        icon: 'people',
        color: tokens.colors.brand.primary,
        target: 'Players',
        trendValue: '+8',
        trendLabel: trendLabelByKey.players || '',
      },
      calendar: {
        key: 'calendar',
        title: roleLabels?.calendar ?? 'Calendar',
        value: stats.matchesAttended,
        icon: 'calendar',
        color: tokens.colors.semantic.success,
        target: 'Calendar',
        trendValue: '+5',
        trendLabel: trendLabelByKey.matches || trendLabelByKey.calendar || '',
      },
      transfermarkt: {
        key: 'transfermarkt',
        title: roleLabels?.transfermarkt ?? 'Transfermarkt',
        value: marketRequestsCount ?? 0,
        icon: 'briefcase',
        color: '#4F7BFF',
        target: 'Market',
        trendValue: `+${marketRequestsCount ?? 0}`,
        trendLabel: trendLabelByKey.transfermarkt || trendLabelByKey.players || '',
      },
      scouts: {
        key: 'scouts',
        title: roleLabels?.scouts ?? 'Scouts',
        value: scoutsCount ?? 0,
        icon: 'person-add',
        color: '#5BE5A8',
        target: 'GlobalSearch',
        trendValue: `+${scoutsCount ?? 0}`,
        trendLabel: trendLabelByKey.scouts || trendLabelByKey.matches || '',
      },
      agentRequests: {
        key: 'agentRequests',
        title: roleLabels?.agentRequests ?? 'Demandes agent',
        value: isAdminRole
          ? clubNeedsCount ?? 0
          : stats.openDemandRequests ?? marketRequestsCount ?? 0,
        icon: 'clipboard-outline',
        color: '#5A82FF',
        target: 'AgentRequests',
        trendValue: `+${
          isAdminRole ? clubNeedsCount ?? 0 : stats.openDemandRequests ?? marketRequestsCount ?? 0
        }`,
        trendLabel: trendLabelByKey.agentRequests || trendLabelByKey.players || '',
      },
    };

    return roleCards.map((key) => cardMap[key]);
  }, [
    clubNeedsCount,
    dashboardCopy?.stats?.cards,
    dashboardCopy?.stats?.roleCards,
    effectiveRole,
    isAdminRole,
    isPlayerRole,
    marketRequestsCount,
    scoutsCount,
    stats.matchesAttended,
    stats.playersScouted,
    stats.totalReports,
    stats.openDemandRequests,
    mobileHome?.cards,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.loadingText}>{dashboardCopy.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const xpProgress = (userLevel.currentXP / userLevel.nextLevelXP) * 100;

  if (isPlayerRole) {
    if (playerDashboardV2Enabled) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView
            testID="dashboard-scroll"
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={tokens.colors.yellow.DEFAULT}
                colors={[tokens.colors.yellow.DEFAULT]}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={[tokens.colors.arcane.charcoal, tokens.colors.arcane.anthracite]}
              style={styles.playerHeroCard}
            >
              <View style={styles.heroHeader}>
                <View style={styles.heroText}>
                  <Text style={styles.greeting}>{dashboardCopy.hero.greeting}</Text>
                  <Text style={styles.userName}>{displayName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={() => handleNavigate('Profile')}
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileInitial}>{avatarFallback}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {showLevelBar ? (
                <View style={styles.xpContainer}>
                  <View style={styles.xpHeader}>
                    <View style={styles.xpLevel}>
                      <Ionicons
                        name="shield"
                        size={tokens.iconSize.sm}
                        color={tokens.colors.yellow.DEFAULT}
                      />
                      <Text style={styles.xpLevelText}>
                        {t('dashboard.hero.level', { level: userLevel.level })}
                      </Text>
                    </View>
                    <Text style={styles.xpText}>
                      {t('dashboard.hero.xp', {
                        current: userLevel.currentXP,
                        next: userLevel.nextLevelXP,
                      })}
                    </Text>
                  </View>
                  <View style={styles.xpBar}>
                    <View style={[styles.xpProgress, { width: `${xpProgress}%` }]} />
                  </View>
                </View>
              ) : null}

              <View style={styles.playerTagRow}>
                <View style={styles.playerTag}>
                  <Text style={styles.playerTagLabel}>{playerCopy?.profilePositionLabel || 'Position'}</Text>
                  <Text style={styles.playerTagValue}>
                    {playerPosition ?? (playerCopy?.notProvided || 'Not provided')}
                  </Text>
                </View>
                <View style={styles.playerTag}>
                  <Text style={styles.playerTagLabel}>{playerCopy?.profileAgeLabel || 'Age'}</Text>
                  <Text style={styles.playerTagValue}>
                    {playerAge ? String(playerAge) : playerCopy?.notProvided || 'Not provided'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{playerCopy?.profileTitle || 'Profile summary'}</Text>
              <View style={styles.playerSummaryCard}>
                <View style={styles.playerSummaryRow}>
                  <Text style={styles.playerSummaryLabel}>
                    {playerCopy?.profileNameLabel || 'Name'}
                  </Text>
                  <Text style={styles.playerSummaryValue}>{displayName}</Text>
                </View>
                <View style={styles.playerSummaryRow}>
                  <Text style={styles.playerSummaryLabel}>
                    {playerCopy?.profilePositionLabel || 'Position'}
                  </Text>
                  <Text style={styles.playerSummaryValue}>
                    {playerPosition ?? (playerCopy?.notProvided || 'Not provided')}
                  </Text>
                </View>
                <View style={styles.playerSummaryRow}>
                  <Text style={styles.playerSummaryLabel}>
                    {playerCopy?.profileAgeLabel || 'Age'}
                  </Text>
                  <Text style={styles.playerSummaryValue}>
                    {playerAge ? String(playerAge) : playerCopy?.notProvided || 'Not provided'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{playerCopy?.performanceTitle || 'Performance'}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('HardwareSessions', {
                      playerId: user?.playerId,
                      playerName: displayName,
                    })
                  }
                >
                  <Text style={styles.viewAllLink}>
                    {playerCopy?.viewSessionsCta || 'View sessions'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.playerPerformanceGrid}>
                <LinearGradient
                  colors={[tokens.colors.arcane.charcoal, tokens.colors.arcane.anthracite]}
                  style={styles.playerMetricCard}
                >
                  <Text style={styles.playerMetricLabel}>
                    {playerCopy?.distanceLabel || 'Distance'}
                  </Text>
                  <Text style={styles.playerMetricValue}>
                    {formatDistance(playerSummary.totalDistanceM)}
                  </Text>
                </LinearGradient>
                <LinearGradient
                  colors={[tokens.colors.arcane.charcoal, tokens.colors.arcane.anthracite]}
                  style={styles.playerMetricCard}
                >
                  <Text style={styles.playerMetricLabel}>
                    {playerCopy?.durationLabel || 'Duration'}
                  </Text>
                  <Text style={styles.playerMetricValue}>
                    {formatDuration(playerSummary.totalDurationMin)}
                  </Text>
                </LinearGradient>
                <LinearGradient
                  colors={[tokens.colors.arcane.charcoal, tokens.colors.arcane.anthracite]}
                  style={styles.playerMetricCard}
                >
                  <Text style={styles.playerMetricLabel}>
                    {playerCopy?.maxSpeedLabel || 'Max speed'}
                  </Text>
                  <Text style={styles.playerMetricValue}>
                    {formatSpeed(playerSummary.maxSpeedKmh)}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            {braceletCardEnabled && (
              <View style={styles.section}>
                <LinearGradient
                  colors={[tokens.colors.arcane.charcoal, tokens.colors.feature.ai + '20']}
                  style={styles.braceletCard}
                >
                  <View style={styles.braceletHeader}>
                    <View>
                      <Text style={styles.braceletTitle}>
                        {playerCopy?.braceletTitle || 'QC Band bracelet'}
                      </Text>
                      <Text style={styles.braceletStatusText}>{braceletStateCopy[braceletStatus]}</Text>
                    </View>
                    <View style={styles.braceletPill}>
                      <Text style={styles.braceletPillText}>
                        {Platform.OS === 'ios'
                          ? playerCopy?.braceletIosLabel || 'iOS Live'
                          : playerCopy?.braceletIosOnlyLabel || 'iOS only'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.braceletMetricsRow}>
                    <View style={styles.braceletMetric}>
                      <Text style={styles.braceletMetricLabel}>
                        {playerCopy?.braceletBatteryLabel || 'Battery'}
                      </Text>
                      <Text style={styles.braceletMetricValue}>
                        {braceletBatteryPercent !== undefined ? `${braceletBatteryPercent}%` : '--'}
                      </Text>
                    </View>
                    <View style={styles.braceletMetric}>
                      <Text style={styles.braceletMetricLabel}>
                        {playerCopy?.braceletStepsLabel || 'Steps'}
                      </Text>
                      <Text style={styles.braceletMetricValue}>
                        {braceletSteps !== undefined ? braceletSteps.toLocaleString() : '--'}
                      </Text>
                    </View>
                    <View style={styles.braceletMetric}>
                      <Text style={styles.braceletMetricLabel}>
                        {playerCopy?.braceletDistanceLabel || 'Distance'}
                      </Text>
                      <Text style={styles.braceletMetricValue}>{braceletDistanceKm ?? '--'}</Text>
                    </View>
                  </View>

                  <View style={styles.braceletFooter}>
                    <Text style={styles.braceletHint}>
                      {playerCopy?.braceletHrLabel || 'HR'}: {braceletHr ?? '--'} ·{' '}
                      {playerCopy?.braceletLastSyncLabel || 'Sync'}: {formatLastSync(braceletLastSync)}
                    </Text>
                    <View style={styles.braceletActions}>
                      {Platform.OS === 'ios' ? (
                        <>
                          {braceletStatus === 'connected' ? (
                            <TouchableOpacity style={styles.braceletActionBtn} onPress={refreshBraceletMetrics}>
                              <Text style={styles.braceletActionText}>
                                {playerCopy?.braceletRefreshCta || 'Refresh'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.braceletActionBtn}
                              onPress={connectBracelet}
                              disabled={braceletStatus === 'connecting'}
                            >
                              <Text style={styles.braceletActionText}>
                                {braceletStatus === 'connecting'
                                  ? playerCopy?.braceletConnectingCta || 'Connecting...'
                                  : playerCopy?.braceletConnectCta || 'Connect'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.braceletActionBtn, styles.braceletActionBtnSecondary]}
                            onPress={() => navigation.navigate('QCBand')}
                          >
                            <Text style={styles.braceletActionTextSecondary}>
                              {playerCopy?.braceletOpenCta || 'Open bracelet'}
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={[styles.braceletActionBtn, styles.braceletActionBtnSecondary]}
                          onPress={() =>
                            navigation.navigate('HardwareSessions', {
                              playerId: user?.playerId,
                              playerName: displayName,
                            })
                          }
                        >
                          <Text style={styles.braceletActionTextSecondary}>
                            {playerCopy?.braceletAndroidCta || 'View sessions'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{playerCopy?.sessionsTitle || 'Training sessions'}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('HardwareSessions', {
                      playerId: user?.playerId,
                      playerName: displayName,
                    })
                  }
                >
                  <Text style={styles.viewAllLink}>{playerCopy?.viewAllLabel || 'View all'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.playerSessionsCard}>
                {playerSessions.length === 0 ? (
                  <Text style={styles.playerEmptyText}>
                    {playerCopy?.emptySessions || 'No sessions available'}
                  </Text>
                ) : (
                  playerSessions.slice(0, 5).map((session) => (
                    <View key={session.id} style={styles.playerSessionItem}>
                      <View style={styles.playerSessionHeader}>
                        <Text style={styles.playerSessionType}>{session.type.toUpperCase()}</Text>
                        <Text style={styles.playerSessionDate}>
                          {new Date(session.startedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.playerSessionStats}>
                        {formatDistance(session.metrics?.movementDistanceM ?? 0)} •{' '}
                        {formatDuration(session.metrics?.totalTimeMin ?? 0)} •{' '}
                        {formatSpeed(session.metrics?.maxSpeedKmh ?? 0)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={styles.playerBottomActions}>
              <TouchableOpacity
                style={styles.playerBottomActionPrimary}
                onPress={() =>
                  navigation.navigate('HardwareSessions', {
                    playerId: user?.playerId,
                    playerName: displayName,
                  })
                }
              >
                <Ionicons
                  name="pulse-outline"
                  size={tokens.iconSize.sm}
                  color={tokens.colors.arcane.black}
                />
                <Text style={styles.playerBottomActionPrimaryText}>
                  {playerCopy?.viewSessionsCta || 'View sessions'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playerBottomActionSecondary}
                onPress={() => navigation.navigate('QCBand')}
              >
                <Ionicons
                  name="watch-outline"
                  size={tokens.iconSize.sm}
                  color={tokens.colors.gray[100]}
                />
                <Text style={styles.playerBottomActionSecondaryText}>
                  {playerCopy?.braceletOpenCta || 'Open bracelet'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          testID="dashboard-scroll"
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.yellow.DEFAULT}
              colors={[tokens.colors.yellow.DEFAULT]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroHeader}>
              <View style={styles.heroText}>
                <Text style={styles.greeting}>{dashboardCopy.hero.greeting}</Text>
                <Text style={styles.userName}>{displayName}</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={() => handleNavigate('Profile')}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitial}>{avatarFallback}</Text>
                </View>
              </TouchableOpacity>
            </View>
            {showLevelBar ? (
              <View style={styles.xpContainer}>
                <View style={styles.xpHeader}>
                  <View style={styles.xpLevel}>
                    <Ionicons
                      name="shield"
                      size={tokens.iconSize.sm}
                      color={tokens.colors.yellow.DEFAULT}
                    />
                    <Text style={styles.xpLevelText}>
                      {t('dashboard.hero.level', { level: userLevel.level })}
                    </Text>
                  </View>
                  <Text style={styles.xpText}>
                    {t('dashboard.hero.xp', {
                      current: userLevel.currentXP,
                      next: userLevel.nextLevelXP,
                    })}
                  </Text>
                </View>
                <View style={styles.xpBar}>
                  <View style={[styles.xpProgress, { width: `${xpProgress}%` }]} />
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{playerCopy?.profileTitle || 'Profile summary'}</Text>
            <View style={styles.playerSummaryCard}>
              <View style={styles.playerSummaryRow}>
                <Text style={styles.playerSummaryLabel}>
                  {playerCopy?.profileNameLabel || 'Name'}
                </Text>
                <Text style={styles.playerSummaryValue}>{displayName}</Text>
              </View>
              <View style={styles.playerSummaryRow}>
                <Text style={styles.playerSummaryLabel}>
                  {playerCopy?.profilePositionLabel || 'Position'}
                </Text>
                <Text style={styles.playerSummaryValue}>
                  {playerPosition ?? (playerCopy?.notProvided || 'Not provided')}
                </Text>
              </View>
              <View style={styles.playerSummaryRow}>
                <Text style={styles.playerSummaryLabel}>{playerCopy?.profileAgeLabel || 'Age'}</Text>
                <Text style={styles.playerSummaryValue}>
                  {playerAge ? String(playerAge) : playerCopy?.notProvided || 'Not provided'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{playerCopy?.performanceTitle || 'Performance'}</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('HardwareSessions', {
                    playerId: user?.playerId,
                    playerName: displayName,
                  })
                }
              >
                <Text style={styles.viewAllLink}>
                  {playerCopy?.viewSessionsCta || 'View sessions'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.playerPerformanceGrid}>
              <View style={styles.playerMetricCard}>
                <Text style={styles.playerMetricLabel}>
                  {playerCopy?.distanceLabel || 'Distance'}
                </Text>
                <Text style={styles.playerMetricValue}>
                  {formatDistance(playerSummary.totalDistanceM)}
                </Text>
              </View>
              <View style={styles.playerMetricCard}>
                <Text style={styles.playerMetricLabel}>
                  {playerCopy?.durationLabel || 'Duration'}
                </Text>
                <Text style={styles.playerMetricValue}>
                  {formatDuration(playerSummary.totalDurationMin)}
                </Text>
              </View>
              <View style={styles.playerMetricCard}>
                <Text style={styles.playerMetricLabel}>
                  {playerCopy?.maxSpeedLabel || 'Max speed'}
                </Text>
                <Text style={styles.playerMetricValue}>
                  {formatSpeed(playerSummary.maxSpeedKmh)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{playerCopy?.sessionsTitle || 'Training sessions'}</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('HardwareSessions', {
                    playerId: user?.playerId,
                    playerName: displayName,
                  })
                }
              >
                <Text style={styles.viewAllLink}>
                  {playerCopy?.viewAllLabel || 'View all'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.playerSessionsCard}>
              {playerSessions.length === 0 ? (
                <Text style={styles.playerEmptyText}>
                  {playerCopy?.emptySessions || 'No sessions available'}
                </Text>
              ) : (
                playerSessions.slice(0, 5).map((session) => (
                  <View key={session.id} style={styles.playerSessionItem}>
                    <View style={styles.playerSessionHeader}>
                      <Text style={styles.playerSessionType}>{session.type.toUpperCase()}</Text>
                      <Text style={styles.playerSessionDate}>
                        {new Date(session.startedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.playerSessionStats}>
                      {formatDistance(session.metrics?.movementDistanceM ?? 0)} • {formatDuration(session.metrics?.totalTimeMin ?? 0)} • {formatSpeed(session.metrics?.maxSpeedKmh ?? 0)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.lastSection} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        testID="dashboard-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.yellow.DEFAULT}
            colors={[tokens.colors.yellow.DEFAULT]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================ */}
        {/* HERO SECTION */}
        {/* ================================================================ */}
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.greeting}>{dashboardCopy.hero.greeting}</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => handleNavigate('Profile')}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>{avatarFallback}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {showLevelBar ? (
            <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                <View style={styles.xpLevel}>
                  <Ionicons
                    name="shield"
                    size={tokens.iconSize.sm}
                    color={tokens.colors.yellow.DEFAULT}
                  />
                  <Text style={styles.xpLevelText}>
                    {t('dashboard.hero.level', { level: userLevel.level })}
                  </Text>
                </View>
                <Text style={styles.xpText}>
                  {t('dashboard.hero.xp', {
                    current: userLevel.currentXP,
                    next: userLevel.nextLevelXP,
                  })}
                </Text>
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpProgress, { width: `${xpProgress}%` }]} />
              </View>
            </View>
          ) : null}
        </View>

        {/* ================================================================ */}
        {/* STAT CARDS GRID (2x2) */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            {statCards.map((meta) => {
              const trend = {
                direction: 'up' as const,
                value: meta.trendValue,
                label: meta.trendLabel,
              };
              return (
                <View style={styles.statCardWrapper} key={meta.key}>
                  <StatCard
                    title={meta.title}
                    value={meta.value}
                    icon={meta.icon}
                    trend={trend}
                    color={meta.color}
                    onPress={meta.target ? () => handleNavigate(meta.target) : undefined}
                    testID={`stat-${meta.key}`}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ================================================================ */}
        {/* QUICK ACTIONS */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{dashboardCopy.quickActions.title}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action: any) => (
              <QuickActionCard
                key={action.label}
                icon={action.icon as any}
                label={action.label}
                onPress={() => {
                  if (action?.target) {
                    handleNavigate(action.target);
                  }
                }}
                variant={(action.variant as any) ?? 'secondary'}
                testID={`quick-action-${action.target?.toLowerCase()}`}
              />
            ))}
          </ScrollView>
        </View>

        {/* ================================================================ */}
        {/* AI INSIGHTS CARD */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{dashboardCopy.ai.sectionTitle}</Text>
            <TouchableOpacity onPress={() => handleNavigate('AI')}>
              <Ionicons
                name="chevron-forward"
                size={tokens.iconSize.sm}
                color={tokens.colors.yellow.DEFAULT}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() => handleNavigate('AI')}
            activeOpacity={0.8}
          >
            {/* Glow Background */}
            <View style={styles.aiGlow} />

            <View style={styles.aiContent}>
              <View style={styles.aiHeader}>
                <View style={styles.aiIconContainer}>
                  <Ionicons
                    name="sparkles"
                    size={tokens.iconSize.lg}
                    color={tokens.colors.feature.ai}
                  />
                </View>
                <View style={styles.aiHeaderText}>
                  <Text style={styles.aiTitle}>{dashboardCopy.ai.cardTitle}</Text>
                  <Text style={styles.aiSubtitle}>
                    {dashboardCopy.ai.subtitle}
                  </Text>
                </View>
              </View>

              {/* Mini Chart Placeholder */}
              <View style={styles.aiChart}>
                <View style={styles.aiChartBar} />
                <View style={[styles.aiChartBar, { height: 60 }]} />
                <View style={[styles.aiChartBar, { height: 45 }]} />
                <View style={[styles.aiChartBar, { height: 70 }]} />
                <View style={[styles.aiChartBar, { height: 55 }]} />
              </View>

              <Text style={styles.aiDescription}>
                {stats.playersScouted > 0
                  ? t('dashboard.ai.descriptionWithData', {
                      count: Math.min(5, Math.floor(stats.playersScouted * 0.2)),
                    })
                  : dashboardCopy.ai.descriptionEmpty}
              </Text>

              <View style={styles.aiButton}>
                <Text style={styles.aiButtonText}>{dashboardCopy.ai.cta}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={tokens.iconSize.sm}
                  color={tokens.colors.arcane.black}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {showDailyChallenge ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{dashboardCopy.challenge.title}</Text>
              <View style={styles.xpBadge}>
                <Ionicons
                  name="star"
                  size={tokens.iconSize.xs}
                  color={tokens.colors.feature.gamification}
                />
                <Text style={styles.xpBadgeText}>
                  {t('dashboard.challenge.xpLabel', { xp: 500 })}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ================================================================ */}
        {/* RECENT ACTIVITY */}
        {/* ================================================================ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{dashboardCopy.activity.title}</Text>
            <TouchableOpacity onPress={() => handleNavigate('Activity')}>
              <Text style={styles.viewAllLink}>{dashboardCopy.activity.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityCard}>
            {recentActivities.slice(0, 5).map((activity, index) => (
              <ActivityItem
                key={activity.id}
                icon={activity.icon}
                iconColor={activity.iconColor}
                title={activity.title}
                description={activity.description}
                timestamp={activity.timestamp}
                showSeparator={index < recentActivities.length - 1}
              />
            ))}
          </View>
        </View>

        {/* ================================================================ */}
        {/* UPCOMING MATCHES */}
        {/* ================================================================ */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{dashboardCopy.matches.title}</Text>
            <TouchableOpacity onPress={() => handleNavigate('Calendar')}>
              <Text style={styles.viewAllLink}>{dashboardCopy.matches.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.matchesCard}>
            {upcomingMatches.map((match, index) => (
              <TouchableOpacity
                key={match.id}
                style={[
                  styles.matchItem,
                  index < upcomingMatches.length - 1 && styles.matchItemWithBorder,
                ]}
                onPress={() => handleNavigate('MatchDetails')}
              >
                <View style={styles.matchTeams}>
                  <View style={styles.matchTeamLogo}>
                    <Text style={styles.matchTeamInitial}>
                      {match.homeTeam.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.matchVs}>{dashboardCopy.matches.vs}</Text>
                  <View style={styles.matchTeamLogo}>
                    <Text style={styles.matchTeamInitial}>
                      {match.awayTeam.charAt(0)}
                    </Text>
                  </View>
                </View>
                <View style={styles.matchDetails}>
                  <Text style={styles.matchTeamsText}>
                    {match.homeTeam} vs {match.awayTeam}
                  </Text>
                  <View style={styles.matchDateTime}>
                    <Ionicons
                      name="calendar-outline"
                      size={tokens.iconSize.xs}
                      color={tokens.colors.gray[400]}
                    />
                    <Text style={styles.matchDate}>{match.date}</Text>
                    <Ionicons
                      name="time-outline"
                      size={tokens.iconSize.xs}
                      color={tokens.colors.gray[400]}
                    />
                    <Text style={styles.matchTime}>{match.time}</Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={tokens.iconSize.sm}
                  color={tokens.colors.gray[500]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
  },

  // Hero Section
  hero: {
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
  },
  greeting: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    marginBottom: 4,
  },
  userName: {
    ...typography.heading2,
    color: tokens.colors.gray[50],
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.md,
  },
  profileInitial: {
    ...typography.heading4,
    color: tokens.colors.arcane.black,
    fontWeight: tokens.fontWeight.bold,
  },

  // XP Progress
  xpContainer: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpLevelText: {
    ...typography.heading5,
    color: tokens.colors.yellow.DEFAULT,
  },
  xpText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  xpBar: {
    height: 8,
    backgroundColor: tokens.colors.arcane.anthracite,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderRadius: 9999,
    ...tokens.shadows.glowYellow,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.heading3,
    color: tokens.colors.gray[100],
  },
  viewAllLink: {
    ...typography.bodySmall,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: tokens.fontWeight.semibold,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCardWrapper: {
    width: '50%',
    padding: 8,
  },

  // Quick Actions
  quickActionsScroll: {
    paddingRight: 16,
    gap: 12,
  },

  // Player dashboard
  playerHeroCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: tokens.colors.brand.primary + '35',
    ...tokens.shadows.lg,
  },
  playerTagRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  playerTag: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: tokens.colors.arcane.anthracite + 'C0',
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '70',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  playerTagLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  playerTagValue: {
    ...typography.bodyBase,
    color: tokens.colors.gray[100],
    fontWeight: tokens.fontWeight.semibold,
  },
  playerSummaryCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
  },
  playerSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerSummaryLabel: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
  },
  playerSummaryValue: {
    ...typography.bodyBase,
    color: tokens.colors.gray[100],
    fontWeight: tokens.fontWeight.semibold,
  },
  playerPerformanceGrid: {
    gap: 10,
  },
  playerMetricCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
  },
  playerMetricLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  playerMetricValue: {
    ...typography.heading4,
    color: tokens.colors.yellow.DEFAULT,
  },
  playerSessionsCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
  },
  playerSessionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.arcane.slate + '35',
  },
  playerSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerSessionType: {
    ...typography.caption,
    color: tokens.colors.gray[100],
    fontWeight: tokens.fontWeight.bold,
  },
  playerSessionDate: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  playerSessionStats: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
  },
  playerEmptyText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    textAlign: 'center',
    paddingVertical: 10,
  },
  braceletCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.colors.feature.ai + '60',
    padding: 16,
    ...tokens.shadows.md,
  },
  braceletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  braceletTitle: {
    ...typography.heading5,
    color: tokens.colors.gray[100],
    marginBottom: 4,
  },
  braceletStatusText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
  },
  braceletPill: {
    backgroundColor: tokens.colors.brand.primary + '20',
    borderColor: tokens.colors.brand.primary + '50',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  braceletPillText: {
    ...typography.caption,
    color: tokens.colors.brand.primary,
    fontWeight: tokens.fontWeight.semibold,
  },
  braceletMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  braceletMetric: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.anthracite + 'AA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '70',
  },
  braceletMetricLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 3,
  },
  braceletMetricValue: {
    ...typography.bodyBase,
    color: tokens.colors.gray[100],
    fontWeight: tokens.fontWeight.bold,
  },
  braceletFooter: {
    gap: 10,
  },
  braceletHint: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  braceletActions: {
    flexDirection: 'row',
    gap: 8,
  },
  braceletActionBtn: {
    flex: 1,
    backgroundColor: tokens.colors.brand.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  braceletActionBtnSecondary: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '80',
  },
  braceletActionText: {
    ...typography.bodySmall,
    color: tokens.colors.arcane.black,
    fontWeight: tokens.fontWeight.bold,
  },
  braceletActionTextSecondary: {
    ...typography.bodySmall,
    color: tokens.colors.gray[100],
    fontWeight: tokens.fontWeight.semibold,
  },
  playerBottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  playerBottomActionPrimary: {
    flex: 1,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    ...tokens.shadows.glowYellow,
  },
  playerBottomActionPrimaryText: {
    ...typography.bodySmall,
    color: tokens.colors.arcane.black,
    fontWeight: tokens.fontWeight.bold,
  },
  playerBottomActionSecondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '80',
    backgroundColor: tokens.colors.arcane.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  playerBottomActionSecondaryText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[100],
    fontWeight: tokens.fontWeight.semibold,
  },
  // AI Card
  aiCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.colors.feature.ai + '40',
    overflow: 'hidden',
    position: 'relative',
    ...tokens.shadows.lg,
  },
  aiGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: tokens.colors.feature.ai,
    opacity: 0.1,
  },
  aiContent: {
    padding: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: tokens.colors.feature.ai + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    ...typography.heading4,
    color: tokens.colors.gray[100],
    marginBottom: 4,
  },
  aiSubtitle: {
    ...typography.bodySmall,
    color: tokens.colors.feature.ai,
  },
  aiChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    marginBottom: 16,
    gap: 8,
  },
  aiChartBar: {
    flex: 1,
    height: 50,
    backgroundColor: tokens.colors.feature.ai + '40',
    borderRadius: 6,
  },
  aiDescription: {
    ...typography.bodyBase,
    color: tokens.colors.gray[300],
    lineHeight: tokens.fontSize.base * 1.5,
    marginBottom: 16,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    ...tokens.shadows.glowYellow,
  },
  aiButtonText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.feature.gamification + '40',
    ...tokens.shadows.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: tokens.colors.feature.gamification + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    ...typography.heading5,
    color: tokens.colors.gray[100],
    marginBottom: 4,
  },
  challengeDescription: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
    lineHeight: tokens.fontSize.sm * 1.4,
  },
  challengeProgress: {
    marginBottom: 16,
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: tokens.colors.arcane.anthracite,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: tokens.colors.feature.gamification,
    borderRadius: 9999,
  },
  challengeProgressText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textAlign: 'right',
  },
  challengeButton: {
    backgroundColor: tokens.colors.feature.gamification + '20',
    borderWidth: 1,
    borderColor: tokens.colors.feature.gamification,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  challengeButtonText: {
    ...typography.buttonText,
    color: tokens.colors.feature.gamification,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.feature.gamification + '20',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  xpBadgeText: {
    ...typography.caption,
    color: tokens.colors.feature.gamification,
    fontWeight: tokens.fontWeight.semibold,
  },

  // Activity Card
  activityCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
    ...tokens.shadows.md,
  },

  // Matches Card
  matchesCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
    ...tokens.shadows.md,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  matchItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.arcane.slate + '40',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchTeamLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: tokens.colors.arcane.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate,
  },
  matchTeamInitial: {
    ...typography.caption,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.gray[300],
  },
  matchVs: {
    ...typography.caption,
    color: tokens.colors.gray[500],
    fontSize: tokens.fontSize.xs,
  },
  matchDetails: {
    flex: 1,
  },
  matchTeamsText: {
    ...typography.bodyBase,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.gray[200],
    marginBottom: 4,
  },
  matchDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchDate: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginRight: 8,
  },
  matchTime: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
});

export default DashboardScreen;
