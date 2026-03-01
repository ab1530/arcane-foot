import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/navigation';
import { Button, GlassCard, Icon, SectionHeader, Select, SegmentedControl } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { isCategoryARole } from '../../lib/roles';
import api, { type MatchMissionRequest } from '../../services/api';
import { logError } from '../../utils/logger';
import type { AppStackParamList } from '../../types/navigation';
import type { SegmentOption } from '../../types/ui';
import type {
  MissionRequestCreateInput,
  MissionRequestFilters,
  MissionRequestListItem,
  MissionRequestStatus,
  MissionType,
} from '../../types/mission-requests';

type MissionRequestsRoute = RouteProp<AppStackParamList, 'MissionRequests'>;
type MissionRequestsNav = NativeStackNavigationProp<AppStackParamList>;

type ScoutOption = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

type MatchOption = {
  id: string;
  scheduledAt?: string | null;
  homeClub?: { name?: string | null; logo?: string | null } | null;
  awayClub?: { name?: string | null; logo?: string | null } | null;
};

type SortMode = 'newest' | 'oldest' | 'status';
type DatePreset = 'ALL' | '24H' | '7D' | '30D';

const STATUS_ORDER: MissionRequestStatus[] = ['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'];
const STATUS_COLORS: Record<MissionRequestStatus, string> = {
  SUBMITTED: '#FACC15',
  APPROVED: '#22C55E',
  REJECTED: '#F97316',
  CANCELLED: '#94A3B8',
};

const STATUS_LABELS: Record<MissionRequestStatus, string> = {
  SUBMITTED: 'Soumise',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
  CANCELLED: 'Annulée',
};

const STATUS_ORDER_FOR_SORT: Record<MissionRequestStatus, number> = {
  SUBMITTED: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3,
};

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'newest', label: 'Plus récentes' },
  { key: 'oldest', label: 'Plus anciennes' },
  { key: 'status', label: 'Par statut' },
];

const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  PRIORITY: 'PRIORITY',
  VOLUNTARY: 'VOLUNTARY',
};

const MISSION_TYPE_OPTIONS: SegmentOption<MissionType>[] = [
  {
    key: 'PRIORITY',
    label: `${MISSION_TYPE_LABELS.PRIORITY} (obligatoire)`,
  },
  {
    key: 'VOLUNTARY',
    label: `${MISSION_TYPE_LABELS.VOLUNTARY} (optionnel)`,
  },
];

const DATE_PRESET_OPTIONS: SegmentOption<DatePreset>[] = [
  { key: 'ALL', label: 'Toutes' },
  { key: '24H', label: '24h' },
  { key: '7D', label: '7 jours' },
  { key: '30D', label: '30 jours' },
];

const MISSION_SCOPE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  AGENT: 'Agent',
  SCOUT: 'Scout',
};

const toDisplayName = (entry?: { firstName?: string | null; lastName?: string | null } | null) => {
  const first = entry?.firstName?.trim() ?? '';
  const last = entry?.lastName?.trim() ?? '';
  return `${first} ${last}`.trim() || 'N/A';
};

const matchLabel = (match?: MatchOption | null) => {
  if (!match) return 'Match non disponible';
  const home = match.homeClub?.name?.trim() || 'Club A';
  const away = match.awayClub?.name?.trim() || 'Club B';
  return `${home} vs ${away}`;
};

const parseRows = (payload: { data?: MatchMissionRequest[] } | null | undefined): MissionRequestListItem[] =>
  Array.isArray(payload?.data) ? (payload!.data as MissionRequestListItem[]) : [];

