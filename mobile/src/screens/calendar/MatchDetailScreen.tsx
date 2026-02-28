import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/navigation';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';
import type { AppStackParamList } from '../../types/navigation';
import type { CalendarMatch } from '../../types/calendar';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { isCategoryARole } from '../../lib/roles';
import api, { pickDateValue, type MatchMissionRequest } from '../../services/api';

type MatchDetailRouteProp = RouteProp<AppStackParamList, 'MatchDetail'>;
type MatchDetailNavigationProp = NativeStackNavigationProp<AppStackParamList>;

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Icon name={icon} size={18} color={colors.brand.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const AssignmentRow = ({
  assignment,
  subtitle,
}: {
  assignment: NonNullable<CalendarMatch['assignments']>[number];
  subtitle: string;
}) => {
  const initials = `${assignment.scout?.firstName?.[0] ?? ''}${assignment.scout?.lastName?.[0] ?? ''}`.toUpperCase() || 'SC';

  return (
    <View style={styles.assignmentRow}>
      <View style={styles.assignmentAvatar}>
        <Text style={styles.assignmentAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.assignmentName}>
          {assignment.scout?.firstName} {assignment.scout?.lastName}
        </Text>
        <Text style={styles.assignmentMeta}>{subtitle}</Text>
      </View>
      <Icon name="chevronForward" size={16} color={colors.text.secondary} />
    </View>
  );
};

const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatTime = (value: string, locale: string) =>
  new Date(value).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

const renderLargeBadge = (logo?: string | null) => {
  if (!logo) {
    return (
      <View style={styles.largeBadgePlaceholder}>
        <Icon name='football' size={20} color={colors.text.secondary} />
      </View>
    );
  }

  return <Image source={{ uri: logo }} style={styles.largeBadgeImage} />;
};

const toIsoDate = (input?: string | null, fallbackTime?: string | null) => {
  if (!input) return new Date().toISOString();
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  if (!fallbackTime) {
    return new Date().toISOString();
  }

  const parsedFromDateOnly = new Date(input);
  if (Number.isNaN(parsedFromDateOnly.getTime())) {
    return new Date().toISOString();
  }

  const [hourRaw, minuteRaw] = String(fallbackTime).split(':');
  const hour = Number.parseInt(hourRaw ?? '0', 10);
  const minute = Number.parseInt(minuteRaw ?? '0', 10);
  parsedFromDateOnly.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);
  return parsedFromDateOnly.toISOString();
};

const MISSION_REQUEST_STATUS_COLORS: Record<MatchMissionRequest['status'], string> = {
  SUBMITTED: '#FACC15',
  APPROVED: '#22C55E',
  REJECTED: '#F97316',
  CANCELLED: '#94A3B8',
};

