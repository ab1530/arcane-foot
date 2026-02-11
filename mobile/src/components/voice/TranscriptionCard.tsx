/**
 * TranscriptionCard Component
 *
 * Displays transcribed text from voice recording.
 * Features:
 * - Scrollable text display
 * - Copy to clipboard button
 * - Language indicator
 * - Character count
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/config';

interface TranscriptionCardProps {
  transcription: string;
  language: string;
  confidence?: number;
}

export const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  transcription,
  language,
  confidence,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(transcription);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy text to clipboard');
    }
  };

  const getLanguageName = (code: string): string => {
    const languages: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text" size={20} color={COLORS.arcane.accent} />
          <Text style={styles.title}>Transcription</Text>
        </View>

        <View style={styles.headerRight}>
          {confidence !== undefined && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(confidence)}%
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copied ? COLORS.success : COLORS.gray[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.transcriptionText}>
          {transcription}
        </Text>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.languageBadge}>
          <Ionicons name="language" size={14} color={COLORS.gray[600]} />
          <Text style={styles.languageText}>
            {getLanguageName(language)}
          </Text>
        </View>

        <Text style={styles.charCount}>
          {transcription.length} characters
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.arcane.darkAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.arcane.darkBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.arcane.darkBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  confidenceBadge: {
    backgroundColor: COLORS.arcane.darkBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.arcane.accent,
  },
  copyButton: {
    padding: SPACING.xs,
  },
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  transcriptionText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
    color: COLORS.gray[700],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.arcane.darkBorder,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  languageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  charCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
});

export default TranscriptionCard;
