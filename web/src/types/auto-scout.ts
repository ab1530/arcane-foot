/**
 * AutoScout Type Definitions
 * AI-powered scouting report generation using GPT-4
 */

export interface GenerateReportDto {
  playerId: string;
  matchId?: string;
  reportType?: 'MATCH_PERFORMANCE' | 'SEASON_OVERVIEW' | 'TRANSFER_TARGET' | 'YOUTH_PROSPECT' | 'QUICK_SCAN';
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
  age?: number;
  club?: string;

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
  generatedAt: string;
  model: string;
  reportType?: string;

  // Cost tracking
  tokensUsed?: number;
  estimatedCost?: number;

  // Metadata
  scoutId?: string;
  matchId?: string;
  isOfficial?: boolean;
}

export interface ReportSection {
  rating: number; // 0-10
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

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  useCase: string;
  sections: string[];
  estimatedTokens: number;
  costEstimate: string;
  icon?: string;
  color?: string;
}

export interface BulkGenerateDto {
  playerIds: string[];
  matchId?: string;
  reportType?: string;
}

export interface BulkGenerateResult {
  successful: number;
  failed: number;
  totalCost: number;
  reports: GeneratedReport[];
  errors: Array<{ playerId: string; error: string }>;
}

export interface AutoScoutAnalytics {
  totalReports: number;
  totalCost: number;
  averageQualityScore: number;
  reportsByType: Record<string, number>;
  reportsByGrade: Record<string, number>;
  costTrend: Array<{ date: string; cost: number }>;
  topScouts: Array<{ id: string; name: string; reportsGenerated: number }>;
}

export interface ReportHistory {
  id: string;
  playerId: string;
  playerName: string;
  reportType: string;
  qualityScore: QualityScore;
  generatedAt: string;
  scoutName: string;
  isOfficial: boolean;
}

export interface CostEstimate {
  reportType: string;
  estimatedTokens: number;
  estimatedCost: string;
  note: string;
}

export interface GenerationProgress {
  stage: 'idle' | 'fetching_stats' | 'generating' | 'scoring' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}

// Template definitions
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'MATCH_PERFORMANCE',
    name: 'Match Performance',
    description: 'Detailed analysis of player performance in a specific match',
    useCase: 'Post-match analysis and match report generation',
    sections: ['Technical', 'Tactical', 'Physical', 'Mental', 'Key Moments', 'Rating'],
    estimatedTokens: 3000,
    costEstimate: '$0.024',
    icon: '⚽',
    color: '#FFD700',
  },
  {
    id: 'SEASON_OVERVIEW',
    name: 'Season Overview',
    description: 'Comprehensive season-long performance evaluation',
    useCase: 'End-of-season review and development tracking',
    sections: ['Technical', 'Tactical', 'Physical', 'Mental', 'Progress', 'Statistics', 'Future Outlook'],
    estimatedTokens: 3500,
    costEstimate: '$0.028',
    icon: '📊',
    color: '#4169E1',
  },
  {
    id: 'TRANSFER_TARGET',
    name: 'Transfer Target',
    description: 'In-depth evaluation for recruitment and transfer decisions',
    useCase: 'Recruitment evaluation and transfer recommendations',
    sections: ['Technical', 'Tactical', 'Physical', 'Mental', 'Market Value', 'Fit Analysis', 'Risk Assessment', 'Comparisons'],
    estimatedTokens: 4000,
    costEstimate: '$0.032',
    icon: '🎯',
    color: '#32CD32',
  },
  {
    id: 'YOUTH_PROSPECT',
    name: 'Youth Prospect',
    description: 'Development-focused assessment for young players',
    useCase: 'Youth player assessment and development planning',
    sections: ['Technical', 'Tactical', 'Physical', 'Mental', 'Potential', 'Development Areas', 'Training Plan'],
    estimatedTokens: 3200,
    costEstimate: '$0.026',
    icon: '🌱',
    color: '#E4FF3B',
  },
  {
    id: 'QUICK_SCAN',
    name: 'Quick Scan',
    description: 'Rapid screening report with essential insights',
    useCase: 'Rapid screening and initial evaluation',
    sections: ['Quick Analysis', 'Key Strengths', 'Red Flags', 'Recommendation'],
    estimatedTokens: 2000,
    costEstimate: '$0.016',
    icon: '⚡',
    color: '#FFA500',
  },
];

// Helper functions
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'S': return '#FFD700'; // Gold
    case 'A': return '#32CD32'; // Green
    case 'B': return '#4169E1'; // Blue
    case 'C': return '#FFA500'; // Orange
    case 'D': return '#DC143C'; // Red
    default: return '#9CA3AF'; // Gray
  }
}

export function getGradeDescription(grade: string): string {
  switch (grade) {
    case 'S': return 'Exceptional - Comprehensive and highly insightful';
    case 'A': return 'Excellent - Strong quality with minor improvements possible';
    case 'B': return 'Good - Solid analysis with some gaps';
    case 'C': return 'Fair - Basic analysis with significant gaps';
    case 'D': return 'Poor - Limited data or weak analysis';
    default: return 'Unknown';
  }
}

export function calculateGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find(t => t.id === id);
}