const adaptFetchedMatch = (payload: any): CalendarMatch => {
  const dateValue =
    pickDateValue(payload, ['scheduledAt', 'matchDate', 'date', 'createdAt']) ??
    payload?.matchDate ??
    payload?.date;
  const date = toIsoDate(dateValue, payload?.matchTime);
  const assignments = Array.isArray(payload?.match_assignments)
    ? payload.match_assignments.map((assignment: any) => ({
        id: assignment.id,
        assignmentId: assignment.id,
        scoutId: assignment.scoutId,
        missionType: assignment.missionType,
        status: assignment.status,
        mobileStatus: assignment.mobileStatus,
        role: assignment.role,
        reportSubmitted: assignment.reportSubmitted,
      }))
    : [];

  return {
    id: String(payload?.id ?? ''),
    sourceType: 'MATCH',
    assignmentId: assignments[0]?.assignmentId,
    date,
    status: payload?.mobileStatus ?? payload?.status ?? 'PLANNED',
    homeScore: typeof payload?.homeScore === 'number' ? payload.homeScore : undefined,
    awayScore: typeof payload?.awayScore === 'number' ? payload.awayScore : undefined,
    competition: payload?.competition?.name
      ? {
          id: payload.competition.id,
          name: payload.competition.name,
          logo: payload.competition.logo,
        }
      : payload?.competitions?.name
      ? {
          id: payload.competitions.id,
          name: payload.competitions.name,
          logo: payload.competitions.logo,
        }
      : payload?.competitionOld
      ? {
          name: payload.competitionOld,
        }
      : undefined,
    venue: payload?.venue
      ? {
          id: payload.venue.id,
          name: payload.venue.name,
          city: payload.venue.city,
          country: payload.venue.country,
          latitude: payload.venue.latitude,
          longitude: payload.venue.longitude,
        }
      : undefined,
    homeClub: payload?.homeClub
      ? {
          id: payload.homeClub.id,
          name: payload.homeClub.name,
          logo: payload.homeClub.logo,
        }
      : payload?.clubs_matches_homeClubIdToclubs
      ? {
          id: payload.clubs_matches_homeClubIdToclubs.id,
          name: payload.clubs_matches_homeClubIdToclubs.name,
          logo: payload.clubs_matches_homeClubIdToclubs.logo,
        }
      : undefined,
    awayClub: payload?.awayClub
      ? {
          id: payload.awayClub.id,
          name: payload.awayClub.name,
          logo: payload.awayClub.logo,
        }
      : payload?.clubs_matches_awayClubIdToclubs
      ? {
          id: payload.clubs_matches_awayClubIdToclubs.id,
          name: payload.clubs_matches_awayClubIdToclubs.name,
          logo: payload.clubs_matches_awayClubIdToclubs.logo,
        }
      : undefined,
    assignments,
    notes:
      typeof payload?.notes === 'string'
        ? payload.notes
        : typeof payload?.notesJson?.summary === 'string'
        ? payload.notesJson.summary
        : undefined,
  };
};

