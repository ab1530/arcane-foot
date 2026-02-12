/**
 * Events API Client
 * API methods for calendar events management
 */

import { apiClient } from '../api-client';
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
  QueryEventsDto,
} from '@/types/event';

export const eventsApi = {
  /**
   * Get all events with optional filters
   * @param params - Query parameters for filtering events
   * @returns Promise with array of events
   */
  getAll: async (params?: QueryEventsDto): Promise<Event[]> => {
    const queryParams = new URLSearchParams();

    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.assignedUserId) queryParams.append('assignedUserId', params.assignedUserId);
    if (params?.matchId) queryParams.append('matchId', params.matchId);

    const query = queryParams.toString();
    return apiClient['request']<Event[]>(`/api/events${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get upcoming events
   * @param limit - Maximum number of events to return
   * @returns Promise with array of upcoming events
   */
  getUpcoming: async (limit?: number): Promise<Event[]> => {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient['request']<Event[]>(`/api/events/upcoming${query}`, {
      method: 'GET',
    });
  },

  /**
   * Get events assigned to current user
   * @param params - Query parameters for filtering events
   * @returns Promise with array of user's events
   */
  getMyEvents: async (params?: QueryEventsDto): Promise<Event[]> => {
    const queryParams = new URLSearchParams();

    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.matchId) queryParams.append('matchId', params.matchId);

    const query = queryParams.toString();
    return apiClient['request']<Event[]>(`/api/events/my-events${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get single event by ID
   * @param id - Event ID
   * @returns Promise with event details
   */
  getById: async (id: string): Promise<Event> => {
    return apiClient['request']<Event>(`/api/events/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create new event (requires COACH/ADMIN role)
   * @param data - Event creation data
   * @returns Promise with created event
   */
  create: async (data: CreateEventDto): Promise<Event> => {
    return apiClient['request']<Event>('/api/events', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update existing event (requires COACH/ADMIN role)
   * @param id - Event ID
   * @param data - Event update data
   * @returns Promise with updated event
   */
  update: async (id: string, data: UpdateEventDto): Promise<Event> => {
    return apiClient['request']<Event>(`/api/events/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Delete event (requires COACH/ADMIN role)
   * @param id - Event ID
   * @returns Promise with void
   */
  delete: async (id: string): Promise<void> => {
    return apiClient['request']<void>(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },
};

export default eventsApi;
