import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { SimilarReport } from '../../types/smart-scout';

interface SimilarReportCardProps {
  report: SimilarReport;
  onPress: () => void;
}

export const SimilarReportCard: React.FC<SimilarReportCardProps> = ({
  report,
  onPress,
}) => {
  const similarityPercentage = Math.round(report.similarity * 100);
  const getColorForSimilarity = (similarity: number): string => {
    if (similarity >= 80) return colors.status.success;
    if (similarity >= 60) return colors.status.warning;
    return colors.text.secondary;
  };

  const color = getColorForSimilarity(similarityPercentage);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassCard variant="bordered" style={styles.card}>
        <View style={styles.content}>
          {/* Similarity Badge */}
          <View style={[styles.similarityBadge, { borderColor: color }]}>
            <Text style={[styles.similarityText, { color }]}>
              {similarityPercentage}%
            </Text>
          </View>

          {/* Player Info */}
          <View style={styles.playerInfo}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerName} numberOfLines={1}>
                {report.player.name}
              </Text>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{report.player.position}</Text>
              </View>
            </View>

            {/* Meta Info */}
            <View style={styles.metaRow}>
              {report.scoutName && (
                <View style={styles.metaItem}>
                  <Icon name="person" size={14} color={colors.text.secondary} />
                  <Text style={styles.metaText}>{report.scoutName}</Text>
                </View>
              )}
              {report.matchDate && (
                <View style={styles.metaItem}>
                  <Icon name="calendar" size={14} color={colors.text.secondary} />
                  <Text style={styles.metaText}>
                    {new Date(report.matchDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Excerpts */}
            {report.excerpts && (
              <View style={styles.excerpts}>
                {report.excerpts.strengths && (
                  <View style={styles.excerpt}>
                    <Icon name="checkmark" size={16} color={colors.status.success} />
                    <Text style={styles.excerptText} numberOfLines={2}>
                      {report.excerpts.strengths}
                    </Text>
                  </View>
                )}
                {report.excerpts.weaknesses && (
                  <View style={styles.excerpt}>
                    <Icon name="close" size={16} color={colors.status.error} />
                    <Text style={styles.excerptText} numberOfLines={2}>
                      {report.excerpts.weaknesses}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Arrow */}
          <Icon name="chevronForward" size={20} color={colors.text.secondary} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  similarityBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  similarityText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerName: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.xs,
  },
  positionBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
  },
  positionText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  excerpts: {
    gap: spacing.xs,
  },
  excerpt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  excerptText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
