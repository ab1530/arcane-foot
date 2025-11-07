import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import api from '../../services/api';
import { logger, logError } from '../../utils/logger';
import type { IconName } from '../../constants/icons';

interface Report {
  id: string;
  playerId: string;
  player?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  matchId?: string;
  match?: {
    homeClub?: { name: string };
    awayClub?: { name: string };
    date: string;
  };
  createdAt: string;
  updatedAt: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  overallRating?: number;
  recommendation?: string;
  scoutId: string;
  scout?: {
    firstName: string;
    lastName: string;
  };
}

export const ReportsScreen = () => {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getScoutingReports();

      // Handle different response formats
      const reportsList = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];

      logger.log('Reports fetched', { count: reportsList.length });
      setReports(reportsList);
    } catch (error) {
      logError('Failed to fetch reports', error);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, [fetchReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#22c55e';
      case 'REJECTED':
        return '#ef4444';
      case 'SUBMITTED':
        return '#3b82f6';
      case 'DRAFT':
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string): IconName => {
    switch (status) {
      case 'APPROVED':
        return 'checkCircle';
      case 'REJECTED':
        return 'close';
      case 'SUBMITTED':
        return 'time';
      case 'DRAFT':
      default:
        return 'edit';
    }
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return colors.text.secondary;
    if (rating >= 80) return '#22c55e';
    if (rating >= 60) return colors.brand.primary;
    if (rating >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' ||
      report.player?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.player?.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.match?.homeClub?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.match?.awayClub?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Scouting Reports</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateReport')}
        >
          <Icon name="add" size={24} color={colors.background.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search player, club..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {statuses.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              selectedStatus === status && styles.filterChipActive
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.filterChipText,
              selectedStatus === status && styles.filterChipTextActive
            ]}>
              {status === 'all' ? 'All' : status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
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
        {filteredReports.length === 0 ? (
          <GlassCard variant="elevated" style={styles.emptyCard}>
            <Icon name="analytics" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first scouting report'}
            </Text>
          </GlassCard>
        ) : (
          filteredReports.map(report => (
            <TouchableOpacity
              key={report.id}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
            >
              <GlassCard variant="elevated" style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {report.player?.user?.firstName} {report.player?.user?.lastName}
                    </Text>
                    {report.match && (
                      <Text style={styles.matchInfo}>
                        {report.match.homeClub?.name} vs {report.match.awayClub?.name}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <Icon name={getStatusIcon(report.status)} size={16} color={getStatusColor(report.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {report.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportContent}>
                  {report.overallRating && (
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingLabel}>Overall</Text>
                      <Text style={[styles.ratingValue, { color: getRatingColor(report.overallRating) }]}>
                        {report.overallRating}/100
                      </Text>
                    </View>
                  )}

                  {report.recommendation && (
                    <View style={styles.recommendationContainer}>
                      <Text style={styles.recommendationLabel}>Recommendation</Text>
                      <Text style={styles.recommendationValue}>
                        {report.recommendation.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.reportFooter}>
                  <Text style={styles.scoutName}>
                    By {report.scout?.firstName} {report.scout?.lastName}
                  </Text>
                  <Text style={styles.reportDate}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
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
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  reportCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  matchInfo: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
  },
  reportContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ratingContainer: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  ratingValue: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
  },
  recommendationContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  recommendationLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  recommendationValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.brand.primary,
    textTransform: 'capitalize',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  scoutName: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  reportDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});

export default ReportsScreen;