export type ProfileContentStatus = 'DRAFT' | 'VERIFIED' | 'PUBLISHED' | 'ARCHIVED';

export type ProfileSectionKey =
  | 'performance-rows'
  | 'transfers'
  | 'career'
  | 'achievements'
  | 'national-team'
  | 'news'
  | 'rumours';

export interface SourceMeta {
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | Date | null;
  status?: ProfileContentStatus | null;
  verifiedAt?: string | Date | null;
  publishedAt?: string | Date | null;
}

export interface PlayerProfileView {
  playerId: string;
  identity: {
    firstName?: string | null;
    lastName?: string | null;
    fullName: string;
    age?: number | null;
    nationality?: string | null;
    club?: {
      id?: string;
      name?: string;
      logo?: string | null;
      country?: string | null;
    } | null;
    positions: {
      main?: string | null;
      other?: string[];
    };
    physical: {
      height?: number | null;
      weight?: number | null;
      preferredFoot?: string | null;
    };
    profile: {
      avatar?: string | null;
      pronunciation?: string | null;
      agentName?: string | null;
      outfitter?: string | null;
      socialLinks?: Record<string, string | null> | null;
    };
  };
  market: {
    currentValue?: number | null;
    highestValue?: number | null;
    contractUntil?: string | Date | null;
    preferredFoot?: string | null;
    externalMarketUrl?: string | null;
    latestValuationAt?: string | Date | null;
    valuationModelVersion?: string | null;
  };
  performance: {
    competitionRows: Array<{
      id: string;
      season?: string | null;
      competitionName: string;
      competitionLogoUrl?: string | null;
      possibleGames?: number | null;
      appearances?: number | null;
      goals?: number | null;
      assists?: number | null;
      yellowCards?: number | null;
      secondYellowCards?: number | null;
      redCards?: number | null;
      startingXIPercent?: number | null;
      minutesPercent?: number | null;
      goalParticipationPercent?: number | null;
      sourceMeta?: SourceMeta;
      updatedAt?: string | Date | null;
    }>;
    statsFallback: Record<string, number>;
  };
  scouting: {
    averageRating?: number | null;
    totalReports: number;
    recommendation?: string | null;
    strengthsTop: string[];
    weaknessesTop: string[];
    lastReportAt?: string | Date | null;
    ratingBreakdown?: {
      technical?: number | null;
      tactical?: number | null;
      physical?: number | null;
      mental?: number | null;
    };
  };
  hardware: {
    totalSessions: number;
    totalDistanceKm?: number | null;
    sprintDistanceKm?: number | null;
    maxSpeedKmh?: number | null;
    averageLoad?: number | null;
    lastSyncedAt?: string | Date | null;
    deviceCount: number;
    recentSessions: Array<{
      id: string;
      source?: string | null;
      type?: string | null;
      startedAt?: string | Date | null;
      endedAt?: string | Date | null;
      movementDistanceM?: number | null;
      sprintDistanceM?: number | null;
      maxSpeedKmh?: number | null;
    }>;
  };
  transfers: Array<{
    id: string;
    season?: string | null;
    transferDate?: string | Date | null;
    fromClubName?: string | null;
    toClubName: string;
    marketValueAtTime?: number | null;
    feeAmount?: number | null;
    feeCurrency?: string | null;
    transferType?: string | null;
    notes?: string | null;
    sourceMeta?: SourceMeta;
    updatedAt?: string | Date | null;
  }>;
  career: Array<{
    id: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    clubName: string;
    teamLevel: 'YOUTH' | 'SENIOR' | 'NATIONAL';
    isLoan: boolean;
    sourceMeta?: SourceMeta;
    updatedAt?: string | Date | null;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    competition?: string | null;
    season?: string | null;
    count: number;
    description?: string | null;
    sourceMeta?: SourceMeta;
    updatedAt?: string | Date | null;
  }>;
  nationalTeam: Array<{
    id: string;
    country: string;
    teamLevel: 'U17' | 'U19' | 'U21' | 'A';
    caps?: number | null;
    goals?: number | null;
    fromDate?: string | Date | null;
    toDate?: string | Date | null;
    isCurrent: boolean;
    sourceMeta?: SourceMeta;
    updatedAt?: string | Date | null;
  }>;
  news: Array<{
    id: string;
    headline: string;
    summary?: string | null;
    publishedAtSource?: string | Date | null;
    sourceMeta?: SourceMeta;
    updatedAt?: string | Date | null;
  }>;
  rumours: Array<{
    id: string;
    headline: string;
    summary?: string | null;
    destinationClub?: string | null;
    probabilityPercent?: number | null;
    sourceMeta?: SourceMeta;
    updatedAt?: string | Date | null;
  }>;
  emptyStateFlags: {
    performance: boolean;
    transfers: boolean;
    career: boolean;
    achievements: boolean;
    nationalTeam: boolean;
    news: boolean;
    rumours: boolean;
    scouting: boolean;
    hardware: boolean;
  };
  lastUpdatedAt?: string | Date | null;
}

export interface PlayerProfileAuditSectionItem {
  id: string;
  contentStatus: ProfileContentStatus;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | Date | null;
  verifiedAt?: string | Date | null;
  publishedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  createdById?: string;
  updatedById?: string;
  verifiedById?: string | null;
}

export interface PlayerProfileAuditTrail {
  playerId: string;
  sections: {
    performanceRows: PlayerProfileAuditSectionItem[];
    transfers: PlayerProfileAuditSectionItem[];
    career: PlayerProfileAuditSectionItem[];
    achievements: PlayerProfileAuditSectionItem[];
    nationalTeam: PlayerProfileAuditSectionItem[];
    news: PlayerProfileAuditSectionItem[];
    rumours: PlayerProfileAuditSectionItem[];
  };
}

export interface PlayerMediaItem {
  id: string;
  type: string;
  url: string;
  playbackUrl?: string;
  playbackExpiresAt?: string | Date | null;
  filename?: string | null;
  mimeType?: string | null;
  size?: number | null;
  duration?: number | null;
  uploadedAt?: string | Date | null;
  playerId?: string | null;
}
