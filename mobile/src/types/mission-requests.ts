export type MissionRequestStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type MissionType = 'PRIORITY' | 'VOLUNTARY';

export interface MissionRequestListItem {
  id: string;
  status: MissionRequestStatus;
  missionType: MissionType;
  note?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string | null;
  matchId: string;
  match?: {
    id: string;
    scheduledAt?: string | null;
    homeClub?: { id?: string; name?: string; logo?: string | null } | null;
    awayClub?: { id?: string; name?: string; logo?: string | null } | null;
  } | null;
  requestedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  targetScout?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
}

export interface MissionRequestFilters {
  status: MissionRequestStatus | 'ALL';
  missionType: MissionType | 'ALL';
  scoutId: string | 'ALL';
  matchId: string | 'ALL';
  fromDate?: string;
  toDate?: string;
}

export interface MissionRequestCreateInput {
  matchId: string;
  missionType: MissionType;
  targetScoutId?: string;
  note?: string;
}
