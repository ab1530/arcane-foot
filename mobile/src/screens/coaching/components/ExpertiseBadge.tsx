/**
 * EXPERTISE BADGE COMPONENT
 * Displays expertise/skill badge with optional icon
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { tokens, typography } from '../../../design';
import {
  Target,
  Brain,
  Zap,
  Shield,
  Trophy,
  Activity,
} from 'lucide-react-native';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpertiseBadgeProps {
  expertise: string;
  icon?: string;
  variant?: 'default' | 'outlined';
  style?: ViewStyle;
}

// ============================================================================
// EXPERTISE ICONS
// ============================================================================

const expertiseIcons: Record<string, any> = {
  'Technical Skills': Target,
  'Tactical Awareness': Brain,
  'Physical Fitness': Zap,
  'Defending': Shield,
  'Career Guidance': Trophy,
  'Game Analysis': Activity,
};

// ============================================================================
// EXPERTISE COLORS
// ============================================================================

const expertiseColors: Record<string, string> = {
  'Technical Skills': tokens.colors.feature.scouting,
  'Tactical Awareness': tokens.colors.feature.ai,
  'Physical Fitness': tokens.colors.semantic.success,
  'Mental Coaching': tokens.colors.feature.coaching,
  'Goalkeeping': tokens.colors.semantic.warning,
  'Defending': tokens.colors.semantic.error,
  'Career Guidance': tokens.colors.feature.gamification,
  'Game Analysis': tokens.colors.feature.analytics,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ExpertiseBadge: React.FC<ExpertiseBadgeProps> = ({
  expertise,
  icon,
  variant = 'default',
  style,
}) => {
  const IconComponent = icon ? expertiseIcons[icon] : expertiseIcons[expertise];
  const color = expertiseColors[expertise] || tokens.colors.yellow.DEFAULT;

  return (
    <View
      style={[
        styles.container,
        variant === 'outlined' && styles.outlined,
        variant === 'outlined' && { borderColor: color },
        variant === 'default' && { backgroundColor: `${color}20` },
        style,
      ]}
    >
      {IconComponent && (
        <IconComponent size={14} color={color} />
      )}
      <Text
        style={[
          styles.text,
          { color },
        ]}
        numberOfLines={1}
      >
        {expertise}
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
