export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPICIOUS = 'SUSPICIOUS',
}

export enum PlayerType {
  PUBLIC = 'PUBLIC',
  AGENCY = 'AGENCY',
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  verificationStatus: VerificationStatus;
  playerType: PlayerType;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  currentClub?: string;
  marketValue?: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ValidationHistory {
  id: string;
  playerId: string;
  status: VerificationStatus;
  reason?: string;
  notes?: string;
  performedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export interface VerificationStats {
  totalPublicPlayers: number;
  statusBreakdown: {
    pending: number;
    verified: number;
    rejected: number;
    suspicious: number;
  };
  percentages: {
    pending: number;
    verified: number;
    rejected: number;
    suspicious: number;
  };
  recentActivity: {
    validationsLast30Days: number;
    rejectionsLast30Days: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ValidatePlayerDto {
  notes?: string;
}

export interface RejectPlayerDto {
  reason: string;
  notes?: string;
}

export interface ConvertToAgencyDto {
  agencyId?: string;
  notes?: string;
}

export interface BulkImportPlayer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  currentClub?: string;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  players: Player[];
}

export interface FilterOptions {
  status?: VerificationStatus;
  search?: string;
  page?: number;
  limit?: number;
}
