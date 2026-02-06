export interface PlayerStats {
  basic: {
    name: string;
    age: number;
    position: string;
    nationality: string;
    club?: string;
  };
  career: {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
  };
  recent: {
    last5Matches: MatchSummary[];
    recentForm: string;
  };
  ratings: {
    avgTechnical: number;
    avgTactical: number;
    avgPhysical: number;
    avgMental: number;
  };
  physical: {
    height?: number;
    weight?: number;
    preferredFoot?: string;
  };
  trends: {
    improving: boolean;
    declining: boolean;
    consistent: boolean;
  };
}

export interface MatchSummary {
  matchId: string;
  date: Date;
  opponent: string;
  result: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  rating?: number;
}

export interface GeneratedReport {
  playerId: string;
  playerName: string;
  position: string;

  summary: string;

  technicalSkills: CategoryRating;
  tacticalAwareness: CategoryRating;
  physicalAttributes: CategoryRating;
  mentalAttributes: CategoryRating;

  overallRating: number;
  potential: string;
  recommendations: string[];
  comparablePlayers: string[];

  qualityScore: QualityScore;
  generatedAt: Date;
  model: string;
}

export interface CategoryRating {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  details: string;
}

export interface QualityScore {
  total: number;
  breakdown: {
    dataCompleteness: number;
    insightDepth: number;
    technicalAccuracy: number;
    actionability: number;
  };
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  useCase: string;
  estimatedCost: string;
  reportType: ReportType;
  sections: TemplateSection[];
  promptTemplate: string;
}

export interface TemplateSection {
  name: string;
  fields: string[];
}

export interface GenerationOptions {
  reportType?: ReportType;
  customContext?: string;
  temperature?: number;
  maxTokens?: number;
  includeComparisons?: boolean;
}

export enum ReportType {
  MATCH_PERFORMANCE = 'MATCH_PERFORMANCE',
  SEASON_OVERVIEW = 'SEASON_OVERVIEW',
  TRANSFER_TARGET = 'TRANSFER_TARGET',
  YOUTH_PROSPECT = 'YOUTH_PROSPECT',
  QUICK_SCAN = 'QUICK_SCAN',
}

export interface BulkGenerationResult {
  total: number;
  successful: number;
  failed: number;
  reports: GeneratedReport[];
  errors: Array<{ playerId: string; error: string }>;
  totalTokens: number;
  totalCost: number;
  averageQualityScore: number;
}

export interface AggregationOptions {
  includeMatches?: boolean;
  matchCount?: number;
  includeHistoricalReports?: boolean;
}
