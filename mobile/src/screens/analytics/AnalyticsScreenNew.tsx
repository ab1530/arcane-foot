import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  SlideInRight,
  ZoomIn,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import {
  Card,
  Text,
  Heading,
  Caption,
  Badge,
  theme,
} from '../../design/components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AnalyticsScreenNew = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Animation values
  const chartScale = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    chartScale.value = withSpring(1, theme.animations.springs.bouncy);

    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const chartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chartScale.value }],
    opacity: interpolate(chartScale.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const stats = [
    {
      title: 'Total Players',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: 'people',
      gradient: [theme.colors.brand.primary, theme.colors.brand.accent],
    },
    {
      title: 'Active Scouts',
      value: '89',
      change: '+5%',
      trend: 'up',
      icon: 'search',
      gradient: [theme.colors.semantic.success, theme.colors.brand.primary],
    },
    {
      title: 'Reports Created',
      value: '456',
      change: '+23%',
      trend: 'up',
      icon: 'document-text',
      gradient: [theme.colors.semantic.info, theme.colors.brand.accent],
    },
    {
      title: 'Success Rate',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: 'trophy',
      gradient: [theme.colors.brand.accent, theme.colors.semantic.success],
    },
  ];

  const periods = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  const renderStatCard = (stat: any, index: number) => (
    <Animated.View
      key={index}
      entering={SlideInRight.delay(index * 100).springify()}
      style={styles.statCardWrapper}
    >
      <Pressable
        onPress={() => Haptics.lightImpact()}
      >
        <Card variant="glass" size="md" style={styles.statCard}>
          <LinearGradient
            colors={stat.gradient}
            style={styles.statIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={stat.icon} size={24} color={theme.colors.text.inverse} />
          </LinearGradient>

          <View style={styles.statContent}>
            <Caption color="secondary">{stat.title}</Caption>
            <Heading variant="h2" style={styles.statValue}>
              {stat.value}
            </Heading>
            <View style={styles.statChange}>
              <MaterialIcons
                name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
                size={16}
                color={stat.trend === 'up' ? theme.colors.semantic.success : theme.colors.semantic.error}
              />
              <Text
                variant="caption"
                style={{
                  color: stat.trend === 'up' ? theme.colors.semantic.success : theme.colors.semantic.error,
                }}
              >
                {stat.change}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );

  const renderChart = () => {
    const data = [40, 65, 45, 80, 55, 90, 70];
    const maxValue = Math.max(...data);

    return (
      <Animated.View style={[styles.chartContainer, chartAnimatedStyle]}>
        <Card variant="glass" size="lg" style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Heading variant="h3">Performance Overview</Heading>
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <Pressable
                  key={period.key}
                  onPress={() => {
                    Haptics.selectionChanged();
                    setSelectedPeriod(period.key);
                  }}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.periodButtonActive,
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: selectedPeriod === period.key
                        ? theme.colors.text.inverse
                        : theme.colors.text.secondary,
                    }}
                  >
                    {period.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.chart}>
            {data.map((value, index) => {
              const height = (value / maxValue) * 150;
              return (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 50).springify()}
                >
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
                      style={[styles.bar, { height }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                    <Caption color="tertiary" style={styles.barLabel}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </Caption>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderActivityFeed = () => {
    const activities = [
      { type: 'report', text: 'New scouting report created', time: '2m ago', icon: 'document-text' },
      { type: 'player', text: 'Player profile updated', time: '15m ago', icon: 'person' },
      { type: 'match', text: 'Match analysis completed', time: '1h ago', icon: 'football' },
      { type: 'scout', text: 'Scout assigned to region', time: '3h ago', icon: 'location' },
    ];

    return (
      <Animated.View
        entering={FadeInDown.delay(400).springify()}
        style={styles.activityContainer}
      >
        <Card variant="glass" size="lg" style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Heading variant="h3">Recent Activity</Heading>
            <Badge variant="gradient" rounded size="sm">
              <Text style={styles.activityBadge}>Live</Text>
            </Badge>
          </View>

          {activities.map((activity, index) => (
            <Animated.View
              key={index}
              entering={SlideInRight.delay(500 + index * 50).springify()}
            >
              <Pressable
                onPress={() => Haptics.selectionChanged()}
                style={styles.activityItem}
              >
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: theme.colors.brand.primary + '20' },
                  ]}
                >
                  <Ionicons
                    name={activity.icon as any}
                    size={20}
                    color={theme.colors.brand.primary}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text variant="body">{activity.text}</Text>
                  <Caption color="tertiary">{activity.time}</Caption>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.text.tertiary}
                />
              </Pressable>
            </Animated.View>
          ))}
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <View>
            <Heading variant="h1">Analytics</Heading>
            <Caption color="secondary">Track your performance metrics</Caption>
          </View>
          <Pressable
            onPress={() => {
              Haptics.lightImpact();
              // navigation.navigate('Settings');
            }}
          >
            <Ionicons name="settings" size={24} color={theme.colors.text.secondary} />
          </Pressable>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => renderStatCard(stat, index))}
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Activity Feed */}
        {renderActivityFeed()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.layout.safeArea.top + theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statCardWrapper: {
    width: (SCREEN_WIDTH - theme.spacing.md * 3) / 2,
  },
  statCard: {
    padding: theme.spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statContent: {
    gap: theme.spacing.xs,
  },
  statValue: {
    marginVertical: theme.spacing.xs,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  chartContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  chartCard: {
    padding: theme.spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.glass,
    borderRadius: theme.radius.md,
    padding: theme.spacing.xxs,
  },
  periodButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.brand.primary,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barWrapper: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bar: {
    width: 30,
    borderRadius: theme.radius.sm,
  },
  barLabel: {
    marginTop: theme.spacing.sm,
  },
  activityContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  activityCard: {
    padding: theme.spacing.xl,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  activityBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
});

export default AnalyticsScreenNew;