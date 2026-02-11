import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { QualityScoreBadge } from './QualityScoreBadge';
import { ReportSection } from './ReportSection';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { GeneratedReport } from '../../types/auto-scout';
import { useLocalization } from '../../contexts/LocalizationContext';

interface ReportPreviewProps {
  report: GeneratedReport;
  onSave: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
  isEditMode?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  onSave,
  onRegenerate,
  onDiscard,
  isEditMode = true,
}) => {
  const { dictionary, language } = useLocalization();
  const previewCopy = dictionary.autoScout.wizard.preview;
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  const [editedSummary, setEditedSummary] = useState(report.summary);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const handleSave = () => {
    if (report.qualityScore.grade === 'C' || report.qualityScore.grade === 'D') {
      Alert.alert(
        previewCopy.alerts.lowQuality.title,
        previewCopy.alerts.lowQuality.message,
        [
          { text: previewCopy.alerts.lowQuality.cancel, style: 'cancel' },
          { text: previewCopy.alerts.lowQuality.confirm, onPress: onSave },
        ]
      );
    } else {
      onSave();
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      previewCopy.alerts.discard.title,
      previewCopy.alerts.discard.message,
      [
        { text: previewCopy.alerts.discard.cancel, style: 'cancel' },
        { text: previewCopy.alerts.discard.confirm, style: 'destructive', onPress: onDiscard },
      ]
    );
  };

  const handleRegenerate = () => {
    Alert.alert(
      previewCopy.alerts.regenerate.title,
      previewCopy.alerts.regenerate.message,
      [
        { text: previewCopy.alerts.regenerate.cancel, style: 'cancel' },
        { text: previewCopy.alerts.regenerate.confirm, onPress: onRegenerate },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quality Score */}
        <View style={styles.qualitySection}>
          <QualityScoreBadge
            qualityScore={report.qualityScore}
            size="large"
            showBreakdown
          />
        </View>

        {/* Player Info */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{report.playerName}</Text>
          <Text style={styles.playerPosition}>{report.position}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{previewCopy.summary}</Text>
            {isEditMode && (
              <TouchableOpacity
                onPress={() => setIsEditingSummary(!isEditingSummary)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={isEditingSummary ? 'checkmark' : 'edit'}
                  size={20}
                  color={colors.brand.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          {isEditingSummary ? (
            <TextInput
              style={styles.summaryInput}
              value={editedSummary}
              onChangeText={setEditedSummary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.summaryText}>{editedSummary}</Text>
          )}
        </View>

        {/* Category Sections */}
        <ReportSection
          title={previewCopy.sections.technical}
          section={report.technicalSkills}
          icon="football"
          defaultExpanded
        />

        <ReportSection
          title={previewCopy.sections.tactical}
          section={report.tacticalAwareness}
          icon="compass"
        />

        <ReportSection
          title={previewCopy.sections.physical}
          section={report.physicalAttributes}
          icon="fitness"
        />

        <ReportSection
          title={previewCopy.sections.mental}
          section={report.mentalAttributes}
          icon="brain"
        />

        {/* Overall Rating & Potential */}
        <View style={styles.ratingsSection}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingLabel}>{previewCopy.ratings.overall}</Text>
            <Text style={styles.ratingValue}>{report.overallRating}/10</Text>
          </View>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingLabel}>{previewCopy.ratings.potential}</Text>
            <Text style={styles.potentialValue}>{report.potential}</Text>
          </View>
        </View>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{previewCopy.recommendations}</Text>
            <View style={styles.recommendationsList}>
              {report.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationBullet}>
                    <Text style={styles.recommendationNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Comparable Players */}
        {report.comparablePlayers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{previewCopy.comparable}</Text>
            <View style={styles.comparableList}>
              {report.comparablePlayers.map((player, index) => (
                <View key={index} style={styles.comparableItem}>
                  <Icon name="person" size={20} color={colors.brand.primary} />
                  <Text style={styles.comparableText}>{player}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Icon name="calendar" size={16} color={colors.text.tertiary} />
            <Text style={styles.metadataText}>
              {previewCopy.metadata.generated.replace(
                '{{date}}',
                new Date(report.generatedAt).toLocaleDateString(locale)
              )}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Icon name="ai" size={16} color={colors.text.tertiary} />
            <Text style={styles.metadataText}>
              {previewCopy.metadata.model.replace('{{model}}', report.model)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {isEditMode && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.discardButton]}
            onPress={handleDiscard}
          >
            <Icon name="delete" size={20} color={colors.status.error} />
            <Text style={styles.discardButtonText}>{previewCopy.actions.discard}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.regenerateButton]}
            onPress={handleRegenerate}
          >
            <Icon name="refresh" size={20} color={colors.brand.primary} />
            <Text style={styles.regenerateButtonText}>{previewCopy.actions.regenerate}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
          >
            <Icon name="checkmark" size={20} color={colors.background.primary} />
            <Text style={styles.saveButtonText}>{previewCopy.actions.save}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    paddingBottom: spacing.xl,
  },
  qualitySection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  playerName: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  playerPosition: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 22,
    backgroundColor: colors.surface.glassLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  summaryInput: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 22,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    minHeight: 100,
  },
  ratingsSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  ratingCard: {
    flex: 1,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  ratingValue: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  potentialValue: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  recommendationsList: {
    gap: spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface.glassLight,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  recommendationBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  comparableList: {
    gap: spacing.sm,
  },
  comparableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glassLight,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  comparableText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  metadata: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  discardButton: {
    backgroundColor: colors.status.error + '10',
    borderColor: colors.status.error,
  },
  discardButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.status.error,
  },
  regenerateButton: {
    backgroundColor: colors.brand.primary + '10',
    borderColor: colors.brand.primary,
  },
  regenerateButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  saveButton: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  saveButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.background.primary,
  },
});
