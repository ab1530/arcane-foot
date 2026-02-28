export type TransferRequestStatus = 'OPEN' | 'IN_DISCUSSION' | 'CLOSED';
export type TransferRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TransferRequestVisibility = 'PRIVATE' | 'SHARED';
export type TransferSuggestionStatus = 'PROPOSED' | 'SHORTLISTED' | 'REJECTED';

export interface TransferRequestRequirements {
  position?: string;
  ageMin?: number;
  ageMax?: number;
  birthYearMin?: number;
  birthYearMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  dealType?: string;
  euPassportRequired?: boolean;
  timing?: string;
}

export interface TransferMarketActor {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
}

export interface TransferMarketClubRef {
  id?: string;
  name?: string | null;
  logo?: string | null;
  country?: string | null;
}

export interface TransferRequest {
  id: string;
  requestKind: 'TRANSFER_REQUEST' | 'LEGACY_RAW';
  title: string;
  clubId?: string | null;
  clubName?: string | null;
  country?: string | null;
  league?: string | null;
  status: TransferRequestStatus;
  priority: TransferRequestPriority;
  visibility: TransferRequestVisibility;
  requirements?: TransferRequestRequirements | null;
  deadlineAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: TransferMarketActor | null;
  club?: TransferMarketClubRef | null;
  counts?: {
    suggestions?: number;
    activities?: number;
  };
}

export interface TransferSuggestionPlayer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string;
  position?: string | null;
  nationality?: string | null;
  marketValue?: number | null;
  photoUrl?: string | null;
}

export interface TransferSuggestion {
  id: string;
  requestId: string;
  playerId: string;
  scoutId: string;
  comment?: string | null;
  status: TransferSuggestionStatus;
  createdAt: string;
  updatedAt: string;
  player?: TransferSuggestionPlayer | null;
  scout?: TransferMarketActor | null;
}

export interface TransferRequestActivity {
  id: string;
  requestId: string;
  actorId?: string | null;
  actionType: string;
  payload?: Record<string, unknown> | null;
  createdAt: string;
  actor?: TransferMarketActor | null;
}

export interface TransferMarketCountryItem {
  country: string;
  requestsCount: number;
}

export interface TransferMarketLeagueItem {
  league: string;
  requestsCount: number;
}

export interface TransferMarketFilters {
  country?: string;
  league?: string;
  status?: TransferRequestStatus;
  priority?: TransferRequestPriority;
  visibility?: TransferRequestVisibility;
  createdByMe?: boolean;
  page?: number;
  limit?: number;
}

export interface MissionRequestListItem extends TransferRequest {}

export interface MissionRequestFilters extends TransferMarketFilters {}

export interface CreateTransferRequestInput {
  clubId?: string;
  clubName?: string;
  country?: string;
  league: string;
  priority?: TransferRequestPriority;
  visibility?: TransferRequestVisibility;
  title?: string;
  deadlineAt?: string;
  requirements?: TransferRequestRequirements;
}

export interface UpdateTransferRequestInput {
  status?: TransferRequestStatus;
  priority?: TransferRequestPriority;
  visibility?: TransferRequestVisibility;
  deadlineAt?: string | null;
  title?: string;
  requirements?: TransferRequestRequirements;
}

export interface CreateTransferSuggestionInput {
  playerId: string;
  comment?: string;
}
