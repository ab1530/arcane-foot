import React, { useState, useEffect, useCallback } from 'react';
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
import { useLocalization } from '../../contexts/LocalizationContext';
import autoScoutApi from '../../services/api/auto-scout';
import api from '../../services/api';
import type { AppStackParamList } from '../../types/navigation';
import type { AutoScoutHistoryItem, ReportType } from '../../types/auto-scout';

type Props = NativeStackScreenProps<AppStackParamList, 'AutoScoutHistory'>;

type FilterValue = 'all' | 'draft' | 'saved';

const TEMPLATE_ICONS: Record<ReportType, string> = {
  MATCH_PERFORMANCE: 'football',
  SEASON_OVERVIEW: 'barChart',
  TRANSFER_TARGET: 'target',
  YOUTH_PROSPECT: 'star',
  QUICK_SCAN: 'flash',
};

export const AutoScoutHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { dictionary } = useLocalization();
  const historyCopy = dictionary.autoScout.history;

  const [reports, setReports] = useState<AutoScoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filterOptions: Array<{ value: FilterValue; label: string }> = [
    { value: 'all', label: historyCopy.filters.tabs.all },
    { value: 'saved', label: historyCopy.filters.tabs.saved },
    { value: 'draft', label: historyCopy.filters.tabs.draft },
  ];

  const fetchFallbackPlayerId = useCallback(async (): Promise<string | null> => {
    try {
      const response = await api.getPlayers({ limit: 1 });
      const candidate =
        response?.data?.[0] ??
        response?.items?.[0];
      return (
        candidate?.id ??
        (candidate as any)?.playerId ??
        (candidate as any)?.player?.id ??
        null
      );
    } catch (err) {
      console.warn('[AutoScoutHistory] Unable to resolve fallback player', err);
      return null;
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      let targetPlayerId = playerId;

      if (!targetPlayerId) {
        const fallbackId = await fetchFallbackPlayerId();
        if (fallbackId) {
          targetPlayerId = fallbackId;
          setPlayerId(fallbackId);
        }
      }

      if (!targetPlayerId) {
        setReports([]);
        setErrorMessage(historyCopy.errors.noPlayer);
        return;
      }

      const response = await autoScoutApi.getHistory(targetPlayerId);

      if (response.success && Array.isArray(response.data)) {
        setReports(response.data);
      } else {
        setReports([]);
        setErrorMessage(historyCopy.errors.load);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      setReports([]);
      setErrorMessage(historyCopy.errors.load);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFallbackPlayerId, historyCopy.errors.load, historyCopy.errors.noPlayer, playerId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleDeleteReport = (reportId: string) => {
    Alert.alert(
      historyCopy.alerts.deleteTitle,
      historyCopy.alerts.deleteMessage,
      [
        { text: historyCopy.alerts.cancel, style: 'cancel' },
        {
          text: historyCopy.alerts.confirm,
          style: 'destructive',
          onPress: async () => {
            // Optimistically remove from UI
            setReports((prev) => prev.filter((r) => r.id !== reportId));

            try {
              // Call API to delete report
              await autoScoutApi.deleteReport(reportId);

              // Show success feedback
              Alert.alert(
                historyCopy.alerts.successTitle || 'Success',
                historyCopy.alerts.successMessage || 'Report deleted successfully',
                [{ text: historyCopy.alerts.close || 'Close' }]
              );
            } catch (error) {
              console.error('Failed to delete report:', error);

              // Revert optimistic update on error
              await loadReports();

              // Show error alert
              Alert.alert(
                historyCopy.alerts.errorTitle || 'Error',
                historyCopy.alerts.errorMessage || 'Failed to delete report. Please try again.',
                [{ text: historyCopy.alerts.close || 'Close' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleViewReport = (report: AutoScoutHistoryItem) => {
    Alert.alert(
      historyCopy.alerts.viewTitle,
      historyCopy.alerts.viewMessage.replace('{{player}}', report.playerName),
      [{ text: historyCopy.alerts.close }],
    );
  };

  const handleExportReport = () => {
    Alert.alert(
      historyCopy.alerts.exportTitle,
      historyCopy.alerts.exportMessage,
      [{ text: historyCopy.alerts.close }],
    );
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const renderReportCard = ({ item }: { item: AutoScoutHistoryItem }) => (
    <TouchableOpacity
      testID={`auto-scout-history-card-${item.id}`}
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
                {item.status === 'saved' ? historyCopy.statuses.saved : historyCopy.statuses.draft}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardRight}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExportReport}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID={`auto-scout-history-export-${item.id}`}
            >
              <Icon name="shareOutline" size={20} color={colors.brand.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteReport(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID={`auto-scout-history-delete-${item.id}`}
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
      <Text style={styles.emptyTitle}>{historyCopy.empty.title}</Text>
      <Text style={styles.emptyText}>
        {historyCopy.empty.description}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="add" size={20} color={colors.background.primary} />
        <Text style={styles.emptyButtonText}>{historyCopy.empty.cta}</Text>
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
        <Text style={styles.headerTitle}>{historyCopy.title}</Text>
        <View style={styles.placeholder} />
      </View>
      <Text style={styles.headerSubtitle}>{historyCopy.subtitle}</Text>
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.filterTab, filter === tab.value && styles.filterTabActive]}
            onPress={() => setFilter(tab.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab.value && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {filter === tab.value && <View style={styles.filterTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>{historyCopy.loading}</Text>
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
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.status.error,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs / 2,
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
