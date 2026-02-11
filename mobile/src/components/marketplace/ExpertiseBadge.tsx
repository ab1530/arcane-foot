import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../design/theme';

export type ExpertiseType = 'league' | 'position' | 'ageGroup' | 'language' | 'country';

interface ExpertiseBadgeProps {
  label: string;
  type?: ExpertiseType;
  size?: 'sm' | 'md';
  variant?: 'default' | 'outline';
}

const ExpertiseBadge: React.FC<ExpertiseBadgeProps> = ({
  label,
  type = 'league',
  size = 'sm',
  variant = 'default',
}) => {
  const getColorForType = (type: ExpertiseType) => {
    switch (type) {
      case 'league':
        return {
          bg: 'rgba(228, 255, 59, 0.12)',
          border: 'rgba(228, 255, 59, 0.3)',
          text: colors.brand.primary,
        };
      case 'position':
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.3)',
          text: colors.semantic.info,
        };
      case 'ageGroup':
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.3)',
          text: '#A855F7',
        };
      case 'language':
        return {
          bg: 'rgba(34, 197, 94, 0.12)',
          border: 'rgba(34, 197, 94, 0.3)',
          text: colors.semantic.success,
        };
      case 'country':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: colors.semantic.warning,
        };
      default:
        return {
          bg: colors.surface.glass,
          border: colors.surface.border,
          text: colors.text.secondary,
        };
    }
  };

  const colorScheme = getColorForType(type);

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        variant === 'default' && {
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
        },
        variant === 'outline' && {
          backgroundColor: 'transparent',
          borderColor: colorScheme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          size === 'sm' ? styles.labelSm : styles.labelMd,
          { color: colorScheme.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    maxWidth: 120,
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 150,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontWeight: typography.weights.medium,
  },
  labelSm: {
    fontSize: typography.sizes.xs,
  },
  labelMd: {
    fontSize: typography.sizes.sm,
  },
});

export default ExpertiseBadge;
