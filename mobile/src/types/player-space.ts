export type PlayerSpaceHealthStatus = 'NORMAL' | 'FATIGUE' | 'INJURY';

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
}
