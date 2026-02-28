import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../design/theme';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type {
  PlayerDailyActivityType,
  PlayerDailyTimelineEntry,
  PlayerMatchAvailability,
  PlayerSpacePayload,
  PlayerSpaceSubmitPayload,
  UserRole,
} from '../../types';
import type { HardwareSession } from '../../types/hardware';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Jamais';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const parseOptionalNumber = (value: string) => {
  if (value.trim().length === 0) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const getWeekStartDate = (baseDate?: Date | number) => {
  const value = new Date(baseDate ?? Date.now());
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diff = (day + 6) % 7;
  value.setDate(value.getDate() - diff);
  return value;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const WEEK_DAYS = 7;

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDefaultDailyTimeline = (weekStart: Date): PlayerDailyTimelineEntry[] =>
  Array.from({ length: WEEK_DAYS }, (_, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    return {
      dayKey: toDateKey(dayDate),
      activityType: 'NONE',
      linkedMatchId: null,
      braceletSynced: null,
      gpsDistanceM: null,
      matchAvailability: null,
      matchStats: null,
      videoUploaded: null,
      notes: null,
    };
  });

const mergeDailyTimeline = (
  weekStart: Date,
  incoming?: PlayerDailyTimelineEntry[] | null,
): PlayerDailyTimelineEntry[] => {
  const defaults = buildDefaultDailyTimeline(weekStart);
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return defaults;
  }

  const byDay = new Map<string, PlayerDailyTimelineEntry>();
  for (const entry of incoming) {
    if (!entry?.dayKey) continue;
    byDay.set(entry.dayKey, entry);
  }

  return defaults.map((entry) => {
    const incomingEntry = byDay.get(entry.dayKey);
    if (!incomingEntry) return entry;
    return {
      ...entry,
      ...incomingEntry,
      dayKey: entry.dayKey,
      activityType: incomingEntry.activityType ?? 'NONE',
    };
  });
};

const isMatchActivity = (activity: PlayerDailyActivityType) =>
  activity === 'MATCH' || activity === 'BOTH';

const isTrainingActivity = (activity: PlayerDailyActivityType) =>
  activity === 'TRAINING' || activity === 'BOTH' || activity === 'PERSONAL';

const isDailyEntryComplete = (entry: PlayerDailyTimelineEntry) => {
  if (entry.activityType === 'NONE' || entry.activityType === 'REST') {
    return true;
  }

  if (entry.activityType === 'PERSONAL') {
    return Boolean(entry.notes?.trim().length);
  }

  if (entry.activityType === 'TRAINING') {
    return entry.braceletSynced !== null || Boolean(entry.notes?.trim().length);
  }

  const unavailable =
    entry.matchAvailability === 'ABSENT' ||
    entry.matchAvailability === 'INJURED' ||
    entry.matchAvailability === 'NOT_CALLED';
  const hasMatchAvailability = Boolean(entry.matchAvailability);
  const hasMatchStats = unavailable || Boolean(entry.matchStats?.trim().length);
  const hasGps = unavailable || Boolean((entry.gpsDistanceM ?? 0) > 0);
  const hasTrainingSync = !isTrainingActivity(entry.activityType) || entry.braceletSynced !== null;

  return hasMatchAvailability && hasMatchStats && hasGps && hasTrainingSync;
};

const toWeeklyMatchAvailability = (value: string): PlayerMatchAvailability => {
  if (value === 'PLAYING' || value === 'BENCH' || value === 'INJURED' || value === 'ABSENT') {
    return value;
  }
  return value === 'NOT_CALLED' ? 'ABSENT' : 'PLAYING';
};

const initialForm: PlayerSpaceSubmitPayload = {
  minutesPlayed: 0,
  goals: 0,
  assists: 0,
  matchesPlayed: 0,
  matchesNotPlayed: 0,
  isInjured: false,
  highlightsUploaded: 0,
  gpsSyncConfirmed: false,
};

const dailyActivityOptions: Array<{
  label: string;
  value: PlayerDailyActivityType;
  helper: string;
}> = [
  { label: 'Repos', value: 'REST', helper: 'Pas de séance prévue' },
  { label: 'Entraînement', value: 'TRAINING', helper: 'Séance club ou perso' },
  { label: 'Match', value: 'MATCH', helper: 'Jour de match' },
  { label: 'Les deux', value: 'BOTH', helper: 'Entraînement + match' },
  { label: 'Perso', value: 'PERSONAL', helper: 'Renfo, salle, travail individuel' },
  { label: 'Aucune donnée', value: 'NONE', helper: 'À compléter plus tard' },
];

const dailyMatchAvailabilityOptions: Array<{ label: string; value: string }> = [
  { label: 'Titulaire', value: 'PLAYING' },
  { label: 'Banc', value: 'BENCH' },
  { label: 'Non convoqué', value: 'NOT_CALLED' },
  { label: 'Absent', value: 'ABSENT' },
  { label: 'Blessé', value: 'INJURED' },
];

const AUTO_SPACE_REFRESH_COOLDOWN_MS = 30_000;

type BraceletSyncHistoryItem = {
  id: string;
  endedAt: string;
  type: string;
  source: string | null;
  steps: number;
  distanceM: number;
};

