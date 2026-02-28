export type MobileHomeScope = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'SCOUT';

export interface MobileHomeDashboardCard {
  id:
    | 'reports'
    | 'playersScouted'
    | 'calendar'
    | 'agentRequests'
    | 'transfermarkt'
    | 'scouts';
  label: string;
  value: number;
  delta: number;
  period: 'week' | 'month';
  statusColor: 'yellow' | 'blue' | 'green' | 'indigo';
}

export interface MobileHomeQuickAction {
  id: 'newReport' | 'globalSearch' | 'analytics' | 'agentRequests' | 'calendar';
  label: string;
  target: 'CreateReport' | 'GlobalSearch' | 'Analytics' | 'AgentRequests' | 'Calendar';
  icon: 'add' | 'search' | 'analytics' | 'clipboard-outline' | 'calendar';
  variant: 'primary' | 'secondary';
}

export interface MobileHomeDashboardResponse {
  scope: MobileHomeScope;
  cards: MobileHomeDashboardCard[];
  quickActions: MobileHomeQuickAction[];
  pending: {
    agentRequests: number;
    clubRequests: number;
    reportsToReview: number;
  };
  meta: {
    totalPlayers: number;
    totalScouts: number;
  };
  generatedAt: string;
}

export interface DashboardScoutDirectoryItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  reportsCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface DashboardScoutDirectoryResponse {
  data: DashboardScoutDirectoryItem[];
  items?: DashboardScoutDirectoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
