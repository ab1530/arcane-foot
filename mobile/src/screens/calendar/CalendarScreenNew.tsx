import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import api from '../../services/api';
import { logger, logError } from '../../utils/logger';
import type { IconName } from '../../constants/icons';

// Conditional import for MapView
let MapView: any;
let Marker: any;
try {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
} catch (error) {
  // react-native-maps not available
  MapView = null;
  Marker = null;
}

const { width } = Dimensions.get('window');

interface Match {
  id: string;
  date: string;
  time?: string;
  homeClub?: {
    id: string;
    name: string;
    logo?: string;
  };
  awayClub?: {
    id: string;
    name: string;
    logo?: string;
  };
  venue?: {
    name: string;
    city: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  competition?: {
    name: string;
  };
  status?: string;
  assignments?: Array<{
    scoutId: string;
    scout?: {
      firstName: string;
      lastName: string;
    };
  }>;
}

type ViewMode = 'list' | 'week' | 'map';

export const CalendarScreenNew = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getMatches();

      // Handle different response formats
      const matchesList = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];

      logger.log('Matches fetched', { count: matchesList.length });
      setMatches(matchesList);
    } catch (error) {
      logError('Failed to fetch matches', error);
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

  const getWeekDates = () => {
    const week = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getMatchesForDate = (date: Date) => {
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate.getDate() === date.getDate() &&
             matchDate.getMonth() === date.getMonth() &&
             matchDate.getFullYear() === date.getFullYear();
    });
  };

  const renderListView = () => (
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
      {matches.length === 0 ? (
        <GlassCard variant="elevated" style={styles.emptyCard}>
          <Icon name="calendar" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyText}>No matches scheduled</Text>
        </GlassCard>
      ) : (
        matches.map(match => (
          <GlassCard key={match.id} variant="elevated" style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <View style={styles.dateContainer}>
                <Text style={styles.matchDate}>{formatDate(match.date)}</Text>
                <Text style={styles.matchTime}>{formatTime(match.date)}</Text>
              </View>
              {match.competition && (
                <Text style={styles.competition}>{match.competition.name}</Text>
              )}
            </View>

            <View style={styles.teamsContainer}>
              <View style={styles.team}>
                <Text style={styles.teamName}>{match.homeClub?.name || 'TBD'}</Text>
              </View>
              <Text style={styles.vs}>VS</Text>
              <View style={styles.team}>
                <Text style={styles.teamName}>{match.awayClub?.name || 'TBD'}</Text>
              </View>
            </View>

            {match.venue && (
              <View style={styles.venueContainer}>
                <Icon name="location" size={16} color={colors.text.secondary} />
                <Text style={styles.venueText}>
                  {match.venue.name}, {match.venue.city}
                </Text>
              </View>
            )}

            {match.assignments && match.assignments.length > 0 && (
              <View style={styles.scoutsContainer}>
                <Icon name="people" size={16} color={colors.brand.primary} />
                <Text style={styles.scoutsText}>
                  {match.assignments.length} scout{match.assignments.length > 1 ? 's' : ''} assigned
                </Text>
              </View>
            )}
          </GlassCard>
        ))
      )}
    </ScrollView>
  );

  const renderWeekView = () => {
    const weekDates = getWeekDates();

    return (
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
        <View style={styles.weekHeader}>
          {weekDates.map(date => (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.weekDay,
                isToday(date) && styles.weekDayToday
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.weekDayName,
                isToday(date) && styles.weekDayTextToday
              ]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                isToday(date) && styles.weekDayTextToday
              ]}>
                {date.getDate()}
              </Text>
              {getMatchesForDate(date).length > 0 && (
                <View style={styles.weekDayDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.weekContent}>
          {weekDates.map(date => {
            const dayMatches = getMatchesForDate(date);
            if (dayMatches.length === 0) return null;

            return (
              <View key={date.toISOString()} style={styles.daySection}>
                <Text style={styles.daySectionTitle}>
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                {dayMatches.map(match => (
                  <GlassCard key={match.id} variant="elevated" style={styles.weekMatchCard}>
                    <Text style={styles.weekMatchTime}>{formatTime(match.date)}</Text>
                    <Text style={styles.weekMatchTeams}>
                      {match.homeClub?.name} vs {match.awayClub?.name}
                    </Text>
                    {match.venue && (
                      <Text style={styles.weekMatchVenue}>{match.venue.name}</Text>
                    )}
                  </GlassCard>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderMapView = () => {
    // Check if MapView is available
    if (!MapView) {
      return (
        <View style={styles.mapContainer}>
          <GlassCard variant="elevated" style={styles.mapUnavailable}>
            <Icon name="location" size={48} color={colors.text.secondary} />
            <Text style={styles.mapUnavailableText}>Map view not available</Text>
            <Text style={styles.mapUnavailableSubtext}>
              Map view requires additional setup for iOS
            </Text>
          </GlassCard>
        </View>
      );
    }

    const matchesWithLocation = matches.filter(m =>
      m.venue?.latitude && m.venue?.longitude
    );

    const initialRegion = matchesWithLocation.length > 0 ? {
      latitude: matchesWithLocation[0].venue!.latitude!,
      longitude: matchesWithLocation[0].venue!.longitude!,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    } : {
      latitude: 48.8566,  // Paris coordinates as default
      longitude: 2.3522,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
        >
          {matchesWithLocation.map(match => (
            <Marker
              key={match.id}
              coordinate={{
                latitude: match.venue!.latitude!,
                longitude: match.venue!.longitude!,
              }}
              title={`${match.homeClub?.name} vs ${match.awayClub?.name}`}
              description={`${formatDate(match.date)} - ${match.venue?.name}`}
            />
          ))}
        </MapView>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer}>
        {(['list', 'week', 'map'] as ViewMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewModeButton,
              viewMode === mode && styles.viewModeButtonActive
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Icon
              name={mode === 'list' ? 'list' : mode === 'week' ? 'calendar' : 'location' as IconName}
              size={20}
              color={viewMode === mode ? colors.background.primary : colors.text.secondary}
            />
            <Text style={[
              styles.viewModeText,
              viewMode === mode && styles.viewModeTextActive
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content based on view mode */}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'map' && renderMapView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
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
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  viewModeButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  viewModeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  viewModeTextActive: {
    color: colors.background.primary,
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
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  matchCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dateContainer: {},
  matchDate: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  matchTime: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    marginTop: spacing.xs,
  },
  competition: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
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
  },
  teamName: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  vs: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  venueText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  scoutsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  scoutsText: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  weekDay: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  weekDayToday: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  weekDayName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  weekDayNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  weekDayTextToday: {
    color: colors.background.primary,
  },
  weekDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
    marginTop: spacing.xs,
  },
  weekContent: {
    paddingHorizontal: spacing.md,
  },
  daySection: {
    marginBottom: spacing.xl,
  },
  daySectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  weekMatchCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  weekMatchTime: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: 'bold',
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
  mapUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  mapUnavailableText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
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