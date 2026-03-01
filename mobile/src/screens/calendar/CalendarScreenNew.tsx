import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import api, {
  extractPayloadItems,
  pickDateValue,
  type ScoutCalendarDiscoverItem,
  type ScoutCalendarMissionItem,
  type ScoutCalendarResponse,
} from '../../services/api';
import { eventsApi, type Event as CalendarEvent } from '../../services/api/events';
import { logger, logError } from '../../utils/logger';
import type { AppStackParamList } from '../../types/navigation';
import type {
  CalendarMatch,
  CalendarItemStatus,
  CalendarPersonaFilter,
} from '../../types/calendar';
import type { RoleColorMap } from '../../types/ui';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { isFeatureEnabled } from '../../constants/features';

let MapView: any;
let Marker: any;
try {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
} catch (error) {
  MapView = null;
  Marker = null;
}

const { width } = Dimensions.get('window');

type ViewMode = 'list' | 'week' | 'map';
type CalendarSectionFilter = 'ALL' | 'MY' | 'SHARED' | 'DISCOVER';
type CalendarFeedStrategy = 'SCOUT_CALENDAR' | 'GLOBAL_MATCHES' | 'LEGACY_ASSIGNMENTS';

const STATUS_COLORS: Record<CalendarItemStatus, string> = {
  PLANNED: '#E6F54A',
  EN_ROUTE: '#2EE59D',
  REPORT_SUBMITTED: '#58D3FF',
  CONFIRMED: '#58D3FF',
  IN_PROGRESS: '#4F7BFF',
  COMPLETED: '#2EE59D',
  CANCELLED: '#EF4444',
};

const PERSONA_COLORS: RoleColorMap = {
  ALL: '#94A3B8',
  AGENTS: '#FB7185',
  SCOUTS: '#FACC15',
  PLAYERS: '#86EFAC',
};

const STATUS_ORDER: CalendarItemStatus[] = ['PLANNED', 'EN_ROUTE', 'REPORT_SUBMITTED'];

const resolveCalendarFeedStrategy = (role?: string | null): CalendarFeedStrategy => {
  const normalizedRole = String(role ?? '').toUpperCase();
  if (normalizedRole === 'SCOUT') return 'SCOUT_CALENDAR';
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN' || normalizedRole === 'AGENT') {
    return 'GLOBAL_MATCHES';
  }
  return 'LEGACY_ASSIGNMENTS';
};

const isCategoryARole = (role?: string | null) => {
  const normalizedRole = String(role ?? '').toUpperCase();
  return normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'ADMIN';
};

const normalizeStatus = (value?: string | null): CalendarItemStatus => {
  const source = String(value ?? '').toUpperCase();
  if (source.includes('REPORT')) return 'REPORT_SUBMITTED';
  if (source.includes('ASSIGNED')) return 'PLANNED';
  if (source.includes('SCHEDULED')) return 'PLANNED';
  if (source.includes('LIVE')) return 'EN_ROUTE';
  if (source.includes('EN_ROUTE')) return 'EN_ROUTE';
  if (source.includes('CONFIRMED')) return 'PLANNED';
  if (source.includes('IN_PROGRESS')) return 'EN_ROUTE';
  if (source.includes('COMPLETED')) return 'REPORT_SUBMITTED';
  if (source.includes('CANCELLED')) return 'CANCELLED';
  return 'PLANNED';
};

const deriveStatusFromAssignments = (assignments?: CalendarMatch['assignments']) => {
  if (!assignments || assignments.length === 0) {
    return undefined;
  }

  if (assignments.some((assignment) => assignment?.reportSubmitted)) {
    return 'REPORT_SUBMITTED' as const;
  }

  const statuses = assignments.map((assignment) =>
    normalizeStatus(assignment?.mobileStatus ?? assignment?.status),
  );

  if (statuses.some((status) => status === 'REPORT_SUBMITTED')) {
    return 'REPORT_SUBMITTED' as const;
  }

  if (statuses.some((status) => status === 'EN_ROUTE')) {
    return 'EN_ROUTE' as const;
  }

  if (statuses.some((status) => status === 'COMPLETED')) {
    return 'REPORT_SUBMITTED' as const;
  }

  if (statuses.some((status) => status === 'CANCELLED')) {
    return 'CANCELLED' as const;
  }

  return 'PLANNED';
};

const toIsoFromLegacy = (rawDate?: string, rawTime?: string) => {
  if (!rawDate) return new Date().toISOString();
  if (!rawTime) return new Date(rawDate).toISOString();

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();

  const [hourRaw, minuteRaw] = rawTime.split(':');
  const hour = Number.parseInt(hourRaw ?? '0', 10);
  const minute = Number.parseInt(minuteRaw ?? '0', 10);

  date.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);
  return date.toISOString();
};

const inferPersonaFromText = (value: string): CalendarPersonaFilter => {
  const source = value.toLowerCase();
  if (source.includes('player') || source.includes('joueur')) return 'PLAYERS';
  if (source.includes('agent')) return 'AGENTS';
  return 'SCOUTS';
};

