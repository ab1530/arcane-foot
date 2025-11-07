import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useScouting, ScoutingReport } from '../../contexts/ScoutingContext';
import { GlassCard, GradientText } from '../../components/ui';
import { spacing, typography, radius } from '../../design/theme';

export const ScoutingReportsScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const {
    reports,
    loadReports,
    searchReports,
    getRecentReports,
    getDraftReports,
    getReportsByStatus,
  } = useScouting();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'submitted' | 'approved'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = getReportsByStatus(selectedFilter);
    }

    // Apply search
    if (searchQuery) {
      filtered = searchReports(searchQuery);
    }

    return filtered;
  }, [reports, selectedFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getStatusColor = (status: ScoutingReport['status']) => {
    switch (status) {
      case 'draft':
        return colors.textSecondary;
      case 'submitted':
        return colors.warning;
      case 'reviewed':
        return colors.info;
      case 'approved':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: ScoutingReport['status']) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'submitted':
        return 'Soumis';
      case 'reviewed':
        return 'En révision';
      case 'approved':
        return 'Approuvé';
      default:
        return status;
    }
  };

  const getRecommendationIcon = (recommendation: ScoutingReport['recommendation']) => {
    switch (recommendation) {
      case 'sign':
        return 'checkmark-circle';
      case 'monitor':
        return 'eye';
      case 'pass':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getRecommendationColor = (recommendation: ScoutingReport['recommendation']) => {
    switch (recommendation) {
      case 'sign':
        return colors.success;
      case 'monitor':
        return colors.warning;
      case 'pass':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderReportCard = (report: ScoutingReport) => {
    return (
      <TouchableOpacity
        key={report.id}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('ScoutingReportDetail', { reportId: report.id });
        }}
      >
        <GlassCard variant="elevated" style={styles.reportCard}>
          {/* Header */}
          <View style={styles.reportHeader}>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: colors.textPrimary }]}>
                {report.playerName}
              </Text>
              <View style={styles.playerMeta}>
                <Text style={[styles.position, { color: colors.accent }]}>
                  {report.playerPosition}
                </Text>
                <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
                <Text style={[styles.opponent, { color: colors.textSecondary }]}>
                  vs {report.opponent}
                </Text>
              </View>
            </View>

            <View style={[styles.ratingBadge, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.ratingText, { color: colors.accent }]}>
                {report.overallRating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Match Info */}
          <View style={styles.matchInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={14} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {report.matchDate}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="trophy" size={14} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {report.competition}
              </Text>
            </View>
          </View>

          {/* Key Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Technique</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {report.technicalSkills}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Tactique</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {report.tacticalAwareness}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Physique</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {report.physicalCondition}/10
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Mental</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {report.mentalStrength}/10
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.reportFooter}>
            <View style={styles.footerLeft}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                  {getStatusLabel(report.status)}
                </Text>
              </View>

              <View style={styles.recommendationBadge}>
                <Ionicons
                  name={getRecommendationIcon(report.recommendation) as any}
                  size={16}
                  color={getRecommendationColor(report.recommendation)}
                />
              </View>
            </View>

            <View style={styles.footerRight}>
              <Text style={[styles.scoutName, { color: colors.textTertiary }]}>
                {report.scoutName}
              </Text>
              <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                {new Date(report.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]} edges={['top']}>
      <LinearGradient
        colors={[colors.dark, colors.darkBg]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <GradientText variant="arcane" style={styles.headerTitle}>
                Rapports de Scouting
              </GradientText>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {filteredReports.length} rapport{filteredReports.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('CreateScoutingReport');
            }}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.glass }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Rechercher un joueur, adversaire..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {['all', 'draft', 'submitted', 'approved'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedFilter === filter ? colors.accent : colors.glass,
                  borderColor: selectedFilter === filter ? colors.accent : colors.glassBorder,
                }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedFilter(filter as any);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedFilter === filter ? colors.textInverse : colors.textSecondary }
                ]}
              >
                {filter === 'all' ? 'Tous' :
                 filter === 'draft' ? 'Brouillons' :
                 filter === 'submitted' ? 'Soumis' : 'Approuvés'}
              </Text>
              {filter !== 'all' && (
                <View
                  style={[
                    styles.filterCount,
                    { backgroundColor: selectedFilter === filter ? colors.textInverse : colors.accent }
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: selectedFilter === filter ? colors.accent : colors.textInverse }
                    ]}
                  >
                    {getReportsByStatus(filter as any).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <GlassCard variant="default" style={styles.statCard}>
            <Ionicons name="document-text" size={24} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
              {reports.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
              Total
            </Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <Ionicons name="create" size={24} color={colors.warning} />
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
              {getDraftReports().length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
              Brouillons
            </Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <Ionicons name="checkmark-done" size={24} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
              {getReportsByStatus('approved').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
              Approuvés
            </Text>
          </GlassCard>
        </View>

        {/* Reports List */}
        <View style={styles.reportsList}>
          {filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={60} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Aucun rapport trouvé
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier rapport de scouting'}
              </Text>
            </View>
          ) : (
            filteredReports.map(report => renderReportCard(report))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  reportsList: {
    paddingHorizontal: spacing.lg,
  },
  reportCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
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
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  position: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  dot: {
    fontSize: typography.sizes.xs,
  },
  opponent: {
    fontSize: typography.sizes.sm,
  },
  ratingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  ratingText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
  },
  matchInfo: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    fontSize: typography.sizes.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    marginTop: 2,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  recommendationBadge: {
    padding: 4,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  scoutName: {
    fontSize: typography.sizes.xs,
  },
  dateText: {
    fontSize: typography.sizes.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing["2xl"] * 2,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});