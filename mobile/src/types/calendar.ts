export interface CalendarClubRef {
  id: string;
  name: string;
  logo?: string | null;
}

export interface CalendarVenue {
  name: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface CalendarCompetition {
  name: string;
  logo?: string | null;
}

export interface CalendarMatchAssignment {
  scoutId: string;
  status?: string;
  mobileStatus?: 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED';
  role?: string;
  reportSubmitted?: boolean;
  scout?: {
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
    role?: string;
  };
  assignedBy?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export type CalendarItemStatus =
  | 'PLANNED'
  | 'EN_ROUTE'
  | 'REPORT_SUBMITTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type CalendarPersonaFilter = 'ALL' | 'SCOUTS' | 'PLAYERS' | 'AGENTS';

export interface CalendarMatch {
  id: string;
  sourceType?: 'MATCH' | 'EVENT';
  title?: string;
  date: string;
  time?: string;
  status?: CalendarItemStatus | string;
  homeScore?: number;
  awayScore?: number;
  notes?: string;
  persona?: CalendarPersonaFilter;
  homeClub?: CalendarClubRef;
  awayClub?: CalendarClubRef;
  competition?: CalendarCompetition;
  venue?: CalendarVenue;
  assignments?: CalendarMatchAssignment[];
  participants?: Array<{
    id?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    avatar?: string | null;
  }>;
  locationLabel?: string;
}
