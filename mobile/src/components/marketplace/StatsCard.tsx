import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design/theme';

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  value,
  label,
  iconColor = colors.brand.primary,
  size = 'md',
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'md':
        return 20;
      case 'lg':
        return 24;
      default:
        return 20;
    }
  };

  const getValueFontSize = () => {
    switch (size) {
      case 'sm':
        return typography.sizes.lg;
      case 'md':
        return typography.sizes.xl;
      case 'lg':
        return typography.sizes.h4;
      default:
        return typography.sizes.xl;
    }
  };

  const getLabelFontSize = () => {
    switch (size) {
      case 'sm':
        return typography.sizes.xs;
      case 'md':
        return typography.sizes.sm;
      case 'lg':
        return typography.sizes.base;
      default:
        return typography.sizes.sm;
    }
  };

  return (
    <View style={[styles.container, size === 'sm' ? styles.containerSm : styles.containerMd]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Icon size={getIconSize()} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.value, { fontSize: getValueFontSize() }]}>
          {value}
        </Text>
        <Text style={[styles.label, { fontSize: getLabelFontSize() }]}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flex: 1,
  },
  containerSm: {
    padding: spacing.sm,
  },
  containerMd: {
    padding: spacing.md,
  },
  iconContainer: {
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  value: {
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  label: {
    fontFamily: typography.fonts.regular,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
});

export default StatsCard;
