/**
 * ExtractedDataCard Component
 *
 * Displays and allows editing of extracted scouting data from voice transcription.
 * Features:
 * - Player information fields
 * - Ratings (technical, tactical, physical, mental)
 * - Strengths/weaknesses
 * - Summary
 * - Editable fields before report generation
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/config';
import type { ExtractedReportData, RecommendationType } from '../../types/voice-to-report';

interface ExtractedDataCardProps {
  data: ExtractedReportData;
  onChange?: (data: ExtractedReportData) => void;
  editable?: boolean;
}

export const ExtractedDataCard: React.FC<ExtractedDataCardProps> = ({
  data,
  onChange,
  editable = true,
}) => {
  const updateField = (field: keyof ExtractedReportData, value: any) => {
    if (onChange && editable) {
      onChange({ ...data, [field]: value });
    }
  };

  const RatingBar: React.FC<{ label: string; value?: number; color: string }> = ({
    label,
    value,
    color,
  }) => (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingBarContainer}>
        <View style={styles.ratingBarBackground}>
          <View
            style={[
              styles.ratingBarFill,
              {
                width: `${value || 0}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={styles.ratingValue}>{value || 0}</Text>
      </View>
    </View>
  );

  const InfoField: React.FC<{
    icon: string;
    label: string;
    value?: string | number;
    field: keyof ExtractedReportData;
  }> = ({ icon, label, value, field }) => (
    <View style={styles.infoField}>
      <View style={styles.infoHeader}>
        <Ionicons name={icon as any} size={16} color={COLORS.gray[600]} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      {editable ? (
        <TextInput
          style={styles.infoInput}
          value={String(value || '')}
          onChangeText={(text) => updateField(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.gray[500]}
        />
      ) : (
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color={COLORS.arcane.accent} />
        <Text style={styles.title}>Extracted Data</Text>
      </View>

      {/* Player Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Information</Text>

        <InfoField icon="person" label="Player Name" value={data.playerName} field="playerName" />
        <InfoField icon="shirt" label="Position" value={data.position} field="position" />
        <InfoField icon="trophy" label="Jersey Number" value={data.jerseyNumber} field="jerseyNumber" />
        <InfoField icon="shield" label="Team" value={data.team} field="team" />
      </View>

      {/* Match Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Details</Text>

        <InfoField icon="football" label="Opponent" value={data.opponent} field="opponent" />
        <InfoField icon="trophy-outline" label="Competition" value={data.competition} field="competition" />
        <InfoField icon="location" label="Venue" value={data.venue} field="venue" />
        <InfoField icon="calendar" label="Match Date" value={data.matchDate} field="matchDate" />
        <InfoField icon="time" label="Minutes Played" value={data.minutesPlayed} field="minutesPlayed" />
      </View>

      {/* Ratings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Ratings</Text>

        <RatingBar label="Technical" value={data.technicalRating} color={COLORS.info} />
        <RatingBar label="Tactical" value={data.tacticalRating} color={COLORS.warning} />
        <RatingBar label="Physical" value={data.physicalRating} color={COLORS.success} />
        <RatingBar label="Mental" value={data.mentalRating} color={COLORS.primary} />

        {data.overallRating !== undefined && (
          <View style={styles.overallRating}>
            <Text style={styles.overallLabel}>Overall Rating</Text>
            <Text style={styles.overallValue}>{data.overallRating}</Text>
          </View>
        )}
      </View>

      {/* Analysis Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis</Text>

        <View style={styles.textAreaField}>
          <Text style={styles.textAreaLabel}>Strengths</Text>
          {editable ? (
            <TextInput
              style={styles.textArea}
              value={data.strengths || ''}
              onChangeText={(text) => updateField('strengths', text)}
              placeholder="Enter player strengths"
              placeholderTextColor={COLORS.gray[500]}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.textAreaValue}>{data.strengths || 'N/A'}</Text>
          )}
        </View>

        <View style={styles.textAreaField}>
          <Text style={styles.textAreaLabel}>Weaknesses</Text>
          {editable ? (
            <TextInput
              style={styles.textArea}
              value={data.weaknesses || ''}
              onChangeText={(text) => updateField('weaknesses', text)}
              placeholder="Enter player weaknesses"
              placeholderTextColor={COLORS.gray[500]}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.textAreaValue}>{data.weaknesses || 'N/A'}</Text>
          )}
        </View>

        <View style={styles.textAreaField}>
          <Text style={styles.textAreaLabel}>Key Moments</Text>
          {editable ? (
            <TextInput
              style={styles.textArea}
              value={data.keyMoments || ''}
              onChangeText={(text) => updateField('keyMoments', text)}
              placeholder="Enter key moments"
              placeholderTextColor={COLORS.gray[500]}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.textAreaValue}>{data.keyMoments || 'N/A'}</Text>
          )}
        </View>

        <View style={styles.textAreaField}>
          <Text style={styles.textAreaLabel}>Observations</Text>
          {editable ? (
            <TextInput
              style={styles.textArea}
              value={data.observations || ''}
              onChangeText={(text) => updateField('observations', text)}
              placeholder="Enter general observations"
              placeholderTextColor={COLORS.gray[500]}
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.textAreaValue}>{data.observations || 'N/A'}</Text>
          )}
        </View>
      </View>

      {/* Tags Section */}
      {data.tags && data.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {data.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.arcane.darkAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.arcane.darkBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.arcane.darkBorder,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  section: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.arcane.darkBorder,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.arcane.accent,
    marginBottom: SPACING.md,
  },
  infoField: {
    marginBottom: SPACING.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  infoInput: {
    backgroundColor: COLORS.arcane.darkBorder,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[700],
  },
  ratingRow: {
    marginBottom: SPACING.md,
  },
  ratingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratingBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.arcane.darkBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
    width: 32,
  },
  overallRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.arcane.darkBorder,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  overallLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  overallValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.arcane.accent,
  },
  textAreaField: {
    marginBottom: SPACING.md,
  },
  textAreaLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  textArea: {
    backgroundColor: COLORS.arcane.darkBorder,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.arcane.darkBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.arcane.accent,
  },
});

export default ExtractedDataCard;
