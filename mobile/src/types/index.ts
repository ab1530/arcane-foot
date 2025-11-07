export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  SCOUT = 'SCOUT',
  ANALYST = 'ANALYST',
  PLAYER = 'PLAYER',
  CLUB_CONTACT = 'CLUB_CONTACT',
  PUBLIC = 'PUBLIC',
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  tokenType: string;
}

export interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  country: string;
  city?: string;
  stadium?: string;
  founded?: number;
}

export interface Player {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  position: string;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  nationality: string;
  dateOfBirth: string;
  clubId?: string;
  club?: Club;
  jerseyNumber?: number;
  status: PlayerStatus;
  marketValue?: number;
  statsJson?: any;
}

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  INJURED = 'INJURED',
  SUSPENDED = 'SUSPENDED',
  RETIRED = 'RETIRED',
  PROSPECT = 'PROSPECT',
}

export interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  homeClub: Club;
  awayClub: Club;
  scheduledAt: string;
  venue?: string;
  competition: string;
  season: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  scout?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  HALF_TIME = 'HALF_TIME',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export interface PaginatedResponse<T> {
  data: T[];
  items?: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  [key: string]: any;
}

// Performance Predictor types
export * from './performance-predictor';

// AutoScout types
export * from './auto-scout';

// Voice-to-Report types
export * from './voice-to-report';

// PlayStyle DNA types
export * from './playstyle-dna';