export const PlayerSpaceScreen = () => {
  const { user, activeRole, isLoading: isAuthLoading } = useAuth();
  const role = activeRole ?? user?.role;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [space, setSpace] = useState<PlayerSpacePayload | null>(null);
  const [form, setForm] = useState<PlayerSpaceSubmitPayload>(initialForm);
  const [remarks, setRemarks] = useState('');
  const [resolvedPlayerId, setResolvedPlayerId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedMatchAvailability, setSelectedMatchAvailability] =
    useState<PlayerMatchAvailability>('PLAYING');
  const [braceletSyncHistory, setBraceletSyncHistory] = useState<BraceletSyncHistoryItem[]>([]);
  const [recentWeeklyHighlights, setRecentWeeklyHighlights] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [dailyTimeline, setDailyTimeline] = useState<PlayerDailyTimelineEntry[]>(() =>
    buildDefaultDailyTimeline(getWeekStartDate()),
  );
  const [activeDayKey, setActiveDayKey] = useState<string>(() => toDateKey(new Date()));
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [selectedCalendarDayKey, setSelectedCalendarDayKey] = useState<string>(() => toDateKey(new Date()));
  const [isMatchPickerOpen, setIsMatchPickerOpen] = useState(false);
  const loadInFlightRef = useRef(false);
  const lastAutoLoadAtRef = useRef(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const weeklyFormYRef = useRef(0);
  const roleSet = useMemo(() => {
    const roles: UserRole[] = [];
    if (role) {
      roles.push(role);
    }
    if (Array.isArray(user?.roles)) {
      for (const candidate of user.roles) {
        if (!roles.includes(candidate as UserRole)) {
          roles.push(candidate as UserRole);
        }
      }
    }
    return new Set<UserRole>(roles);
  }, [role, user?.roles]);

  const playerName = useMemo(() => {
    if (space?.player?.fullName) {
      return space.player.fullName;
    }
    const first = user?.firstName ?? '';
    const last = user?.lastName ?? '';
    return `${first} ${last}`.trim() || 'Joueur';
  }, [space, user?.firstName, user?.lastName]);

  const isPlayerAccess = useMemo(() => roleSet.has('PLAYER'), [roleSet]);

  const loadSpace = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force === true;

    if (
      !force &&
      lastAutoLoadAtRef.current > 0 &&
      Date.now() - lastAutoLoadAtRef.current < AUTO_SPACE_REFRESH_COOLDOWN_MS
    ) {
      return;
    }

    if (loadInFlightRef.current) {
      return;
    }
    loadInFlightRef.current = true;

    if (isAuthLoading) {
      loadInFlightRef.current = false;
      return;
    }

    if (!isPlayerAccess) {
      setError('Accès réservé aux comptes joueur.');
      setLoading(false);
      setSpace(null);
      loadInFlightRef.current = false;
      return;
    }

    let resolvedPlayerId: string | null = user?.playerId ?? null;
    if (!resolvedPlayerId) {
      try {
        const currentUser = await api.getCurrentUser();
        resolvedPlayerId = currentUser?.playerId ?? null;
      } catch {
        resolvedPlayerId = null;
      }
    }

    if (!resolvedPlayerId) {
      setError("Votre compte n'est pas encore lié à un profil joueur.");
      setLoading(false);
      loadInFlightRef.current = false;
      return;
    }

    if (!force) {
      setLoading(true);
    }
    setError(null);
    try {
      const weekStart = getWeekStartDate();
      const [data, mediaItems, hardwareSessions] = await Promise.all([
        api.getMyPlayerSpace(resolvedPlayerId),
        api
          .getPlayerMedia(resolvedPlayerId)
          .catch(() => [] as Array<{ type?: string; uploadedAt?: string | null }>),
        api.getHardwareSessions(resolvedPlayerId).catch(() => [] as HardwareSession[]),
      ]);
      const weeklyHighlights = (Array.isArray(mediaItems) ? mediaItems : []).filter((item) => {
        if (String(item?.type ?? '').toUpperCase() !== 'VIDEO') return false;
        const uploadedAt = item?.uploadedAt ? new Date(item.uploadedAt) : null;
        return !!uploadedAt && !Number.isNaN(uploadedAt.getTime()) && uploadedAt >= weekStart;
      }).length;
      setRecentWeeklyHighlights(weeklyHighlights);
      setSpace(data);
      setResolvedPlayerId(resolvedPlayerId);
      const normalizedHistory = (Array.isArray(hardwareSessions) ? hardwareSessions : [])
        .map((session) => {
          const metrics = session.metrics ?? {};
          return {
            id: session.id,
            endedAt: session.endedAt,
            type: session.type,
            source: typeof session.source === 'string' ? session.source : null,
            steps: Math.max(0, Math.round(metrics.reductionStepsCount ?? 0)),
            distanceM: Math.max(0, Math.round(metrics.movementDistanceM ?? 0)),
          } as BraceletSyncHistoryItem;
        })
        .filter((session) => Boolean(session.endedAt))
        .sort((left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime())
        .slice(0, 10);
      setBraceletSyncHistory(normalizedHistory);
      const latest = data?.weekly?.latest;
      setForm({
        minutesPlayed: latest?.minutesPlayed ?? data?.snapshot?.minutesPlayed ?? 0,
        goals: latest?.goals ?? data?.snapshot?.goals ?? 0,
        assists: latest?.assists ?? data?.snapshot?.assists ?? 0,
        matchesPlayed: latest?.matchesPlayed ?? data?.snapshot?.matchesPlayed ?? 0,
        matchesNotPlayed: latest?.matchesNotPlayed ?? data?.snapshot?.matchesNotPlayed ?? 0,
        isInjured: latest?.isInjured ?? data?.snapshot?.isInjured ?? false,
        healthStatus: latest?.healthStatus ?? (data?.snapshot?.isInjured ? 'INJURY' : 'NORMAL'),
        selectedMatchId: latest?.selectedMatchId ?? undefined,
        selectedMatchAvailability: latest?.selectedMatchAvailability ?? undefined,
        selectedMatchTeamScore: latest?.selectedMatchTeamScore ?? undefined,
        selectedMatchOpponentScore: latest?.selectedMatchOpponentScore ?? undefined,
        selectedMatchRating: latest?.selectedMatchRating ?? undefined,
        highlightsUploaded: latest?.highlightsUploaded ?? weeklyHighlights ?? 0,
        gpsSyncConfirmed:
          latest?.gpsSyncConfirmed ??
          Boolean(latest?.trackerSteps || latest?.trackerDistanceM || latest?.trackerSource),
        trackerSteps: latest?.trackerSteps ?? undefined,
        trackerDistanceM: latest?.trackerDistanceM ?? undefined,
        trackerSource: latest?.trackerSource ?? undefined,
      });
      setRemarks(latest?.remarks ?? '');
      setSelectedMatchId(latest?.selectedMatchId ?? '');
      setSelectedMatchAvailability(latest?.selectedMatchAvailability ?? 'PLAYING');
      const timeline = mergeDailyTimeline(weekStart, latest?.dailyTimeline);
      setDailyTimeline(timeline);
      const todayKey = toDateKey(new Date());
      const nextActiveDay =
        timeline.find((entry) => entry.dayKey === todayKey)?.dayKey ??
        timeline[0]?.dayKey ??
        todayKey;
      setActiveDayKey(nextActiveDay);
      setError(null);
      lastAutoLoadAtRef.current = Date.now();
    } catch (e: any) {
      setError(
        e?.message || "Impossible de charger l'espace joueur.",
      );
    } finally {
      if (!force) {
        setLoading(false);
      }
      loadInFlightRef.current = false;
    }
  }, [isAuthLoading, isPlayerAccess, user?.playerId]);

  useEffect(() => {
    void loadSpace();
  }, [loadSpace]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNowTick(Date.now());
    }, 60_000);
    return () => clearInterval(timerId);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSpace({ force: true });
    setRefreshing(false);
  }, [loadSpace]);

  const weekWindow = useMemo(() => {
    const weekStart = getWeekStartDate(nowTick);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const remainingMs = Math.max(0, weekEnd.getTime() - nowTick);
    const remainingDays = Math.floor(remainingMs / DAY_MS);
    const remainingHours = Math.floor((remainingMs % DAY_MS) / HOUR_MS);

    let remainingLabel = 'Semaine clôturée';
    if (remainingMs > 0) {
      remainingLabel =
        remainingDays > 0
          ? `Il reste ${remainingDays} j ${remainingHours} h`
          : `Il reste ${Math.max(1, remainingHours)} h`;
    }

    return {
      weekStart,
      weekEnd,
      remainingLabel,
    };
  }, [nowTick]);

  const weekStartKey = useMemo(() => toDateKey(weekWindow.weekStart), [weekWindow.weekStart]);

  const weekDays = useMemo(() => {
    const weekStartDate = new Date(`${weekStartKey}T00:00:00`);
    return Array.from({ length: WEEK_DAYS }, (_, index) => {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);
      return {
        dayKey: toDateKey(dayDate),
        label: dayDate.toLocaleDateString('fr-FR', { weekday: 'short' }),
        dateLabel: dayDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      };
    });
  }, [weekStartKey]);

  useEffect(() => {
    setDailyTimeline((prev) => {
      const defaults = buildDefaultDailyTimeline(new Date(`${weekStartKey}T00:00:00`));
      const byDay = new Map(prev.map((entry) => [entry.dayKey, entry]));
      return defaults.map((entry) => {
        const existing = byDay.get(entry.dayKey);
        if (!existing) return entry;
        return {
          ...entry,
          ...existing,
          dayKey: entry.dayKey,
          activityType: existing.activityType ?? 'NONE',
        };
      });
    });
  }, [weekStartKey]);

  useEffect(() => {
    if (weekDays.some((day) => day.dayKey === activeDayKey)) {
      return;
    }
    const todayKey = toDateKey(new Date(nowTick));
    const fallbackDayKey =
      weekDays.find((day) => day.dayKey === todayKey)?.dayKey ?? weekDays[0]?.dayKey ?? todayKey;
    setActiveDayKey(fallbackDayKey);
  }, [activeDayKey, nowTick, weekDays]);

  const activeDailyEntry = useMemo(() => {
    if (!dailyTimeline.length) {
      return null;
    }
    return (
      dailyTimeline.find((entry) => entry.dayKey === activeDayKey) ??
      dailyTimeline[0] ??
      null
    );
  }, [activeDayKey, dailyTimeline]);

  useEffect(() => {
    setIsMatchPickerOpen(false);
  }, [activeDayKey]);

  useEffect(() => {
    if (!activeDailyEntry) return;
    if (activeDailyEntry.linkedMatchId) {
      setSelectedMatchId(activeDailyEntry.linkedMatchId);
    } else {
      setSelectedMatchId('');
    }
  }, [activeDailyEntry]);

  const updateDailyEntry = useCallback(
    (dayKey: string, updater: (entry: PlayerDailyTimelineEntry) => PlayerDailyTimelineEntry) => {
      setDailyTimeline((previous) =>
        previous.map((entry) => (entry.dayKey === dayKey ? updater(entry) : entry)),
      );
    },
    [],
  );

  const dailyTimelineSummary = useMemo(() => {
    const items = weekDays.map((day) => {
      const entry = dailyTimeline.find((candidate) => candidate.dayKey === day.dayKey) ?? null;
      const done = entry ? isDailyEntryComplete(entry) : false;
      const label =
        dailyActivityOptions.find((option) => option.value === entry?.activityType)?.label ??
        'Aucune donnée';
      return {
        key: day.dayKey,
        dayLabel: `${day.label} ${day.dateLabel}`,
        activityLabel: label,
        done,
      };
    });

    return {
      items,
      completed: items.filter((item) => item.done).length,
      total: items.length,
    };
  }, [dailyTimeline, weekDays]);

  const dailyTimelineStats = useMemo(() => {
    let matchesPlayed = 0;
    let matchesNotPlayed = 0;
    let totalGpsDistanceM = 0;
    let timelineVideosUploaded = 0;
    let hasBraceletSync = false;
    let hasInjury = false;

    for (const entry of dailyTimeline) {
      if (entry.braceletSynced === true) {
        hasBraceletSync = true;
      }
      if (entry.videoUploaded === true) {
        timelineVideosUploaded += 1;
      }
      totalGpsDistanceM += Math.max(0, entry.gpsDistanceM ?? 0);

      if (!isMatchActivity(entry.activityType)) {
        continue;
      }

      if (entry.matchAvailability === 'PLAYING' || entry.matchAvailability === 'BENCH') {
        matchesPlayed += 1;
      } else if (
        entry.matchAvailability === 'ABSENT' ||
        entry.matchAvailability === 'INJURED' ||
        entry.matchAvailability === 'NOT_CALLED'
      ) {
        matchesNotPlayed += 1;
      }

      if (entry.matchAvailability === 'INJURED') {
        hasInjury = true;
      }
    }

    return {
      matchesPlayed,
      matchesNotPlayed,
      totalGpsDistanceM,
      videosUploaded: Math.max(recentWeeklyHighlights, timelineVideosUploaded),
      hasBraceletSync,
      hasInjury,
    };
  }, [dailyTimeline, recentWeeklyHighlights]);

  const calendarWeekStart = useMemo(() => {
    const baseStart = getWeekStartDate(nowTick);
    const offsetStart = new Date(baseStart);
    offsetStart.setDate(baseStart.getDate() + calendarWeekOffset * WEEK_DAYS);
    return offsetStart;
  }, [calendarWeekOffset, nowTick]);

  const calendarWeekDays = useMemo(() => {
    return Array.from({ length: WEEK_DAYS }, (_, index) => {
      const dayDate = new Date(calendarWeekStart);
      dayDate.setDate(calendarWeekStart.getDate() + index);
      return {
        dayKey: toDateKey(dayDate),
        dayLabel: dayDate.toLocaleDateString('fr-FR', { weekday: 'short' }),
        dateLabel: dayDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      };
    });
  }, [calendarWeekStart]);

  const calendarWeekLabel = useMemo(() => {
    const weekEnd = new Date(calendarWeekStart);
    weekEnd.setDate(calendarWeekStart.getDate() + 6);
    return `${calendarWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
  }, [calendarWeekStart]);

  useEffect(() => {
    const todayKey = toDateKey(new Date(nowTick));
    const defaultDay =
      calendarWeekDays.find((day) => day.dayKey === todayKey)?.dayKey ??
      calendarWeekDays[0]?.dayKey ??
      todayKey;
    if (!calendarWeekDays.some((day) => day.dayKey === selectedCalendarDayKey)) {
      setSelectedCalendarDayKey(defaultDay);
    }
  }, [calendarWeekDays, nowTick, selectedCalendarDayKey]);

  const calendarMatchesByDay = useMemo(() => {
    const validDays = new Set(calendarWeekDays.map((day) => day.dayKey));
    const grouped = new Map<string, NonNullable<PlayerSpacePayload['upcomingCalendar']>>();
    for (const match of space?.upcomingCalendar ?? []) {
      const scheduled = new Date(match.scheduledAt);
      if (Number.isNaN(scheduled.getTime())) continue;
      const dayKey = toDateKey(scheduled);
      if (!validDays.has(dayKey)) continue;
      const current = grouped.get(dayKey) ?? [];
      current.push(match);
      grouped.set(dayKey, current);
    }
    return grouped;
  }, [calendarWeekDays, space?.upcomingCalendar]);

  const selectedCalendarMatches = useMemo(
    () => calendarMatchesByDay.get(selectedCalendarDayKey) ?? [],
    [calendarMatchesByDay, selectedCalendarDayKey],
  );

  const dailyActivityByDay = useMemo(() => {
    const map = new Map<string, PlayerDailyActivityType>();
    for (const entry of dailyTimeline) {
      map.set(entry.dayKey, entry.activityType);
    }
    return map;
  }, [dailyTimeline]);

  const selectedActiveDayMatch = useMemo(() => {
    if (!activeDailyEntry?.linkedMatchId) return null;
    return space?.upcomingCalendar.find((match) => match.id === activeDailyEntry.linkedMatchId) ?? null;
  }, [activeDailyEntry?.linkedMatchId, space?.upcomingCalendar]);

  const activeDayMatchOptions = useMemo(() => {
    if (!activeDailyEntry) return [];
    const byDay = (calendarMatchesByDay.get(activeDailyEntry.dayKey) ?? []).slice();
    if (byDay.length > 0) return byDay;
    return (space?.upcomingCalendar ?? []).slice(0, 25);
  }, [activeDailyEntry, calendarMatchesByDay, space?.upcomingCalendar]);

  const selectMatchFromCalendar = useCallback((matchId: string) => {
    setSelectedMatchId(matchId);
    setSelectedMatchAvailability('PLAYING');
    setForm((prev) => ({
      ...prev,
      selectedMatchId: matchId,
      selectedMatchAvailability: 'PLAYING',
    }));

    const matchDayKey = (() => {
      const match = space?.upcomingCalendar.find((item) => item.id === matchId);
      if (!match?.scheduledAt) return null;
      const matchDate = new Date(match.scheduledAt);
      if (Number.isNaN(matchDate.getTime())) return null;
      return toDateKey(matchDate);
    })();
    if (matchDayKey && weekDays.some((day) => day.dayKey === matchDayKey)) {
      setActiveDayKey(matchDayKey);
      setSelectedCalendarDayKey(matchDayKey);
      updateDailyEntry(matchDayKey, (entry) => ({
        ...entry,
        linkedMatchId: matchId,
        activityType: entry.activityType === 'TRAINING' ? 'BOTH' : 'MATCH',
        matchAvailability: entry.matchAvailability ?? 'PLAYING',
      }));
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, weeklyFormYRef.current - 12),
        animated: true,
      });
    });
  }, [space?.upcomingCalendar, updateDailyEntry, weekDays]);

  const applyNoMatchTemplate = useCallback(() => {
    setSelectedMatchId('');
    setSelectedMatchAvailability('ABSENT');
    const sundayDayKey = weekDays[weekDays.length - 1]?.dayKey;
    if (sundayDayKey) {
      setActiveDayKey(sundayDayKey);
      setSelectedCalendarDayKey(sundayDayKey);
    }
    setForm((prev) => ({
      ...prev,
      matchesPlayed: 0,
      matchesNotPlayed: Math.max(prev.matchesNotPlayed, 1),
      selectedMatchId: undefined,
      selectedMatchAvailability: 'ABSENT',
      selectedMatchTeamScore: undefined,
      selectedMatchOpponentScore: undefined,
      selectedMatchRating: undefined,
    }));
    setDailyTimeline((previous) => {
      if (previous.length === 0) return previous;
      const lastIndex = previous.length - 1;
      return previous.map((entry, index) => {
        if (index !== lastIndex) return entry;
        return {
          ...entry,
          activityType: 'MATCH',
          linkedMatchId: null,
          matchAvailability: 'ABSENT',
          gpsDistanceM: null,
          videoUploaded: entry.videoUploaded ?? false,
          notes: entry.notes ?? 'Semaine sans match déclaré',
        };
      });
    });
  }, [weekDays]);

  const submitUpdate = async () => {
    const validationMatchEntry = dailyTimeline.find((entry) => Boolean(entry.linkedMatchId));
    const validationAvailability =
      validationMatchEntry?.matchAvailability &&
      ['PLAYING', 'BENCH', 'INJURED', 'ABSENT', 'NOT_CALLED'].includes(
        validationMatchEntry.matchAvailability,
      )
        ? toWeeklyMatchAvailability(validationMatchEntry.matchAvailability)
        : selectedMatchAvailability;
    const requiresScores =
      Boolean(validationMatchEntry?.linkedMatchId ?? selectedMatchId) &&
      (validationAvailability === 'PLAYING' || validationAvailability === 'BENCH');
    const hasDailyMatchReport = dailyTimeline.some(
      (entry) =>
        isMatchActivity(entry.activityType) &&
        (Boolean(entry.matchStats?.trim().length) ||
          entry.matchAvailability === 'ABSENT' ||
          entry.matchAvailability === 'INJURED' ||
          entry.matchAvailability === 'NOT_CALLED'),
    );
    if (
      requiresScores &&
      (typeof form.selectedMatchTeamScore !== 'number' ||
        typeof form.selectedMatchOpponentScore !== 'number') &&
      !hasDailyMatchReport
    ) {
      Alert.alert(
        'Match incomplet',
        'Ajoute soit le score du match (équipe + adversaire), soit un rapport match dans la vue quotidienne.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const normalizedDailyTimeline: PlayerDailyTimelineEntry[] = dailyTimeline.map((entry) => ({
        dayKey: entry.dayKey,
        activityType: entry.activityType ?? 'NONE',
        linkedMatchId: entry.linkedMatchId ?? null,
        braceletSynced: entry.braceletSynced ?? null,
        gpsDistanceM: entry.gpsDistanceM ?? null,
        matchAvailability: entry.matchAvailability ?? null,
        matchStats: entry.matchStats ?? null,
        videoUploaded: entry.videoUploaded ?? null,
        notes: entry.notes ?? null,
      }));

      const selectedTimelineMatchId =
        normalizedDailyTimeline.find((entry) => !!entry.linkedMatchId)?.linkedMatchId ??
        selectedMatchId;
      const selectedTimelineMatch = normalizedDailyTimeline.find(
        (entry) => entry.linkedMatchId === selectedTimelineMatchId,
      );
      const resolvedAvailability =
        selectedTimelineMatch?.matchAvailability &&
        ['PLAYING', 'BENCH', 'INJURED', 'ABSENT', 'NOT_CALLED'].includes(
          selectedTimelineMatch.matchAvailability,
        )
          ? toWeeklyMatchAvailability(selectedTimelineMatch.matchAvailability)
          : selectedMatchAvailability;

      const computedTrackerDistanceM = Math.max(
        form.trackerDistanceM ?? 0,
        dailyTimelineStats.totalGpsDistanceM,
      );

      const payload: PlayerSpaceSubmitPayload = {
        ...form,
        matchesPlayed: Math.max(form.matchesPlayed, dailyTimelineStats.matchesPlayed),
        matchesNotPlayed: Math.max(form.matchesNotPlayed, dailyTimelineStats.matchesNotPlayed),
        isInjured: Boolean(form.isInjured || dailyTimelineStats.hasInjury),
        remarks: remarks?.trim() ? remarks.trim() : undefined,
        selectedMatchId: selectedTimelineMatchId || undefined,
        selectedMatchAvailability: selectedTimelineMatchId ? resolvedAvailability : undefined,
        selectedMatchTeamScore:
          selectedTimelineMatchId && typeof form.selectedMatchTeamScore === 'number'
            ? form.selectedMatchTeamScore
            : undefined,
        selectedMatchOpponentScore:
          selectedTimelineMatchId && typeof form.selectedMatchOpponentScore === 'number'
            ? form.selectedMatchOpponentScore
            : undefined,
        selectedMatchRating:
          selectedTimelineMatchId && typeof form.selectedMatchRating === 'number'
            ? form.selectedMatchRating
            : undefined,
        highlightsUploaded: Math.max(
          typeof form.highlightsUploaded === 'number' ? form.highlightsUploaded : 0,
          dailyTimelineStats.videosUploaded,
        ),
        gpsSyncConfirmed: Boolean(
          form.gpsSyncConfirmed ||
            dailyTimelineStats.hasBraceletSync ||
            computedTrackerDistanceM > 0,
        ),
        trackerSteps: form.trackerSteps,
        trackerDistanceM: computedTrackerDistanceM > 0 ? computedTrackerDistanceM : undefined,
        trackerSource: form.trackerSource,
        dailyTimeline: normalizedDailyTimeline,
      };
      await api.submitMyPlayerWeeklyUpdate(payload);
      await loadSpace({ force: true });
      Alert.alert('Mise à jour envoyée', 'Votre mise à jour hebdomadaire a été enregistrée.');
    } catch (e: any) {
      Alert.alert("Échec de l'envoi", e?.message || "Impossible d'envoyer la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text style={styles.loadingText}>Chargement de votre espace…</Text>
      </SafeAreaView>
    );
  }

  if (error || !space) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={44} color={theme.colors.semantic.error} />
        <Text style={styles.errorText}>{error ?? "Aucune donnée disponible"}</Text>
        <TouchableOpacity onPress={() => void loadSpace({ force: true })} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.subtitle}>
              {space.player.position} • {space.player.clubName || 'Sans club'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.cardTitle}>Calendrier personnel</Text>
              <View style={styles.calendarWeekNav}>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarWeekOffset((prev) => prev - 1)}
                >
                  <Ionicons name="chevron-back" size={16} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.calendarWeekLabel}>{calendarWeekLabel}</Text>
                <TouchableOpacity
                  style={styles.calendarNavButton}
                  onPress={() => setCalendarWeekOffset((prev) => prev + 1)}
                >
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.miniCalendarGrid}>
              {calendarWeekDays.map((day) => {
                const dayMatches = calendarMatchesByDay.get(day.dayKey) ?? [];
                const dayActivity = dailyActivityByDay.get(day.dayKey);
                return (
                  <TouchableOpacity
                    key={day.dayKey}
                    style={[
                      styles.miniCalendarCell,
                      selectedCalendarDayKey === day.dayKey && styles.miniCalendarCellActive,
                    ]}
                    onPress={() => {
                      setSelectedCalendarDayKey(day.dayKey);
                      if (weekDays.some((item) => item.dayKey === day.dayKey)) {
                        setActiveDayKey(day.dayKey);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.miniCalendarDayLabel,
                        selectedCalendarDayKey === day.dayKey && styles.miniCalendarDayLabelActive,
                      ]}
                    >
                      {day.dayLabel}
                    </Text>
                    <Text
                      style={[
                        styles.miniCalendarDateLabel,
                        selectedCalendarDayKey === day.dayKey && styles.miniCalendarDateLabelActive,
                      ]}
                    >
                      {day.dateLabel}
                    </Text>
                    <Text style={styles.miniCalendarMeta}>{dayMatches.length} match(s)</Text>
                    {dayActivity && dayActivity !== 'NONE' && dayActivity !== 'REST' ? (
                      <Text style={styles.miniCalendarTaskBadge}>Tâche active</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>
              Détails du {new Date(`${selectedCalendarDayKey}T00:00:00`).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </Text>

            {selectedCalendarMatches.length === 0 ? (
              <Text style={styles.emptyText}>Aucun match planifié sur cette journée.</Text>
            ) : (
              selectedCalendarMatches.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.calendarRow,
                    selectedMatchId === item.id && styles.calendarRowActive,
                  ]}
                  onPress={() => selectMatchFromCalendar(item.id)}
                >
                  <View style={styles.calendarMeta}>
                    <Text style={styles.calendarTitle}>{item.opponent}</Text>
                    <Text style={styles.calendarMetaText}>
                      {item.isHome ? 'Domicile' : 'Extérieur'} • {formatDate(item.scheduledAt)}
                    </Text>
                  </View>
                  <Text style={styles.calendarMetaText}>{item.competition || 'Compétition'}</Text>
                  <Text style={styles.calendarActionHint}>
                    {selectedMatchId === item.id
                      ? 'Match sélectionné pour la tâche du jour'
                      : 'Sélectionner ce match'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View
            style={styles.card}
            onLayout={(event) => {
              weeklyFormYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.onboardingHeader}>
              <Text style={styles.cardTitle}>Tâches hebdomadaires</Text>
              <Text style={styles.onboardingProgress}>
                {dailyTimelineSummary.completed}/{dailyTimelineSummary.total}
              </Text>
            </View>
            <Text style={styles.helperText}>
              Semaine active: {weekWindow.weekStart.toLocaleDateString('fr-FR')} →{' '}
              {weekWindow.weekEnd.toLocaleDateString('fr-FR')} (lundi à lundi)
            </Text>
            <View style={styles.weekTimerPill}>
              <Ionicons name="time-outline" size={16} color={theme.colors.brand.primary} />
              <Text style={styles.weekTimerText}>{weekWindow.remainingLabel}</Text>
            </View>
            <Text style={styles.helperText}>
              Saisi jour par jour ce que tu as fait: entraînement, match, repos ou séance perso.
            </Text>

            <View style={styles.weeklySummaryRow}>
              <Text style={styles.weeklySummaryText}>
                Matchs détectés: {dailyTimelineStats.matchesPlayed} joué(s) •{' '}
                {dailyTimelineStats.matchesNotPlayed} non joué(s)
              </Text>
              <Text style={styles.weeklySummaryText}>
                GPS semaine: {(dailyTimelineStats.totalGpsDistanceM / 1000).toFixed(1)} km
              </Text>
            </View>

            <View style={styles.daySelectorRow}>
              {dailyTimelineSummary.items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.daySelectorChip,
                    activeDayKey === item.key && styles.daySelectorChipActive,
                  ]}
                  onPress={() => setActiveDayKey(item.key)}
                >
                  <Text
                    style={[
                      styles.daySelectorLabel,
                      activeDayKey === item.key && styles.daySelectorLabelActive,
                    ]}
                  >
                    {item.dayLabel}
                  </Text>
                  <Text
                    style={[
                      styles.daySelectorMeta,
                      activeDayKey === item.key && styles.daySelectorMetaActive,
                    ]}
                  >
                    {item.activityLabel}
                  </Text>
                  <Ionicons
                    name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={item.done ? theme.colors.brand.primary : theme.colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {activeDailyEntry ? (
              <View style={styles.dailyDetailCard}>
                <Text style={styles.inputLabel}>
                  Jour sélectionné: {new Date(`${activeDailyEntry.dayKey}T00:00:00`).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                </Text>
                <Text style={styles.inputLabel}>Type de journée</Text>
                <View style={styles.inlineChoice}>
                  {dailyActivityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.choiceChip,
                        styles.choiceChipCompact,
                        activeDailyEntry.activityType === option.value && styles.choiceChipActive,
                      ]}
                      onPress={() => {
                        updateDailyEntry(activeDailyEntry.dayKey, (previous) => {
                          const keepMatchFields = isMatchActivity(option.value);
                          const keepTrainingFields = isTrainingActivity(option.value);
                          return {
                            ...previous,
                            activityType: option.value,
                            linkedMatchId: keepMatchFields ? previous.linkedMatchId ?? null : null,
                            braceletSynced: keepTrainingFields ? previous.braceletSynced : null,
                            matchAvailability: keepMatchFields ? previous.matchAvailability : null,
                            matchStats: keepMatchFields ? previous.matchStats : null,
                            gpsDistanceM: keepMatchFields ? previous.gpsDistanceM : null,
                            videoUploaded: keepMatchFields ? previous.videoUploaded : null,
                          };
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          activeDailyEntry.activityType === option.value && styles.choiceChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.helperText}>
                  {dailyActivityOptions.find((option) => option.value === activeDailyEntry.activityType)?.helper}
                </Text>

                {isTrainingActivity(activeDailyEntry.activityType) ? (
                  <>
                    <Text style={styles.inputLabel}>Sync bracelet/état santé pour ce jour</Text>
                    <View style={styles.inlineChoice}>
                      <TouchableOpacity
                        style={[
                          styles.choiceChip,
                          styles.choiceChipCompact,
                          activeDailyEntry.braceletSynced === true && styles.choiceChipActive,
                        ]}
                        onPress={() =>
                          updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                            ...previous,
                            braceletSynced: true,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            activeDailyEntry.braceletSynced === true && styles.choiceChipTextActive,
                          ]}
                        >
                          Oui, synchronisé
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.choiceChip,
                          styles.choiceChipCompact,
                          activeDailyEntry.braceletSynced === false && styles.choiceChipActive,
                        ]}
                        onPress={() =>
                          updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                            ...previous,
                            braceletSynced: false,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            activeDailyEntry.braceletSynced === false && styles.choiceChipTextActive,
                          ]}
                        >
                          Pas encore
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}

                {isMatchActivity(activeDailyEntry.activityType) ? (
                  <>
                    <Text style={styles.inputLabel}>Match lié à cette journée</Text>
                    <TouchableOpacity
                      style={styles.matchSelectorButton}
                      onPress={() => setIsMatchPickerOpen((prev) => !prev)}
                    >
                      <View>
                        <Text style={styles.matchSelectorLabel}>
                          {selectedActiveDayMatch
                            ? `${selectedActiveDayMatch.opponent} • ${formatDate(selectedActiveDayMatch.scheduledAt)}`
                            : 'Choisir un match lié'}
                        </Text>
                        <Text style={styles.matchSelectorHint}>
                          {selectedActiveDayMatch
                            ? 'Appuie pour changer la sélection'
                            : 'Tu peux aussi laisser vide si aucun match officiel'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isMatchPickerOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>

                    {isMatchPickerOpen ? (
                      <View style={styles.matchPickerPanel}>
                        <TouchableOpacity
                          style={styles.matchPickerOption}
                          onPress={() => {
                            setSelectedMatchId('');
                            setIsMatchPickerOpen(false);
                            setForm((prev) => ({
                              ...prev,
                              selectedMatchId: undefined,
                            }));
                            updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                              ...previous,
                              linkedMatchId: null,
                            }));
                          }}
                        >
                          <Text style={styles.matchPickerOptionLabel}>Aucun match (hors calendrier)</Text>
                        </TouchableOpacity>
                        {activeDayMatchOptions.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.matchPickerOption,
                              activeDailyEntry.linkedMatchId === item.id && styles.matchPickerOptionActive,
                            ]}
                            onPress={() => {
                              setSelectedMatchId(item.id);
                              setIsMatchPickerOpen(false);
                              setForm((prev) => ({
                                ...prev,
                                selectedMatchId: item.id,
                                selectedMatchAvailability: prev.selectedMatchAvailability ?? 'PLAYING',
                              }));
                              updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                                ...previous,
                                linkedMatchId: item.id,
                                activityType:
                                  previous.activityType === 'TRAINING'
                                    ? 'BOTH'
                                    : isMatchActivity(previous.activityType)
                                    ? previous.activityType
                                    : 'MATCH',
                                matchAvailability: previous.matchAvailability ?? 'PLAYING',
                              }));
                            }}
                          >
                            <View>
                              <Text style={styles.matchPickerOptionLabel}>{item.opponent}</Text>
                              <Text style={styles.matchPickerOptionMeta}>
                                {formatDate(item.scheduledAt)} • {item.competition || 'Compétition'}
                              </Text>
                            </View>
                            {activeDailyEntry.linkedMatchId === item.id ? (
                              <Ionicons name="checkmark-circle" size={18} color={theme.colors.brand.primary} />
                            ) : null}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}

                    {selectedActiveDayMatch ? (
                      <View style={styles.selectedMatchBanner}>
                        <Text style={styles.selectedMatchBannerText}>
                          Match actif: {selectedActiveDayMatch.opponent}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.inputGrid}>
                      <TextInput
                        style={styles.input}
                        placeholder="Score équipe"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={
                          typeof form.selectedMatchTeamScore === 'number'
                            ? String(form.selectedMatchTeamScore)
                            : ''
                        }
                        onChangeText={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            selectedMatchTeamScore: parseOptionalNumber(value),
                          }))
                        }
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Score adverse"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={
                          typeof form.selectedMatchOpponentScore === 'number'
                            ? String(form.selectedMatchOpponentScore)
                            : ''
                        }
                        onChangeText={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            selectedMatchOpponentScore: parseOptionalNumber(value),
                          }))
                        }
                      />
                    </View>

                    <Text style={styles.inputLabel}>Disponibilité match</Text>
                    <View style={styles.inlineChoice}>
                      {dailyMatchAvailabilityOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.choiceChip,
                            styles.choiceChipCompact,
                            activeDailyEntry.matchAvailability === option.value && styles.choiceChipActive,
                          ]}
                          onPress={() => {
                            updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                              ...previous,
                              matchAvailability: option.value,
                            }));
                            const mappedAvailability = toWeeklyMatchAvailability(option.value);
                            setSelectedMatchAvailability(mappedAvailability);
                            setForm((prev) => ({
                              ...prev,
                              selectedMatchAvailability: mappedAvailability,
                              isInjured: option.value === 'INJURED' ? true : prev.isInjured,
                              healthStatus:
                                option.value === 'INJURED'
                                  ? 'INJURY'
                                  : prev.healthStatus === 'INJURY'
                                  ? 'NORMAL'
                                  : prev.healthStatus,
                            }));
                          }}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              activeDailyEntry.matchAvailability === option.value && styles.choiceChipTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.inputLabel}>Statistiques / résumé du match</Text>
                    <TextInput
                      style={[styles.input, styles.textareaCompact]}
                      placeholder="Ex: 90 min, 1 but, 4 récupérations..."
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={activeDailyEntry.matchStats ?? ''}
                      onChangeText={(value) =>
                        updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                          ...previous,
                          matchStats: value.trim().length > 0 ? value : null,
                        }))
                      }
                      multiline
                    />

                    <Text style={styles.inputLabel}>Distance GPS du match (mètres)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 10200"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={
                        typeof activeDailyEntry.gpsDistanceM === 'number' && activeDailyEntry.gpsDistanceM > 0
                          ? String(activeDailyEntry.gpsDistanceM)
                          : ''
                      }
                      onChangeText={(value) =>
                        updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                          ...previous,
                          gpsDistanceM: parseOptionalNumber(value) ?? null,
                        }))
                      }
                    />

                    <Text style={styles.inputLabel}>Note perso après match (0-10)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 7"
                      keyboardType="numeric"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={
                        typeof form.selectedMatchRating === 'number'
                          ? String(form.selectedMatchRating)
                          : ''
                      }
                      onChangeText={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          selectedMatchRating: parseOptionalNumber(value),
                        }))
                      }
                    />

                    <Text style={styles.inputLabel}>Vidéo du match (max 3 min)</Text>
                    <View style={styles.inlineChoice}>
                      <TouchableOpacity
                        style={[
                          styles.choiceChip,
                          styles.choiceChipCompact,
                          activeDailyEntry.videoUploaded === true && styles.choiceChipActive,
                        ]}
                        onPress={() =>
                          updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                            ...previous,
                            videoUploaded: true,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            activeDailyEntry.videoUploaded === true && styles.choiceChipTextActive,
                          ]}
                        >
                          Uploadée
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.choiceChip,
                          styles.choiceChipCompact,
                          activeDailyEntry.videoUploaded === false && styles.choiceChipActive,
                        ]}
                        onPress={() =>
                          updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                            ...previous,
                            videoUploaded: false,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            activeDailyEntry.videoUploaded === false && styles.choiceChipTextActive,
                          ]}
                        >
                          Pas encore
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}

                <Text style={styles.inputLabel}>Commentaire du jour (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textareaCompact]}
                  placeholder="Ex: séance intense, bonnes sensations..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={activeDailyEntry.notes ?? ''}
                  onChangeText={(value) =>
                    updateDailyEntry(activeDailyEntry.dayKey, (previous) => ({
                      ...previous,
                      notes: value.trim().length > 0 ? value : null,
                    }))
                  }
                  multiline
                />
              </View>
            ) : null}

            <View style={styles.quickActionRow}>
              <TouchableOpacity style={styles.quickActionButton} onPress={applyNoMatchTemplate}>
                <Text style={styles.quickActionText}>Semaine sans match</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Remarques semaine (optionnel)"
              placeholderTextColor={theme.colors.text.tertiary}
              value={remarks}
              onChangeText={setRemarks}
              multiline
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={submitUpdate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer la semaine</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historique synchronisations bracelet</Text>
            {braceletSyncHistory.length === 0 ? (
              <Text style={styles.emptyText}>Aucune synchronisation détectée pour le moment.</Text>
            ) : (
              braceletSyncHistory.map((session) => (
                <View key={session.id} style={styles.syncHistoryRow}>
                  <View>
                    <Text style={styles.syncHistoryTitle}>
                      {session.type === 'match' ? 'Session match' : 'Session entraînement'}
                    </Text>
                    <Text style={styles.syncHistoryMeta}>
                      {formatDateTime(session.endedAt)} • {session.source || 'tracker'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.syncHistoryMetric}>
                      {session.steps.toLocaleString('fr-FR')} pas
                    </Text>
                    <Text style={styles.syncHistoryMetric}>
                      {(session.distanceM / 1000).toFixed(1)} km
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Snapshot du joueur</Text>
            <View style={styles.snapshotGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.minutesPlayed}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.matchesPlayed}</Text>
                <Text style={styles.statLabel}>Matchs joués</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.matchesNotPlayed}</Text>
                <Text style={styles.statLabel}>Matchs non joués</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.goals}</Text>
                <Text style={styles.statLabel}>Buts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.assists}</Text>
                <Text style={styles.statLabel}>Passes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.isInjured ? 'Oui' : 'Non'}</Text>
                <Text style={styles.statLabel}>Blessé</Text>
              </View>
            </View>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>État santé</Text>
              <Text style={styles.healthValue}>{space.health.status}</Text>
            </View>
            <Text style={styles.healthMeta}>Sync: {formatDateTime(space.health.lastDeviceSync)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>News</Text>
            {space.news.length === 0 ? (
              <Text style={styles.emptyText}>Aucune actualité pour le moment</Text>
            ) : (
              <FlatList
                data={space.news}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.newsRow}>
                    <Text style={styles.newsTitle}>{item.headline}</Text>
                    {!!item.summary && <Text style={styles.newsSummary}>{item.summary}</Text>}
                    <Text style={styles.newsMeta}>
                      {item.sourceName} • {formatDate(item.publishedAt)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 14,
  },
  playerName: {
    color: theme.colors.text.primary,
    fontSize: 26,
    fontFamily: theme.typography.fonts.bold,
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    marginBottom: 12,
    fontFamily: theme.typography.fonts.bold,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarWeekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarNavButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.glassLight,
  },
  calendarWeekLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
  },
  miniCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  miniCalendarCell: {
    minWidth: '31%',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface.glassLight,
  },
  miniCalendarCellActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}16`,
  },
  miniCalendarDayLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  miniCalendarDayLabelActive: {
    color: theme.colors.brand.primary,
  },
  miniCalendarDateLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 13,
    marginBottom: 6,
  },
  miniCalendarDateLabelActive: {
    color: theme.colors.brand.primary,
  },
  miniCalendarMeta: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
  },
  miniCalendarTaskBadge: {
    marginTop: 6,
    fontSize: 10,
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.medium,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onboardingProgress: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
    fontSize: 16,
  },
  onboardingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  onboardingTaskTextWrap: {
    flex: 1,
  },
  onboardingDayLabel: {
    color: theme.colors.brand.primary,
    fontSize: 11,
    marginBottom: 2,
    fontFamily: theme.typography.fonts.medium,
  },
  onboardingLabel: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  onboardingLabelDone: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
  },
  onboardingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  weeklySummaryRow: {
    marginBottom: 12,
  },
  weeklySummaryText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  daySelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  daySelectorChip: {
    minWidth: '31%',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface.glassLight,
  },
  daySelectorChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}18`,
  },
  daySelectorLabel: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    marginBottom: 4,
  },
  daySelectorLabelActive: {
    color: theme.colors.brand.primary,
  },
  daySelectorMeta: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    marginBottom: 6,
  },
  daySelectorMetaActive: {
    color: theme.colors.text.secondary,
  },
  dailyDetailCard: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: theme.colors.surface.glassLight,
  },
  matchSelectorButton: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: theme.colors.surface.glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchSelectorLabel: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 13,
  },
  matchSelectorHint: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    marginTop: 2,
  },
  matchPickerPanel: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface.glass,
  },
  matchPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  matchPickerOptionActive: {
    backgroundColor: `${theme.colors.brand.primary}14`,
  },
  matchPickerOptionLabel: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
  },
  matchPickerOptionMeta: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    marginTop: 2,
  },
  selectedMatchBanner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${theme.colors.brand.primary}66`,
    backgroundColor: `${theme.colors.brand.primary}16`,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  selectedMatchBannerText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
  },
  weekTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${theme.colors.brand.primary}66`,
    backgroundColor: `${theme.colors.brand.primary}16`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  weekTimerText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 12,
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  quickActionButton: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface.glassLight,
  },
  quickActionText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
  },
  trackerSummary: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: theme.colors.surface.glassLight,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: theme.colors.surface.glassLight,
    overflow: 'hidden',
  },
  picker: {
    color: theme.colors.text.primary,
    height: 48,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '33.333%',
    padding: 6,
  },
  statValue: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
    fontSize: 20,
  },
  statLabel: {
    color: theme.colors.text.tertiary,
    marginTop: 4,
    fontSize: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  healthLabel: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  healthValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
  },
  healthMeta: {
    marginTop: 6,
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendDate: {
    color: theme.colors.text.secondary,
    width: 90,
    fontSize: 12,
  },
  trendValue: {
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  calendarRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 10,
    paddingBottom: 10,
  },
  calendarRowActive: {
    borderColor: `${theme.colors.brand.primary}66`,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 6,
    backgroundColor: `${theme.colors.brand.primary}12`,
  },
  calendarMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  calendarMetaText: {
    marginTop: 4,
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  calendarActionHint: {
    marginTop: 6,
    color: theme.colors.brand.primary,
    fontSize: 11,
    fontFamily: theme.typography.fonts.medium,
  },
  syncHistoryRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncHistoryTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 13,
  },
  syncHistoryMeta: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    marginTop: 2,
  },
  syncHistoryMetric: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    textAlign: 'right',
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    color: theme.colors.text.primary,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface.glassLight,
    fontSize: 14,
    marginBottom: 10,
  },
  textarea: {
    height: 88,
    textAlignVertical: 'top',
  },
  textareaCompact: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  inlineChoice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.glassLight,
  },
  choiceChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}22`,
  },
  choiceChipCompact: {
    marginRight: 8,
    marginBottom: 8,
  },
  choiceChipText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  choiceChipTextActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.medium,
  },
  inputLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 8,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
  },
  submitButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fonts.bold,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  newsRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 12,
    marginTop: 12,
  },
  newsTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
    marginBottom: 4,
  },
  newsSummary: {
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  newsMeta: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: 10,
  },
  errorText: {
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: theme.colors.brand.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fonts.bold,
  },
});