const adaptEventToCalendar = (item: CalendarEvent): CalendarMatch => {
  const rawItem = item as any;
  const rawMatch = rawItem.match ?? rawItem.matches;
  const assignedUsers = Array.isArray(rawItem.assignedUsers)
    ? rawItem.assignedUsers
    : Array.isArray(rawItem.event_assignments)
    ? rawItem.event_assignments.map((entry: any) => ({
        id: entry.id,
        user: entry.user ?? entry.users,
      }))
    : [];

  const createdBy = rawItem.createdBy ?? rawItem.users;
  const assignments = assignedUsers
    .map((entry: any) => {
      const user = entry?.user;
      if (!user) return null;
      return {
        scoutId: user.id,
        scout: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    })
    .filter(Boolean) as CalendarMatch['assignments'];

  const participants = assignments?.map((entry) => ({
    id: entry.scoutId,
    firstName: entry.scout?.firstName,
    lastName: entry.scout?.lastName,
    role: entry.scout?.role,
    avatar: entry.scout?.avatar,
  })) ?? [];

  const roleSource = [
    createdBy?.role,
    ...participants.map((participant) => participant.role),
  ]
    .map((value) => String(value ?? '').toUpperCase())
    .filter(Boolean);

  const persona = roleSource.some((role) => role === 'SCOUT')
    ? 'SCOUTS'
    : roleSource.some((role) => role === 'PLAYER')
    ? 'PLAYERS'
    : roleSource.some((role) => role === 'AGENT' || role === 'ADMIN' || role === 'SUPER_ADMIN')
    ? 'AGENTS'
    : inferPersonaFromText(`${item.type} ${item.title ?? ''}`);

  return {
    id: `event-${item.id}`,
    sourceType: 'EVENT',
    title: item.title,
    date: item.startDate,
    status: normalizeStatus(item.status),
    persona,
    homeClub: rawMatch?.homeClub
      ? {
          id: rawMatch.homeClub.id,
          name: rawMatch.homeClub.name,
          logo: rawMatch.homeClub.logo,
        }
      : rawMatch?.clubs_matches_homeClubIdToclubs
      ? {
          id: rawMatch.clubs_matches_homeClubIdToclubs.id,
          name: rawMatch.clubs_matches_homeClubIdToclubs.name,
          logo: rawMatch.clubs_matches_homeClubIdToclubs.logo,
        }
      : undefined,
    awayClub: rawMatch?.awayClub
      ? {
          id: rawMatch.awayClub.id,
          name: rawMatch.awayClub.name,
          logo: rawMatch.awayClub.logo,
        }
      : rawMatch?.clubs_matches_awayClubIdToclubs
      ? {
          id: rawMatch.clubs_matches_awayClubIdToclubs.id,
          name: rawMatch.clubs_matches_awayClubIdToclubs.name,
          logo: rawMatch.clubs_matches_awayClubIdToclubs.logo,
        }
      : undefined,
    competition: rawMatch
      ? {
          name: 'Arcane Event',
          logo: undefined,
        }
      : undefined,
    venue: {
      name: item.location || 'Location TBD',
      city: undefined,
      latitude: item.latitude,
      longitude: item.longitude,
    },
    assignments,
    participants: createdBy
      ? [
          {
            id: createdBy.id,
            firstName: createdBy.firstName,
            lastName: createdBy.lastName,
            role: createdBy.role,
            avatar: createdBy.avatar,
          },
          ...participants,
        ]
      : participants,
    notes: item.description,
    locationLabel: item.location,
  };
};

const adaptMatchToCalendar = (item: any): CalendarMatch => {
  const directDate = pickDateValue(item, ['scheduledAt', 'matchDate', 'date', 'createdAt']);
  const parsedDirectDate = directDate ? new Date(directDate) : null;
  const isoDate =
    parsedDirectDate && !Number.isNaN(parsedDirectDate.getTime())
      ? parsedDirectDate.toISOString()
      : toIsoFromLegacy(item.matchDate ?? item.date, item.matchTime ?? item.time);

  const legacyScout = item.scout ?? item.users_matches_scoutIdTousers;
  const legacyAssignments = legacyScout
    ? [
        {
          scoutId: legacyScout.id,
          scout: {
            firstName: legacyScout.firstName,
            lastName: legacyScout.lastName,
            role: legacyScout.role ?? 'SCOUT',
            avatar: legacyScout.avatar,
          },
        },
      ]
    : [];

  const assignments = Array.isArray(item.assignments)
    ? item.assignments
        .map((assignment: any) => ({
          scoutId: assignment.scoutId ?? assignment.scout?.id,
          status: assignment.status,
          mobileStatus: assignment.mobileStatus,
          role: assignment.role,
          reportSubmitted: assignment.reportSubmitted,
          scout: assignment.scout
            ? {
                firstName: assignment.scout.firstName,
                lastName: assignment.scout.lastName,
                avatar: assignment.scout.avatar,
                role: assignment.scout.role,
              }
            : undefined,
          assignedBy: assignment.assignedBy
            ? {
                id: assignment.assignedBy.id,
                firstName: assignment.assignedBy.firstName,
                lastName: assignment.assignedBy.lastName,
                role: assignment.assignedBy.role,
              }
            : undefined,
        }))
        .filter(
          (assignment: NonNullable<CalendarMatch['assignments']>[number]) =>
            Boolean(assignment.scoutId || assignment.scout),
        )
    : legacyAssignments;

  const assignmentDerivedStatus = deriveStatusFromAssignments(assignments);

  return {
    id: String(item.id),
    sourceType: 'MATCH',
    title:
      item.title ??
      `${item.homeClub?.name ?? item.clubs_matches_homeClubIdToclubs?.name ?? 'Club A'} vs ${
        item.awayClub?.name ?? item.clubs_matches_awayClubIdToclubs?.name ?? 'Club B'
      }`,
    date: isoDate,
    status: assignmentDerivedStatus ?? normalizeStatus(item.mobileStatus ?? item.status),
    persona: assignments.length > 0 ? 'SCOUTS' : 'AGENTS',
    homeScore: item.homeScore,
    awayScore: item.awayScore,
    homeClub: item.homeClub
      ? {
          id: item.homeClub.id,
          name: item.homeClub.name,
          logo: item.homeClub.logo,
        }
      : item.clubs_matches_homeClubIdToclubs
      ? {
          id: item.clubs_matches_homeClubIdToclubs.id,
          name: item.clubs_matches_homeClubIdToclubs.name,
          logo: item.clubs_matches_homeClubIdToclubs.logo,
        }
      : undefined,
    awayClub: item.awayClub
      ? {
          id: item.awayClub.id,
          name: item.awayClub.name,
          logo: item.awayClub.logo,
        }
      : item.clubs_matches_awayClubIdToclubs
      ? {
          id: item.clubs_matches_awayClubIdToclubs.id,
          name: item.clubs_matches_awayClubIdToclubs.name,
          logo: item.clubs_matches_awayClubIdToclubs.logo,
        }
      : undefined,
    competition: item.competition
      ? {
          name: item.competition.name ?? item.competition,
          logo: item.competition.logo,
        }
      : item.competitionOld
      ? {
          name: item.competitionOld,
        }
      : undefined,
    venue: item.venue
      ? {
          name: item.venue.name ?? item.venue,
          city: item.venue.city,
          address: item.venue.address,
          latitude: item.venue.latitude,
          longitude: item.venue.longitude,
        }
      : item.venueOld
      ? {
          name: item.venueOld,
        }
      : undefined,
    assignments,
    participants: assignments.map((entry: NonNullable<CalendarMatch['assignments']>[number]) => ({
      id: entry.scoutId,
      firstName: entry.scout?.firstName,
      lastName: entry.scout?.lastName,
      role: entry.scout?.role,
      avatar: entry.scout?.avatar,
    })),
    notes: item.notes,
    locationLabel: item.venue?.name ?? item.venueOld,
  };
};

const adaptScoutMissionToCalendar = (
  item: ScoutCalendarMissionItem,
  sectionType: 'MY' | 'SHARED',
): CalendarMatch => {
  const match = item.match ?? {};
  const homeClub = match.homeClub;
  const awayClub = match.awayClub;
  const scheduledAt =
    match.scheduledAt ??
    match.matchDate ??
    new Date().toISOString();

  const assignment: CalendarMatch['assignments'] = [
    {
      id: item.assignmentId,
      assignmentId: item.assignmentId,
      scoutId: item.scout?.id ?? item.scout?.scoutId ?? item.scout?.userId ?? '',
      missionType: item.missionType,
      status: item.status,
      mobileStatus: item.mobileStatus,
      reportSubmitted: item.reportSubmitted,
      scout: item.scout
        ? {
            firstName: item.scout.firstName,
            lastName: item.scout.lastName,
            avatar: item.scout.avatar,
            role: item.scout.role,
          }
        : undefined,
      assignedBy: item.assignedBy
        ? {
            id: item.assignedBy.id,
            firstName: item.assignedBy.firstName,
            lastName: item.assignedBy.lastName,
            role: item.assignedBy.role,
          }
        : undefined,
    },
  ];

  return {
    id: item.matchId,
    assignmentId: item.assignmentId,
    missionType: item.missionType,
    sectionType,
    sourceType: 'MATCH',
    status: item.mobileStatus ?? normalizeStatus(item.status),
    date: scheduledAt,
    country: item.country ?? undefined,
    league: item.league ?? undefined,
    persona: 'SCOUTS',
    assignments: assignment,
    participants: assignment
      .filter((entry) => entry.scout)
      .map((entry) => ({
        id: entry.scoutId,
        firstName: entry.scout?.firstName,
        lastName: entry.scout?.lastName,
        role: entry.scout?.role,
        avatar: entry.scout?.avatar,
      })),
    homeClub: homeClub
      ? {
          id: homeClub.id,
          name: homeClub.name,
          logo: homeClub.logo,
        }
      : undefined,
    awayClub: awayClub
      ? {
          id: awayClub.id,
          name: awayClub.name,
          logo: awayClub.logo,
        }
      : undefined,
    competition: (match.competition?.name || match.competitionOld)
      ? {
          id: match.competition?.id,
          name: match.competition?.name ?? match.competitionOld,
        }
      : undefined,
    venue: match.venue
      ? {
          id: match.venue.id,
          name: match.venue.name ?? 'Stadium',
          city: match.venue.city,
          country: match.venue.country,
          address: match.venue.address,
          latitude: match.venue.latitude,
          longitude: match.venue.longitude,
        }
      : undefined,
    locationLabel: match.venue?.name,
    title:
      `${homeClub?.name ?? 'Club A'} vs ${awayClub?.name ?? 'Club B'}`,
  };
};

const adaptScoutDiscoverToCalendar = (item: ScoutCalendarDiscoverItem): CalendarMatch => {
  const match = item.match ?? {};
  const homeClub = match.homeClub;
  const awayClub = match.awayClub;

  return {
    id: item.matchId,
    sectionType: 'DISCOVER',
    sourceType: 'MATCH',
    status: match.mobileStatus ?? normalizeStatus(match.status),
    date: match.scheduledAt ?? match.matchDate ?? new Date().toISOString(),
    country: item.country ?? undefined,
    league: item.league ?? undefined,
    persona: 'SCOUTS',
    homeClub: homeClub
      ? {
          id: homeClub.id,
          name: homeClub.name,
          logo: homeClub.logo,
        }
      : undefined,
    awayClub: awayClub
      ? {
          id: awayClub.id,
          name: awayClub.name,
          logo: awayClub.logo,
        }
      : undefined,
    competition: (match.competition?.name || match.competitionOld)
      ? {
          id: match.competition?.id,
          name: match.competition?.name ?? match.competitionOld,
        }
      : undefined,
    venue: match.venue
      ? {
          id: match.venue.id,
          name: match.venue.name ?? 'Stadium',
          city: match.venue.city,
          country: match.venue.country,
          address: match.venue.address,
          latitude: match.venue.latitude,
          longitude: match.venue.longitude,
        }
      : undefined,
    participants: (item.sharedScouts ?? []).map((scout) => ({
      id: scout.id,
      firstName: scout.firstName,
      lastName: scout.lastName,
      role: scout.role,
    })),
    locationLabel: match.venue?.name,
    title: `${homeClub?.name ?? 'Club A'} vs ${awayClub?.name ?? 'Club B'}`,
  };
};

const formatDateLabel = (dateIso: string, language: 'fr' | 'en') => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(dateIso).toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTimeLabel = (dateIso: string, language: 'fr' | 'en') => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(dateIso).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDayLabel = (date: Date, language: 'fr' | 'en') => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(locale, { weekday: 'short' });
};

