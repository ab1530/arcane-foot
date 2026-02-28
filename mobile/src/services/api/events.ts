import api from '../api';
import type { UserRole } from '@shared/config/roles.config';

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: 'MATCH' | 'TRAINING' | 'MEETING' | 'CAMP' | 'OTHER';
  status: 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  matchId?: string;
  createdById: string;
  createdBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  users?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  assignedUsers?: Array<{
    id: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  }>;
  event_assignments?: Array<{
    id: string;
    users?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
    };
  }>;
  match?: {
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
  };
  matches?: {
    id: string;
    clubs_matches_homeClubIdToclubs?: {
      id: string;
      name: string;
      logo?: string;
    };
    clubs_matches_awayClubIdToclubs?: {
      id: string;
      name: string;
      logo?: string;
    };
    scheduledAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  type?: 'MATCH' | 'TRAINING' | 'MEETING' | 'CAMP' | 'OTHER';
  status?: 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  matchId?: string;
  assignedUserIds?: string[];
}

export interface QueryEventsDto {
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  assignedUserId?: string;
  matchId?: string;
}

export const eventsApi = {
  // Obtenir tous les événements
  getAll: async (params?: QueryEventsDto): Promise<Event[]> => {
    return api.getRaw('/events', { params });
  },

  // Obtenir les événements à venir
  getUpcoming: async (limit?: number): Promise<Event[]> => {
    return api.getRaw('/events/upcoming', {
      params: { limit },
    });
  },

  // Obtenir mes événements (assignés)
  getMyEvents: async (params?: QueryEventsDto): Promise<Event[]> => {
    return api.getRaw('/events/my-events', { params });
  },

  // Obtenir les événements d'équipe (admin/super-admin)
  getTeamEvents: async (params?: QueryEventsDto): Promise<Event[]> => {
    return api.getRaw('/events/team-events', { params });
  },

  // Obtenir un événement par ID
  getById: async (id: string): Promise<Event> => {
    return api.getRaw(`/events/${id}`);
  },

  // Créer un événement
  create: async (data: CreateEventDto): Promise<Event> => {
    return api.postRaw('/events', data);
  },

  // Mettre à jour un événement
  update: async (id: string, data: Partial<CreateEventDto>): Promise<Event> => {
    return api.patchRaw(`/events/${id}`, data);
  },

  // Supprimer un événement
  delete: async (id: string): Promise<void> => {
    await api.deleteRaw(`/events/${id}`);
  },
};
