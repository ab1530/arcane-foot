import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { GenerationStage } from '../../types/auto-scout';

interface GenerationProgressProps {
  stage: GenerationStage;
}

const STAGES = [
  {
    id: 'fetching',
    label: 'Fetching Stats',
    icon: 'download',
    description: 'Gathering player statistics and performance data',
  },
  {
    id: 'generating',
    label: 'Generating with GPT-4',
    icon: 'ai',
    description: 'AI is analyzing the data and creating insights',
  },
  {
    id: 'scoring',
    label: 'Scoring Quality',
    icon: 'checkmarkCircle',
    description: 'Evaluating report quality and accuracy',
  },
  {
    id: 'complete',
    label: 'Complete',
    icon: 'checkmarkDone',
    description: 'Report generated successfully',
  },
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ stage }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for active stage
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    if (stage.stage !== 'complete') {
      pulseAnimation.start();
    }

    return () => pulseAnimation.stop();
  }, [stage.stage]);

  useEffect(() => {
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: stage.progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [stage.progress]);

  const getCurrentStageIndex = () => {
    return STAGES.findIndex((s) => s.id === stage.stage);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const currentStageIndex = getCurrentStageIndex();
  const currentStage = STAGES[currentStageIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generating Report</Text>
      <Text style={styles.subtitle}>{stage.message}</Text>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(stage.progress)}%</Text>
      </View>

      {/* Current Stage Indicator */}
      <View style={styles.currentStageContainer}>
        <Animated.View
          style={[
            styles.currentStageIcon,
            stage.stage === 'generating' && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Icon name={currentStage.icon as any} size={40} color={colors.brand.primary} />
        </Animated.View>
        <View style={styles.currentStageText}>
          <Text style={styles.currentStageLabel}>{currentStage.label}</Text>
          <Text style={styles.currentStageDescription}>
            {currentStage.description}
          </Text>
        </View>
      </View>

      {/* All Stages List */}
      <View style={styles.stagesList}>
        {STAGES.map((stageItem, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <View key={stageItem.id} style={styles.stageItem}>
              <View
                style={[
                  styles.stageIndicator,
                  isActive && styles.stageIndicatorActive,
                  isCompleted && styles.stageIndicatorCompleted,
                ]}
              >
                {isCompleted ? (
                  <Icon name="checkmark" size={16} color={colors.background.primary} />
                ) : (
                  <Text style={styles.stageNumber}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  isActive && styles.stageLabelActive,
                  isCompleted && styles.stageLabelCompleted,
                  isPending && styles.stageLabelPending,
                ]}
              >
                {stageItem.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Estimated Time */}
      {stage.estimatedTimeRemaining !== undefined && stage.estimatedTimeRemaining > 0 && (
        <View style={styles.timeEstimate}>
          <Icon name="time" size={16} color={colors.text.secondary} />
          <Text style={styles.timeEstimateText}>
            Estimated time remaining: {stage.estimatedTimeRemaining}s
          </Text>
        </View>
      )}

      {/* GPT-4 Badge */}
      {stage.stage === 'generating' && (
        <View style={styles.gptBadge}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon name="ai" size={24} color={colors.brand.primary} />
          </Animated.View>
          <Text style={styles.gptBadgeText}>Powered by GPT-4</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: spacing.xl,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.sm,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.brand.primary,
    textAlign: 'right',
  },
  currentStageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.brand.primary + '30',
  },
  currentStageIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  currentStageText: {
    flex: 1,
  },
  currentStageLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  currentStageDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  stagesList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIndicatorActive: {
    backgroundColor: colors.brand.primary,
  },
  stageIndicatorCompleted: {
    backgroundColor: colors.status.success,
  },
  stageNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  stageLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  stageLabelActive: {
    fontWeight: '600',
    color: colors.brand.primary,
  },
  stageLabelCompleted: {
    color: colors.text.primary,
  },
  stageLabelPending: {
    color: colors.text.tertiary,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  timeEstimateText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  gptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary + '10',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  gptBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
