import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design/theme';
import { Button } from '../../components/ui';
import type { SearchListingsFilters } from '../../types/marketplace';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchListingsFilters) => void;
  initialFilters?: SearchListingsFilters;
}

const LEAGUES = [
  'Premier League',
  'La Liga',
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'Eredivisie',
  'Primeira Liga',
  'Scottish Premiership',
];

const POSITIONS = [
  'GK',
  'CB',
  'LB',
  'RB',
  'CDM',
  'CM',
  'CAM',
  'LW',
  'RW',
  'ST',
];

const AGE_GROUPS = ['U17', 'U19', 'U21', 'U23', 'SENIOR'];

const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [leagues, setLeagues] = useState<string[]>(initialFilters.leagues || []);
  const [positions, setPositions] = useState<string[]>(initialFilters.positions || []);
  const [ageGroup, setAgeGroup] = useState<string | undefined>(initialFilters.ageGroup);
  const [maxBudget, setMaxBudget] = useState<number>(initialFilters.maxBudget || 300);
  const [minRating, setMinRating] = useState<number>(initialFilters.minRating || 0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(
    initialFilters.verifiedOnly || false
  );

  const toggleLeague = useCallback((league: string) => {
    setLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    );
  }, []);

  const togglePosition = useCallback((position: string) => {
    setPositions((prev) =>
      prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position]
    );
  }, []);

  const handleReset = useCallback(() => {
    setLeagues([]);
    setPositions([]);
    setAgeGroup(undefined);
    setMaxBudget(300);
    setMinRating(0);
    setVerifiedOnly(false);
  }, []);

  const handleApply = useCallback(() => {
    const filters: SearchListingsFilters = {
      leagues: leagues.length > 0 ? leagues : undefined,
      positions: positions.length > 0 ? positions : undefined,
      ageGroup: ageGroup,
      maxBudget: maxBudget < 300 ? maxBudget : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      verifiedOnly: verifiedOnly || undefined,
    };
    onApply(filters);
    onClose();
  }, [leagues, positions, ageGroup, maxBudget, minRating, verifiedOnly, onApply, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Scouts</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Leagues */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leagues</Text>
              <View style={styles.chipContainer}>
                {LEAGUES.map((league) => (
                  <TouchableOpacity
                    key={league}
                    onPress={() => toggleLeague(league)}
                    style={[
                      styles.chip,
                      leagues.includes(league) && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        leagues.includes(league) && styles.chipTextSelected,
                      ]}
                    >
                      {league}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Positions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Positions</Text>
              <View style={styles.chipContainer}>
                {POSITIONS.map((position) => (
                  <TouchableOpacity
                    key={position}
                    onPress={() => togglePosition(position)}
                    style={[
                      styles.chip,
                      positions.includes(position) && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        positions.includes(position) && styles.chipTextSelected,
                      ]}
                    >
                      {position}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Age Groups */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Age Group</Text>
              <View style={styles.chipContainer}>
                {AGE_GROUPS.map((group) => (
                  <TouchableOpacity
                    key={group}
                    onPress={() => setAgeGroup(ageGroup === group ? undefined : group)}
                    style={[
                      styles.chip,
                      ageGroup === group && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        ageGroup === group && styles.chipTextSelected,
                      ]}
                    >
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Budget */}
            <View style={styles.section}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sectionTitle}>Max Budget (per hour)</Text>
                <Text style={styles.sliderValue}>€{maxBudget}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={300}
                step={10}
                value={maxBudget}
                onValueChange={setMaxBudget}
                minimumTrackTintColor={colors.brand.primary}
                maximumTrackTintColor={colors.surface.border}
                thumbTintColor={colors.brand.primary}
              />
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sectionTitle}>Minimum Rating</Text>
                <Text style={styles.sliderValue}>{minRating.toFixed(1)} ★</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={5}
                step={0.5}
                value={minRating}
                onValueChange={setMinRating}
                minimumTrackTintColor={colors.semantic.warning}
                maximumTrackTintColor={colors.surface.border}
                thumbTintColor={colors.semantic.warning}
              />
            </View>

            {/* Verified Only */}
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => setVerifiedOnly(!verifiedOnly)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, verifiedOnly && styles.checkboxSelected]}>
                  {verifiedOnly && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Verified scouts only</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Button
              variant="ghost"
              onPress={handleReset}
              style={styles.resetButton}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onPress={handleApply}
              style={styles.applyButton}
            >
              Apply Filters
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  title: {
    fontSize: typography.sizes.h4,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semiBold,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: 'rgba(228, 255, 59, 0.12)',
    borderColor: colors.brand.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.brand.primary,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderValue: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.brand.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(228, 255, 59, 0.12)',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.brand.primary,
  },
  checkboxLabel: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});

export default FilterBottomSheet;
