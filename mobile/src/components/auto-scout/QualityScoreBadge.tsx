import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { QualityScore } from '../../types/auto-scout';

interface QualityScoreBadgeProps {
  qualityScore: QualityScore;
  size?: 'small' | 'large';
  showBreakdown?: boolean;
}

const GRADE_COLORS = {
  S: '#FFD700', // Gold
  A: '#10B981', // Green
  B: '#3B82F6', // Blue
  C: '#F59E0B', // Orange
  D: '#EF4444', // Red
};

const GRADE_LABELS = {
  S: 'Exceptional',
  A: 'Excellent',
  B: 'Good',
  C: 'Fair',
  D: 'Needs Improvement',
};

export const QualityScoreBadge: React.FC<QualityScoreBadgeProps> = ({
  qualityScore,
  size = 'large',
  showBreakdown = false,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const gradeColor = GRADE_COLORS[qualityScore.grade];
  const gradeLabel = GRADE_LABELS[qualityScore.grade];
  const badgeSize = size === 'large' ? 120 : 60;
  const fontSize = size === 'large' ? typography.sizes.h1 : typography.sizes.xl;

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { width: badgeSize, height: badgeSize }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.badge,
            {
              borderColor: gradeColor,
              width: badgeSize,
              height: badgeSize,
            },
          ]}
        >
          <Text style={[styles.grade, { fontSize, color: gradeColor }]}>
            {qualityScore.grade}
          </Text>
          <Text style={styles.score}>{qualityScore.total}</Text>
        </View>
        {size === 'large' && (
          <Text style={[styles.label, { color: gradeColor }]}>{gradeLabel}</Text>
        )}
      </TouchableOpacity>

      {/* Breakdown Modal */}
      {showBreakdown && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Quality Score Breakdown</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.totalScore}>
                <View style={[styles.badge, { borderColor: gradeColor }]}>
                  <Text style={[styles.grade, { color: gradeColor }]}>
                    {qualityScore.grade}
                  </Text>
                  <Text style={styles.score}>{qualityScore.total}</Text>
                </View>
                <Text style={[styles.totalLabel, { color: gradeColor }]}>
                  {gradeLabel}
                </Text>
              </View>

              <View style={styles.breakdownList}>
                <BreakdownItem
                  label="Data Completeness"
                  value={qualityScore.breakdown.dataCompleteness}
                  description="How comprehensive the available data is"
                />
                <BreakdownItem
                  label="Insight Depth"
                  value={qualityScore.breakdown.insightDepth}
                  description="Quality and depth of AI analysis"
                />
                <BreakdownItem
                  label="Technical Accuracy"
                  value={qualityScore.breakdown.technicalAccuracy}
                  description="Precision of technical assessments"
                />
                <BreakdownItem
                  label="Actionability"
                  value={qualityScore.breakdown.actionability}
                  description="Usefulness of recommendations"
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

interface BreakdownItemProps {
  label: string;
  value: number;
  description: string;
}

const BreakdownItem: React.FC<BreakdownItemProps> = ({ label, value, description }) => {
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownLabel}>{label}</Text>
        <Text style={styles.breakdownValue}>{value}/100</Text>
      </View>
      <View style={styles.breakdownBar}>
        <View
          style={[
            styles.breakdownBarFill,
            {
              width: `${value}%`,
              backgroundColor:
                value >= 80
                  ? colors.status.success
                  : value >= 60
                  ? colors.brand.primary
                  : colors.status.warning,
            },
          ]}
        />
      </View>
      <Text style={styles.breakdownDescription}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: 1000,
    borderWidth: 4,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grade: {
    fontWeight: 'bold',
    marginBottom: -4,
  },
  score: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalScore: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  totalLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  breakdownList: {
    gap: spacing.lg,
  },
  breakdownItem: {
    gap: spacing.xs,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  breakdownValue: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  breakdownBar: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  breakdownDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
