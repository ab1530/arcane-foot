/**
 * Event Types
 * Types for calendar events and event management
 */

export type EventType = 'MATCH' | 'TRAINING' | 'MEETING' | 'CAMP' | 'OTHER';
export type EventStatus = 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface EventUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AssignedUser {
  id: string;
  user: EventUser;
}

export interface EventMatch {
  id: string;
  homeClub: {
    id: string;
    name: string;
    logo?: string;
  };
  awayClub: {
    id: string;
    name: string;
    logo?: string;
  };
  scheduledAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  matchId?: string;
  createdById: string;
  createdBy: EventUser;
  assignedUsers: AssignedUser[];
  match?: EventMatch;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  type?: EventType;
  status?: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  matchId?: string;
  assignedUserIds?: string[];
}

export type UpdateEventDto = Partial<CreateEventDto>;

export interface QueryEventsDto {
  type?: EventType;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  assignedUserId?: string;
  matchId?: string;
}

export interface EventFilters {
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  assignedUserId?: string;
  matchId?: string;
}

export interface CreateEventResponse {
  success: boolean;
  event: Event;
  message: string;
}

export interface UpdateEventResponse {
  success: boolean;
  event: Event;
  message: string;
}

export interface DeleteEventResponse {
  success: boolean;
  message: string;
}
