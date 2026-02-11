/**
 * AVAILABILITY CALENDAR COMPONENT
 * Weekly mini calendar showing coach availability
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from '../../../utils/date';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface AvailabilitySlot {
  id: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  booked?: boolean;
}

export interface AvailabilityCalendarProps {
  coachId: string;
  availability: AvailabilitySlot[];
  onSlotSelect: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot;
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  coachId,
  availability,
  onSlotSelect,
  selectedSlot,
  style,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleDayPress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Find slots for this date
    const slotsForDate = availability.filter((slot) =>
      isSameDay(parseISO(slot.date), date)
    );

    // Select first available slot
    const availableSlot = slotsForDate.find((slot) => slot.available && !slot.booked);
    if (availableSlot) {
      onSlotSelect(availableSlot);
    }
  };

  const hasAvailableSlots = (date: Date) => {
    return availability.some(
      (slot) =>
        isSameDay(parseISO(slot.date), date) &&
        slot.available &&
        !slot.booked
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedSlot) return false;
    return isSameDay(parseISO(selectedSlot.date), date);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Week Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={handlePrevWeek}>
          <ChevronLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {format(currentWeekStart, 'MMMM yyyy')}
        </Text>

        <TouchableOpacity style={styles.navButton} onPress={handleNextWeek}>
          <ChevronRight size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysContainer}
        contentContainerStyle={styles.daysContent}
      >
        {weekDays.map((day, index) => {
          const hasSlots = hasAvailableSlots(day);
          const selected = isSelected(day);
          const isToday = isSameDay(day, new Date());

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selected && styles.selectedDay,
                isToday && !selected && styles.todayDay,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={!hasSlots}
            >
              <Text
                style={[
                  styles.dayName,
                  selected && styles.selectedDayText,
                  !hasSlots && styles.disabledDayText,
                ]}
              >
                {format(day, 'EEE')}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  selected && styles.selectedDayText,
                  !hasSlots && styles.disabledDayText,
                ]}
              >
                {format(day, 'd')}
              </Text>

              {/* Availability Dot */}
              {hasSlots && !selected && (
                <View style={styles.availableDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: tokens.colors.semantic.success }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: tokens.colors.yellow.DEFAULT }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    ...typography.heading5,
  },
  daysContainer: {
    marginBottom: 12,
  },
  daysContent: {
    gap: 8,
  },
  dayButton: {
    width: 60,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: tokens.colors.arcane.anthracite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
    ...tokens.shadows.glowYellow,
  },
  todayDay: {
    borderColor: tokens.colors.yellow.DEFAULT,
    borderWidth: 2,
  },
  dayName: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumber: {
    ...typography.heading5,
    color: tokens.colors.text.primary,
  },
  selectedDayText: {
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
  disabledDayText: {
    color: tokens.colors.gray[600],
  },
  availableDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: tokens.colors.semantic.success,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.surface.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  legendText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
});