export const MatchDetailScreen = () => {
  const { dictionary, language } = useLocalization();
  const { user, activeRole } = useAuth();
  const copy = dictionary.calendarCenter ?? {};
  const copyAny = copy as Record<string, any>;
  const navigation = useNavigation<MatchDetailNavigationProp>();
  const { params } = useRoute<MatchDetailRouteProp>();
  const effectiveRole = String(activeRole ?? user?.role ?? '').toUpperCase();
  const canModerateMissionRequests = isCategoryARole(effectiveRole as any);
  const canCreateMissionRequest = effectiveRole === 'AGENT' || canModerateMissionRequests;
  const canViewMissionRequests =
    canCreateMissionRequest || effectiveRole === 'SCOUT';
  const [match, setMatch] = useState<CalendarMatch | undefined>(params?.match as CalendarMatch | undefined);
  const [loading, setLoading] = useState(!params?.match && !!params?.matchId);
  const [startingMission, setStartingMission] = useState(false);
  const [completingMission, setCompletingMission] = useState(false);
  const [creatingMissionRequest, setCreatingMissionRequest] = useState(false);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [missionRequests, setMissionRequests] = useState<MatchMissionRequest[]>([]);
  const [loadingMissionRequests, setLoadingMissionRequests] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | undefined>(
    (params?.match as CalendarMatch | undefined)?.status as string | undefined,
  );
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const assignmentId = params?.assignmentId ?? match?.assignmentId;

  const loadMatchFromId = useCallback(async () => {
    if (!params?.matchId) {
      return;
    }

    setLoading(true);
    try {
      const payload = await api.getMatch(params.matchId);
      const adapted = adaptFetchedMatch(payload);
      if (params.assignmentId) {
        adapted.assignmentId = params.assignmentId;
      }
      setMatch(adapted);
      setStatusOverride(adapted.status as string | undefined);
    } catch (error) {
      console.error('Unable to load match detail', error);
    } finally {
      setLoading(false);
    }
  }, [params?.assignmentId, params?.matchId]);

  useEffect(() => {
    if (params?.match) {
      setMatch(params.match as CalendarMatch);
      setStatusOverride((params.match as CalendarMatch).status as string | undefined);
      return;
    }

    if (params?.matchId) {
      loadMatchFromId();
    }
  }, [loadMatchFromId, params?.match, params?.matchId]);

  const refreshMissionRequests = useCallback(async () => {
    if (!canViewMissionRequests || !match?.id) {
      setMissionRequests([]);
      return;
    }

    try {
      setLoadingMissionRequests(true);
      const payload = await api.getMatchMissionRequests(match.id);
      setMissionRequests(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error('Unable to load mission requests', error);
      setMissionRequests([]);
    } finally {
      setLoadingMissionRequests(false);
    }
  }, [canViewMissionRequests, match?.id]);

  useEffect(() => {
    refreshMissionRequests();
  }, [refreshMissionRequests]);

  const currentStatus = statusOverride ?? (match?.status as string | undefined) ?? 'PLANNED';
  const isMissionStarted = String(currentStatus).toUpperCase() === 'EN_ROUTE';
  const isMissionCompleted = String(currentStatus).toUpperCase() === 'REPORT_SUBMITTED';

  const handleStartMission = useCallback(async () => {
    if (!assignmentId) {
      Alert.alert(
        copy.detailNoAssignments ?? 'Mission indisponible',
        copyAny.detailNoAssignmentsBody ??
          "Cette rencontre n'a pas d'assignation active pour votre compte scout.",
      );
      return;
    }

    try {
      setStartingMission(true);
      const response = await api.startAssignmentMission(assignmentId);
      setStatusOverride(response?.mobileStatus ?? response?.status ?? 'EN_ROUTE');
      Alert.alert(
        copyAny.startMissionSuccessTitle ?? 'Mission démarrée',
        copyAny.startMissionSuccessBody ?? 'Le statut est maintenant EN_ROUTE.',
      );
    } catch (error: any) {
      Alert.alert(
        copyAny.startMissionErrorTitle ?? 'Erreur mission',
        error?.response?.data?.message ??
          copyAny.startMissionErrorBody ??
          'Impossible de démarrer cette mission.',
      );
    } finally {
      setStartingMission(false);
    }
  }, [
    assignmentId,
    copy.detailNoAssignments,
    copyAny.detailNoAssignmentsBody,
    copyAny.startMissionErrorBody,
    copyAny.startMissionErrorTitle,
    copyAny.startMissionSuccessBody,
    copyAny.startMissionSuccessTitle,
  ]);

  const handleCreateReport = useCallback(() => {
    if (!match?.id) {
      return;
    }

    navigation.navigate('CreateReport', {
      matchId: match.id,
      assignmentId: assignmentId ?? undefined,
      playerIds: params?.suggestedPlayerIds,
    });
  }, [assignmentId, match?.id, navigation, params?.suggestedPlayerIds]);

  const handleOpenMissionRequestsHub = useCallback(() => {
    navigation.navigate('MissionRequests', {
      preselectedMatchId: match?.id,
    });
  }, [match?.id, navigation]);

  const handleCompleteMission = useCallback(async () => {
    if (!assignmentId) {
      Alert.alert(
        copy.detailNoAssignments ?? 'Mission indisponible',
        copyAny.detailNoAssignmentsBody ??
          "Cette rencontre n'a pas d'assignation active pour votre compte scout.",
      );
      return;
    }

    try {
      setCompletingMission(true);
      const response = await api.completeAssignmentMission(assignmentId);
      setStatusOverride(response?.mobileStatus ?? response?.status ?? 'REPORT_SUBMITTED');
      Alert.alert(
        copyAny.completeMissionSuccessTitle ?? 'Mission terminée',
        copyAny.completeMissionSuccessBody ?? 'Le statut est maintenant REPORT_SUBMITTED.',
      );
    } catch (error: any) {
      Alert.alert(
        copyAny.completeMissionErrorTitle ?? 'Erreur mission',
        error?.response?.data?.message ??
          copyAny.completeMissionErrorBody ??
          'Impossible de terminer cette mission.',
      );
    } finally {
      setCompletingMission(false);
    }
  }, [
    assignmentId,
    copy.detailNoAssignments,
    copyAny.completeMissionErrorBody,
    copyAny.completeMissionErrorTitle,
    copyAny.completeMissionSuccessBody,
    copyAny.completeMissionSuccessTitle,
    copyAny.detailNoAssignmentsBody,
  ]);

  const handleCreateMissionRequest = useCallback(async () => {
    if (!match?.id) return;

    const suggestedScoutId = match.assignments?.find((assignment) => assignment?.scoutId)?.scoutId;
    if (!suggestedScoutId) {
      navigation.navigate('MissionRequests', {
        preselectedMatchId: match.id,
        preopenCreateForm: true,
        preopenScoutMenu: true,
      });
      return;
    }

    try {
      setCreatingMissionRequest(true);
      await api.createMissionRequest(match.id, {
        missionType: 'PRIORITY',
        targetScoutId: suggestedScoutId || undefined,
      });
      await refreshMissionRequests();
      Alert.alert(
        copyAny.missionRequestCreatedTitle ?? 'Demande créée',
        copyAny.missionRequestCreatedBody ?? 'La demande de mission a été envoyée à validation.',
      );
    } catch (error: any) {
      const backendMessage = String(error?.response?.data?.message ?? '');
      if (backendMessage.toLowerCase().includes('scout')) {
        navigation.navigate('MissionRequests', {
          preselectedMatchId: match.id,
          preopenCreateForm: true,
          preopenScoutMenu: true,
        });
        return;
      }
      Alert.alert(
        copyAny.missionRequestErrorTitle ?? 'Erreur demande',
        backendMessage ||
          (copyAny.missionRequestErrorBody ??
            'Impossible de créer la demande de mission.'),
      );
    } finally {
      setCreatingMissionRequest(false);
    }
  }, [
    copyAny.missionRequestCreatedBody,
    copyAny.missionRequestCreatedTitle,
    copyAny.missionRequestErrorBody,
    copyAny.missionRequestErrorTitle,
    navigation,
    match,
    refreshMissionRequests,
  ]);

  const handleApproveMissionRequest = useCallback(
    async (request: MatchMissionRequest) => {
      if (!canModerateMissionRequests) return;
      try {
        setRequestActionId(request.id);
        const fallbackScoutId = request.targetScout?.id ?? match?.assignments?.[0]?.scoutId;
        await api.approveMissionRequest(request.id, {
          scoutId: fallbackScoutId || undefined,
        });
        await refreshMissionRequests();
        Alert.alert(
          copyAny.missionRequestApprovedTitle ?? 'Demande approuvée',
          copyAny.missionRequestApprovedBody ?? 'Mission assignée au scout.',
        );
      } catch (error: any) {
        Alert.alert(
          copyAny.missionRequestErrorTitle ?? 'Erreur demande',
          error?.response?.data?.message ??
            copyAny.missionRequestErrorBody ??
            "Impossible d'approuver la demande.",
        );
      } finally {
        setRequestActionId(null);
      }
    },
    [
      canModerateMissionRequests,
      copyAny.missionRequestApprovedBody,
      copyAny.missionRequestApprovedTitle,
      copyAny.missionRequestErrorBody,
      copyAny.missionRequestErrorTitle,
      match?.assignments,
      refreshMissionRequests,
    ],
  );

  const handleRejectMissionRequest = useCallback(
    async (request: MatchMissionRequest) => {
      if (!canModerateMissionRequests) return;
      try {
        setRequestActionId(request.id);
        await api.rejectMissionRequest(request.id);
        await refreshMissionRequests();
      } catch (error: any) {
        Alert.alert(
          copyAny.missionRequestErrorTitle ?? 'Erreur demande',
          error?.response?.data?.message ??
            copyAny.missionRequestErrorBody ??
            'Impossible de rejeter la demande.',
        );
      } finally {
        setRequestActionId(null);
      }
    },
    [
      canModerateMissionRequests,
      copyAny.missionRequestErrorBody,
      copyAny.missionRequestErrorTitle,
      refreshMissionRequests,
    ],
  );

  const handleCancelMissionRequest = useCallback(
    async (request: MatchMissionRequest) => {
      try {
        setRequestActionId(request.id);
        await api.cancelMissionRequest(request.id);
        await refreshMissionRequests();
      } catch (error: any) {
        Alert.alert(
          copyAny.missionRequestErrorTitle ?? 'Erreur demande',
          error?.response?.data?.message ??
            copyAny.missionRequestErrorBody ??
            "Impossible d'annuler la demande.",
        );
      } finally {
        setRequestActionId(null);
      }
    },
    [
      copyAny.missionRequestErrorBody,
      copyAny.missionRequestErrorTitle,
      refreshMissionRequests,
    ],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={copy.detailTitle ?? 'Match'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>{copyAny.detailLoading ?? 'Chargement du match...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={copy.detailTitle ?? 'Match'} />
        <View style={styles.fallbackContainer}>
          <Icon name="alert" size={48} color={colors.text.secondary} />
          <Text style={styles.fallbackText}>{copy.detailEmptyTitle ?? 'Aucune donnée de match disponible.'}</Text>
          <Text style={styles.fallbackSubtext}>
            {copy.detailEmptyBody ?? 'Veuillez revenir en arrière et sélectionner une rencontre.'}
          </Text>
          {params?.matchId ? (
            <TouchableOpacity style={styles.retryButton} onPress={loadMatchFromId}>
              <Text style={styles.retryButtonText}>
                {copyAny.detailRetryCta ?? 'Réessayer'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const dateLabel = formatDate(match.date, locale);
  const timeLabel = formatTime(match.date, locale);
  const venueLabel = match.venue
    ? `${match.venue.name}${match.venue.city ? ` • ${match.venue.city}` : ''}`
    : 'À confirmer';
  const statusKey = String(currentStatus ?? 'PLANNED').toUpperCase();
  const statusLabel =
    (copy.statusLabels as Record<string, string> | undefined)?.[statusKey] ??
    statusKey.replace(/_/g, ' ');
  const assignments = match.assignments ?? [];
  const canUseScoutMissionActions = effectiveRole === 'SCOUT';

  const detailRows: Array<{ icon: IconName; label: string; value: string }> = [
    { icon: 'calendar', label: copy.detailDateLabel ?? 'Date', value: dateLabel },
    { icon: 'time', label: copy.detailTimeLabel ?? 'Heure', value: timeLabel },
    {
      icon: 'trophy',
      label: copy.detailCompetitionLabel ?? 'Compétition',
      value: match.competition?.name ?? copy.detailTbd ?? 'À confirmer',
    },
    { icon: 'location', label: copy.detailVenueLabel ?? 'Stade', value: venueLabel },
    { icon: 'shield', label: copy.detailStatusLabel ?? 'Statut', value: statusLabel },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={copy.detailTitle ?? 'Détails du match'} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#1E1B4B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEyebrow}>{copy.detailEyebrow ?? 'Rencontre programmée'}</Text>

          {match.competition && (
            <View style={styles.leagueChip}>
              {renderLargeBadge(match.competition.logo)}
              <Text style={styles.leagueChipText} numberOfLines={1}>
                {match.competition.name}
              </Text>
            </View>
          )}

          <View style={styles.heroTeamsRow}>
            <View style={styles.teamColumn}>
              {renderLargeBadge(match.homeClub?.logo)}
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeClub?.name ?? 'À déterminer'}
              </Text>
            </View>

            <View style={styles.scoreColumn}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{match.homeScore ?? '-'}</Text>
                <Text style={styles.scoreDivider}>:</Text>
                <Text style={styles.scoreText}>{match.awayScore ?? '-'}</Text>
              </View>
              <Text style={styles.scoreStatus}>{statusLabel}</Text>
            </View>

            <View style={styles.teamColumn}>
              {renderLargeBadge(match.awayClub?.logo)}
              <Text style={styles.teamName} numberOfLines={1}>
                {match.awayClub?.name ?? 'À déterminer'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDate}>{dateLabel}</Text>
          <Text style={styles.heroTime}>{timeLabel}</Text>
        </LinearGradient>

        <GlassCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{copy.detailInfoSection ?? 'Informations'}</Text>
          {detailRows.map((row) => (
            <DetailRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
          ))}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{copy.detailAssignmentsSection ?? 'Scouts assignés'}</Text>
          {assignments.length === 0 && (
            <Text style={styles.emptyState}>
              {copy.detailNoAssignments ?? "Aucun scout n'est assigné pour ce match."}
            </Text>
          )}
          {assignments.map((assignment) => (
            <AssignmentRow
              key={assignment.assignmentId ?? assignment.id ?? assignment.scoutId}
              assignment={assignment}
              subtitle={copy.detailAssignedScout ?? 'Scout assigné'}
            />
          ))}
        </GlassCard>

        {canViewMissionRequests && (
          <GlassCard variant="elevated" style={styles.infoCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {copyAny.missionRequestsSectionTitle ?? 'Demandes de mission'}
              </Text>
              <View style={styles.sectionHeaderActions}>
                <TouchableOpacity
                  style={styles.openHubButton}
                  onPress={handleOpenMissionRequestsHub}
                >
                  <Icon name="clipboard" size={14} color={colors.text.primary} />
                  <Text style={styles.openHubButtonText}>
                    {copyAny.missionRequestHubCta ?? 'Ouvrir hub'}
                  </Text>
                </TouchableOpacity>
                {canCreateMissionRequest && (
                  <TouchableOpacity
                    style={[styles.requestButton, creatingMissionRequest && styles.actionButtonDisabled]}
                    onPress={handleCreateMissionRequest}
                    disabled={creatingMissionRequest}
                  >
                    {creatingMissionRequest ? (
                      <ActivityIndicator size="small" color={colors.background.primary} />
                    ) : (
                      <Icon name="add" size={14} color={colors.background.primary} />
                    )}
                    <Text style={styles.requestButtonText}>
                      {copyAny.missionRequestCta ?? 'Demander mission'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {loadingMissionRequests ? (
              <View style={styles.inlineLoadingRow}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <Text style={styles.inlineLoadingText}>
                  {copyAny.missionRequestsLoading ?? 'Chargement des demandes...'}
                </Text>
              </View>
            ) : missionRequests.length === 0 ? (
              <Text style={styles.emptyState}>
                {copyAny.missionRequestsEmpty ?? 'Aucune demande pour ce match.'}
              </Text>
            ) : (
              missionRequests.map((request) => {
                const statusColor = MISSION_REQUEST_STATUS_COLORS[request.status];
                const isSubmitted = request.status === 'SUBMITTED';
                const canCancel = isSubmitted && request.requestedBy?.id === user?.id;
                return (
                  <View key={request.id} style={styles.requestRow}>
                    <View style={styles.requestTopRow}>
                      <View style={[styles.requestStatusBadge, { borderColor: `${statusColor}99` }]}>
                        <Text style={[styles.requestStatusText, { color: statusColor }]}>
                          {request.status}
                        </Text>
                      </View>
                      <Text style={styles.requestMetaText}>
                        {new Date(request.createdAt).toLocaleString(locale)}
                      </Text>
                    </View>

                    <Text style={styles.requestLineText}>
                      {(request.requestedBy?.firstName ?? '')} {(request.requestedBy?.lastName ?? '')}
                    </Text>
                    <Text style={styles.requestSubText}>
                      {request.targetScout?.firstName
                        ? `${copyAny.requestTargetScoutLabel ?? 'Scout cible'}: ${request.targetScout.firstName} ${request.targetScout.lastName ?? ''}`
                        : copyAny.requestTargetScoutFallback ?? 'Scout cible non défini'}
                    </Text>

                    {request.note ? <Text style={styles.requestSubText}>{request.note}</Text> : null}

                    {(canModerateMissionRequests || canCancel) && isSubmitted ? (
                      <View style={styles.requestActionsRow}>
                        {canModerateMissionRequests && (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.requestActionButton,
                                styles.requestApproveButton,
                                requestActionId === request.id && styles.actionButtonDisabled,
                              ]}
                              onPress={() => handleApproveMissionRequest(request)}
                              disabled={requestActionId === request.id}
                            >
                              <Text style={styles.requestActionText}>
                                {copyAny.missionRequestApproveCta ?? 'Approuver'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.requestActionButton,
                                styles.requestRejectButton,
                                requestActionId === request.id && styles.actionButtonDisabled,
                              ]}
                              onPress={() => handleRejectMissionRequest(request)}
                              disabled={requestActionId === request.id}
                            >
                              <Text style={styles.requestActionText}>
                                {copyAny.missionRequestRejectCta ?? 'Rejeter'}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {canCancel && (
                          <TouchableOpacity
                            style={[
                              styles.requestActionButton,
                              styles.requestCancelButton,
                              requestActionId === request.id && styles.actionButtonDisabled,
                            ]}
                            onPress={() => handleCancelMissionRequest(request)}
                            disabled={requestActionId === request.id}
                          >
                            <Text style={styles.requestActionText}>
                              {copyAny.missionRequestCancelCta ?? 'Annuler'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </GlassCard>
        )}

        <GlassCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{copyAny.detailActionsSection ?? 'Actions terrain'}</Text>
          <View style={styles.actionsRow}>
            {canUseScoutMissionActions && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isMissionStarted && !isMissionCompleted
                    ? styles.completeMissionButton
                    : styles.startMissionButton,
                  (startingMission || completingMission || isMissionCompleted) &&
                    styles.actionButtonDisabled,
                ]}
                onPress={isMissionStarted && !isMissionCompleted ? handleCompleteMission : handleStartMission}
                disabled={startingMission || completingMission || isMissionCompleted}
              >
                {startingMission || completingMission ? (
                  <ActivityIndicator size="small" color={colors.background.primary} />
                ) : (
                  <Icon
                    name={isMissionStarted && !isMissionCompleted ? 'checkmark' : 'location'}
                    size={16}
                    color={colors.background.primary}
                  />
                )}
                <Text style={styles.actionButtonText}>
                  {isMissionCompleted
                    ? copyAny.reportSubmittedLabel ?? 'Rapport envoyé'
                    : isMissionStarted
                    ? copyAny.completeMissionCta ?? 'Check-out'
                    : copyAny.startMissionCta ?? 'Commencer mission'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.createReportButton]}
              onPress={handleCreateReport}
            >
              <Icon name="document" size={16} color={colors.background.primary} />
              <Text style={styles.actionButtonText}>
                {copy.createReportCta ?? 'Créer rapport'}
              </Text>
            </TouchableOpacity>
          </View>

          {!assignmentId ? (
            <Text style={styles.actionHint}>
              {copyAny.detailNoAssignmentsBody ??
                "Aucune assignation active trouvée: vous pouvez tout de même créer un rapport volontaire."}
            </Text>
          ) : null}
        </GlassCard>

        {match.notes && (
          <GlassCard variant="elevated" style={styles.infoCard}>
            <Text style={styles.sectionTitle}>{copy.detailNotesSection ?? 'Notes'}</Text>
            <Text style={styles.notesText}>{match.notes}</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MatchDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroEyebrow: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  scoreText: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  scoreDivider: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  scoreStatus: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroDate: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  heroTime: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  leagueChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  leagueChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  infoCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    width: '100%',
    gap: spacing.xs,
  },
  openHubButton: {
    flexGrow: 1,
    minWidth: 150,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openHubButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  requestButton: {
    flexGrow: 1,
    minWidth: 150,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestButtonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  inlineLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineLoadingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  requestRow: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(15,23,42,0.45)',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  requestStatusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  requestStatusText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  requestMetaText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  requestLineText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  requestSubText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  requestActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  requestActionButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  requestApproveButton: {
    backgroundColor: '#16A34A',
  },
  requestRejectButton: {
    backgroundColor: '#EA580C',
  },
  requestCancelButton: {
    backgroundColor: '#64748B',
  },
  requestActionText: {
    color: colors.background.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  assignmentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAvatarText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  assignmentName: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  assignmentMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyState: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  notesText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fallbackText: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  fallbackSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    color: colors.background.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  startMissionButton: {
    backgroundColor: colors.brand.primary,
  },
  completeMissionButton: {
    backgroundColor: '#16A34A',
  },
  createReportButton: {
    backgroundColor: '#F97316',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: colors.background.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  actionHint: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  largeBadgePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBadgeImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
