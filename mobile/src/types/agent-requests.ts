export type AgentRequestCategory = "INJURY" | "MEDICAL" | "EQUIPMENT" | "OTHER";
export type AgentRequestStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "SATISFIED"
  | "CANCELLED";
export type AgentRequestPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type PreferredFoot = "LEFT" | "RIGHT" | "BOTH";

export interface AgentRequestUserRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AgentRequestItem {
  id: string;
  title: string;
  category: AgentRequestCategory;
  status: AgentRequestStatus;
  priority: AgentRequestPriority;
  creatorRole:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "AGENT"
    | "SCOUT"
    | "ANALYST"
    | "PLAYER"
    | "CLUB_CONTACT"
    | "PUBLIC"
    | null;
  playerId: string | null;
  dueAt: string | null;
  details: string | null;
  content: {
    equipment: string | null;
    medicalDetails: string | null;
    preferredFoot: PreferredFoot | null;
  };
  createdAt: string;
  updatedAt: string;
  creator: AgentRequestUserRef;
  assignee: AgentRequestUserRef | null;
}

export interface AgentRequestCreatePayload {
  title: string;
  category: AgentRequestCategory;
  playerId?: string | null;
  assigneeId?: string | null;
  details?: string;
  equipment?: string;
  medicalDetails?: string;
  preferredFoot?: PreferredFoot;
  dueAt?: string | null;
  priority?: AgentRequestPriority;
}

export interface AgentRequestUpdateStatusPayload {
  status: AgentRequestStatus;
}

export interface AgentRequestMarketProfileRule {
  id: string;
  label: string;
  market: string;
  positions?: string[];
  minHeightCm?: number;
  preferredFoot?: PreferredFoot;
  minEndurance?: number;
  traits?: string[];
  isActive?: boolean;
}

export interface AgentRequestMarketProfileRulesResponse {
  rules: AgentRequestMarketProfileRule[];
}

export interface AgentRequestListResponse {
  data: AgentRequestItem[];
  items?: AgentRequestItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  [key: string]: unknown;
}