export const MissionRequestsScreen = () => {
  const { user, activeRole } = useAuth();
  const route = useRoute<MissionRequestsRoute>();
  const navigation = useNavigation<MissionRequestsNav>();
  const effectiveRole = String(activeRole ?? user?.role ?? '').toUpperCase();
  const isAdmin = isCategoryARole(effectiveRole as any);
  const isAgent = effectiveRole === 'AGENT';
  const canCreate = isAdmin || isAgent;
  const canApproveReject = isAdmin;
  const canSee = canCreate || effectiveRole === 'SCOUT';
  const locale = 'fr-FR';

  const [requests, setRequests] = useState<MissionRequestListItem[]>([]);
  const [scouts, setScouts] = useState<ScoutOption[]>([]);
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [createInput, setCreateInput] = useState<MissionRequestCreateInput>({
    matchId: route.params?.preselectedMatchId ?? '',
    missionType: 'PRIORITY',
    targetScoutId: route.params?.preselectedScoutId ?? '',
    note: '',
  });
  const [filters, setFilters] = useState<MissionRequestFilters>({
    status: 'ALL',
    missionType: 'ALL',
    scoutId: 'ALL',
    matchId: route.params?.preselectedMatchId ?? 'ALL',
  });
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [showMatchMenu, setShowMatchMenu] = useState(false);
  const [showScoutMenu, setShowScoutMenu] = useState(Boolean(route.params?.preopenScoutMenu));
  const [matchSearch, setMatchSearch] = useState('');
  const [scoutSearch, setScoutSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  const requestScopeLabel =
    effectiveRole === 'AGENT'
      ? MISSION_SCOPE_LABELS.AGENT
      : effectiveRole === 'SCOUT'
        ? MISSION_SCOPE_LABELS.SCOUT
        : isAdmin
          ? MISSION_SCOPE_LABELS[effectiveRole]
          : 'Mission';

  const loadRequests = useCallback(async () => {
    const payload = await api.getMissionRequests();
    const parsed = parseRows(payload);
    setRequests(parsed);
  }, []);

  const loadScouts = useCallback(async () => {
    if (!canCreate) {
      setScouts([]);
      return;
    }

    try {
      const payload = await api.getUsers({ role: 'SCOUT', page: 1, limit: 100 });
      const users = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : [];
      const normalized = users.map((entry: any) => ({
        id: String(entry.id),
        firstName: entry.firstName,
        lastName: entry.lastName,
      }));
      setScouts(normalized);
    } catch (error) {
      logError('Failed to load scouts from /users, fallback to dashboard/scouts', error);
      try {
        const payload = await api.getDashboardScouts({ page: 1, limit: 100 });
        const fallbackRows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        const normalized = fallbackRows.map((entry: any) => ({
          id: String(entry.id),
          firstName: entry.firstName,
          lastName: entry.lastName,
        }));
        setScouts(normalized);
      } catch (fallbackError) {
        logError('Failed to load scouts list', fallbackError);
        setScouts([]);
      }
    }
  }, [canCreate]);

  const loadMatches = useCallback(async () => {
    if (!canCreate) {
      setMatches([]);
      return;
    }

    try {
      const payload = await api.getMatches({
        from: new Date().toISOString(),
        limit: 200,
      });
      let rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : [];
      if (rows.length === 0) {
        const fallbackPayload = await api.getMatches({ limit: 200 });
        rows = Array.isArray(fallbackPayload?.data)
          ? fallbackPayload.data
          : Array.isArray(fallbackPayload?.items)
          ? fallbackPayload.items
          : [];
      }
      const normalized = rows.map((entry: any) => ({
        id: String(entry.id),
        scheduledAt: entry.scheduledAt ?? entry.matchDate ?? null,
        homeClub: entry.homeClub ?? entry.clubs_matches_homeClubIdToclubs ?? null,
        awayClub: entry.awayClub ?? entry.clubs_matches_awayClubIdToclubs ?? null,
      }));
      setMatches(normalized);
    } catch (error) {
      logError('Failed to load matches for mission request create form', error);
      setMatches([]);
    }
  }, [canCreate]);

  const refreshAll = useCallback(async () => {
    if (!canSee) {
      setRequests([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      await Promise.all([loadRequests(), loadScouts(), loadMatches()]);
    } catch (error) {
      logError('Failed to refresh mission requests hub', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canSee, loadMatches, loadRequests, loadScouts]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!canCreate) return;

    if (route.params?.preselectedMatchId) {
      setCreateInput((prev) => ({
        ...prev,
        matchId: route.params?.preselectedMatchId ?? prev.matchId,
      }));
      setFilters((prev) => ({
        ...prev,
        matchId: route.params?.preselectedMatchId ?? prev.matchId,
      }));
    }

    if (route.params?.preselectedScoutId) {
      setCreateInput((prev) => ({
        ...prev,
        targetScoutId: route.params?.preselectedScoutId ?? prev.targetScoutId,
      }));
    }

    if (route.params?.preopenScoutMenu) {
      setShowMatchMenu(false);
      setShowScoutMenu(true);
    }
  }, [
    canCreate,
    route.params?.preopenScoutMenu,
    route.params?.preselectedMatchId,
    route.params?.preselectedScoutId,
  ]);

  const statusCounts = useMemo(() => {
    const initial: Record<MissionRequestStatus, number> = {
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    for (const row of requests) {
      if (STATUS_ORDER.includes(row.status)) {
        initial[row.status] += 1;
      }
    }
    return initial;
  }, [requests]);

  const filterScoutOptions = useMemo(() => {
    const map = new Map<string, ScoutOption>();
    for (const row of requests) {
      if (row.targetScout?.id) {
        map.set(row.targetScout.id, {
          id: row.targetScout.id,
          firstName: row.targetScout.firstName,
          lastName: row.targetScout.lastName,
        });
      }
    }
    return Array.from(map.values());
  }, [requests]);

  const filterMatchOptions = useMemo(() => {
    const map = new Map<string, MatchOption>();
    for (const row of requests) {
      if (row.matchId) {
        map.set(row.matchId, {
          id: row.matchId,
          scheduledAt: row.match?.scheduledAt,
          homeClub: row.match?.homeClub ?? null,
          awayClub: row.match?.awayClub ?? null,
        });
      }
    }
    return Array.from(map.values());
  }, [requests]);

  const selectedCreateMatch = useMemo(
    () => matches.find((match) => match.id === createInput.matchId) ?? null,
    [createInput.matchId, matches],
  );

  const selectedCreateScout = useMemo(
    () => scouts.find((scout) => scout.id === createInput.targetScoutId) ?? null,
    [createInput.targetScoutId, scouts],
  );

  const filteredCreateMatches = useMemo(() => {
    const query = matchSearch.trim().toLowerCase();
    const source = matches.slice(0, 200);
    if (!query) return source;
    return source.filter((match) => matchLabel(match).toLowerCase().includes(query));
  }, [matchSearch, matches]);

  const filteredCreateScouts = useMemo(() => {
    const query = scoutSearch.trim().toLowerCase();
    const source = scouts.slice(0, 200);
    if (!query) return source;
    return source.filter((scout) => toDisplayName(scout).toLowerCase().includes(query));
  }, [scoutSearch, scouts]);

  const formatMatchDate = useCallback(
    (value?: string | null) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [locale],
  );

  const formatMatchTime = useCallback(
    (value?: string | null) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return date.toLocaleString(locale, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    [locale],
  );

  const filteredRequests = useMemo(() => {
    const fromDate = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
    const toDate = filters.toDate ? new Date(filters.toDate).getTime() : null;

    return requests.filter((row) => {
      if (filters.status !== 'ALL' && row.status !== filters.status) return false;
      if (filters.missionType !== 'ALL' && row.missionType !== filters.missionType) return false;
      if (filters.scoutId !== 'ALL' && row.targetScout?.id !== filters.scoutId) return false;
      if (filters.matchId !== 'ALL' && row.matchId !== filters.matchId) return false;

      const createdAtTs = new Date(row.createdAt).getTime();
      if (fromDate && createdAtTs < fromDate) return false;
      if (toDate && createdAtTs > toDate) return false;
      return true;
    });
  }, [filters, requests]);

  const sortedRequests = useMemo(() => {
    const rows = [...filteredRequests];
    if (sortMode === 'oldest') {
      rows.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
      return rows;
    }

    if (sortMode === 'status') {
      return rows.sort((left, right) => {
        const leftStatusOrder = STATUS_ORDER_FOR_SORT[left.status] ?? 99;
        const rightStatusOrder = STATUS_ORDER_FOR_SORT[right.status] ?? 99;
        if (leftStatusOrder !== rightStatusOrder) {
          return leftStatusOrder - rightStatusOrder;
        }
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
    }

    return rows.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [filteredRequests, sortMode]);

  const groupedByDay = useMemo(() => {
    const byDay = new Map<string, { date: Date; rows: MissionRequestListItem[] }>();
    for (const request of sortedRequests) {
      const date = new Date(request.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const existing = byDay.get(key);
      if (existing) {
        existing.rows.push(request);
      } else {
        byDay.set(key, { date, rows: [request] });
      }
    }
    return Array.from(byDay.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((entry) => ({
        ...entry,
        rows: entry.rows,
      }));
  }, [sortedRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshAll();
  }, [refreshAll]);

  const applyDatePreset = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'ALL') {
      setFilters((prev) => ({ ...prev, fromDate: undefined, toDate: undefined }));
      return;
    }

    const now = new Date();
    const deltaMs =
      preset === '24H'
        ? 24 * 60 * 60 * 1000
        : preset === '7D'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
    const from = new Date(now.getTime() - deltaMs);
    setFilters((prev) => ({
      ...prev,
      fromDate: from.toISOString(),
      toDate: now.toISOString(),
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      status: 'ALL',
      missionType: 'ALL',
      scoutId: 'ALL',
      matchId: route.params?.preselectedMatchId ?? 'ALL',
    }));
    setDatePreset('ALL');
    setSortMode('newest');
  }, [route.params?.preselectedMatchId]);

  const resetForm = useCallback(() => {
    setCreateInput({
      matchId: route.params?.preselectedMatchId ?? '',
      missionType: 'PRIORITY',
      targetScoutId: route.params?.preselectedScoutId ?? '',
      note: '',
    });
    setShowMatchMenu(false);
    setShowScoutMenu(Boolean(route.params?.preopenScoutMenu));
    setMatchSearch('');
    setScoutSearch('');
  }, [route.params?.preopenScoutMenu, route.params?.preselectedMatchId, route.params?.preselectedScoutId]);

  const handleCreateRequest = useCallback(async () => {
    if (!canCreate) return;
    if (!createInput.matchId) {
      Alert.alert('Match requis', 'Sélectionnez un match avant de soumettre.');
      return;
    }
    if (createInput.missionType === 'PRIORITY' && !createInput.targetScoutId) {
      Alert.alert('Scout requis', 'Une mission PRIORITY doit cibler un scout.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createMissionRequest(createInput.matchId, {
        missionType: createInput.missionType,
        targetScoutId:
          createInput.missionType === 'PRIORITY' ? createInput.targetScoutId || undefined : undefined,
        note: createInput.note?.trim() || undefined,
      });
      await refreshAll();
      resetForm();
      Alert.alert('Demande créée', 'La demande de mission est maintenant SUBMITTED.');
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error?.response?.data?.message ?? 'Impossible de créer la demande de mission.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [canCreate, createInput, refreshAll, resetForm]);

  const handleApprove = useCallback(
    async (row: MissionRequestListItem) => {
      if (!canApproveReject) return;
      try {
        setActingRequestId(row.id);
        await api.approveMissionRequest(row.id, {
          scoutId: row.targetScout?.id ?? undefined,
        });
        await refreshAll();
      } catch (error: any) {
        Alert.alert(
          'Erreur',
          error?.response?.data?.message ??
            "Impossible d'approuver cette demande. Rafraîchissez puis réessayez.",
        );
      } finally {
        setActingRequestId(null);
      }
    },
    [canApproveReject, refreshAll],
  );

  const handleReject = useCallback(
    async (row: MissionRequestListItem) => {
      if (!canApproveReject) return;
      try {
        setActingRequestId(row.id);
        await api.rejectMissionRequest(row.id);
        await refreshAll();
      } catch (error: any) {
        Alert.alert(
          'Erreur',
          error?.response?.data?.message ??
            "Impossible de rejeter cette demande. Rafraîchissez puis réessayez.",
        );
      } finally {
        setActingRequestId(null);
      }
    },
    [canApproveReject, refreshAll],
  );

  const handleCancel = useCallback(
    async (row: MissionRequestListItem) => {
      const isOwner = row.requestedBy?.id === user?.id;
      const canCancel = row.status === 'SUBMITTED' && (isAdmin || (isAgent && isOwner));
      if (!canCancel) return;
      try {
        setActingRequestId(row.id);
        await api.cancelMissionRequest(row.id);
        await refreshAll();
      } catch (error: any) {
        Alert.alert(
          'Erreur',
          error?.response?.data?.message ??
            "Impossible d'annuler cette demande. Rafraîchissez puis réessayez.",
        );
      } finally {
        setActingRequestId(null);
      }
    },
    [isAdmin, isAgent, refreshAll, user?.id],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Mission Requests" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Chargement des demandes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canSee) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Mission Requests" />
        <View style={styles.centered}>
          <Icon name="lock" size={44} color={colors.text.secondary} />
          <Text style={styles.restrictedTitle}>Accès non autorisé</Text>
          <Text style={styles.restrictedBody}>
            Votre rôle ne peut pas consulter ce hub.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Mission Requests" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <GlassCard variant="featured" style={styles.heroCard}>
          <SectionHeader
            title="Mission Requests"
            subtitle="Hub de coordination terrain"
            rightAction={
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText}>Scope</Text>
                <View style={styles.scopeBadge}>
                  <Text style={styles.scopeBadgeText}>{requestScopeLabel}</Text>
                </View>
              </View>
            }
          />

          <View style={styles.countSummaryRow}>
            <View style={styles.countSummaryCard}>
              <Text style={styles.countSummaryLabel}>Demandes visibles</Text>
              <Text style={styles.countSummaryValue}>{sortedRequests.length}</Text>
            </View>
            <View style={styles.countSummaryCard}>
              <Text style={styles.countSummaryLabel}>Demandes actives</Text>
              <Text style={styles.countSummaryValue}>{statusCounts.SUBMITTED}</Text>
            </View>
            <Button
              variant="outline"
              size="sm"
              style={styles.heroActionButton}
              onPress={() => setShowCreatePanel((prev) => !prev)}
              icon={<Icon name={showCreatePanel ? 'edit' : 'add'} size={16} color={colors.text.secondary} />}
            >
              {showCreatePanel ? 'Modifier' : 'Nouvelle demande'}
            </Button>
          </View>

          <View style={styles.countRow}>
            {STATUS_ORDER.map((status) => (
              <View key={status} style={[styles.countChip, { borderColor: `${STATUS_COLORS[status]}80` }]}> 
                <Text style={styles.countLabel}>{STATUS_LABELS[status]}</Text>
                <Text style={[styles.countValue, { color: STATUS_COLORS[status] }]}> 
                  {statusCounts[status]}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard variant="elevated" style={styles.card}>
          <SectionHeader
            title="Créer une demande"
            subtitle="Assignez une mission à un scout"
            rightAction={
              canCreate ? (
                <Button variant="ghost" size="sm" onPress={() => setShowCreatePanel((prev) => !prev)}>
                  {showCreatePanel ? 'Masquer' : 'Afficher'}
                </Button>
              ) : null
            }
          />
          {canCreate && showCreatePanel ? (
            <>
              <Text style={styles.fieldLabel}>Type</Text>
              <SegmentedControl<MissionType>
                options={MISSION_TYPE_OPTIONS}
                value={createInput.missionType}
                onChange={(missionType: MissionType) =>
                  setCreateInput((prev) => ({
                    ...prev,
                    missionType,
                    targetScoutId: missionType === 'PRIORITY' ? prev.targetScoutId : '',
                  }))
                }
              />

              <Select
                value={selectedCreateMatch ? matchLabel(selectedCreateMatch) : ''}
                label="Match"
                placeholder="Sélectionner un match"
                onPress={() => {
                  setShowScoutMenu(false);
                  setShowMatchMenu((prev) => !prev);
                }}
                style={styles.selectField}
              />
              {showMatchMenu ? (
                <View style={styles.dropdownPanel}>
                  <TextInput
                    value={matchSearch}
                    onChangeText={setMatchSearch}
                    placeholder="Rechercher un match..."
                    placeholderTextColor={colors.text.secondary}
                    style={styles.dropdownSearchInput}
                  />
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {filteredCreateMatches.length === 0 ? (
                      <Text style={styles.dropdownEmpty}>Aucun match trouvé.</Text>
                    ) : (
                      filteredCreateMatches.map((match) => {
                        const active = createInput.matchId === match.id;
                        return (
                          <TouchableOpacity
                            key={match.id}
                            style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                            onPress={() => {
                              setCreateInput((prev) => ({ ...prev, matchId: match.id }));
                              setShowMatchMenu(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemTitle,
                                active && styles.dropdownItemTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {matchLabel(match)}
                            </Text>
                            {match.scheduledAt ? (
                              <Text style={styles.dropdownItemMeta}>
                                {formatMatchDate(match.scheduledAt)}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              ) : null}

              {createInput.missionType === 'PRIORITY' ? (
                <>
                  <Select
                    value={selectedCreateScout ? toDisplayName(selectedCreateScout) : ''}
                    label="Scout cible"
                    placeholder="Sélectionner un scout"
                    onPress={() => {
                      setShowMatchMenu(false);
                      setShowScoutMenu((prev) => !prev);
                    }}
                    style={styles.selectField}
                  />
                  {showScoutMenu ? (
                    <View style={styles.dropdownPanel}>
                      <TextInput
                        value={scoutSearch}
                        onChangeText={setScoutSearch}
                        placeholder="Rechercher un scout..."
                        placeholderTextColor={colors.text.secondary}
                        style={styles.dropdownSearchInput}
                      />
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        {filteredCreateScouts.length === 0 ? (
                          <Text style={styles.dropdownEmpty}>Aucun scout trouvé.</Text>
                        ) : (
                          filteredCreateScouts.map((scout) => {
                            const active = createInput.targetScoutId === scout.id;
                            return (
                              <TouchableOpacity
                                key={scout.id}
                                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                                onPress={() => {
                                  setCreateInput((prev) => ({
                                    ...prev,
                                    targetScoutId: scout.id,
                                  }));
                                  setShowScoutMenu(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.dropdownItemTitle,
                                    active && styles.dropdownItemTitleActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {toDisplayName(scout)}
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </ScrollView>
                    </View>
                  ) : null}
                </>
              ) : null}

              <Text style={styles.fieldLabel}>Note (optionnel)</Text>
              <TextInput
                value={createInput.note}
                onChangeText={(value) => setCreateInput((prev) => ({ ...prev, note: value }))}
                placeholder="Contexte de la mission"
                placeholderTextColor={colors.text.secondary}
                style={styles.noteInput}
                multiline
              />

              <Button
                variant="primary"
                size="md"
                loading={submitting}
                onPress={handleCreateRequest}
                disabled={submitting}
                icon={<Icon name="add" size={18} color={colors.background.primary} />}
              >
                Soumettre la demande
              </Button>
            </>
          ) : null}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.card}>
          <SectionHeader
            title="Filtres"
            subtitle={`${sortedRequests.length} résultat${sortedRequests.length > 1 ? 's' : ''}`}
            rightAction={
              <View style={styles.filterTopActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowFilterPanel((prev) => !prev)}
                  icon={
                    <Icon
                      name={showFilterPanel ? 'remove' : 'funnel'}
                      size={16}
                      color={colors.text.secondary}
                    />
                  }
                >
                  {showFilterPanel ? 'Masquer' : 'Filtres'}
                </Button>
                <Button variant="outline" size="sm" onPress={resetFilters}>
                  Réinitialiser
                </Button>
              </View>
            }
          />

          {showFilterPanel ? (
            <>
              <View style={styles.filterBlock}>
                <Text style={styles.fieldLabel}>Statut</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                  {(['ALL', ...STATUS_ORDER] as Array<MissionRequestStatus | 'ALL'>).map((status) => {
                    const active = filters.status === status;
                    const label = status === 'ALL' ? 'Tous' : STATUS_LABELS[status];
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.selectorChip, active && styles.selectorChipActive]}
                        onPress={() => setFilters((prev) => ({ ...prev, status }))}
                      >
                        <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.filterBlock}>
                <Text style={styles.fieldLabel}>Type de mission</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                  {(['ALL', 'PRIORITY', 'VOLUNTARY'] as Array<MissionType | 'ALL'>).map((missionType) => {
                    const active = filters.missionType === missionType;
                    const label = missionType === 'ALL' ? 'Tous' : MISSION_TYPE_LABELS[missionType];
                    return (
                      <TouchableOpacity
                        key={missionType}
                        style={[styles.selectorChip, active && styles.selectorChipActive]}
                        onPress={() => setFilters((prev) => ({ ...prev, missionType }))}
                      >
                        <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {filterScoutOptions.length > 0 ? (
                <View style={styles.filterBlock}>
                  <Text style={styles.fieldLabel}>Scout</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                    <TouchableOpacity
                      style={[styles.selectorChip, filters.scoutId === 'ALL' && styles.selectorChipActive]}
                      onPress={() => setFilters((prev) => ({ ...prev, scoutId: 'ALL' }))}
                    >
                      <Text style={[styles.selectorChipText, filters.scoutId === 'ALL' && styles.selectorChipTextActive]}>
                        Tous
                      </Text>
                    </TouchableOpacity>
                    {filterScoutOptions.map((scout) => {
                      const active = filters.scoutId === scout.id;
                      return (
                        <TouchableOpacity
                          key={scout.id}
                          style={[styles.selectorChip, active && styles.selectorChipActive]}
                          onPress={() => setFilters((prev) => ({ ...prev, scoutId: scout.id }))}
                        >
                          <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                            {toDisplayName(scout)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {filterMatchOptions.length > 0 ? (
                <View style={styles.filterBlock}>
                  <Text style={styles.fieldLabel}>Match</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                    <TouchableOpacity
                      style={[styles.selectorChip, filters.matchId === 'ALL' && styles.selectorChipActive]}
                      onPress={() => setFilters((prev) => ({ ...prev, matchId: 'ALL' }))}
                    >
                      <Text style={[styles.selectorChipText, filters.matchId === 'ALL' && styles.selectorChipTextActive]}>
                        Tous
                      </Text>
                    </TouchableOpacity>
                    {filterMatchOptions.map((match) => {
                      const active = filters.matchId === match.id;
                      return (
                        <TouchableOpacity
                          key={match.id}
                          style={[styles.selectorChip, active && styles.selectorChipActive]}
                          onPress={() => setFilters((prev) => ({ ...prev, matchId: match.id }))}
                        >
                          <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                            {matchLabel(match)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.filterBlock}>
                <Text style={styles.fieldLabel}>Période</Text>
                <SegmentedControl<DatePreset>
                  options={DATE_PRESET_OPTIONS}
                  value={datePreset}
                  onChange={(value: DatePreset) => applyDatePreset(value)}
                />
              </View>

              <View style={styles.filterBlock}>
                <Text style={styles.fieldLabel}>Tri</Text>
                <SegmentedControl<SortMode>
                  options={SORT_OPTIONS}
                  value={sortMode}
                  onChange={(value: SortMode) => setSortMode(value)}
                />
              </View>
            </>
          ) : null}
        </GlassCard>

        {groupedByDay.length === 0 ? (
          <GlassCard variant="elevated" style={styles.emptyCard}>
            <Icon name="clipboard" size={36} color={colors.text.secondary} />
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyBody}>Aucune demande de mission pour les filtres actifs.</Text>
          </GlassCard>
        ) : (
          groupedByDay.map((group) => (
            <View key={group.date.toISOString()} style={styles.dayGroup}>
              <Text style={styles.dayTitle}>
                {group.date.toLocaleDateString(locale, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
              {group.rows.map((row) => {
                const statusColor = STATUS_COLORS[row.status];
                const missionTypeColor =
                  row.missionType === 'PRIORITY' ? colors.brand.primary : colors.accent;
                const missionTypeLabel =
                  row.missionType === 'PRIORITY' ? 'Mission prioritaire' : 'Mission volontaire';
                const matchTime = formatMatchTime(row.match?.scheduledAt);
                const isSubmitted = row.status === 'SUBMITTED';
                const isOwner = row.requestedBy?.id === user?.id;
                const canCancel = isSubmitted && (isAdmin || (isAgent && isOwner));
                return (
                  <GlassCard key={row.id} variant="elevated" style={styles.requestCard}>
                    <View style={styles.requestTone}> 
                      <View style={[styles.requestToneBar, { backgroundColor: missionTypeColor }]} />
                    </View>
                    <View style={styles.requestBody}>
                      <View style={styles.requestHeader}>
                        <View style={styles.requestTitleBlock}>
                          <Text style={styles.requestMatchLabel}>{matchLabel(row.match as MatchOption)}</Text>
                          <View style={styles.requestDateRow}>
                            <Icon name="calendar" size={12} color={colors.text.secondary} />
                            <Text style={styles.requestDate}>Créé {new Date(row.createdAt).toLocaleString(locale)}</Text>
                          </View>
                        </View>
                        <View style={styles.badgeStack}>
                          <View style={[styles.typeBadge, { borderColor: `${missionTypeColor}66` }]}> 
                            <Text style={[styles.typeBadgeText, { color: missionTypeColor }]}> 
                              {missionTypeLabel}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { borderColor: `${statusColor}88` }]}> 
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}> 
                              {STATUS_LABELS[row.status]}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.requestMetaGrid}>
                        <View style={styles.requestMetaCell}>
                          <Text style={styles.requestLine}>Scout cible</Text>
                          <Text style={styles.requestValue}>{toDisplayName(row.targetScout)}</Text>
                        </View>
                        <View style={styles.requestMetaCell}>
                          <Text style={styles.requestLine}>Demandeur</Text>
                          <Text style={styles.requestValue}>{toDisplayName(row.requestedBy)}</Text>
                        </View>
                        <View style={styles.requestMetaCell}>
                          <Text style={styles.requestLine}>Match</Text>
                          <Text style={styles.requestValue}>{matchTime ?? 'Non planifié'}</Text>
                        </View>
                      </View>

                      {row.note ? <Text style={styles.requestNote}>{row.note}</Text> : null}

                      <View style={styles.rowActions}>
                          <Button
                            variant="outline"
                            size="sm"
                            onPress={() =>
                              navigation.navigate('MatchDetail', {
                                matchId: row.matchId,
                              })
                            }
                            icon={<Icon name="football" size={14} color={colors.text.secondary} />}
                          >
                            Voir le match
                          </Button>

                        {isSubmitted && canApproveReject ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onPress={() => handleApprove(row)}
                              disabled={actingRequestId === row.id}
                              loading={actingRequestId === row.id}
                              icon={<Icon name="checkmark" size={16} color={colors.text.secondary} />}
                            >
                              Approuver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onPress={() => handleReject(row)}
                              disabled={actingRequestId === row.id}
                              loading={actingRequestId === row.id}
                              icon={<Icon name="close" size={16} color={colors.text.secondary} />}
                            >
                              Rejeter
                            </Button>
                          </>
                        ) : null}

                        {canCancel ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onPress={() => handleCancel(row)}
                            disabled={actingRequestId === row.id}
                            loading={actingRequestId === row.id}
                            icon={<Icon name="delete" size={16} color={colors.text.secondary} />}
                          >
                            Annuler
                          </Button>
                        ) : null}
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MissionRequestsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  heroCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  heroMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  heroMetaText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xxs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scopeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.focus,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.border.focus}1A`,
  },
  scopeBadgeText: {
    color: colors.border.focus,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  heroActionButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
  },
  countSummaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  countSummaryCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: `${colors.surface.glass}`,
    padding: spacing.sm,
  },
  countSummaryLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginBottom: 2,
  },
  countSummaryValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '800',
  },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  countChip: {
    minWidth: '23%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    gap: 2,
  },
  countValue: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
  },
  countLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  filterTopActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  filterBlock: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectField: {
    marginBottom: spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentChip: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glass,
    gap: 2,
  },
  segmentChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}22`,
  },
  segmentChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  segmentChipTextActive: {
    color: colors.brand.primary,
  },
  segmentChipHint: {
    color: colors.text.secondary,
    fontSize: 11,
  },
  dropdownTrigger: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dropdownTriggerOpen: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}18`,
  },
  dropdownTextWrap: {
    flex: 1,
    gap: 2,
  },
  dropdownValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  dropdownValuePlaceholder: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dropdownMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  dropdownPanel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: 'rgba(15,23,42,0.86)',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  dropdownSearchInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(2,6,23,0.55)',
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: typography.sizes.sm,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  dropdownItemActive: {
    borderColor: `${colors.brand.primary}88`,
    backgroundColor: `${colors.brand.primary}20`,
  },
  dropdownItemTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  dropdownItemTitleActive: {
    color: colors.brand.primary,
  },
  dropdownItemMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  dropdownEmpty: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectorRow: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  selectorChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface.glass,
    maxWidth: 280,
  },
  selectorChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}22`,
  },
  selectorChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  selectorChipTextActive: {
    color: colors.brand.primary,
  },
  noteInput: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    minHeight: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
  createButton: {
    marginTop: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  createButtonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  dayGroup: {
    gap: spacing.xs,
  },
  dayTitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  requestCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  requestTone: {
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.xs,
  },
  requestToneBar: {
    height: 2,
    width: '100%',
    borderRadius: 2,
  },
  requestBody: {
    gap: spacing.xs,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requestTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeBadgeText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xxs,
    fontWeight: '700',
  },
  requestDate: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  requestMatchLabel: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  requestMetaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  requestDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  requestMetaCell: {
    minWidth: '32%',
    flex: 1,
    gap: 2,
  },
  requestLine: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  requestValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  requestNote: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  linkButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  linkButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  approveButton: {
    backgroundColor: '#16A34A',
  },
  rejectButton: {
    backgroundColor: '#EA580C',
  },
  cancelButton: {
    backgroundColor: '#64748B',
  },
  actionButtonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  restrictedTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  restrictedBody: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
