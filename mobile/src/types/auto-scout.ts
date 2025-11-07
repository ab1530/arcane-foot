export interface GenerateReportDto {
  playerId: string;
  matchId?: string;
  reportType?: ReportType;
  customContext?: string;
  autoSave?: boolean;
  temperature?: number;
  includeComparisons?: boolean;
}

export interface GeneratedReport {
  id?: string;
  playerId: string;
  playerName: string;
  position: string;
  summary: string;
  technicalSkills: ReportSection;
  tacticalAwareness: ReportSection;
  physicalAttributes: ReportSection;
  mentalAttributes: ReportSection;
  overallRating: number;
  potential: string;
  recommendations: string[];
  comparablePlayers: string[];
  qualityScore: QualityScore;
  generatedAt: Date | string;
  model: string;
  template?: string;
}

export interface ReportSection {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  details: string;
}

export interface QualityScore {
  total: number; // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    dataCompleteness: number;
    insightDepth: number;
    technicalAccuracy: number;
    actionability: number;
  };
}

export enum ReportType {
  MATCH_PERFORMANCE = 'MATCH_PERFORMANCE',
  SEASON_OVERVIEW = 'SEASON_OVERVIEW',
  TRANSFER_TARGET = 'TRANSFER_TARGET',
  YOUTH_PROSPECT = 'YOUTH_PROSPECT',
  QUICK_SCAN = 'QUICK_SCAN',
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  useCase: string;
  estimatedCost: string;
  reportType: ReportType;
}

export interface GenerationStage {
  stage: 'fetching' | 'generating' | 'scoring' | 'complete';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}

export interface AutoScoutHistoryItem {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  qualityScore: QualityScore;
  template: ReportType;
  templateName: string;
  status: 'draft' | 'saved';
  createdAt: Date | string;
  overallRating: number;
}

export interface RegenerateOptions {
  temperature?: number;
  customContext?: string;
  includeComparisons?: boolean;
}

export interface CostEstimate {
  reportType: string;
  estimatedTokens: number;
  estimatedCost: string;
  note: string;
}
