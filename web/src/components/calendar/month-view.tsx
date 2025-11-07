"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { MatchDetailModal } from "./match-detail-modal";

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

interface Scout {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

type MatchStatus = "SCHEDULED" | "CONFIRMED" | "LIVE" | "COMPLETED" | "CANCELLED";

interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  scheduledAt: string;
  venueOld?: string;
  competitionOld?: string;
  season: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  scoutId?: string | null;
  notes?: string | null;
  homeClub: Club;
  awayClub: Club;
  scout?: Scout | null;
  _count?: {
    scoutingReports: number;
  };
}

interface MonthViewProps {
  matches: Match[];
  onRefresh?: () => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function MonthView({ matches, onRefresh }: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<Match[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // We want Monday to be first (0), so adjust
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes 6

    // Days from previous month to show
    const prevMonthDays: Date[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      prevMonthDays.push(date);
    }

    // Days in current month
    const currentMonthDays: Date[] = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      currentMonthDays.push(new Date(year, month, i));
    }

    // Days from next month to complete grid
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays: Date[] = [];
    const daysNeeded = Math.ceil(totalDays / 7) * 7 - totalDays;
    for (let i = 1; i <= daysNeeded; i++) {
      nextMonthDays.push(new Date(year, month + 1, i));
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Get matches for a specific date
  const getMatchesForDate = (date: Date): Match[] => {
    return matches.filter(match => {
      const matchDate = new Date(match.scheduledAt);
      return matchDate.getDate() === date.getDate() &&
             matchDate.getMonth() === date.getMonth() &&
             matchDate.getFullYear() === date.getFullYear();
    });
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day click
  const handleDayClick = (date: Date, dayMatches: Match[]) => {
    if (dayMatches.length > 0) {
      setSelectedDate(date);
      setSelectedMatches(dayMatches);
      setShowMatchModal(true);
    }
  };

  // Get status color
  const getStatusColor = (status: MatchStatus): string => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500";
      case "SCHEDULED":
        return "bg-yellow-500";
      case "LIVE":
        return "bg-red-500";
      case "COMPLETED":
        return "bg-arcane-accent";
      case "CANCELLED":
        return "bg-gray-500";
      default:
        return "bg-arcane-accent";
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToPreviousMonth}
              className="p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={goToNextMonth}
              className="p-2"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Aujourd'hui
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-bold text-arcane-grey uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dayMatches = getMatchesForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDay = isToday(date);
            const hasMatches = dayMatches.length > 0;

            return (
              <motion.button
                key={`${date.toISOString()}-${index}`}
                onClick={() => handleDayClick(date, dayMatches)}
                disabled={!hasMatches}
                className={`
                  relative aspect-square p-2 rounded-lg border transition-all
                  ${isTodayDay
                    ? 'border-arcane-accent bg-arcane-accent/10'
                    : 'border-arcane-darkBorder/30 hover:border-arcane-darkBorder'
                  }
                  ${!isCurrentMonthDay ? 'opacity-30' : 'opacity-100'}
                  ${hasMatches ? 'cursor-pointer hover:bg-arcane-darkBorder/20' : 'cursor-default'}
                `}
                whileHover={hasMatches ? { scale: 1.05 } : {}}
                whileTap={hasMatches ? { scale: 0.98 } : {}}
              >
                {/* Day Number */}
                <div className={`
                  text-sm font-bold
                  ${isTodayDay ? 'text-arcane-accent' : 'text-white'}
                  ${!isCurrentMonthDay ? 'text-arcane-grey' : ''}
                `}>
                  {date.getDate()}
                </div>

                {/* Match Indicators */}
                {hasMatches && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-wrap gap-1 justify-center max-w-full px-1">
                    {dayMatches.slice(0, 3).map((match, idx) => (
                      <div
                        key={match.id}
                        className={`w-1.5 h-1.5 rounded-full ${getStatusColor(match.status)}`}
                        title={`${match.homeClub.name} vs ${match.awayClub.name}`}
                      />
                    ))}
                    {dayMatches.length > 3 && (
                      <div className="text-[10px] font-bold text-arcane-accent">
                        +{dayMatches.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Match Count Badge */}
                {hasMatches && dayMatches.length > 0 && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 rounded-full bg-arcane-accent text-arcane-dark text-[10px] font-bold flex items-center justify-center">
                      {dayMatches.length}
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-arcane-darkBorder/30">
          <div className="flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-arcane-grey">Prévu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-arcane-grey">Confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-arcane-grey">En Direct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-arcane-accent" />
              <span className="text-arcane-grey">Terminé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-arcane-grey">Annulé</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Match Detail Modal */}
      {selectedDate && (
        <MatchDetailModal
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            setSelectedDate(null);
            setSelectedMatches([]);
          }}
          date={selectedDate}
          matches={selectedMatches}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
