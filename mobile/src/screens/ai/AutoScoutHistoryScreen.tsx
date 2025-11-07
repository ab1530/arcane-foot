import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '../../components/ui';
import { GlassCard } from '../../components/ui/GlassCard';
import { QualityScoreBadge } from '../../components/auto-scout/QualityScoreBadge';
import { colors, spacing, typography, radius } from '../../design/theme';
import autoScoutApi from '../../services/api/auto-scout';
import type { AppStackParamList } from '../../types/navigation';
import type { AutoScoutHistoryItem, ReportType } from '../../types/auto-scout';

type Props = NativeStackScreenProps<AppStackParamList, 'AutoScoutHistory'>;

const TEMPLATE_NAMES: Record<ReportType, string> = {
  MATCH_PERFORMANCE: 'Match Performance',
  SEASON_OVERVIEW: 'Season Overview',
  TRANSFER_TARGET: 'Transfer Target',
  YOUTH_PROSPECT: 'Youth Prospect',
  QUICK_SCAN: 'Quick Scan',
};

const TEMPLATE_ICONS: Record<ReportType, string> = {
  MATCH_PERFORMANCE: 'football',
  SEASON_OVERVIEW: 'barChart',
  TRANSFER_TARGET: 'target',
  YOUTH_PROSPECT: 'star',
  QUICK_SCAN: 'flash',
};

export const AutoScoutHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [reports, setReports] = useState<AutoScoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'saved'>('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await autoScoutApi.getHistory();

      if (response.success && response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      // Use mock data as fallback
      setReports(MOCK_REPORTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleDeleteReport = (reportId: string) => {
    Alert.alert(
      'Delete Report?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setReports((prev) => prev.filter((r) => r.id !== reportId));
            // TODO: Call API to delete
          },
        },
      ]
    );
  };

  const handleViewReport = (report: AutoScoutHistoryItem) => {
    // Navigate to report detail or preview
    Alert.alert('View Report', `Viewing report for ${report.playerName}`);
  };

  const handleExportReport = (report: AutoScoutHistoryItem) => {
    Alert.alert('Export Report', 'Report export feature coming soon!');
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const renderReportCard = ({ item }: { item: AutoScoutHistoryItem }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => handleViewReport(item)}
      activeOpacity={0.7}
    >
      <GlassCard variant="elevated">
        <View style={styles.cardContent}>
          {/* Quality Badge */}
          <View style={styles.cardLeft}>
            <QualityScoreBadge
              qualityScore={item.qualityScore}
              size="small"
            />
          </View>

          {/* Report Info */}
          <View style={styles.cardCenter}>
            <Text style={styles.playerName}>{item.playerName}</Text>
            <View style={styles.metadata}>
              <Icon
                name={TEMPLATE_ICONS[item.template] as any}
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.metadataText}>{item.templateName}</Text>
            </View>
            <View style={styles.metadata}>
              <Icon name="calendar" size={14} color={colors.text.secondary} />
              <Text style={styles.metadataText}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  item.status === 'saved'
                    ? styles.statusDotSaved
                    : styles.statusDotDraft,
                ]}
              />
              <Text style={styles.statusText}>
                {item.status === 'saved' ? 'Saved' : 'Draft'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardRight}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExportReport(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="shareOutline" size={20} color={colors.brand.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteReport(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="trash" size={20} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="documentOutline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptyText}>
        Generate your first AI-powered scouting report to see it here
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="add" size={20} color={colors.background.primary} />
        <Text style={styles.emptyButtonText}>Generate Report</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'saved', 'draft'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab && styles.filterTabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {filter === tab && <View style={styles.filterTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// Mock data for testing
const MOCK_REPORTS: AutoScoutHistoryItem[] = [
  {
    id: '1',
    playerId: 'p1',
    playerName: 'Marcus Silva',
    qualityScore: {
      total: 87,
      grade: 'A',
      breakdown: {
        dataCompleteness: 90,
        insightDepth: 85,
        technicalAccuracy: 88,
        actionability: 85,
      },
    },
    template: 'MATCH_PERFORMANCE',
    templateName: 'Match Performance',
    status: 'saved',
    createdAt: new Date('2024-11-05'),
    overallRating: 8.5,
  },
  {
    id: '2',
    playerId: 'p2',
    playerName: 'Luca Martinez',
    qualityScore: {
      total: 92,
      grade: 'S',
      breakdown: {
        dataCompleteness: 95,
        insightDepth: 90,
        technicalAccuracy: 92,
        actionability: 91,
      },
    },
    template: 'TRANSFER_TARGET',
    templateName: 'Transfer Target',
    status: 'saved',
    createdAt: new Date('2024-11-04'),
    overallRating: 9.0,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  filterTabActive: {
    // Active state handled by indicator
  },
  filterTabText: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    fontWeight: '600',
    color: colors.brand.primary,
  },
  filterTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.brand.primary,
  },
  listContent: {
    padding: spacing.md,
  },
  reportCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardLeft: {
    alignItems: 'center',
  },
  cardCenter: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  playerName: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  metadataText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginTop: spacing.xs / 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSaved: {
    backgroundColor: colors.status.success,
  },
  statusDotDraft: {
    backgroundColor: colors.status.warning,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  cardRight: {
    gap: spacing.sm,
    justifyContent: 'center',
  },
  actionButton: {
    padding: spacing.xs / 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  emptyButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.background.primary,
  },
});
