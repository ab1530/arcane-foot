/**
 * ARCANE STAT CARD COMPONENT
 * Premium stat card with glow shadow effect and trend indicators
 *
 * Features:
 * - Charcoal background with yellow accents
 * - Trend indicators with arrows
 * - Glow shadow effect
 * - Icon support
 * - Touchable with haptic feedback
 *
 * @version 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../../design/tokens';
import { typographyPresets as typography } from '../../../design/typography';

// ============================================================================
// TYPES
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: {
    direction: TrendDirection;
    value: string | number;
    label?: string;
  };
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = tokens.colors.yellow.DEFAULT,
  onPress,
  style,
  testID,
}) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return tokens.colors.semantic.success;
      case 'down':
        return tokens.colors.semantic.error;
      case 'neutral':
      default:
        return tokens.colors.gray[400];
    }
  };

  const getTrendIcon = (direction: TrendDirection): keyof typeof Ionicons.glyphMap => {
    switch (direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'neutral':
      default:
        return 'remove';
    }
  };

  const content = (
    <View style={[styles.container, style]} testID={testID}>
      {/* Background with subtle glow */}
      <View style={[styles.glowBackground, { backgroundColor: color + '08' }]} />

      {/* Card Content */}
      <View style={styles.content}>
        {/* Header with icon */}
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
              <Ionicons name={icon} size={tokens.iconSize.sm} color={color} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Value */}
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]} testID={`${testID}-value`}>
            {value}
          </Text>
        </View>

        {/* Trend Indicator */}
        {trend && (
          <View style={styles.trendContainer}>
            <View style={styles.trendBadge}>
              <Ionicons
                name={getTrendIcon(trend.direction)}
                size={tokens.iconSize.xs}
                color={getTrendColor(trend.direction)}
              />
              <Text
                style={[
                  styles.trendValue,
                  { color: getTrendColor(trend.direction) },
                ]}
              >
                {trend.value}
              </Text>
            </View>
            {trend.label && (
              <Text style={styles.trendLabel} numberOfLines={1}>
                {trend.label}
              </Text>
            )}
          </View>
        )}

        {/* Bottom indicator bar */}
        <View style={[styles.indicator, { backgroundColor: color }]} />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}`}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  container: {
    position: 'relative',
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
    overflow: 'hidden',
    minHeight: 140,
    ...tokens.shadows.md,
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.caption,
    flex: 1,
    color: tokens.colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: tokens.letterSpacing.wide,
  },
  valueContainer: {
    marginBottom: 8,
  },
  value: {
    ...typography.statValue,
    fontSize: tokens.fontSize['4xl'],
    lineHeight: tokens.fontSize['4xl'] * tokens.lineHeight.tight,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: tokens.colors.arcane.anthracite,
    borderRadius: 6,
  },
  trendValue: {
    ...typography.caption,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: tokens.fontSize.xs,
  },
  trendLabel: {
    ...typography.caption,
    flex: 1,
    color: tokens.colors.gray[500],
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 6,
  },
});

export default StatCard;