const formatSectionDayLabel = (date: Date, language: 'fr' | 'en') => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const toDayKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

const getWeekStartDate = (baseDate: Date) => {
  const startOfWeek = new Date(baseDate);
  startOfWeek.setHours(0, 0, 0, 0);
  const day = startOfWeek.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + offsetToMonday);
  return startOfWeek;
};

const addDays = (baseDate: Date, days: number) => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatWeekRangeLabel = (weekStart: Date, weekEnd: Date, language: 'fr' | 'en') => {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const startLabel = weekStart.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
  const endLabel = weekEnd.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
  });
  return `${startLabel} - ${endLabel}`;
};

const renderBadge = (logo?: string | null) => {
  if (!logo) {
    return <View style={styles.badgePlaceholder} />;
  }

  return <Image source={{ uri: logo }} style={styles.badgeImage} />;
};

export const CalendarScreenNew = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { dictionary, language } = useLocalization();
  const { user, activeRole } = useAuth();
  const copy = dictionary.calendarCenter ?? {};
  const copyAny = copy as Record<string, any>;
  const mapRef = useRef<any>(null);
  const missionRequestHubEnabled = isFeatureEnabled('missionRequestHub');
  const effectiveRole = String(activeRole ?? user?.role ?? '').toUpperCase();
  const calendarFeedStrategy = useMemo(
    () => resolveCalendarFeedStrategy(effectiveRole),
    [effectiveRole],
  );
  const canOpenMissionRequestsHub = useMemo(() => {
    if (!missionRequestHubEnabled) return false;
    return ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SCOUT'].includes(effectiveRole);
  }, [effectiveRole, missionRequestHubEnabled]);

  const [matches, setMatches] = useState<CalendarMatch[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [isScoutCalendarMode, setIsScoutCalendarMode] = useState(false);
  const [addingMatchId, setAddingMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personaFilter, setPersonaFilter] = useState<CalendarPersonaFilter>('ALL');
  const [sectionFilter, setSectionFilter] = useState<CalendarSectionFilter>('ALL');
  const [selectedMapMatchId, setSelectedMapMatchId] = useState<string | null>(null);
  const selectedWeekStart = useMemo(() => getWeekStartDate(selectedDate), [selectedDate]);
  const selectedWeekEnd = useMemo(() => addDays(selectedWeekStart, 6), [selectedWeekStart]);
  const selectedWeekEndExclusive = useMemo(() => addDays(selectedWeekStart, 7), [selectedWeekStart]);
  const selectedWeekDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(selectedWeekStart, index)),
    [selectedWeekStart],
  );
  const isCurrentWeek = useMemo(
    () => getWeekStartDate(new Date()).getTime() === selectedWeekStart.getTime(),
    [selectedWeekStart],
  );
  const weekRangeLabel = useMemo(
    () => formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd, language),
    [language, selectedWeekEnd, selectedWeekStart],
  );

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      if (calendarFeedStrategy === 'SCOUT_CALENDAR') {
        const [scoutCalendarPayload, eventsPayload] = await Promise.all([
          api.getScoutCalendar({
            country: selectedCountry !== 'ALL' ? selectedCountry : undefined,
            league: selectedLeague !== 'ALL' ? selectedLeague : undefined,
          }),
          eventsApi.getMyEvents().catch((error) => {
            logError('Failed to fetch calendar events in scout mode', error);
            return [];
          }),
        ]);
        const scoutCalendar = scoutCalendarPayload as ScoutCalendarResponse;
        const my = (scoutCalendar?.myCalendar ?? []).map((entry) =>
          adaptScoutMissionToCalendar(entry, 'MY'),
        );
        const shared = (scoutCalendar?.sharedCalendar ?? []).map((entry) =>
          adaptScoutMissionToCalendar(entry, 'SHARED'),
        );
        const discover = (scoutCalendar?.discover ?? []).map((entry) =>
          adaptScoutDiscoverToCalendar(entry),
        );
        const events = extractPayloadItems<CalendarEvent>(eventsPayload).map(adaptEventToCalendar);
        const merged = [...my, ...shared, ...discover, ...events].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        logger.info('calendar', 'Scout calendar feed adapted', {
          my: my.length,
          shared: shared.length,
          discover: discover.length,
          events: events.length,
          total: merged.length,
        });

        setCountries(scoutCalendar?.filters?.countries ?? []);
        setLeagues(scoutCalendar?.filters?.leagues ?? []);
        setIsScoutCalendarMode(true);
        setMatches(merged);
        return;
      }

      if (calendarFeedStrategy === 'GLOBAL_MATCHES') {
        setIsScoutCalendarMode(false);
        const useTeamEvents = isCategoryARole(effectiveRole);
        const eventsPromise = (useTeamEvents ? eventsApi.getTeamEvents() : eventsApi.getMyEvents()).catch((error) => {
          logError('Failed to fetch calendar events', error);
          return [];
        });
        const upcomingMatchesPayload = await api.getMatches({
          from: new Date().toISOString(),
          limit: 200,
        });
        let matchesList = extractPayloadItems<any>(upcomingMatchesPayload).map(adaptMatchToCalendar);
        if (matchesList.length === 0) {
          logger.info('calendar', 'No upcoming matches for global feed, fallback to latest matches', {
            role: effectiveRole,
          });
          const fallbackMatchesPayload = await api.getMatches({
            limit: 200,
          });
          matchesList = extractPayloadItems<any>(fallbackMatchesPayload).map(adaptMatchToCalendar);
        }
        const eventsPayload = await eventsPromise;
        const events = extractPayloadItems<CalendarEvent>(eventsPayload).map(adaptEventToCalendar);
        const merged = [...events, ...matchesList].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        const fallbackCountries = Array.from(
          new Set(merged.map((entry) => entry.country).filter((value): value is string => Boolean(value))),
        );
        const fallbackLeagues = Array.from(
          new Set(merged.map((entry) => entry.league).filter((value): value is string => Boolean(value))),
        );

        logger.info('calendar', 'Global calendar feed adapted', {
          role: effectiveRole,
          eventScope: useTeamEvents ? 'TEAM' : 'MY',
          events: events.length,
          matches: matchesList.length,
          total: merged.length,
        });

        setCountries(fallbackCountries.sort((a, b) => a.localeCompare(b)));
        setLeagues(fallbackLeagues.sort((a, b) => a.localeCompare(b)));
        setMatches(merged);
        return;
      }

      setIsScoutCalendarMode(false);

      const [eventsPayload, matchesPayload] = await Promise.all([
        eventsApi.getMyEvents().catch((error) => {
          logError('Failed to fetch calendar events', error);
          return [];
        }),
        api.getMyAssignedMatches().catch((error) => {
          logError('Failed to fetch calendar matches', error);
          return api.getMatches({
            from: new Date().toISOString(),
            limit: 200,
          });
        }),
      ]);

      const events = extractPayloadItems<CalendarEvent>(eventsPayload).map(adaptEventToCalendar);
      let matchesList = extractPayloadItems<any>(matchesPayload).map(adaptMatchToCalendar);
      if (matchesList.length === 0) {
        const fallbackMatchesPayload = await api.getMatches({
          limit: 200,
        });
        matchesList = extractPayloadItems<any>(fallbackMatchesPayload).map(adaptMatchToCalendar);
      }
      const merged = [...events, ...matchesList].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const fallbackCountries = Array.from(
        new Set(merged.map((entry) => entry.country).filter((value): value is string => Boolean(value))),
      );
      const fallbackLeagues = Array.from(
        new Set(merged.map((entry) => entry.league).filter((value): value is string => Boolean(value))),
      );

      logger.info('calendar', 'Legacy calendar feed adapted', {
        events: events.length,
        matches: matchesList.length,
        total: merged.length,
      });

      setCountries(fallbackCountries.sort((a, b) => a.localeCompare(b)));
      setLeagues(fallbackLeagues.sort((a, b) => a.localeCompare(b)));
      setMatches(merged);
    } catch (error) {
      logError('Failed to build calendar feed', error);
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarFeedStrategy, effectiveRole, selectedCountry, selectedLeague]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (!isScoutCalendarMode && sectionFilter !== 'ALL') {
      setSectionFilter('ALL');
    }
  }, [isScoutCalendarMode, sectionFilter]);

  const handleAddToMyCalendar = useCallback(
    async (matchId: string) => {
      try {
        setAddingMatchId(matchId);
        await api.addMatchToMyCalendar(matchId);
        await fetchMatches();
      } catch (error) {
        logError('Failed to add discover match to my calendar', error);
      } finally {
        setAddingMatchId(null);
      }
    },
    [fetchMatches],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const isSameDate = useCallback((left: Date, right: Date) => {
    return (
      left.getDate() === right.getDate() &&
      left.getMonth() === right.getMonth() &&
      left.getFullYear() === right.getFullYear()
    );
  }, []);

  const handleShiftWeek = useCallback((direction: -1 | 1) => {
    setSelectedDate((currentDate) => addDays(currentDate, direction * 7));
  }, []);

  const handleGoToCurrentWeek = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const zoneFilteredMatches = useMemo(() => {
    return matches.filter((item) => {
      const countryOk =
        selectedCountry === 'ALL' ||
        String(item.country ?? item.venue?.country ?? '')
          .toLowerCase()
          .trim() === selectedCountry.toLowerCase();
      const leagueOk =
        selectedLeague === 'ALL' ||
        String(item.league ?? item.competition?.name ?? '')
          .toLowerCase()
          .trim() === selectedLeague.toLowerCase();
      return countryOk && leagueOk;
    });
  }, [matches, selectedCountry, selectedLeague]);

  const sectionScopedMatches = useMemo(() => {
    return zoneFilteredMatches.filter((item) => {
      if (sectionFilter === 'ALL') return true;
      return item.sectionType === sectionFilter;
    });
  }, [zoneFilteredMatches, sectionFilter]);

  const filteredMatches = useMemo(() => {
    return sectionScopedMatches.filter((item) => {
      if (personaFilter === 'ALL') return true;
      return item.persona === personaFilter;
    });
  }, [sectionScopedMatches, personaFilter]);

  const weekScopedMatches = useMemo(() => {
    const weekStartTs = selectedWeekStart.getTime();
    const weekEndTs = selectedWeekEndExclusive.getTime();
    return filteredMatches.filter((item) => {
      const matchTs = new Date(item.date).getTime();
      return matchTs >= weekStartTs && matchTs < weekEndTs;
    });
  }, [filteredMatches, selectedWeekEndExclusive, selectedWeekStart]);

  const weekMatchesByDay = useMemo(() => {
    const byDay = new Map<string, CalendarMatch[]>();
    for (const date of selectedWeekDates) {
      byDay.set(toDayKey(date), []);
    }
    for (const item of weekScopedMatches) {
      const key = toDayKey(new Date(item.date));
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.push(item);
    }
    for (const bucket of byDay.values()) {
      bucket.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
    }
    return byDay;
  }, [selectedWeekDates, weekScopedMatches]);

  const personaCounts = useMemo(() => {
    const initial: Record<CalendarPersonaFilter, number> = {
      ALL: sectionScopedMatches.length,
      AGENTS: 0,
      SCOUTS: 0,
      PLAYERS: 0,
    };
    for (const item of sectionScopedMatches) {
      const persona = item.persona ?? 'SCOUTS';
      initial[persona] += 1;
    }
    return initial;
  }, [sectionScopedMatches]);

  const sectionCounts = useMemo(() => {
    const initial: Record<CalendarSectionFilter, number> = {
      ALL: zoneFilteredMatches.length,
      MY: 0,
      SHARED: 0,
      DISCOVER: 0,
    };
    for (const item of zoneFilteredMatches) {
      const section = item.sectionType;
      if (section === 'MY' || section === 'SHARED' || section === 'DISCOVER') {
        initial[section] += 1;
      }
    }
    return initial;
  }, [zoneFilteredMatches]);

  const groupedListByDay = useMemo(() => {
    const byDay = new Map<string, { date: Date; items: CalendarMatch[] }>();
    for (const item of weekScopedMatches) {
      const date = new Date(item.date);
      const dayKey = toDayKey(date);

      const existing = byDay.get(dayKey);
      if (existing) {
        existing.items.push(item);
      } else {
        byDay.set(dayKey, { date, items: [item] });
      }
    }

    return Array.from(byDay.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((group) => ({
        ...group,
        items: group.items.sort(
          (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
        ),
      }));
  }, [weekScopedMatches]);

  useEffect(() => {
    if (!selectedMapMatchId) return;
    if (!filteredMatches.some((match) => match.id === selectedMapMatchId)) {
      setSelectedMapMatchId(null);
    }
  }, [filteredMatches, selectedMapMatchId]);

  const getMatchesForDate = useCallback(
    (date: Date) => weekMatchesByDay.get(toDayKey(date)) ?? [],
    [weekMatchesByDay],
  );

  const upcomingMatches = useMemo(
    () => filteredMatches.filter((item) => new Date(item.date).getTime() >= Date.now()),
    [filteredMatches],
  );

  const handleShareCalendar = useCallback(async () => {
    const source = upcomingMatches.slice(0, 6);
    const lines = source.map(
      (item) =>
        `• ${formatDateLabel(item.date, language)} ${formatTimeLabel(item.date, language)} - ${
          item.title ??
          `${item.homeClub?.name ?? copy.teamsTbd ?? 'TBD'} vs ${item.awayClub?.name ?? copy.teamsTbd ?? 'TBD'}`
        }`,
    );

    const headline = copy.shareHeadline ?? 'Arcane Calendar';
    const message = [headline, ...lines].join('\n');

    try {
      await Share.share({ message });
    } catch (error) {
      logError('Failed to share calendar summary', error);
    }
  }, [copy.shareHeadline, copy.teamsTbd, language, upcomingMatches]);

  const handleCreateReport = useCallback(() => {
    const firstMatch = upcomingMatches.find((item) => item.sourceType === 'MATCH');
    if (firstMatch?.id) {
      navigation.navigate('CreateReport', { playerId: undefined });
      return;
    }
    navigation.navigate('CreateReport', { playerId: undefined });
  }, [navigation, upcomingMatches]);

  const handleOpenMissionRequestsHub = useCallback(() => {
    navigation.navigate('MissionRequests');
  }, [navigation]);

  const defaultEmptyTitle =
    calendarFeedStrategy === 'GLOBAL_MATCHES'
      ? copyAny.emptyUpcomingTitle ?? 'Aucun match à venir'
      : copy.emptyTitle ?? 'Aucun rendez-vous planifié';
  const defaultEmptyBody =
    calendarFeedStrategy === 'GLOBAL_MATCHES'
      ? copyAny.emptyUpcomingBody ?? 'Aucun match à venir pour ce filtre.'
      : copy.emptyBody ?? 'Aucun élément pour ce filtre.';

  const renderWeekNavigator = () => (
    <View style={styles.weekNavigator} testID="calendar-center-week-navigation">
      <View style={styles.weekNavigatorRow}>
        <TouchableOpacity
          testID="calendar-center-week-prev"
          style={styles.weekNavigatorButton}
          onPress={() => handleShiftWeek(-1)}
        >
          <Icon name="chevronBack" size={18} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.weekNavigatorCenter}>
          <Text style={styles.weekNavigatorLabel}>{weekRangeLabel}</Text>
          <Text style={styles.weekNavigatorHint}>
            {isCurrentWeek
              ? copyAny.weekCurrentHint ?? 'Semaine en cours'
              : copyAny.weekSelectedHint ?? 'Semaine sélectionnée'}
          </Text>
        </View>

        <TouchableOpacity
          testID="calendar-center-week-next"
          style={styles.weekNavigatorButton}
          onPress={() => handleShiftWeek(1)}
        >
          <Icon name="chevronForward" size={18} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {!isCurrentWeek ? (
        <TouchableOpacity
          testID="calendar-center-week-current"
          style={styles.weekNavigatorCurrentButton}
          onPress={handleGoToCurrentWeek}
        >
          <Icon name="today" size={14} color={colors.brand.primary} />
          <Text style={styles.weekNavigatorCurrentText}>
            {copyAny.weekCurrentCta ?? 'Revenir à cette semaine'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderStatusLegend = () => {
    const labels = copy.statusLabels ?? {};

    return (
      <View style={styles.legendBox}>
        {STATUS_ORDER.map((status) => (
          <View key={status} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
            <Text style={styles.legendText}>{labels[status] ?? status}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.legendCta} onPress={handleCreateReport}>
          <Text style={styles.legendCtaText}>{copy.createReportCta ?? 'Créer rapport'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMatchListItem = (match: CalendarMatch, index: number) => {
    const normalizedStatus = normalizeStatus(match.status);
    const missionLabel =
      match.missionType === 'PRIORITY'
        ? copyAny.priorityMissionLabel ?? 'Mission prioritaire'
        : match.missionType === 'VOLUNTARY'
        ? copyAny.voluntaryMissionLabel ?? 'Mission volontaire'
        : null;
    const sectionLabel =
      match.sectionType === 'MY'
        ? copyAny.myMissionLabel ?? 'Mes missions'
        : match.sectionType === 'SHARED'
        ? copyAny.sharedMissionLabel ?? 'Calendrier partagé'
        : match.sectionType === 'DISCOVER'
        ? copyAny.discoverMissionLabel ?? 'Découverte'
        : null;
    const isDiscover = match.sectionType === 'DISCOVER';
    const isAdding = addingMatchId === match.id;
    const persona = match.persona ?? 'SCOUTS';
    const personaColor = PERSONA_COLORS[persona];
    const personaLabel =
      persona === 'AGENTS'
        ? copyAny.agentRoleLabel ?? 'Agent'
        : persona === 'PLAYERS'
        ? copyAny.playerRoleLabel ?? 'Joueur'
        : copyAny.scoutRoleLabel ?? 'Scout';
    const participantNames = (match.participants ?? [])
      .map((participant) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
      .filter((value) => value.length > 0);
    const participantPreview = participantNames.slice(0, 2).join(', ');
    const participantOverflow = participantNames.length > 2 ? ` +${participantNames.length - 2}` : '';

    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchTile, { borderColor: `${personaColor}66` }]}
        activeOpacity={0.92}
        onPress={() =>
          navigation.navigate('MatchDetail', {
            match,
            matchId: match.id,
            assignmentId: match.assignmentId,
          })
        }
      >
        <View style={styles.matchTileContent}>
          <View style={styles.matchHeaderRow}>
            <View>
              <Text style={styles.matchDate}>{formatDateLabel(match.date, language)}</Text>
              <Text style={styles.matchTime}>{formatTimeLabel(match.date, language)}</Text>
            </View>

            <View style={[styles.statusPill, { borderColor: STATUS_COLORS[normalizedStatus] }]}>
              <Text style={[styles.statusPillText, { color: STATUS_COLORS[normalizedStatus] }]}>
                {(copy.statusLabels ?? {})[normalizedStatus] ?? normalizedStatus}
              </Text>
            </View>
          </View>

          {(sectionLabel || missionLabel || personaLabel) && (
            <View style={styles.badgesRow}>
              <View style={[styles.roleBadge, { borderColor: `${personaColor}66`, backgroundColor: `${personaColor}24` }]}>
                <Text style={styles.roleBadgeText}>{personaLabel}</Text>
              </View>
              {sectionLabel ? (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{sectionLabel}</Text>
                </View>
              ) : null}
              {missionLabel ? (
                <View
                  style={[
                    styles.missionBadge,
                    match.missionType === 'PRIORITY'
                      ? styles.missionBadgePriority
                      : styles.missionBadgeVoluntary,
                  ]}
                >
                  <Text style={styles.missionBadgeText}>{missionLabel}</Text>
                </View>
              ) : null}
            </View>
          )}

          {match.competition?.name ? (
            <View style={styles.competitionRow}>
              {renderBadge(match.competition.logo)}
              <Text style={styles.competitionName}>{match.competition.name}</Text>
            </View>
          ) : null}

          <View style={styles.teamsContainer}>
            <View style={styles.team}>
              {renderBadge(match.homeClub?.logo)}
              <Text style={styles.teamName}>{match.homeClub?.name ?? copy.teamsTbd ?? 'TBD'}</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.team}>
              {renderBadge(match.awayClub?.logo)}
              <Text style={styles.teamName}>{match.awayClub?.name ?? copy.teamsTbd ?? 'TBD'}</Text>
            </View>
          </View>

          {(match.locationLabel || match.venue?.name) && (
            <View style={styles.metaRow}>
              <Icon name="location" size={16} color={colors.text.secondary} />
              <Text style={styles.metaText}>
                {match.locationLabel ??
                  [match.venue?.name, match.venue?.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {participantNames.length > 0 ? (
            <View style={styles.metaRow}>
              <Icon name="people" size={16} color={colors.brand.primary} />
              <Text style={styles.metaText}>
                {participantPreview}
                {participantOverflow}
              </Text>
            </View>
          ) : null}

          {participantNames.length === 0 && match.assignments && match.assignments.length > 0 && (
            <View style={styles.metaRow}>
              <Icon name="people" size={16} color={colors.brand.primary} />
              <Text style={styles.metaText}>
                {match.assignments.length}{' '}
                {match.assignments.length > 1
                  ? copy.assignedPlural ?? 'assignés'
                  : copy.assignedSingle ?? 'assigné'}
              </Text>
            </View>
          )}

          {isDiscover && isScoutCalendarMode && (
            <TouchableOpacity
              style={[styles.addToCalendarButton, isAdding && styles.addToCalendarButtonDisabled]}
              onPress={() => handleAddToMyCalendar(match.id)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <>
                  <Icon name="add" size={16} color={colors.background.primary} />
                  <Text style={styles.addToCalendarButtonText}>
                    {copyAny.addToMyCalendarCta ?? 'Ajouter à mon calendrier'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <LinearGradient
          colors={index % 2 === 0 ? ['#58D3FF', '#1D4ED8'] : ['#FDE047', '#F97316']}
          style={styles.matchTileAccent}
        />
      </TouchableOpacity>
    );
  };

  const renderListView = () => (
    <ScrollView
      testID="calendar-center-list-view"
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
      {renderWeekNavigator()}
      {groupedListByDay.length === 0 ? (
        <View testID="calendar-center-empty-state">
          <GlassCard variant="elevated" style={styles.emptyCard}>
            <Icon name="calendar" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>{defaultEmptyTitle}</Text>
            <Text style={styles.emptySubtext}>{defaultEmptyBody}</Text>
          </GlassCard>
        </View>
      ) : (
        groupedListByDay.map((group) => (
          <View key={group.date.toISOString()} style={styles.daySection}>
            <Text style={styles.daySectionTitle}>{formatSectionDayLabel(group.date, language)}</Text>
            {group.items.map((match, index) => renderMatchListItem(match, index))}
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderWeekView = () => {
    const weekDates = selectedWeekDates;
    const selectedDayMatches = getMatchesForDate(selectedDate);
    const hasAnyWeekMatch = weekScopedMatches.length > 0;
    const renderWeekMatchCard = (match: CalendarMatch) => {
      const normalizedStatus = normalizeStatus(match.status);
      const statusText = (copy.statusLabels ?? {})[normalizedStatus] ?? normalizedStatus;
      const statusColor = STATUS_COLORS[normalizedStatus];
      const missionLabel =
        match.missionType === 'PRIORITY'
          ? copyAny.priorityMissionLabel ?? 'Mission prioritaire'
          : match.missionType === 'VOLUNTARY'
          ? copyAny.voluntaryMissionLabel ?? 'Mission volontaire'
          : null;
      const sectionLabel =
        match.sectionType === 'MY'
          ? copyAny.myMissionLabel ?? 'Mes missions'
          : match.sectionType === 'SHARED'
          ? copyAny.sharedMissionLabel ?? 'Calendrier partagé'
          : match.sectionType === 'DISCOVER'
          ? copyAny.discoverMissionLabel ?? 'Découverte'
          : null;
      const persona = match.persona ?? 'SCOUTS';
      const personaColor = PERSONA_COLORS[persona];
      const personaLabel =
        persona === 'AGENTS'
          ? copyAny.agentRoleLabel ?? 'Agent'
          : persona === 'PLAYERS'
          ? copyAny.playerRoleLabel ?? 'Joueur'
          : copyAny.scoutRoleLabel ?? 'Scout';
      const participants = (match.participants ?? [])
        .map((participant) => `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim())
        .filter(Boolean);
      const participantPreview = participants.slice(0, 2).join(', ');
      const participantOverflow = participants.length > 2 ? ` +${participants.length - 2}` : '';
      const venueLabel = match.locationLabel ??
        [match.venue?.name, match.venue?.city].filter(Boolean).join(', ');

      return (
        <TouchableOpacity
          key={match.id}
          activeOpacity={0.92}
          onPress={() =>
            navigation.navigate('MatchDetail', {
              match,
              matchId: match.id,
              assignmentId: match.assignmentId,
            })
          }
        >
          <GlassCard
            variant="elevated"
            style={[styles.weekMatchCard, { borderColor: `${personaColor}66` }]}
          >
            <View style={styles.weekMatchHeader}>
              <View style={styles.weekMatchMeta}>
                <Text style={styles.matchTime}>{formatTimeLabel(match.date, language)}</Text>
              </View>
              <View style={[styles.statusPill, { borderColor: statusColor }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>{statusText}</Text>
              </View>
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.roleBadge, { borderColor: `${personaColor}66`, backgroundColor: `${personaColor}24` }]}>
                <Text style={styles.roleBadgeText}>{personaLabel}</Text>
              </View>
              {sectionLabel ? (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{sectionLabel}</Text>
                </View>
              ) : null}
              {missionLabel ? (
                <View
                  style={[
                    styles.missionBadge,
                    match.missionType === 'PRIORITY'
                      ? styles.missionBadgePriority
                      : styles.missionBadgeVoluntary,
                  ]}
                >
                  <Text style={styles.missionBadgeText}>{missionLabel}</Text>
                </View>
              ) : null}
            </View>

            {match.competition?.name ? (
              <View style={styles.competitionRow}>
                {renderBadge(match.competition.logo)}
                <Text style={styles.competitionName}>{match.competition.name}</Text>
              </View>
            ) : null}

            <Text style={styles.weekMatchTeams}>
              {match.homeClub?.name ?? copy.teamsTbd ?? 'TBD'} vs{' '}
              {match.awayClub?.name ?? copy.teamsTbd ?? 'TBD'}
            </Text>

            {venueLabel ? (
              <View style={styles.weekMatchMetaRow}>
                <Icon name="location" size={14} color={colors.text.secondary} />
                <Text style={styles.weekMatchVenue}>{venueLabel}</Text>
              </View>
            ) : null}

            {participants.length > 0 ? (
              <View style={styles.weekMatchMetaRow}>
                <Icon name="people" size={14} color={colors.brand.primary} />
                <Text style={styles.weekMatchMetaText}>
                  {participantPreview}
                  {participantOverflow}
                </Text>
              </View>
            ) : null}
          </GlassCard>
        </TouchableOpacity>
      );
    };

    return (
      <ScrollView
        testID="calendar-center-week-view"
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
        {renderWeekNavigator()}
        <View style={styles.weekHeader}>
            {weekDates.map((date) => {
              const dayMatches = getMatchesForDate(date);
              const isSelected = isSameDate(date, selectedDate);
              const dayMatchCount = dayMatches.length;
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  testID={`calendar-center-weekday-${date.getDate()}`}
                  style={[styles.weekDay, isSelected && styles.weekDaySelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.weekDayName, isSelected && styles.weekDayNameSelected]}>
                    {formatDayLabel(date, language)}
                  </Text>
                  <Text style={[styles.weekDayNumber, isSelected && styles.weekDayNumberSelected]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[styles.weekDayCount, isSelected && styles.weekDayCountSelected]}>
                    {dayMatchCount}
                  </Text>
                  <View style={styles.weekDayDotsRow}>
                    {dayMatches.slice(0, 2).map((item) => (
                      <View
                        key={`${date.toISOString()}-${item.id}`}
                      style={[
                        styles.weekDayDot,
                        { backgroundColor: STATUS_COLORS[normalizeStatus(item.status)] },
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.weekContent}>
          {!hasAnyWeekMatch ? (
            <GlassCard variant="elevated" style={styles.emptyCard}>
              <Icon name="calendar" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>{defaultEmptyTitle}</Text>
              <Text style={styles.emptySubtext}>{defaultEmptyBody}</Text>
            </GlassCard>
          ) : selectedDayMatches.length === 0 ? (
            <GlassCard variant="elevated" style={styles.emptyCard}>
              <Icon name="calendar" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>
                {copyAny.emptySelectedDayTitle ?? 'Aucun rendez-vous ce jour'}
              </Text>
              <Text style={styles.emptySubtext}>
                {copyAny.emptySelectedDayBody ??
                  'Sélectionnez un autre jour ou changez le filtre persona.'}
              </Text>
            </GlassCard>
          ) : (
            <View key={selectedDate.toISOString()} style={styles.daySection}>
              <Text style={styles.daySectionTitle}>
                {formatSectionDayLabel(selectedDate, language)}
              </Text>
              {selectedDayMatches.map((match) => (
                renderWeekMatchCard(match)
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderMapView = () => {
    const matchesWithLocation = filteredMatches.filter(
      (m) => typeof m.venue?.latitude === 'number' && typeof m.venue?.longitude === 'number',
    );
    const selectedMapMatch =
      matchesWithLocation.find((match) => match.id === selectedMapMatchId) ??
      matchesWithLocation[0];

    const focusMapMatch = (match: CalendarMatch) => {
      setSelectedMapMatchId(match.id);
      if (
        mapRef.current &&
        typeof match.venue?.latitude === 'number' &&
        typeof match.venue?.longitude === 'number'
      ) {
        mapRef.current.animateToRegion(
          {
            latitude: match.venue.latitude,
            longitude: match.venue.longitude,
            latitudeDelta: 2.2,
            longitudeDelta: 2.2,
          },
          260,
        );
      }
    };

    if (!MapView) {
      return (
        <View style={styles.mapContainer} testID="calendar-center-map-view">
          <View testID="calendar-center-map-fallback" style={{ flex: 1 }}>
            <GlassCard variant="elevated" style={styles.mapUnavailable}>
              <Icon name="location" size={48} color={colors.text.secondary} />
              <Text style={styles.mapUnavailableText}>{copy.mapUnavailableTitle ?? 'Map unavailable'}</Text>
              <Text style={styles.mapUnavailableSubtext}>
                {copy.mapUnavailableBody ?? 'react-native-maps is not available on this build.'}
              </Text>
            </GlassCard>
          </View>
        </View>
      );
    }

    const initialRegion =
      selectedMapMatch
        ? {
            latitude: selectedMapMatch.venue!.latitude!,
            longitude: selectedMapMatch.venue!.longitude!,
            latitudeDelta: 4,
            longitudeDelta: 4,
          }
        : {
            latitude: 48.8566,
            longitude: 2.3522,
            latitudeDelta: 6,
            longitudeDelta: 6,
          };

    return (
      <View style={styles.mapContainer} testID="calendar-center-map-view">
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          testID="calendar-center-map-canvas"
        >
          {matchesWithLocation.map((match) => {
            const normalizedStatus = normalizeStatus(match.status);
            const isSelected = selectedMapMatch?.id === match.id;
            return (
              <Marker
                key={match.id}
                coordinate={{
                  latitude: match.venue!.latitude!,
                  longitude: match.venue!.longitude!,
                }}
                title={match.title}
                description={`${formatDateLabel(match.date, language)} • ${
                  (copy.statusLabels ?? {})[normalizedStatus] ?? normalizedStatus
                }`}
                pinColor={isSelected ? '#E6F54A' : STATUS_COLORS[normalizedStatus]}
                onPress={() => focusMapMatch(match)}
              />
            );
          })}
        </MapView>

        <View style={styles.mapOverlay} testID="calendar-center-map-overlay">{renderStatusLegend()}</View>

        {matchesWithLocation.length === 0 ? (
          <View style={styles.mapEmptyOverlay} testID="calendar-center-map-empty">
            <GlassCard variant="elevated" style={styles.mapEmptyCard}>
              <Icon name="location" size={28} color={colors.text.secondary} />
              <Text style={styles.mapEmptyTitle}>
                {copyAny.mapNoGeodataTitle ?? 'Aucun point GPS disponible'}
              </Text>
              <Text style={styles.mapEmptyBody}>
                {copyAny.mapNoGeodataBody ??
                  'Ajoutez un stade avec coordonnées pour afficher les missions sur la carte.'}
              </Text>
            </GlassCard>
          </View>
        ) : null}

        {matchesWithLocation.length > 0 ? (
          <View style={styles.mapMissionsPanel} testID="calendar-center-map-missions">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapMissionsRow}>
              {matchesWithLocation.map((match) => {
                const isSelected = selectedMapMatch?.id === match.id;
                const normalizedStatus = normalizeStatus(match.status);
                return (
                  <TouchableOpacity
                    key={match.id}
                    style={[styles.mapMissionCard, isSelected && styles.mapMissionCardSelected]}
                    onPress={() => focusMapMatch(match)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.mapMissionTime}>{formatTimeLabel(match.date, language)}</Text>
                    <Text style={styles.mapMissionTitle} numberOfLines={1}>
                      {match.homeClub?.name ?? copy.teamsTbd ?? 'TBD'} vs{' '}
                      {match.awayClub?.name ?? copy.teamsTbd ?? 'TBD'}
                    </Text>
                    <Text
                      style={[
                        styles.mapMissionStatus,
                        { color: isSelected ? '#E6F54A' : STATUS_COLORS[normalizedStatus] },
                      ]}
                    >
                      {(copy.statusLabels ?? {})[normalizedStatus] ?? normalizedStatus}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

  const personaLabels = copy.personaLabels ?? {};
  const renderBackdrop = () => (
    <View pointerEvents="none" style={styles.backdropLayer}>
      <LinearGradient
        colors={['rgba(228, 255, 59, 0.12)', 'rgba(228, 255, 59, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdropGlowTop}
      />
      <LinearGradient
        colors={['rgba(88, 230, 255, 0.10)', 'rgba(88, 230, 255, 0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backdropGlowBottom}
      />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderBackdrop()}
        <View style={styles.loadingContainer} testID="calendar-center-loading">
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>{copy.loading ?? 'Loading calendar...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderBackdrop()}
      <ScreenHeader
        blur={false}
        borderBottom={false}
        compact
        title={copy.title ?? 'Match Center'}
        subtitle={
          copy.subtitle ??
          'Suivez vos rencontres et coordonnez les missions scouts.'
        }
        rightActions={
          canOpenMissionRequestsHub ? (
            <TouchableOpacity
              style={styles.headerHubButton}
              onPress={handleOpenMissionRequestsHub}
              testID="calendar-center-open-mission-requests"
            >
              <Icon name="clipboard" size={14} color={colors.background.primary} />
              <Text style={styles.headerHubButtonText}>
                {copyAny.missionRequestsHubCta ?? 'Missions'}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.viewModeContainer}>
        {(['list', 'week', 'map'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            testID={`calendar-center-viewmode-${mode}`}
            style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
            onPress={() => setViewMode(mode)}
          >
            <Icon
              name={
                mode === 'list' ? 'list' : mode === 'week' ? 'calendar' : 'location'
              }
              size={18}
              color={viewMode === mode ? colors.background.primary : colors.text.secondary}
            />
            <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
              {(copy.viewModes?.[mode] ?? mode).toString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isScoutCalendarMode ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionFilterRow}
          testID="calendar-center-section-filters"
        >
          {(['ALL', 'MY', 'SHARED', 'DISCOVER'] as CalendarSectionFilter[]).map((filter) => {
            const active = sectionFilter === filter;
            const label =
              filter === 'ALL'
                ? copyAny.sectionAllLabel ?? 'Toutes missions'
                : filter === 'MY'
                ? copyAny.myMissionLabel ?? 'Mes missions'
                : filter === 'SHARED'
                ? copyAny.sharedMissionLabel ?? 'Calendrier partagé'
                : copyAny.discoverMissionLabel ?? 'Découverte';
            const count = sectionCounts[filter];
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.sectionFilterChip, active && styles.sectionFilterChipActive]}
                onPress={() => setSectionFilter(filter)}
                testID={`calendar-center-section-${filter.toLowerCase()}`}
              >
                <Text style={[styles.sectionFilterChipText, active && styles.sectionFilterChipTextActive]}>
                  {label} · {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.personaRow}>
        {(['ALL', 'SCOUTS', 'PLAYERS', 'AGENTS'] as CalendarPersonaFilter[]).map((filter) => {
          const active = personaFilter === filter;
          const count = personaCounts[filter];
          return (
            <TouchableOpacity
              key={filter}
              testID={`calendar-center-persona-${filter.toLowerCase()}`}
              style={[styles.personaChip, active && styles.personaChipActive]}
              onPress={() => setPersonaFilter(filter)}
            >
              <Text style={[styles.personaChipText, active && styles.personaChipTextActive]}>
                {(personaLabels[filter] ?? filter).toString()} · {count}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity testID="calendar-center-share" style={styles.shareBtn} onPress={handleShareCalendar}>
          <Icon name="share" size={16} color={colors.text.primary} />
          <Text style={styles.shareBtnText}>{copy.shareCta ?? 'Partager votre calendrier'}</Text>
        </TouchableOpacity>
      </View>

      {countries.length > 0 || leagues.length > 0 ? (
        <View style={styles.zoneFiltersContainer}>
          {countries.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneFilterRow}>
              {['ALL', ...countries].map((country) => {
                const active = selectedCountry === country;
                return (
                  <TouchableOpacity
                    key={`country-${country}`}
                    style={[styles.zoneFilterChip, active && styles.zoneFilterChipActive]}
                    onPress={() => setSelectedCountry(country)}
                  >
                    <Text style={[styles.zoneFilterChipText, active && styles.zoneFilterChipTextActive]}>
                      {country === 'ALL' ? copyAny.allCountriesLabel ?? 'Tous pays' : country}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          {leagues.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneFilterRow}>
              {['ALL', ...leagues].map((league) => {
                const active = selectedLeague === league;
                return (
                  <TouchableOpacity
                    key={`league-${league}`}
                    style={[styles.zoneFilterChip, active && styles.zoneFilterChipActive]}
                    onPress={() => setSelectedLeague(league)}
                  >
                    <Text style={[styles.zoneFilterChipText, active && styles.zoneFilterChipTextActive]}>
                      {league === 'ALL' ? copyAny.allLeaguesLabel ?? 'Toutes ligues' : league}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {viewMode === 'list' && renderListView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'map' && renderMapView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backdropGlowTop: {
    position: 'absolute',
    top: -110,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 160,
  },
  backdropGlowBottom: {
    position: 'absolute',
    right: -90,
    bottom: 120,
    width: 250,
    height: 250,
    borderRadius: 160,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  headerHubButton: {
    borderRadius: 999,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerHubButtonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 4,
    zIndex: 1,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    gap: spacing.xs,
  },
  viewModeButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  viewModeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  viewModeTextActive: {
    color: colors.background.primary,
  },
  sectionFilterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    zIndex: 1,
  },
  sectionFilterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sectionFilterChipActive: {
    borderColor: '#58D3FF',
    backgroundColor: 'rgba(88,211,255,0.18)',
  },
  sectionFilterChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  sectionFilterChipTextActive: {
    color: '#58D3FF',
  },
  personaRow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  personaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  personaChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + '22',
  },
  personaChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  personaChipTextActive: {
    color: colors.brand.primary,
  },
  shareBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  shareBtnText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  zoneFiltersContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  zoneFilterRow: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  zoneFilterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  zoneFilterChipActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + '20',
  },
  zoneFilterChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  zoneFilterChipTextActive: {
    color: colors.brand.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyCard: {
    padding: spacing.xl * 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  matchTile: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0f1525',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  matchTileContent: {
    padding: spacing.lg,
  },
  matchTileAccent: {
    height: 5,
  },
  matchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  matchDate: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  matchTime: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    marginTop: spacing.xs,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  sectionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(148,163,184,0.16)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  missionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  missionBadgePriority: {
    borderColor: '#FDE047',
    backgroundColor: 'rgba(250,204,21,0.2)',
  },
  missionBadgeVoluntary: {
    borderColor: '#58D3FF',
    backgroundColor: 'rgba(56,189,248,0.2)',
  },
  missionBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text.primary,
  },
  competitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  competitionName: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  vs: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  addToCalendarButton: {
    marginTop: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  addToCalendarButtonDisabled: {
    opacity: 0.6,
  },
  addToCalendarButtonText: {
    color: colors.background.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  badgePlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface.glassLight,
  },
  badgeImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  weekNavigator: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  weekNavigatorRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weekNavigatorButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavigatorCenter: {
    flex: 1,
    alignItems: 'center',
  },
  weekNavigatorLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '700',
  },
  weekNavigatorHint: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  weekNavigatorCurrentButton: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + '1F',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekNavigatorCurrentText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    padding: 3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
  },
  weekDay: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 14,
  },
  weekDaySelected: {
    backgroundColor: `${colors.brand.primary}22`,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}66`,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  weekDayName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  weekDayNameSelected: {
    color: colors.brand.primary,
  },
  weekDayNumber: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  weekDayNumberSelected: {
    color: colors.brand.primary,
  },
  weekDayCount: {
    marginTop: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    overflow: 'hidden',
  },
  weekDayCountSelected: {
    color: colors.brand.primary,
    borderColor: `${colors.brand.primary}80`,
  },
  weekDayDotsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 6,
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekContent: {
    paddingHorizontal: spacing.md,
  },
  daySection: {
    marginBottom: spacing.xl,
  },
  daySectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  weekMatchCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  weekMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  weekMatchMeta: {
    flex: 1,
    gap: 4,
  },
  weekMatchTime: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  weekMatchStatus: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.text.secondary,
    opacity: 0.95,
  },
  weekMatchTeams: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  weekMatchVenue: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  weekMatchMetaRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekMatchMetaText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: Math.min(220, width * 0.55),
  },
  mapEmptyOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.lg,
    alignItems: 'center',
  },
  mapEmptyCard: {
    width: '100%',
    maxWidth: 360,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  mapEmptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  mapEmptyBody: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  mapMissionsPanel: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  mapMissionsRow: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  mapMissionCard: {
    width: width * 0.66,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(8,15,32,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapMissionCardSelected: {
    borderColor: '#E6F54A',
    backgroundColor: 'rgba(230,245,74,0.12)',
  },
  mapMissionTime: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  mapMissionTitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '700',
  },
  mapMissionStatus: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  legendBox: {
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: 'rgba(8,13,26,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  legendCta: {
    marginTop: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  legendCtaText: {
    color: colors.background.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  mapUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    margin: spacing.lg,
  },
  mapUnavailableText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  mapUnavailableSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default CalendarScreenNew;
