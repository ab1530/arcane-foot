export type PlayerSpaceHealthStatus = 'NORMAL' | 'FATIGUE' | 'INJURY';
export type PlayerMatchAvailability = 'PLAYING' | 'BENCH' | 'INJURED' | 'ABSENT';
export type PlayerDailyActivityType = 'NONE' | 'TRAINING' | 'MATCH' | 'BOTH' | 'PERSONAL' | 'REST';

export interface PlayerDailyTimelineEntry {
  dayKey: string;
  activityType: PlayerDailyActivityType;
  linkedMatchId?: string | null;
  braceletSynced?: boolean | null;
  gpsDistanceM?: number | null;
  matchAvailability?: string | null;
  matchStats?: string | null;
  videoUploaded?: boolean | null;
  notes?: string | null;
}

export interface PlayerSpacePlayerProfile {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  position: string;
  nationality: string;
  clubId?: string | null;
  clubName?: string | null;
  photoUrl?: string | null;
}

export interface PlayerSpaceSnapshot {
  matchesPlayed: number;
  matchesNotPlayed: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  isInjured: boolean;
  injuryStatus: string | null;
}

export interface PlayerSpaceTrendPoint {
  period: string;
  rating: number | null;
  minutes: number | null;
}

export interface PlayerSpaceCalendarItem {
  id: string;
  scheduledAt: string;
  opponent: string;
  opponentLogo: string | null;
  isHome: boolean;
  status: string | null;
  competition: string | null;
}

export interface PlayerSpaceHealth {
  status: string;
  lastDeviceSync: string | null;
  syncSource: string | null;
}

export interface PlayerSpaceWeeklyRecord {
  weekStartDate: string;
  submittedAt: string;
  updatedBy: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
  matchesNotPlayed: number;
  isInjured: boolean;
  healthStatus: PlayerSpaceHealthStatus;
  remarks?: string | null;
  selectedMatchId?: string | null;
  selectedMatchAvailability?: PlayerMatchAvailability;
  selectedMatchTeamScore?: number | null;
  selectedMatchOpponentScore?: number | null;
  selectedMatchRating?: number | null;
  highlightsUploaded?: number | null;
  gpsSyncConfirmed?: boolean | null;
  dailyTimeline?: PlayerDailyTimelineEntry[] | null;
  trackerSteps?: number | null;
  trackerDistanceM?: number | null;
  trackerSource?: string | null;
  linkedEventId?: string | null;
}

export interface PlayerSpaceNewsItem {
  id: string;
  headline: string;
  summary: string | null;
  sourceName: string;
  publishedAt: string | null;
}

export interface PlayerSpacePayload {
  playerId: string;
  player: PlayerSpacePlayerProfile;
  snapshot: PlayerSpaceSnapshot;
  performanceTrend: PlayerSpaceTrendPoint[];
  upcomingCalendar: PlayerSpaceCalendarItem[];
  health: PlayerSpaceHealth;
  weekly: {
    latest: PlayerSpaceWeeklyRecord | null;
    totalUpdates: number;
  };
  news: PlayerSpaceNewsItem[];
  generatedAt: string;
}

export interface PlayerSpaceSubmitPayload {
  weekStartDate?: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
  matchesNotPlayed: number;
  isInjured: boolean;
  healthStatus?: PlayerSpaceHealthStatus;
  remarks?: string;
  selectedMatchId?: string;
  selectedMatchAvailability?: PlayerMatchAvailability;
  selectedMatchTeamScore?: number;
  selectedMatchOpponentScore?: number;
  selectedMatchRating?: number;
  highlightsUploaded?: number;
  gpsSyncConfirmed?: boolean;
  dailyTimeline?: PlayerDailyTimelineEntry[];
  trackerSteps?: number;
  trackerDistanceM?: number;
  trackerSource?: string;
}
