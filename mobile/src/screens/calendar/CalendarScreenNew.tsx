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
import api, { extractPayloadItems, pickDateValue } from '../../services/api';
import { eventsApi, type Event as CalendarEvent } from '../../services/api/events';
import { logger, logError } from '../../utils/logger';
import type { AppStackParamList } from '../../types/navigation';
import type {
  CalendarMatch,
  CalendarItemStatus,
  CalendarPersonaFilter,
} from '../../types/calendar';
import { useLocalization } from '../../contexts/LocalizationContext';

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

const STATUS_COLORS: Record<CalendarItemStatus, string> = {
  PLANNED: '#E6F54A',
  EN_ROUTE: '#2EE59D',
  REPORT_SUBMITTED: '#58D3FF',
  CONFIRMED: '#58D3FF',
  IN_PROGRESS: '#4F7BFF',
  COMPLETED: '#2EE59D',
  CANCELLED: '#EF4444',
};

const STATUS_ORDER: CalendarItemStatus[] = ['PLANNED', 'EN_ROUTE', 'REPORT_SUBMITTED'];

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
  const assignedUsers = Array.isArray(item.assignedUsers) ? item.assignedUsers : [];
  const firstRole = assignedUsers[0]?.user?.role ?? item.type;

  const assignments = assignedUsers
    .map((entry) => {
      if (!entry?.user) return null;
      return {
        scoutId: entry.user.id,
        scout: {
          firstName: entry.user.firstName,
          lastName: entry.user.lastName,
          role: entry.user.role,
        },
      };
    })
    .filter(Boolean) as CalendarMatch['assignments'];

  return {
    id: `event-${item.id}`,
    sourceType: 'EVENT',
    title: item.title,
    date: item.startDate,
    status: normalizeStatus(item.status),
    persona: inferPersonaFromText(String(firstRole)),
    homeClub: item.match?.homeClub
      ? {
          id: item.match.homeClub.id,
          name: item.match.homeClub.name,
          logo: item.match.homeClub.logo,
        }
      : undefined,
    awayClub: item.match?.awayClub
      ? {
          id: item.match.awayClub.id,
          name: item.match.awayClub.name,
          logo: item.match.awayClub.logo,
        }
      : undefined,
    competition: item.match
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
    participants: assignments?.map((entry) => ({
      id: entry.scoutId,
      firstName: entry.scout?.firstName,
      lastName: entry.scout?.lastName,
      role: entry.scout?.role,
      avatar: entry.scout?.avatar,
    })),
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
        .filter((assignment) => Boolean(assignment.scoutId || assignment.scout))
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
    participants: assignments.map((entry) => ({
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

const renderBadge = (logo?: string | null) => {
  if (!logo) {
    return <View style={styles.badgePlaceholder} />;
  }

  return <Image source={{ uri: logo }} style={styles.badgeImage} />;
};

export const CalendarScreenNew = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { dictionary, language } = useLocalization();
  const copy = dictionary.calendarCenter ?? {};
  const mapRef = useRef<any>(null);

  const [matches, setMatches] = useState<CalendarMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personaFilter, setPersonaFilter] = useState<CalendarPersonaFilter>('ALL');
  const [selectedMapMatchId, setSelectedMapMatchId] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);

      const [eventsPayload, matchesPayload] = await Promise.all([
        eventsApi.getMyEvents().catch((error) => {
          logError('Failed to fetch calendar events', error);
          return [];
        }),
        api.getMyAssignedMatches().catch((error) => {
          logError('Failed to fetch calendar matches', error);
          return api.getMatches();
        }),
      ]);

      const events = extractPayloadItems<CalendarEvent>(eventsPayload).map(adaptEventToCalendar);
      const matchesList = extractPayloadItems<any>(matchesPayload).map(adaptMatchToCalendar);

      const merged = [...events, ...matchesList].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      logger.info('calendar', 'Calendar feed adapted', {
        events: events.length,
        matches: matchesList.length,
        total: merged.length,
      });

      setMatches(merged);
    } catch (error) {
      logError('Failed to build calendar feed', error);
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const getWeekDates = useCallback(() => {
    const week = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i += 1) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }

    return week;
  }, [selectedDate]);

  const isSameDate = useCallback((left: Date, right: Date) => {
    return (
      left.getDate() === right.getDate() &&
      left.getMonth() === right.getMonth() &&
      left.getFullYear() === right.getFullYear()
    );
  }, []);

  const filteredMatches = useMemo(() => {
    if (personaFilter === 'ALL') return matches;
    return matches.filter((item) => item.persona === personaFilter);
  }, [matches, personaFilter]);

  useEffect(() => {
    if (!selectedMapMatchId) return;
    if (!filteredMatches.some((match) => match.id === selectedMapMatchId)) {
      setSelectedMapMatchId(null);
    }
  }, [filteredMatches, selectedMapMatchId]);

  const getMatchesForDate = useCallback(
    (date: Date) =>
      filteredMatches.filter((match) => {
        const matchDate = new Date(match.date);
        return isSameDate(matchDate, date);
      }),
    [filteredMatches, isSameDate],
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

    return (
      <TouchableOpacity
        key={match.id}
        style={styles.matchTile}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('MatchDetail', { match })}
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

          {match.assignments && match.assignments.length > 0 && (
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
      {filteredMatches.length === 0 ? (
        <View testID="calendar-center-empty-state">
          <GlassCard variant="elevated" style={styles.emptyCard}>
            <Icon name="calendar" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>{copy.emptyTitle ?? 'Aucun rendez-vous planifié'}</Text>
            <Text style={styles.emptySubtext}>{copy.emptyBody ?? 'Aucun élément pour ce filtre.'}</Text>
          </GlassCard>
        </View>
      ) : (
        filteredMatches.map((match, index) => renderMatchListItem(match, index))
      )}
    </ScrollView>
  );

  const renderWeekView = () => {
    const weekDates = getWeekDates();

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
        <View style={styles.weekHeader}>
          {weekDates.map((date) => {
            const dayMatches = getMatchesForDate(date);
            const isSelected = isSameDate(date, selectedDate);
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
          {weekDates.map((date) => {
            const dayMatches = getMatchesForDate(date);
            if (dayMatches.length === 0) return null;

            return (
              <View key={date.toISOString()} style={styles.daySection}>
                <Text style={styles.daySectionTitle}>{formatSectionDayLabel(date, language)}</Text>
                {dayMatches.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('MatchDetail', { match })}
                  >
                    <GlassCard variant="elevated" style={styles.weekMatchCard}>
                      <View style={styles.weekMatchHeader}>
                        <Text style={styles.weekMatchTime}>{formatTimeLabel(match.date, language)}</Text>
                        <Text
                          style={[
                            styles.weekMatchStatus,
                            { color: STATUS_COLORS[normalizeStatus(match.status)] },
                          ]}
                        >
                          {(copy.statusLabels ?? {})[normalizeStatus(match.status)] ??
                            normalizeStatus(match.status)}
                        </Text>
                      </View>
                      <Text style={styles.weekMatchTeams}>
                        {match.homeClub?.name ?? copy.teamsTbd ?? 'TBD'} vs{' '}
                        {match.awayClub?.name ?? copy.teamsTbd ?? 'TBD'}
                      </Text>
                      {(match.locationLabel || match.venue?.name) ? (
                        <Text style={styles.weekMatchVenue}>
                          {match.locationLabel ??
                            [match.venue?.name, match.venue?.city].filter(Boolean).join(', ')}
                        </Text>
                      ) : null}
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer} testID="calendar-center-loading">
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>{copy.loading ?? 'Loading calendar...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader blur={false} borderBottom={false} />

      <View style={styles.heroSection}>
        <Text style={styles.heroEyebrow}>{copy.eyebrow ?? 'Arcane Calendar'}</Text>
        <Text style={styles.heroTitle}>{copy.title ?? 'Match Center'}</Text>
        <Text style={styles.heroSubtitle}>
          {copy.subtitle ??
            'Suivez vos rencontres planifiées, répartissez les scouts et visualisez les terrains en un coup d’œil.'}
        </Text>
      </View>

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

      <View style={styles.personaRow}>
        {(['ALL', 'SCOUTS', 'PLAYERS', 'AGENTS'] as CalendarPersonaFilter[]).map((filter) => {
          const active = personaFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              testID={`calendar-center-persona-${filter.toLowerCase()}`}
              style={[styles.personaChip, active && styles.personaChipActive]}
              onPress={() => setPersonaFilter(filter)}
            >
              <Text style={[styles.personaChipText, active && styles.personaChipTextActive]}>
                {personaLabels[filter] ?? filter}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity testID="calendar-center-share" style={styles.shareBtn} onPress={handleShareCalendar}>
          <Icon name="share" size={16} color={colors.text.primary} />
          <Text style={styles.shareBtnText}>{copy.shareCta ?? 'Partager votre calendrier'}</Text>
        </TouchableOpacity>
      </View>

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
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  heroEyebrow: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    gap: spacing.xs,
  },
  viewModeButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  viewModeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  viewModeTextActive: {
    color: colors.background.primary,
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
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  weekDay: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    flex: 1,
    borderRadius: 12,
  },
  weekDaySelected: {
    backgroundColor: colors.brand.primary + '20',
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
    marginBottom: spacing.md,
  },
  weekMatchCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  weekMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weekMatchTime: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  weekMatchStatus: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
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
