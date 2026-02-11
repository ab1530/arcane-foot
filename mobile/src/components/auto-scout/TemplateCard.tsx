import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../ui';
import type { IconName } from '../../constants/icons';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { ReportTemplate } from '../../types/auto-scout';

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

const TEMPLATE_ICONS: Record<string, IconName> = {
  MATCH_PERFORMANCE: 'football',
  SEASON_OVERVIEW: 'barChart',
  TRANSFER_TARGET: 'target',
  YOUTH_PROSPECT: 'star',
  QUICK_SCAN: 'flash',
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  const iconName = TEMPLATE_ICONS[template.reportType] || 'document';

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Icon
            name={iconName}
            size={32}
            color={isSelected ? colors.background.primary : colors.brand.primary}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.header}>
            <Text style={styles.name}>{template.name}</Text>
            {isSelected && (
              <View style={styles.checkmark}>
                <Icon name="checkmark" size={16} color={colors.background.primary} />
              </View>
            )}
          </View>

          <Text style={styles.description}>{template.description}</Text>

          <View style={styles.footer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{template.estimatedCost}</Text>
            </View>
            <Text style={styles.useCase}>{template.useCase}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.background.tertiary,
  },
  containerSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.surface.glassLight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.brand.primary,
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.status.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.status.success,
  },
  useCase: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});
