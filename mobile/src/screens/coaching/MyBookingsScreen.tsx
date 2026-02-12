/**
 * MY BOOKINGS SCREEN
 * User's coaching session bookings with tabs
 *
 * Features:
 * - Three tabs: Upcoming, Past, Cancelled
 * - Session cards with actions
 * - Pull-to-refresh
 * - Empty states
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tokens, typography } from '../../design';
import { useSessions, useCancelSession } from '../../hooks/useCoaching';
import { SessionCard } from './components';
import { SessionStatus } from '../../types/coaching';
import type { AppStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type TabType = 'upcoming' | 'past' | 'cancelled';

// ============================================================================
// COMPONENT
// ============================================================================

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<TabType>(
    (route.params as any)?.tab || 'upcoming'
  );

  const statusMap: Record<TabType, SessionStatus> = {
    upcoming: SessionStatus.UPCOMING,
    past: SessionStatus.COMPLETED,
    cancelled: SessionStatus.CANCELLED,
  };

  // Queries
  const {
    data: sessionsData,
    isLoading,
    refetch,
  } = useSessions(statusMap[activeTab]);
  const cancelMutation = useCancelSession();

  const sessions = sessionsData?.data || [];

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleCancelSession = useCallback(
    (sessionId: string) => {
      Alert.alert(
        'Cancel Session',
        'Are you sure you want to cancel this session?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => cancelMutation.mutate(sessionId),
          },
        ]
      );
    },
    [cancelMutation]
  );

  const handleReview = useCallback(
    (sessionId: string, coachId: string) => {
      navigation.navigate('ReviewModal' as any, { sessionId, coachId });
    },
    [navigation]
  );

  const handleRebook = useCallback(
    (coachId: string) => {
      navigation.navigate('BookSession' as any, { coachId });
    },
    [navigation]
  );

  const renderSession = useCallback(
    ({ item }: { item: any }) => (
      <SessionCard
        session={item}
        onCancel={
          activeTab === 'upcoming'
            ? () => handleCancelSession(item.id)
            : undefined
        }
        onReview={
          activeTab === 'past'
            ? () => handleReview(item.id, item.coach.id)
            : undefined
        }
        onRebook={
          activeTab === 'past'
            ? () => handleRebook(item.coach.id)
            : undefined
        }
        style={styles.sessionCard}
      />
    ),
    [activeTab, handleCancelSession, handleReview, handleRebook]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      );
    }

    const emptyMessages = {
      upcoming: 'No upcoming sessions',
      past: 'No past sessions',
      cancelled: 'No cancelled sessions',
    };

    return (
      <View style={styles.centerContainer}>
        <Calendar size={48} color={tokens.colors.gray[500]} />
        <Text style={styles.emptyTitle}>{emptyMessages[activeTab]}</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'upcoming' && 'Book a session to get started'}
          {activeTab === 'past' && 'Complete a session to see it here'}
          {activeTab === 'cancelled' && 'No sessions have been cancelled'}
        </Text>
      </View>
    );
  }, [isLoading, activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'upcoming' && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}
          >
            Past
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'cancelled' && styles.activeTabText,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          sessions.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading3,
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
  },
  tabText: {
    ...typography.buttonText,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.gray[400],
  },
  activeTabText: {
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  sessionCard: {
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    marginTop: 12,
  },
  emptyTitle: {
    ...typography.heading3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    textAlign: 'center',
  },
});

export default MyBookingsScreen;
