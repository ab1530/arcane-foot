import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '../../components/ui';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenHeader } from '../../components/navigation';
import { TemplateSelector } from '../../components/auto-scout/TemplateSelector';
import { PlayerConfig } from '../../components/auto-scout/PlayerConfig';
import { GenerationProgress } from '../../components/auto-scout/GenerationProgress';
import { ReportPreview } from '../../components/auto-scout/ReportPreview';
import { QualityScoreBadge } from '../../components/auto-scout/QualityScoreBadge';
import { colors, spacing, typography, radius } from '../../design/theme';
import autoScoutApi from '../../services/api/auto-scout';
import api from '../../services/api';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { AppStackParamList } from '../../types/navigation';
import type {
  ReportType,
  GeneratedReport,
  GenerationStage,
} from '../../types/auto-scout';
import type { AutoScoutHistoryItem } from '../../types/auto-scout';

type Props = NativeStackScreenProps<AppStackParamList, 'AutoScout'>;

type WizardStep = 'template' | 'configure' | 'generating' | 'preview';
type Tab = 'generate' | 'history';

type AutoScoutAnalytics = {
  totalReports?: number;
  averageQualityScore?: number;
  estimatedCost?: number;
  templateUsage?: Array<{ template: string; count: number }>;
};

export const AutoScoutScreen: React.FC<Props> = ({ navigation }) => {
  const { dictionary, language } = useLocalization();
  const autoScoutCopy = dictionary.autoScout;
  const wizardCopy = autoScoutCopy.wizard;
  const defaultErrorMessage = dictionary.common?.feedback?.error || 'Unable to load data';
  const refreshLabel = dictionary.common?.actions?.refresh || 'Refresh';
  const loadingLabel = dictionary.common?.feedback?.loading || 'Loading...';
  const viewAllLabel =
    autoScoutCopy.history.viewAll || dictionary.common?.actions?.viewAll || 'View history';
  const savedStatusLabel = dictionary.common?.status?.saved || 'Saved';
  const draftStatusLabel = dictionary.common?.status?.draft || 'Draft';

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState('');
  const [autoSave, setAutoSave] = useState(false);

  // Progress state
  const [progress, setProgress] = useState<GenerationStage>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AutoScoutAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // History preview state
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null);
  const [historyPlayerName, setHistoryPlayerName] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<AutoScoutHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Load analytics on mount
  useEffect(() => {
    let mounted = true;
    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const response = await autoScoutApi.getAnalytics();
        if (mounted && response?.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.warn('AutoScout analytics unavailable', error);
      } finally {
        if (mounted) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle template selection
  const handleTemplateSelect = (templateId: string, reportType: ReportType) => {
    setSelectedTemplate(templateId);
    setSelectedReportType(reportType);
  };

  // Handle player selection
  const handlePlayerSelect = (playerId: string, playerName: string) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerName(playerName);
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 'template' && !selectedTemplate) {
      Alert.alert(wizardCopy.alerts.rateLimit.title, wizardCopy.wizard.template.subtitle);
      return;
    }

    const steps: WizardStep[] = ['template', 'configure', 'generating', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // Handle previous step
  const handleBack = () => {
    const steps: WizardStep[] = ['template', 'configure', 'generating', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle report generation
  const handleGenerate = async () => {
    if (!selectedPlayerId || !selectedReportType) {
      Alert.alert(dictionary.common.feedback.error, wizardCopy.config.playerLabel);
      return;
    }

    try {
      // Move to generating step
      setCurrentStep('generating');
      setIsGenerating(true);

      // Simulate progress stages
      setProgress({
        stage: 'fetching_stats',
        message: wizardCopy.progress.stages.fetching.message,
        progress: 10,
        estimatedTimeRemaining: 10,
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress({
        stage: 'generating',
        message: wizardCopy.progress.stages.generating.message,
        progress: 40,
        estimatedTimeRemaining: 8,
      });

      // Call API
      const response = await autoScoutApi.generate({
        playerId: selectedPlayerId,
        matchId: selectedMatchId || undefined,
        reportType: selectedReportType,
        customContext: customContext || undefined,
        autoSave,
        temperature: 0.7,
        includeComparisons: true,
      });

      if (!response.success) {
        throw new Error(response.message || wizardCopy.alerts.failure.message);
      }

      // Update progress
      setProgress({
        stage: 'scoring',
        message: wizardCopy.progress.stages.scoring.message,
        progress: 80,
        estimatedTimeRemaining: 2,
      });

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress({
        stage: 'complete',
        message: wizardCopy.progress.stages.complete.message,
        progress: 100,
        estimatedTimeRemaining: 0,
      });

      // Set generated report
      setGeneratedReport(response.data);

      // Move to preview step after short delay
      setTimeout(() => {
        setCurrentStep('preview');
      }, 1000);

      Alert.alert(wizardCopy.alerts.save.successTitle, wizardCopy.alerts.save.successMessage);
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      Alert.alert(wizardCopy.alerts.save.errorTitle, error.message || wizardCopy.alerts.failure.message);

      setProgress({
        stage: 'error',
        message: wizardCopy.alerts.failure.title,
        progress: 0,
      });

      // Go back to configure step
      setTimeout(() => {
        setCurrentStep('configure');
      }, 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle save report
  const handleSave = async () => {
    try {
      Alert.alert(wizardCopy.alerts.save.successTitle, wizardCopy.alerts.save.successMessage);
      // Reset wizard
      setCurrentStep('template');
      setSelectedTemplate(null);
      setSelectedReportType(null);
      setSelectedPlayerId(null);
      setSelectedPlayerName('');
      setGeneratedReport(null);
      // Switch to history tab
      setActiveTab('history');
      setHistoryPlayerId(selectedPlayerId);
      setHistoryPlayerName(selectedPlayerName);
    } catch (error) {
      console.error('Failed to save report:', error);
      Alert.alert(wizardCopy.alerts.save.errorTitle, wizardCopy.alerts.save.errorMessage);
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    setCurrentStep('configure');
    setGeneratedReport(null);
  };

  // Handle discard
  const handleDiscard = () => {
    Alert.alert(
      wizardCopy.preview.alerts.discard.title,
      wizardCopy.preview.alerts.discard.message,
      [
        { text: wizardCopy.preview.alerts.discard.cancel, style: 'cancel' },
        {
          text: wizardCopy.preview.alerts.discard.confirm,
          style: 'destructive',
          onPress: () => {
            setCurrentStep('template');
            setSelectedTemplate(null);
            setSelectedReportType(null);
            setGeneratedReport(null);
          },
        },
      ]
    );
  };

  // Get current step number
  const wizardSteps = [
    { id: 'template', label: wizardCopy.template.title, number: 1 },
    { id: 'configure', label: wizardCopy.config.title, number: 2 },
    { id: 'generating', label: wizardCopy.progress.title, number: 3 },
    { id: 'preview', label: 'Preview', number: 4 },
  ];

  const currentStepIndex = wizardSteps.findIndex((s) => s.id === currentStep);

  const formatHistoryDate = useCallback(
    (value: string | Date) => {
      try {
        return new Date(value).toLocaleDateString(language, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return typeof value === 'string' ? value : '';
      }
    },
    [language]
  );

  const resolveTemplateLabel = useCallback(
    (item: AutoScoutHistoryItem) => {
      const fallbackLabel =
        autoScoutCopy?.history?.unknownTemplate || dictionary.common?.labels?.unknown || 'Auto-Scout';

      if (!item) {
        return fallbackLabel;
      }

      if (item.templateName && item.templateName.trim().length > 0) {
        return item.templateName;
      }

      const slug = typeof item.template === 'string' ? item.template : null;
      if (slug) {
        return slug.replace(/_/g, ' ');
      }

      return fallbackLabel;
    },
    [autoScoutCopy?.history?.unknownTemplate, dictionary.common?.labels?.unknown]
  );

  const resolveFallbackPlayer = useCallback(async () => {
    try {
      const response = await api.getPlayers({ limit: 1 });
      const candidate =
        response?.data?.[0] ??
        response?.items?.[0] ??
        (response as any)?.players?.[0];

      if (!candidate) {
        return null;
      }

      const id =
        candidate.id ??
        candidate.playerId ??
        candidate.player?.id ??
        candidate.player?.playerId;

      if (!id) {
        return null;
      }

      const name =
        `${candidate.user?.firstName ?? candidate.users?.firstName ?? ''} ${
          candidate.user?.lastName ?? candidate.users?.lastName ?? ''
        }`.trim() ||
        candidate.playerName ||
        candidate.player?.name ||
        autoScoutCopy.history?.fallbackName ||
        'Player';

      return { id, name };
    } catch (error) {
      console.warn('[AutoScout] Unable to resolve fallback player', error);
      return null;
    }
  }, [autoScoutCopy.history]);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      let targetPlayerId = selectedPlayerId || historyPlayerId;
      let targetPlayerName = selectedPlayerName || historyPlayerName;

      if (selectedPlayerId && selectedPlayerId !== historyPlayerId) {
        targetPlayerId = selectedPlayerId;
        targetPlayerName = selectedPlayerName;
        setHistoryPlayerId(selectedPlayerId);
        setHistoryPlayerName(selectedPlayerName);
      }

      if (!targetPlayerId) {
        const fallback = await resolveFallbackPlayer();
        if (!fallback) {
          setHistoryItems([]);
          setHistoryError(autoScoutCopy.history?.errors?.noPlayer || defaultErrorMessage);
          return;
        }
        targetPlayerId = fallback.id;
        targetPlayerName = fallback.name;
        setHistoryPlayerId(fallback.id);
        setHistoryPlayerName(fallback.name);
      }

      const response = await autoScoutApi.getHistory(targetPlayerId);
      if (response.success && Array.isArray(response.data)) {
        setHistoryItems(response.data);
      } else {
        setHistoryItems([]);
        setHistoryError(autoScoutCopy.history?.errors?.load || defaultErrorMessage);
      }
    } catch (error) {
      console.error('Failed to load AutoScout history', error);
      setHistoryItems([]);
      setHistoryError(autoScoutCopy.history?.errors?.load || defaultErrorMessage);
    } finally {
      setHistoryLoading(false);
    }
  }, [
    autoScoutCopy.history,
    defaultErrorMessage,
    historyPlayerId,
    historyPlayerName,
    resolveFallbackPlayer,
    selectedPlayerId,
    selectedPlayerName,
  ]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleOpenHistory = useCallback(() => {
    navigation.navigate('AutoScoutHistory');
  }, [navigation]);

  const historyDisplayName =
    selectedPlayerName ||
    historyPlayerName ||
    autoScoutCopy.history?.defaultPlayerLabel ||
    dictionary.common.labels?.player ||
    'Player';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader showBackButton={true} borderBottom={false} blur={false} backgroundColor={colors.background.secondary} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Icon name="sparkles" size={32} color={colors.brand.primary} />
            <View>
              <Text style={styles.title}>{autoScoutCopy.hero.title}</Text>
              <Text style={styles.subtitle}>{autoScoutCopy.hero.subtitle}</Text>
            </View>
          </View>
        </View>

        {/* Analytics Cards */}
        {(analytics || analyticsLoading) && (
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>{autoScoutCopy.history.title}</Text>
              <Text style={styles.analyticsValue}>
                {analytics?.totalReports ?? '—'}
              </Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>{wizardCopy.quality.modalTitle}</Text>
              <Text style={styles.analyticsValue}>
                {analytics?.averageQualityScore
                  ? `${analytics.averageQualityScore.toFixed(1)}/100`
                  : '—'}
              </Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsLabel}>{wizardCopy.alerts.cost.title}</Text>
              <Text style={styles.analyticsValue}>
                {analytics?.estimatedCost
                  ? `$${analytics.estimatedCost.toFixed(2)}`
                  : '—'}
              </Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'generate' && styles.tabActive]}
            onPress={() => setActiveTab('generate')}
          >
            <Icon
              name="document"
              size={20}
              color={activeTab === 'generate' ? colors.background.primary : colors.text.primary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'generate' && styles.tabTextActive,
              ]}
            >
              {wizardCopy.navigation.generate}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Icon
              name="time"
              size={20}
              color={activeTab === 'history' ? colors.background.primary : colors.text.primary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.tabTextActive,
              ]}
            >
              {autoScoutCopy.history.title}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'generate' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          {currentStep !== 'generating' && (
            <View style={styles.progressIndicator}>
              {wizardSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <View
                    style={[
                      styles.progressStep,
                      index <= currentStepIndex && styles.progressStepActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.progressNumber,
                        index <= currentStepIndex && styles.progressNumberActive,
                        index < currentStepIndex && styles.progressNumberCompleted,
                      ]}
                    >
                      {index < currentStepIndex ? (
                        <Icon name="checkmark" size={16} color={colors.background.primary} />
                      ) : (
                        <Text
                          style={[
                            styles.progressNumberText,
                            index <= currentStepIndex && styles.progressNumberTextActive,
                          ]}
                        >
                          {step.number}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.progressLabel,
                        index <= currentStepIndex && styles.progressLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>

                  {index < wizardSteps.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        index < currentStepIndex && styles.progressLineActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Step Content */}
          <GlassCard variant="elevated" style={styles.stepCard}>
            {currentStep === 'template' && (
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={handleTemplateSelect}
              />
            )}

            {currentStep === 'configure' && (
              <PlayerConfig
                selectedPlayerId={selectedPlayerId}
                selectedMatchId={selectedMatchId}
                customContext={customContext}
                autoSave={autoSave}
                selectedTemplate={selectedTemplate || undefined}
                onPlayerSelect={handlePlayerSelect}
                onMatchSelect={setSelectedMatchId}
                onCustomContextChange={setCustomContext}
                onAutoSaveChange={setAutoSave}
              />
            )}

            {currentStep === 'generating' && (
              <GenerationProgress stage={progress} />
            )}

            {currentStep === 'preview' && generatedReport && (
              <ReportPreview
                report={generatedReport}
                onSave={handleSave}
                onRegenerate={handleRegenerate}
                onDiscard={handleDiscard}
              />
            )}
          </GlassCard>

          {/* Navigation Buttons */}
          {currentStep !== 'generating' && currentStep !== 'preview' && (
            <View style={styles.navigation}>
              <TouchableOpacity
                onPress={handleBack}
                disabled={currentStep === 'template'}
                style={[
                  styles.navButton,
                  styles.backButton,
                  currentStep === 'template' && styles.navButtonDisabled,
                ]}
              >
                <Icon name="arrowBack" size={20} color={colors.text.primary} />
                <Text style={styles.backButtonText}>{dictionary.common.actions.back}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  currentStep === 'configure' ? handleGenerate : handleNext
                }
                disabled={
                  (currentStep === 'template' && !selectedTemplate) ||
                  (currentStep === 'configure' && !selectedPlayerId)
                }
                testID={
                  currentStep === 'configure'
                    ? 'auto-scout-generate-button'
                    : 'auto-scout-continue-button'
                }
                style={[
                  styles.navButton,
                  styles.nextButton,
                  ((currentStep === 'template' && !selectedTemplate) ||
                    (currentStep === 'configure' && !selectedPlayerId)) &&
                    styles.navButtonDisabled,
                ]}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === 'configure' ? wizardCopy.navigation.generate : wizardCopy.navigation.continue}
                </Text>
                <Icon name="arrowForward" size={20} color={colors.background.primary} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard variant="elevated" style={styles.stepCard}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>{autoScoutCopy.history.title}</Text>
                <Text style={styles.historySubtitle}>
                  {historyDisplayName
                    ? `${autoScoutCopy.history.subtitle} — ${historyDisplayName}`
                    : autoScoutCopy.history.subtitle}
                </Text>
              </View>
              <TouchableOpacity style={styles.refreshButton} onPress={loadHistory}>
                <Icon name="refresh" size={18} color={colors.brand.primary} />
                <Text style={styles.refreshText}>{refreshLabel}</Text>
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <Text style={styles.historyLoadingText}>{loadingLabel}</Text>
              </View>
            ) : historyItems.length > 0 ? (
              <>
                {historyItems.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyCardTop}>
                      <View>
                        <Text style={styles.historyPlayer}>{item.playerName}</Text>
                        <Text style={styles.historyMeta}>
                          {resolveTemplateLabel(item)} • {formatHistoryDate(item.createdAt)}
                        </Text>
                      </View>
                      <QualityScoreBadge qualityScore={item.qualityScore} size="small" />
                    </View>
                    <View style={styles.historyCardBottom}>
                      <Text style={styles.historyRating}>
                        {dictionary.autoScout.preview.overallRating}:{' '}
                        <Text style={styles.historyRatingValue}>
                          {item.overallRating?.toFixed?.(1) ?? '—'}
                        </Text>
                      </Text>
                      <View style={styles.historyStatusPill}>
                        <Text style={styles.historyStatusText}>
                          {item.status === 'saved' ? savedStatusLabel : draftStatusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="document" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyStateText}>
                  {historyError || autoScoutCopy.history.empty?.title || defaultErrorMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.viewHistoryButton} onPress={handleOpenHistory}>
              <Text style={styles.viewHistoryText}>
                {viewAllLabel}
              </Text>
              <Icon name="arrowForward" size={18} color={colors.brand.primary} />
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  headerTop: {
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  analyticsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: colors.surface.glass,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  analyticsValue: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
  },
  tabActive: {
    backgroundColor: colors.brand.primary,
  },
  tabText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tabTextActive: {
    color: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  progressStep: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressStepActive: {},
  progressNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumberActive: {
    backgroundColor: colors.brand.primary,
  },
  progressNumberCompleted: {
    backgroundColor: colors.status.success,
  },
  progressNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
    color: colors.text.tertiary,
  },
  progressNumberTextActive: {
    color: colors.background.primary,
  },
  progressLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  progressLabelActive: {
    color: colors.text.primary,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: spacing.xs,
  },
  progressLineActive: {
    backgroundColor: colors.status.success,
  },
  stepCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  backButton: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  nextButton: {
    backgroundColor: colors.brand.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  nextButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.background.primary,
  },
  historyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  historySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
  },
  refreshText: {
    fontSize: typography.sizes.xs,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  historyLoading: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  historyLoadingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface.glass,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  historyPlayer: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  historyMeta: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  historyCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRating: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  historyRatingValue: {
    fontWeight: '700',
  },
  historyStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface.glassLight,
  },
  historyStatusText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  viewHistoryButton: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  viewHistoryText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
