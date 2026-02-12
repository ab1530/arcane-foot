import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '../../components/ui';
import { GlassCard } from '../../components/ui/GlassCard';
import { TemplateSelector } from '../../components/auto-scout/TemplateSelector';
import { PlayerConfig } from '../../components/auto-scout/PlayerConfig';
import { GenerationProgress } from '../../components/auto-scout/GenerationProgress';
import { ReportPreview } from '../../components/auto-scout/ReportPreview';
import { colors, spacing, typography, radius } from '../../design/theme';
import autoScoutApi from '../../services/api/auto-scout';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { AppStackParamList } from '../../types/navigation';
import type {
  ReportType,
  GeneratedReport,
  GenerationStage,
} from '../../types/auto-scout';

type Props = NativeStackScreenProps<AppStackParamList, 'AutoScout'>;

type WizardStep = 'template' | 'config' | 'generate' | 'preview';

type AutoScoutAnalytics = {
  totalReports?: number;
  averageQualityScore?: number;
  estimatedCost?: number;
  templateUsage?: Array<{ template: string; count: number }>;
};

export const AutoScoutScreen: React.FC<Props> = ({ navigation }) => {
  const { dictionary, language } = useLocalization();
  const wizardCopy = dictionary.autoScout.wizard;
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState('');
  const [autoSave, setAutoSave] = useState(false);
  const [generationStage, setGenerationStage] = useState<GenerationStage>({
    stage: 'fetching',
    progress: 0,
    message: wizardCopy.progress.initializing,
  });
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analytics, setAnalytics] = useState<AutoScoutAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const canProceedFromTemplate = selectedTemplate !== null;
  const canProceedFromConfig = selectedPlayerId !== null;

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

  const handleTemplateSelect = (templateId: string, reportType: ReportType) => {
    setSelectedTemplate(templateId);
    setSelectedReportType(reportType);
  };

  const handlePlayerSelect = (playerId: string, playerName: string) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerName(playerName);
  };

  const simulateGeneration = async () => {
    const stages: Array<{ stage: GenerationStage['stage']; progress: number; message: string }> = [
      { stage: 'fetching', progress: 25, message: wizardCopy.progress.stages.fetching.message },
      { stage: 'generating', progress: 60, message: wizardCopy.progress.stages.generating.message },
      { stage: 'scoring', progress: 85, message: wizardCopy.progress.stages.scoring.message },
      { stage: 'complete', progress: 100, message: wizardCopy.progress.stages.complete.message },
    ];

    for (const stageData of stages) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setGenerationStage({
        ...stageData,
        estimatedTimeRemaining: stageData.stage === 'complete' ? 0 : (4 - stages.indexOf(stageData)) * 1.5,
      });
    }
  };

  const handleGenerate = async () => {
    if (!selectedPlayerId || !selectedReportType) return;

    // Show cost warning
    Alert.alert(
      wizardCopy.alerts.cost.title,
      wizardCopy.alerts.cost.message,
      [
        { text: wizardCopy.alerts.cost.cancel, style: 'cancel' },
        {
          text: wizardCopy.alerts.cost.confirm,
          onPress: async () => {
            try {
              setCurrentStep('generate');
              setIsGenerating(true);

              // Start progress simulation
              simulateGeneration();

              // Make actual API call
              const response = await autoScoutApi.generate({
                playerId: selectedPlayerId,
                matchId: selectedMatchId || undefined,
                reportType: selectedReportType,
                customContext: customContext || undefined,
                autoSave,
                temperature: 0.7,
                includeComparisons: true,
              });

              if (response.success && response.data) {
                setGeneratedReport(response.data);
                setCurrentStep('preview');
              } else {
                throw new Error('Failed to generate report');
              }
            } catch (error: any) {
              console.error('Report generation failed:', error);

              // Check if it's a rate limit error
              if (error.response?.status === 429) {
                Alert.alert(
                  wizardCopy.alerts.rateLimit.title,
                  wizardCopy.alerts.rateLimit.message,
                  [{ text: wizardCopy.alerts.rateLimit.confirm, onPress: () => setCurrentStep('config') }]
                );
              } else {
                Alert.alert(
                  wizardCopy.alerts.failure.title,
                  wizardCopy.alerts.failure.message,
                  [
                    { text: wizardCopy.alerts.failure.cancel, style: 'cancel', onPress: () => setCurrentStep('config') },
                    { text: wizardCopy.alerts.failure.retry, onPress: handleGenerate },
                  ]
                );
              }
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveReport = async () => {
    if (!generatedReport) return;

    try {
      // If autoSave was enabled, it's already saved
      if (autoSave) {
        Alert.alert(wizardCopy.alerts.save.successTitle, wizardCopy.alerts.save.successMessage, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Save manually
        Alert.alert(wizardCopy.alerts.save.successTitle, wizardCopy.alerts.save.successMessage, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert(wizardCopy.alerts.save.errorTitle, wizardCopy.alerts.save.errorMessage);
    }
  };

  const handleRegenerateReport = () => {
    setCurrentStep('config');
    setGeneratedReport(null);
  };

  const handleDiscardReport = () => {
    setCurrentStep('config');
    setGeneratedReport(null);
  };

  const handleBack = () => {
    if (currentStep === 'template') {
      navigation.goBack();
    } else if (currentStep === 'config') {
      setCurrentStep('template');
    } else if (currentStep === 'generate') {
      // Can't go back during generation
    } else if (currentStep === 'preview') {
      Alert.alert(
        wizardCopy.alerts.exitPreview.title,
        wizardCopy.alerts.exitPreview.message,
        [
          { text: wizardCopy.alerts.exitPreview.cancel, style: 'cancel' },
          { text: wizardCopy.alerts.exitPreview.confirm, onPress: () => setCurrentStep('config') },
        ]
      );
    }
  };

  const handleNext = () => {
    if (currentStep === 'template' && canProceedFromTemplate) {
      setCurrentStep('config');
    } else if (currentStep === 'config' && canProceedFromConfig) {
      handleGenerate();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleTemplateSelect}
          />
        );

      case 'config':
        return (
          <PlayerConfig
            selectedPlayerId={selectedPlayerId}
            selectedMatchId={selectedMatchId}
            customContext={customContext}
            autoSave={autoSave}
            onPlayerSelect={handlePlayerSelect}
            onMatchSelect={setSelectedMatchId}
            onCustomContextChange={setCustomContext}
            onAutoSaveChange={setAutoSave}
          />
        );

      case 'generate':
        return <GenerationProgress stage={generationStage} />;

      case 'preview':
        return generatedReport ? (
          <ReportPreview
            report={generatedReport}
            onSave={handleSaveReport}
            onRegenerate={handleRegenerateReport}
            onDiscard={handleDiscardReport}
          />
        ) : null;

      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps = { template: 1, config: 2, generate: 3, preview: 4 };
    return steps[currentStep];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerButton}
          disabled={currentStep === 'generate' && isGenerating}
        >
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{wizardCopy.header.title}</Text>
          <Text style={styles.headerSubtitle}>
            {wizardCopy.header.stepLabel
              .replace('{{current}}', String(getStepNumber()))
              .replace('{{total}}', '4')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('AutoScoutHistory' as any)}
          style={styles.headerButton}
        >
          <Icon name="time" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {['template', 'config', 'generate', 'preview'].map((step, index) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.progressDot,
                currentStep === step && styles.progressDotActive,
                getStepNumber() > index + 1 && styles.progressDotCompleted,
              ]}
            >
              {getStepNumber() > index + 1 ? (
                <Icon name="checkmark" size={12} color={colors.background.primary} />
              ) : (
                <Text
                  style={[
                    styles.progressDotText,
                    (currentStep === step || getStepNumber() > index + 1) &&
                      styles.progressDotTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            {index < 3 && (
              <View
                style={[
                  styles.progressLine,
                  getStepNumber() > index + 1 && styles.progressLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Content */}
      <GlassCard variant="elevated" style={styles.content}>
        {renderStepContent()}
      </GlassCard>

      {/* Navigation Buttons */}
      {currentStep !== 'generate' && currentStep !== 'preview' && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              ((currentStep === 'template' && !canProceedFromTemplate) ||
                (currentStep === 'config' && !canProceedFromConfig)) &&
                styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={
              (currentStep === 'template' && !canProceedFromTemplate) ||
              (currentStep === 'config' && !canProceedFromConfig)
            }
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 'config' ? wizardCopy.navigation.generate : wizardCopy.navigation.continue}
            </Text>
            <Icon name="arrowForward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        </View>
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.brand.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.status.success,
  },
  progressDotText: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
    color: colors.text.tertiary,
  },
  progressDotTextActive: {
    color: colors.background.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: spacing.xs,
  },
  progressLineActive: {
    backgroundColor: colors.status.success,
  },
  content: {
    flex: 1,
    margin: spacing.md,
    padding: spacing.md,
  },
  navigation: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  nextButton: {
    backgroundColor: colors.brand.primary,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.background.primary,
  },
});
