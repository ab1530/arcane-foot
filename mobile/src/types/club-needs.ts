export type ClubNeedsViewMode = 'REQUESTS' | 'ADVANCED';

export type ClubNeedLeagueFilter = 'ALL' | 'LIGUE_1' | 'BUNDESLIGA' | 'SERIE_A' | 'LALIGA';

export interface ClubNeedLeagueChip {
  key: ClubNeedLeagueFilter;
  label: string;
  countries: string[];
  accentColor: string;
}

export interface ClubNeedDemandCard {
  id: string;
  requestId?: string | null;
  lineNumber?: number | null;
  sortDate: number;
  league: ClubNeedLeagueFilter;
  clubName: string;
  clubLogo?: string | null;
  requestDateLabel: string;
  criteriaLines: string[];
  progressLabel: string;
  completionLabel: string;
  statusLabel: string;
  statusColor: string;
}
