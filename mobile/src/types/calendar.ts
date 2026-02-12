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
  scout?: {
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
    role?: string;
  };
}

export interface CalendarMatch {
  id: string;
  date: string;
  time?: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  notes?: string;
  homeClub?: CalendarClubRef;
  awayClub?: CalendarClubRef;
  competition?: CalendarCompetition;
  venue?: CalendarVenue;
  assignments?: CalendarMatchAssignment[];
}
