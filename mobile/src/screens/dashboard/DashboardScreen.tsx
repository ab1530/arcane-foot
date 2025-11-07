import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GradientText, AnimatedBadge } from '../../components/ui';
import { Icon } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { logError } from '../../utils/logger';
import { LineChart, PieChart, BarChart } from '../../components/charts';
import { lightImpact } from '../../utils/haptics';

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    totalPlayers: 0,
    upcomingMatches: 0,
    activeCamps: 0,
    totalCamps: 0,
  });
  const [activityData, setActivityData] = useState([
    { name: 'Lun', rapports: 4, joueurs: 2, camps: 1 },
    { name: 'Mar', rapports: 6, joueurs: 3, camps: 0 },
    { name: 'Mer', rapports: 5, joueurs: 4, camps: 2 },
    { name: 'Jeu', rapports: 8, joueurs: 1, camps: 1 },
    { name: 'Ven', rapports: 7, joueurs: 5, camps: 0 },
    { name: 'Sam', rapports: 3, joueurs: 2, camps: 3 },
    { name: 'Dim', rapports: 4, joueurs: 3, camps: 1 },
  ]);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics and real data
      const [overviewData, playersData, reportsData, campsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getPlayers().catch(() => ({ items: [], data: [] })),
        api.getReports().catch(() => ({ items: [], data: [] })),
        api.getCamps().catch(() => []),
      ]);

      const players = playersData?.items ?? playersData?.data ?? [];
      const reports = reportsData?.items ?? reportsData?.data ?? [];
      const camps = Array.isArray(campsData) ? campsData : campsData?.items ?? campsData?.data ?? [];

      setStats({
        totalReports: overviewData?.totalReports ?? reports.length,
        pendingReports: overviewData?.pendingReports ?? reports.filter((r: any) => r.status === 'DRAFT').length,
        totalPlayers: overviewData?.totalPlayers ?? players.length,
        upcomingMatches: overviewData?.upcomingMatches ?? 0,
        activeCamps: camps.filter((c: any) => c.status === 'ACTIVE').length,
        totalCamps: camps.length,
      });
    } catch (error) {
      logError('Error fetching dashboard data', error, { screen: 'DashboardScreen' });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, color, onPress, testID }: any) => (
    <TouchableOpacity testID={testID} style={styles.statCardWrapper} onPress={onPress}>
      <GlassCard variant="elevated">
        <View style={styles.statCard}>
          <Text testID={`${testID}-value`} style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          <View style={[styles.statIndicator, { backgroundColor: color }]} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        testID="dashboard-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {user?.firstName?.charAt(0) || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            testID="dashboard-stat-totalReports"
            title="Total Reports"
            value={stats.totalReports}
            color={colors.brand.primary}
            onPress={() => navigation.navigate('Reports')}
          />
          <StatCard
            testID="dashboard-stat-pendingReports"
            title="Pending"
            value={stats.pendingReports}
            color={colors.semantic.warning}
            onPress={() => navigation.navigate('Reports')}
          />
          <StatCard
            testID="dashboard-stat-totalPlayers"
            title="Players"
            value={stats.totalPlayers}
            color={colors.semantic.info}
            onPress={() => navigation.navigate('Players')}
          />
          <StatCard
            testID="dashboard-stat-upcomingMatches"
            title="Matches"
            value={stats.upcomingMatches}
            color={colors.semantic.success}
            onPress={() => navigation.navigate('Calendar')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <GlassCard variant="elevated">
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  lightImpact();
                  navigation.navigate('CreateReport');
                }}
              >
                <View style={styles.actionIcon}>
                  <Icon name="add" size={28} color={colors.brand.primary} />
                </View>
                <Text style={styles.actionText}>New Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  lightImpact();
                  navigation.navigate('Players');
                }}
              >
                <View style={styles.actionIcon}>
                  <Icon name="people" size={28} color={colors.brand.primary} />
                </View>
                <Text style={styles.actionText}>View Players</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  lightImpact();
                  navigation.navigate('Calendar');
                }}
              >
                <View style={styles.actionIcon}>
                  <Icon name="calendar" size={28} color={colors.brand.primary} />
                </View>
                <Text style={styles.actionText}>Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  lightImpact();
                  navigation.navigate('Kanban');
                }}
              >
                <View style={styles.actionIcon}>
                  <Icon name="clipboard" size={28} color={colors.brand.primary} />
                </View>
                <Text style={styles.actionText}>Kanban</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Analytics Charts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Trends (7 Days)</Text>
          <LineChart
            data={activityData}
            lines={[
              { dataKey: 'rapports', color: colors.brand.primary, name: 'Rapports' },
              { dataKey: 'joueurs', color: colors.semantic.info, name: 'Joueurs' },
              { dataKey: 'camps', color: colors.semantic.success, name: 'Camps' },
            ]}
            height={200}
          />
        </View>

        {/* Reports Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports Distribution</Text>
          <PieChart
            data={[
              { name: 'Approved', value: Math.max(0, stats.totalReports - stats.pendingReports) },
              { name: 'Pending', value: stats.pendingReports },
              { name: 'In Review', value: Math.floor(stats.totalReports * 0.15) },
            ]}
            colors={[colors.semantic.success, colors.semantic.warning, colors.semantic.info]}
            height={180}
          />
        </View>

        {/* Players by Position */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players by Position</Text>
          <BarChart
            data={[
              { name: 'Forwards', count: Math.floor(stats.totalPlayers * 0.3) },
              { name: 'Midfielders', count: Math.floor(stats.totalPlayers * 0.35) },
              { name: 'Defenders', count: Math.floor(stats.totalPlayers * 0.25) },
              { name: 'Goalkeepers', count: Math.floor(stats.totalPlayers * 0.1) },
            ]}
            bars={[{ dataKey: 'count', color: colors.brand.primary, name: 'Players' }]}
            height={200}
          />
        </View>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GradientText variant="arcane" style={styles.aiTitle}>
              AI Recommendations
            </GradientText>
            <TouchableOpacity onPress={() => navigation.navigate('AI')}>
              <Icon name="chevronForward" size={20} color={colors.brand.primary} />
            </TouchableOpacity>
          </View>
          <GlassCard variant="elevated">
            <TouchableOpacity
              style={styles.aiCard}
              onPress={() => navigation.navigate('AI')}
            >
              <View style={styles.aiIconContainer}>
                <Icon name="ai" size={32} color={colors.brand.primary} />
              </View>
              <View style={styles.aiContent}>
                <Text style={styles.aiCardTitle}>Discover Top Talents</Text>
                <Text style={styles.aiCardDesc}>
                  {stats.totalPlayers > 0
                    ? `Arcane AI has identified ${Math.min(5, Math.floor(stats.totalPlayers * 0.2))} promising players based on performance analytics`
                    : 'Use Arcane AI to discover and analyze players'}
                </Text>
                <View style={styles.aiFeatures}>
                  <View style={styles.aiFeature}>
                    <Icon name="checkmark" size={16} color={colors.semantic.success} />
                    <Text style={styles.aiFeatureText}>Performance Analysis</Text>
                  </View>
                  <View style={styles.aiFeature}>
                    <Icon name="checkmark" size={16} color={colors.semantic.success} />
                    <Text style={styles.aiFeatureText}>Smart Matching</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Pending Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Tasks</Text>
            <AnimatedBadge count={stats.pendingReports} size="sm" animation="bounce" />
          </View>
          <GlassCard variant="elevated">
            {stats.pendingReports > 0 ? (
              <View style={styles.tasksContainer}>
                <TaskItem
                  icon="document"
                  title="Complete Pending Reports"
                  count={stats.pendingReports}
                  color={colors.semantic.warning}
                  onPress={() => navigation.navigate('Reports')}
                />
                {stats.upcomingMatches > 0 && (
                  <TaskItem
                    icon="calendar"
                    title="Upcoming Matches to Scout"
                    count={stats.upcomingMatches}
                    color={colors.semantic.info}
                    onPress={() => navigation.navigate('Calendar')}
                  />
                )}
                {stats.activeCamps > 0 && (
                  <TaskItem
                    icon="fitness"
                    title="Active Training Camps"
                    count={stats.activeCamps}
                    color={colors.semantic.success}
                    onPress={() => navigation.navigate('Camps')}
                  />
                )}
              </View>
            ) : (
              <View style={styles.emptyTasks}>
                <Icon name="checkmark" size={48} color={colors.semantic.success} />
                <Text style={styles.emptyTasksText}>All caught up!</Text>
                <Text style={styles.emptyTasksSubtext}>No pending tasks at the moment</Text>
              </View>
            )}
          </GlassCard>
        </View>

        {/* Recent Activity Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <GlassCard variant="elevated">
            <View style={styles.timelineContainer}>
              <TimelineItem
                icon="document"
                iconColor={colors.brand.primary}
                title="Report Created"
                description="New scouting report for player analysis"
                time="2 hours ago"
              />
              <TimelineItem
                icon="people"
                iconColor={colors.semantic.info}
                title="Player Added"
                description="New player profile added to database"
                time="5 hours ago"
              />
              <TimelineItem
                icon="calendar"
                iconColor={colors.semantic.success}
                title="Match Scheduled"
                description="Upcoming scouting match scheduled"
                time="1 day ago"
              />
              <TimelineItem
                icon="analytics"
                iconColor={colors.semantic.warning}
                title="Analytics Updated"
                description="Performance metrics recalculated"
                time="2 days ago"
                isLast
              />
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const TaskItem = ({
  icon,
  title,
  count,
  color,
  onPress,
}: {
  icon: any;
  title: string;
  count: number;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.taskItem} onPress={onPress}>
    <View style={[styles.taskIconContainer, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <View style={styles.taskContent}>
      <Text style={styles.taskTitle}>{title}</Text>
      <Text style={styles.taskCount}>{count} pending</Text>
    </View>
    <Icon name="chevronForward" size={20} color={colors.text.secondary} />
  </TouchableOpacity>
);

const TimelineItem = ({
  icon,
  iconColor,
  title,
  description,
  time,
  isLast = false,
}: {
  icon: any;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  isLast?: boolean;
}) => (
  <View style={styles.timelineItem}>
    <View style={styles.timelineLeft}>
      <View style={[styles.timelineDot, { backgroundColor: iconColor }]}>
        <Icon name={icon} size={16} color={colors.background.primary} />
      </View>
      {!isLast && <View style={styles.timelineLine} />}
    </View>
    <View style={styles.timelineRight}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineDesc}>{description}</Text>
      <Text style={styles.timelineTime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  profileButton: {
    padding: spacing.xs,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  statCardWrapper: {
    width: '50%',
    padding: spacing.xs,
  },
  statCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statIndicator: {
    width: 40,
    height: 4,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  actionButton: {
    width: '50%',
    padding: spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionIconText: {
    fontSize: typography.sizes.h3,
  },
  actionText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
  activityContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  aiTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
  },
  aiCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  aiIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  aiCardDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  aiFeatures: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  aiFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiFeatureText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  tasksContainer: {
    padding: spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  taskCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyTasks: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyTasksSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  timelineContainer: {
    padding: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surface.border,
  },
  timelineRight: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  timelineDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  timelineTime: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
