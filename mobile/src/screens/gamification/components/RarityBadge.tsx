/**
 * RARITY BADGE COMPONENT
 * Color-coded badge for achievement/badge rarity
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { tokens, typography } from '../../../design';
import { AchievementRarity } from '../../../types/gamification';

// ============================================================================
// TYPES
// ============================================================================

export interface RarityBadgeProps {
  rarity: AchievementRarity;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

// ============================================================================
// RARITY CONFIG
// ============================================================================

const RARITY_CONFIG = {
  [AchievementRarity.COMMON]: {
    color: tokens.colors.gray[500],
    label: 'Common',
    icon: '⚪',
  },
  [AchievementRarity.RARE]: {
    color: tokens.colors.semantic.info,
    label: 'Rare',
    icon: '🔵',
  },
  [AchievementRarity.EPIC]: {
    color: tokens.colors.feature.ai,
    label: 'Epic',
    icon: '🟣',
  },
  [AchievementRarity.LEGENDARY]: {
    color: tokens.colors.feature.gamification,
    label: 'Legendary',
    icon: '⭐',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  size = 'medium',
  style,
}) => {
  const config = RARITY_CONFIG[rarity];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        isSmall ? styles.containerSmall : styles.containerMedium,
        { backgroundColor: `${config.color}15`, borderColor: config.color },
        style,
      ]}
    >
      {!isSmall && (
        <Text style={styles.icon}>{config.icon}</Text>
      )}
      <Text
        style={[
          styles.label,
          isSmall ? styles.labelSmall : styles.labelMedium,
          { color: config.color },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontWeight: '600',
  },
  labelSmall: {
    ...typography.caption,
    fontSize: 10,
  },
  labelMedium: {
    ...typography.bodySmall,
    fontSize: 12,
  },
});
