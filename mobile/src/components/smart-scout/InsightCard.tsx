import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui';
import type { IconName } from '../../constants/icons';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { PlayerInsights } from '../../types/smart-scout';

interface InsightCardProps {
  insights: PlayerInsights;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insights }) => {
  const renderRatingsChart = () => {
    const ratings = [
      { label: 'Technical', value: insights.avgRatings.technical, color: colors.brand.primary },
      { label: 'Tactical', value: insights.avgRatings.tactical, color: colors.status.info },
      { label: 'Physical', value: insights.avgRatings.physical, color: colors.status.success },
      { label: 'Mental', value: insights.avgRatings.mental, color: colors.status.warning },
    ];

    return (
      <View style={styles.ratingsContainer}>
        {ratings.map((rating) => (
          <View key={rating.label} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>{rating.label}</Text>
            <View style={styles.ratingBarContainer}>
              <View
                style={[
                  styles.ratingBar,
                  {
                    width: `${rating.value}%`,
                    backgroundColor: rating.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.ratingValue}>{Math.round(rating.value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTrends = () => {
    const trendSections: Array<{
      title: string;
      items: string[];
      icon: IconName;
      color: string;
    }> = [
      {
        title: 'Improving',
        items: insights.trends.improving,
        icon: 'trendingUp',
        color: colors.status.success,
      },
      {
        title: 'Declining',
        items: insights.trends.declining,
        icon: 'trendingDown',
        color: colors.status.error,
      },
      {
        title: 'Stable',
        items: insights.trends.stable,
        icon: 'remove',
        color: colors.text.secondary,
      },
    ];

    return (
      <View style={styles.trendsContainer}>
        {trendSections.map((section) => {
          if (section.items.length === 0) return null;

          return (
            <View key={section.title} style={styles.trendSection}>
              <View style={styles.trendHeader}>
                <Icon name={section.icon} size={16} color={section.color} />
                <Text style={[styles.trendTitle, { color: section.color }]}>
                  {section.title}
                </Text>
              </View>
              <View style={styles.trendItems}>
                {section.items.map((item, index) => (
                  <View key={index} style={styles.trendItem}>
                    <View style={[styles.bullet, { backgroundColor: section.color }]} />
                    <Text style={styles.trendItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Player Header */}
      <GlassCard variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <Icon name="person" size={24} color={colors.brand.primary} />
          <Text style={styles.playerName}>{insights.playerName}</Text>
        </View>
      </GlassCard>

      {/* AI Summary */}
      <GlassCard variant="bordered" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Icon name="sparkles" size={20} color={colors.status.warning} />
          <Text style={styles.sectionTitle}>AI Summary</Text>
        </View>
        <Text style={styles.summaryText}>{insights.summary}</Text>
      </GlassCard>

      {/* Trends */}
      <GlassCard variant="bordered" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Icon name="analytics" size={20} color={colors.brand.primary} />
          <Text style={styles.sectionTitle}>Performance Trends</Text>
        </View>
        {renderTrends()}
      </GlassCard>

      {/* Scout Consensus */}
      <GlassCard variant="bordered" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Icon name="people" size={20} color={colors.brand.primary} />
          <Text style={styles.sectionTitle}>Scout Consensus</Text>
        </View>
        <View style={styles.consensusContainer}>
          <View style={styles.consensusCircle}>
            <Text style={styles.consensusPercentage}>
              {Math.round(insights.consensus.agreementPercentage)}%
            </Text>
            <Text style={styles.consensusLabel}>Agreement</Text>
          </View>
          <View style={styles.consensusStats}>
            <View style={styles.consensusStat}>
              <Text style={styles.consensusStatValue}>
                {insights.consensus.totalReports}
              </Text>
              <Text style={styles.consensusStatLabel}>Total Reports</Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Average Ratings */}
      <GlassCard variant="bordered" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Icon name="barChart" size={20} color={colors.brand.primary} />
          <Text style={styles.sectionTitle}>Average Ratings</Text>
        </View>
        {renderRatingsChart()}
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  playerName: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  trendsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  trendSection: {
    gap: spacing.sm,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  trendItems: {
    gap: spacing.xs,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendItemText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  consensusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xl,
  },
  consensusCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brand.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.brand.primary,
  },
  consensusPercentage: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  consensusLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  consensusStats: {
    flex: 1,
  },
  consensusStat: {
    gap: spacing.xs / 2,
  },
  consensusStatValue: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  consensusStatLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  ratingsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingLabel: {
    width: 70,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    borderRadius: radius.sm,
  },
  ratingValue: {
    width: 35,
    textAlign: 'right',
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
