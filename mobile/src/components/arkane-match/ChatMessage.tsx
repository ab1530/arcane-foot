import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { ChatMessage as ChatMessageType } from '../../types/arkane-match';
import { ScoutMiniCard } from './ScoutMiniCard';

interface ChatMessageProps {
  message: ChatMessageType;
  onScoutPress?: (scoutId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onScoutPress }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isUser ? styles.containerRight : styles.containerLeft]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {/* Message Content */}
        <Text style={[styles.content, isUser && styles.contentUser]}>{message.content}</Text>

        {/* Scout Results (only for AI messages) */}
        {!isUser && message.scouts && message.scouts.length > 0 && (
          <View style={styles.scoutsContainer}>
            {message.scouts.map((scout) => (
              <ScoutMiniCard
                key={scout.id}
                scout={scout}
                onPress={() => onScoutPress?.(scout.id)}
              />
            ))}
          </View>
        )}

        {/* Suggestions (only for AI messages) */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {message.suggestions.slice(0, 3).map((suggestion, index) => (
              <View key={index} style={styles.suggestionChip}>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {suggestion}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.brand.primary,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface.glassMedium,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  content: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  contentUser: {
    color: colors.background.primary,
    fontWeight: typography.weights.medium,
  },
  scoutsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  suggestionsContainer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestionChip: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: '100%',
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  timestamp: {
    fontSize: typography.sizes.xxs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  timestampUser: {
    color: colors.background.secondary,
  },
});
