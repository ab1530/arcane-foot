import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Icon } from '../../../components/ui';
import { RatingSlider, SimilarReportCard } from '../../../components/smart-scout';
import { colors, spacing, typography, radius } from '../../../design/theme';
import { smartScoutApi } from '../../../services/api/smart-scout';
import type { PartialReport, SimilarReport } from '../../../types/smart-scout';
import { POSITIONS } from '../../../types/smart-scout';
import Toast from 'react-native-toast-message';

export const SuggestionsTab: React.FC = () => {
  const [partialReport, setPartialReport] = useState<PartialReport>({
    playerPosition: POSITIONS[0],
    technicalRating: 50,
    tacticalRating: 50,
    physicalRating: 50,
    mentalRating: 50,
    strengths: '',
    weaknesses: '',
  });

  const [similarReports, setSimilarReports] = useState<SimilarReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFindSimilar = async () => {
    try {
      setIsLoading(true);
      const response = await smartScoutApi.getSuggestions(partialReport);
      setSimilarReports(response.similarReports);
      setHasSearched(true);

      if (response.similarReports.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Similar Reports',
          text2: 'Try adjusting your criteria',
        });
      }
    } catch (error) {
      console.error('Error fetching similar reports:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch similar reports',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportPress = (reportId: string) => {
    // Navigate to report details
    console.log('View report:', reportId);
    Toast.show({
      type: 'info',
      text1: 'Report Details',
      text2: `Report ID: ${reportId}`,
    });
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.emptyText}>Finding similar reports...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Icon name="search" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>Enter report details above</Text>
          <Text style={styles.emptySubtext}>
            Then tap "Find Similar" to discover matching reports
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Icon name="documentOutline" size={64} color={colors.text.secondary} />
        <Text style={styles.emptyText}>No similar reports found</Text>
        <Text style={styles.emptySubtext}>
          Try adjusting your criteria
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Section */}
        <GlassCard variant="bordered" style={styles.formCard}>
          <Text style={styles.sectionTitle}>Report Criteria</Text>

          {/* Position Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Position</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={partialReport.playerPosition}
                onValueChange={(value) =>
                  setPartialReport({ ...partialReport, playerPosition: value })
                }
                style={styles.picker}
                dropdownIconColor={colors.text.primary}
              >
                {POSITIONS.map((pos) => (
                  <Picker.Item key={pos} label={pos} value={pos} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Rating Sliders */}
          <RatingSlider
            label="Technical Rating"
            value={partialReport.technicalRating || 50}
            onValueChange={(value) =>
              setPartialReport({ ...partialReport, technicalRating: value })
            }
          />
          <RatingSlider
            label="Tactical Rating"
            value={partialReport.tacticalRating || 50}
            onValueChange={(value) =>
              setPartialReport({ ...partialReport, tacticalRating: value })
            }
          />
          <RatingSlider
            label="Physical Rating"
            value={partialReport.physicalRating || 50}
            onValueChange={(value) =>
              setPartialReport({ ...partialReport, physicalRating: value })
            }
          />
          <RatingSlider
            label="Mental Rating"
            value={partialReport.mentalRating || 50}
            onValueChange={(value) =>
              setPartialReport({ ...partialReport, mentalRating: value })
            }
          />

          {/* Find Similar Button */}
          <TouchableOpacity
            style={[styles.findButton, isLoading && styles.findButtonDisabled]}
            onPress={handleFindSimilar}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background.primary} />
            ) : (
              <>
                <Icon name="search" size={20} color={colors.background.primary} />
                <Text style={styles.findButtonText}>Find Similar Reports</Text>
              </>
            )}
          </TouchableOpacity>
        </GlassCard>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>
            Similar Reports
            {similarReports.length > 0 && (
              <Text style={styles.resultsCount}> ({similarReports.length})</Text>
            )}
          </Text>

          {similarReports.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.reportsList}>
              {similarReports.map((report) => (
                <SimilarReportCard
                  key={report.reportId}
                  report={report}
                  onPress={() => handleReportPress(report.reportId)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text.primary,
    height: 50,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  findButtonDisabled: {
    opacity: 0.6,
  },
  findButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  resultsSection: {
    marginBottom: spacing.xl,
  },
  resultsCount: {
    color: colors.text.secondary,
  },
  reportsList: {
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
