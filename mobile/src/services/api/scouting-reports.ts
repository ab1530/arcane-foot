import api from '../api';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type RecommendationType = 'BUY_NOW' | 'MONITOR' | 'FOLLOW_UP' | 'NOT_INTERESTED' | 'NEEDS_MORE_DATA';

export interface ScoutingReport {
  id: string;
  matchId: string;
  playerId: string;
  scoutId: string;
  status: ReportStatus;
  overallRating?: number;
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  tacticalRating?: number;
  strengths?: string;
  weaknesses?: string;
  conclusion?: string;
  recommendation?: RecommendationType;
  recommendationNotes?: string;
  tags?: string[];
  similarPlayerIds?: string[];
  playerMinutesPlayed?: number;
  playerPosition?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  scout?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  player?: {
    id: string;
    userId: string;
    position?: string;
    preferredFoot?: string;
    height?: number;
    weight?: number;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  match?: {
    id: string;
    date: string;
    homeClubId: string;
    awayClubId: string;
    homeScore?: number;
    awayScore?: number;
    homeClub?: {
      id: string;
      name: string;
      logo?: string;
    };
    awayClub?: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  notes?: any[];
  media?: any[];
}

export interface CreateScoutingReportDto {
  matchId: string;
  playerId: string;
  overallRating?: number;
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  tacticalRating?: number;
  strengths?: string;
  weaknesses?: string;
  conclusion?: string;
  recommendation?: RecommendationType;
  recommendationNotes?: string;
  tags?: string[];
  similarPlayerIds?: string[];
  playerMinutesPlayed?: number;
  playerPosition?: string;
}

export interface QueryScoutingReportDto {
  playerId?: string;
  scoutId?: string;
  matchId?: string;
  status?: ReportStatus;
  recommendation?: RecommendationType;
}

export const scoutingReportsApi = {
  /**
   * Obtenir tous les rapports avec filtres optionnels
   */
  getAll: async (params?: QueryScoutingReportDto): Promise<ScoutingReport[]> => {
    const payload = await api.getRaw<any>('/scouting-reports', { params });
    if (Array.isArray(payload)) {
      return payload as ScoutingReport[];
    }
    if (Array.isArray(payload?.items)) {
      return payload.items as ScoutingReport[];
    }
    if (Array.isArray(payload?.data)) {
      return payload.data as ScoutingReport[];
    }
    return [];
  },

  /**
   * Obtenir un rapport par ID
   */
  getById: async (id: string): Promise<ScoutingReport> => {
    return api.getRaw(`/scouting-reports/${id}`);
  },

  /**
   * Obtenir les rapports d'un joueur
   */
  getPlayerReports: async (playerId: string): Promise<ScoutingReport[]> => {
    const payload = await api.getRaw<any>(`/scouting-reports/player/${playerId}`);
    if (Array.isArray(payload)) {
      return payload as ScoutingReport[];
    }
    return (payload?.data ?? payload?.items ?? []) as ScoutingReport[];
  },

  /**
   * Obtenir les rapports d'un scout
   */
  getScoutReports: async (scoutId: string): Promise<ScoutingReport[]> => {
    const payload = await api.getRaw<any>(`/scouting-reports/scout/${scoutId}`);
    if (Array.isArray(payload)) {
      return payload as ScoutingReport[];
    }
    return (payload?.data ?? payload?.items ?? []) as ScoutingReport[];
  },

  /**
   * Obtenir les rapports d'un match
   */
  getMatchReports: async (matchId: string): Promise<ScoutingReport[]> => {
    const payload = await api.getRaw<any>(`/scouting-reports/match/${matchId}`);
    if (Array.isArray(payload)) {
      return payload as ScoutingReport[];
    }
    return (payload?.data ?? payload?.items ?? []) as ScoutingReport[];
  },

  /**
   * Créer un nouveau rapport
   */
  create: async (data: CreateScoutingReportDto): Promise<ScoutingReport> => {
    return api.postRaw('/scouting-reports', data);
  },

  /**
   * Mettre à jour un rapport
   */
  update: async (id: string, data: Partial<CreateScoutingReportDto>): Promise<ScoutingReport> => {
    return api.patchRaw(`/scouting-reports/${id}`, data);
  },

  /**
   * Soumettre un rapport pour revue
   */
  submit: async (id: string): Promise<ScoutingReport> => {
    return api.postRaw(`/scouting-reports/${id}/submit`);
  },

  /**
   * Reviewer un rapport (approuver/rejeter)
   */
  review: async (id: string, approved: boolean): Promise<ScoutingReport> => {
    return api.postRaw(`/scouting-reports/${id}/review`, { approved });
  },

  /**
   * Supprimer un rapport
   */
  delete: async (id: string): Promise<void> => {
    await api.deleteRaw(`/scouting-reports/${id}`);
  },
};
