import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { TemplateCard } from './TemplateCard';
import { colors, spacing, typography } from '../../design/theme';
import type { ReportTemplate, ReportType } from '../../types/auto-scout';
import autoScoutApi from '../../services/api/auto-scout';
import { useLocalization } from '../../contexts/LocalizationContext';
import api from '../../services/api';

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string, reportType: ReportType) => void;
}

// Mock templates as fallback
const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: 'match-performance',
    name: 'Match Performance',
    description: 'Detailed analysis of player performance in a specific match',
    icon: 'football',
    useCase: 'Post-match analysis',
    estimatedCost: '$0.024',
    reportType: 'MATCH_PERFORMANCE' as ReportType,
  },
  {
    id: 'season-overview',
    name: 'Season Overview',
    description: 'Comprehensive season performance and development tracking',
    icon: 'barChart',
    useCase: 'End of season review',
    estimatedCost: '$0.028',
    reportType: 'SEASON_OVERVIEW' as ReportType,
  },
  {
    id: 'transfer-target',
    name: 'Transfer Target',
    description: 'In-depth evaluation for potential recruitment',
    icon: 'target',
    useCase: 'Transfer assessment',
    estimatedCost: '$0.032',
    reportType: 'TRANSFER_TARGET' as ReportType,
  },
  {
    id: 'youth-prospect',
    name: 'Youth Prospect',
    description: 'Development potential and growth trajectory analysis',
    icon: 'star',
    useCase: 'Youth development',
    estimatedCost: '$0.026',
    reportType: 'YOUTH_PROSPECT' as ReportType,
  },
  {
    id: 'quick-scan',
    name: 'Quick Scan',
    description: 'Fast overview of key stats and highlights',
    icon: 'flash',
    useCase: 'Quick assessment',
    estimatedCost: '$0.016',
    reportType: 'QUICK_SCAN' as ReportType,
  },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const { dictionary } = useLocalization();
  const copy = dictionary.autoScout.wizard.template;
  const upgradePrompt =
    copy?.upgradePrompt ||
    dictionary.autoScout?.access?.upgradePrompt ||
    'AutoScout templates require a GOLD subscription tier. Upgrade your plan to unlock this feature.';
  const [templates, setTemplates] = useState<ReportTemplate[]>(MOCK_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [accessState, setAccessState] = useState<'checking' | 'granted' | 'locked'>('checking');
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await autoScoutApi.getTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.warn('Failed to load templates, using mock data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const subscription = await api.getMySubscription();
        const tier = (subscription?.tier || 'FREE').toUpperCase();
        const hasGoldAccess = tier === 'GOLD' || tier === 'ENTERPRISE';
        if (hasGoldAccess) {
          setAccessState('granted');
          await loadTemplates();
        } else {
          setAccessState('locked');
          setAccessMessage(upgradePrompt);
        }
      } catch (error) {
        console.warn('Unable to verify subscription tier for AutoScout templates', error);
        setAccessState('locked');
        setAccessMessage(upgradePrompt);
      }
    };

    checkAccess();
  }, [loadTemplates, upgradePrompt]);

  const handleLockedSelect = () => {
    Alert.alert(copy?.upgradeTitle || 'Upgrade Required', upgradePrompt);
  };

  if (accessState === 'checking' || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.loadingText}>{copy.loading}</Text>
      </View>
    );
  }

  const disableTemplates = accessState !== 'granted';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>
        {copy.subtitle}
      </Text>

      {accessState === 'locked' && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedTitle}>
            {dictionary.autoScout?.access?.title || 'AutoScout AI – Gold Feature'}
          </Text>
          <Text style={styles.lockedText}>{accessMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={
              disableTemplates
                ? handleLockedSelect
                : () => onSelectTemplate(template.id, template.reportType)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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
  lockedBanner: {
    borderWidth: 1,
    borderColor: colors.status.warning,
    backgroundColor: colors.status.warning + '20',
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lockedTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.status.warning,
    marginBottom: spacing.xs,
  },
  lockedText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
