import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi, Event } from '../../services/api/events';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';

type ViewMode = 'list' | 'calendar';
type FilterType = 'all' | 'upcoming' | 'my-events';

const CalendarScreen = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterType>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Event[];

      if (filter === 'upcoming') {
        data = await eventsApi.getUpcoming(20);
      } else if (filter === 'my-events') {
        data = await eventsApi.getMyEvents();
      } else {
        data = await eventsApi.getAll();
      }

      setEvents(data);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError('Impossible de charger les événements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents().finally(() => setRefreshing(false));
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'MATCH':
        return 'football';
      case 'TRAINING':
        return 'fitness';
      case 'MEETING':
        return 'people';
      case 'CAMP':
        return 'school';
      default:
        return 'calendar';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'MATCH':
        return COLORS.primary;
      case 'TRAINING':
        return COLORS.success;
      case 'MEETING':
        return COLORS.warning;
      case 'CAMP':
        return COLORS.secondary;
      default:
        return COLORS.gray[500];
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      PLANNED: { label: 'Prévu', color: COLORS.info },
      CONFIRMED: { label: 'Confirmé', color: COLORS.success },
      COMPLETED: { label: 'Terminé', color: COLORS.gray[400] },
      CANCELLED: { label: 'Annulé', color: COLORS.danger },
    };
    return config[status as keyof typeof config] || config.PLANNED;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const statusBadge = getStatusBadge(item.status);
    const typeColor = getEventTypeColor(item.type);

    return (
      <TouchableOpacity style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeIconContainer}>
            <Ionicons
              name={getEventTypeIcon(item.type) as any}
              size={24}
              color={typeColor}
            />
          </View>
          <View style={styles.eventTitleContainer}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.eventMeta}>
              <Ionicons name="location" size={14} color={COLORS.gray[500]} />
              <Text style={styles.eventLocation}>{item.location}</Text>
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}
          >
            <Text style={styles.statusBadgeText}>{statusBadge.label}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.eventDateTime}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.eventDate}>
              {formatDate(item.startDate)}
            </Text>
          </View>
          <View style={styles.eventDateTime}>
            <Ionicons name="time-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.eventTime}>
              {formatTime(item.startDate)} - {formatTime(item.endDate)}
            </Text>
          </View>
        </View>

        {item.assignedUsers && item.assignedUsers.length > 0 && (
          <View style={styles.assignedUsersContainer}>
            <Ionicons name="people-outline" size={14} color={COLORS.gray[500]} />
            <Text style={styles.assignedUsersText}>
              {item.assignedUsers.length} personne(s) assignée(s)
            </Text>
          </View>
        )}

        {item.match && item.match.homeClub && item.match.awayClub && (
          <View style={styles.matchInfo}>
            <Ionicons name="football" size={14} color={COLORS.primary} />
            <Text style={styles.matchInfoText}>
              {item.match.homeClub.name} vs {item.match.awayClub.name}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator testID="calendar-loading-indicator" size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des événements...</Text>
        {error && <TouchableOpacity testID="calendar-retry" style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendrier</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            testID="calendar-viewmode-list"
            style={[
              styles.viewModeButton,
              viewMode === 'list' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? COLORS.white : COLORS.gray[600]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            testID="calendar-viewmode-calendar"
            style={[
              styles.viewModeButton,
              viewMode === 'calendar' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={viewMode === 'calendar' ? COLORS.white : COLORS.gray[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity testID="calendar-retry-inline" onPress={fetchEvents}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          testID="calendar-filter-all"
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="calendar-filter-upcoming"
          style={[
            styles.filterButton,
            filter === 'upcoming' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'upcoming' && styles.filterButtonTextActive,
            ]}
          >
            À venir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="calendar-filter-my"
          style={[
            styles.filterButton,
            filter === 'my-events' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('my-events')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'my-events' && styles.filterButtonTextActive,
            ]}
          >
            Mes événements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          testID="calendar-list"
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              testID="calendar-refresh-control"
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={COLORS.gray[300]}
              />
              <Text style={styles.emptyText}>Aucun événement</Text>
              <Text style={styles.emptySubtext}>
                Les événements apparaîtront ici
              </Text>
              <TouchableOpacity testID="calendar-empty-cta" style={styles.retryButton} onPress={() => setFilter('upcoming')}>
                <Text style={styles.retryText}>Voir les événements à venir</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <View style={styles.calendarPlaceholder}>
          <Ionicons name="calendar" size={64} color={COLORS.gray[300]} />
          <Text style={styles.calendarPlaceholderText}>
            Vue calendrier
          </Text>
          <Text style={styles.calendarPlaceholderSubtext}>
            Fonctionnalité en cours de développement
          </Text>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  viewModeButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.danger,
  },
  errorText: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.sm,
  },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  eventTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  eventTitleContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  eventTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  assignedUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
  },
  assignedUsersText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  matchInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
  calendarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  calendarPlaceholderText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: SPACING.md,
  },
  calendarPlaceholderSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CalendarScreen;
