"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AvailabilitySlot } from "@/lib/api/coaching";
import { Skeleton } from "@/components/ui/skeleton";

export interface BookingCalendarProps {
  coachId: string;
  availability: AvailabilitySlot[];
  onSlotSelect: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot;
  isLoading?: boolean;
  className?: string;
}

/**
 * BookingCalendar Component
 * Displays coach availability in a weekly calendar view
 * Features:
 * - 7-day weekly view
 * - Time slots displayed as grid
 * - Color coding: Available (green), Booked (gray), Selected (yellow)
 * - Previous/Next week navigation
 * - Hover effects on available slots
 * - Responsive (stacks on mobile)
 */
export function BookingCalendar({
  coachId,
  availability,
  onSlotSelect,
  selectedSlot,
  isLoading = false,
  className,
}: BookingCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Generate 7 days starting from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Group availability by day and time
  const slotsByDay = weekDays.map((day) => {
    const daySlots = availability.filter((slot) => {
      const slotDate = parseISO(slot.start);
      return isSameDay(slotDate, day);
    });

    // Sort by time
    return daySlots.sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  });

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isSlotSelected = (slot: AvailabilitySlot) => {
    return selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
  };

  if (isLoading) {
    return <BookingCalendarSkeleton className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-arcane-accent" />
            <CardTitle className="text-lg">Select Time</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-sm font-bold text-white">
            {format(weekDays[0], "MMM dd")} - {format(weekDays[6], "MMM dd, yyyy")}
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Desktop: Grid view */}
        <div className="hidden md:grid md:grid-cols-7 gap-2">
          {weekDays.map((day, dayIndex) => (
            <div key={day.toISOString()} className="space-y-2">
              {/* Day header */}
              <div className="text-center p-2 bg-arcane-darkBorder/30 rounded-lg">
                <div className="text-xs font-bold text-arcane-grey uppercase">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-bold mt-1",
                    isSameDay(day, new Date()) ? "text-arcane-accent" : "text-white"
                  )}
                >
                  {format(day, "dd")}
                </div>
              </div>

              {/* Time slots */}
              <div className="space-y-1">
                {slotsByDay[dayIndex].map((slot) => (
                  <TimeSlot
                    key={`${slot.start}-${slot.end}`}
                    slot={slot}
                    selected={isSlotSelected(slot)}
                    onSelect={() => slot.available && !slot.booked && onSlotSelect(slot)}
                  />
                ))}

                {slotsByDay[dayIndex].length === 0 && (
                  <div className="p-3 text-center text-xs text-arcane-grey">
                    No slots
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: List view */}
        <div className="md:hidden space-y-4">
          {weekDays.map((day, dayIndex) => (
            <div key={day.toISOString()}>
              {/* Day header */}
              <div className="flex items-center gap-2 mb-2 p-2 bg-arcane-darkBorder/30 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">
                    {format(day, "EEEE, MMM dd")}
                  </div>
                </div>
                {isSameDay(day, new Date()) && (
                  <span className="px-2 py-0.5 bg-arcane-accent text-arcane-dark rounded text-xs font-bold">
                    Today
                  </span>
                )}
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 gap-2">
                {slotsByDay[dayIndex].map((slot) => (
                  <TimeSlot
                    key={`${slot.start}-${slot.end}`}
                    slot={slot}
                    selected={isSlotSelected(slot)}
                    onSelect={() => slot.available && !slot.booked && onSlotSelect(slot)}
                    mobile
                  />
                ))}

                {slotsByDay[dayIndex].length === 0 && (
                  <div className="col-span-2 p-4 text-center text-sm text-arcane-grey">
                    No available slots
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-arcane-darkBorder/50 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
            <span className="text-arcane-grey">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-arcane-accent border border-arcane-accent" />
            <span className="text-arcane-grey">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-arcane-darkBorder" />
            <span className="text-arcane-grey">Booked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * TimeSlot Component
 */
interface TimeSlotProps {
  slot: AvailabilitySlot;
  selected: boolean;
  onSelect: () => void;
  mobile?: boolean;
}

function TimeSlot({ slot, selected, onSelect, mobile = false }: TimeSlotProps) {
  const startTime = format(parseISO(slot.start), "HH:mm");
  const isAvailable = slot.available && !slot.booked;

  return (
    <motion.button
      whileHover={isAvailable ? { scale: 1.05 } : {}}
      whileTap={isAvailable ? { scale: 0.95 } : {}}
      onClick={onSelect}
      disabled={!isAvailable}
      className={cn(
        "w-full p-2 rounded-lg text-xs font-bold transition-all",
        "flex items-center justify-center gap-1",
        mobile && "p-3 text-sm",
        selected && "bg-arcane-accent text-arcane-dark ring-2 ring-arcane-accent",
        !selected && isAvailable && "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30",
        !selected && !isAvailable && "bg-arcane-darkBorder/50 text-arcane-grey/50 cursor-not-allowed",
      )}
    >
      <Clock className={cn("h-3 w-3", mobile && "h-4 w-4")} />
      <span>{startTime}</span>
      {selected && <CheckCircle className={cn("h-3 w-3", mobile && "h-4 w-4")} />}
      {!isAvailable && <XCircle className={cn("h-3 w-3", mobile && "h-4 w-4")} />}
    </motion.button>
  );
}

/**
 * BookingCalendar Skeleton for loading states
 */
export function BookingCalendarSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
