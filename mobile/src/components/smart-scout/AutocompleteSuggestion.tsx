import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';

interface AutocompleteSuggestionProps {
  text: string;
  confidence?: number;
  isAI?: boolean;
  onPress: () => void;
}

export const AutocompleteSuggestion: React.FC<AutocompleteSuggestionProps> = ({
  text,
  confidence,
  isAI = false,
  onPress,
}) => {
  const confidencePercentage = confidence ? Math.round(confidence * 100) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Icon name="text" size={16} color={colors.text.secondary} />
        <Text style={styles.text} numberOfLines={2}>
          {text}
        </Text>
      </View>
      <View style={styles.badges}>
        {isAI && (
          <View style={styles.aiBadge}>
            <Icon name="sparkles" size={12} color={colors.status.warning} />
            <Text style={styles.aiText}>AI</Text>
          </View>
        )}
        {confidencePercentage !== null && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{confidencePercentage}%</Text>
          </View>
        )}
        <Icon name="chevronForward" size={16} color={colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.status.warning + '20',
    borderRadius: radius.sm,
  },
  aiText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.status.warning,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.brand.primary + '20',
    borderRadius: radius.sm,
  },
  confidenceText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
