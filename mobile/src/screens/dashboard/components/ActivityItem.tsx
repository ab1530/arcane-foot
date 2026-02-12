/**
 * ARCANE ACTIVITY ITEM
 * Activity list item with icon, title, description, and timestamp
 *
 * Features:
 * - Icon with colored background
 * - Title and description
 * - Timestamp
 * - Separator line
 * - Touch feedback
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

export interface ActivityItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  description?: string;
  timestamp: string;
  onPress?: () => void;
  showSeparator?: boolean;
  style?: ViewStyle;
  testID?: string;
}

// ============================================================================
// ACTIVITY ITEM COMPONENT
// ============================================================================

export const ActivityItem: React.FC<ActivityItemProps> = ({
  icon,
  iconColor = tokens.colors.yellow.DEFAULT,
  title,
  description,
  timestamp,
  onPress,
  showSeparator = true,
  style,
  testID,
}) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const content = (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon} size={tokens.iconSize.sm} color={iconColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>

        {/* Chevron (if pressable) */}
        {onPress && (
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={tokens.iconSize.sm}
              color={tokens.colors.gray[500]}
            />
          </View>
        )}
      </View>

      {/* Separator */}
      {showSeparator && <View style={styles.separator} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${timestamp}`}
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
  container: {
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyBase,
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.gray[100],
  },
  description: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
    lineHeight: tokens.fontSize.sm * 1.4,
  },
  timestamp: {
    ...typography.caption,
    color: tokens.colors.gray[500],
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: tokens.colors.arcane.slate + '40',
    marginTop: 12,
    marginLeft: 40 + 12, // Align with text
  },
});

export default ActivityItem;
