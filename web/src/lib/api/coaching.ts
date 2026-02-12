/**
 * Coaching API Client
 * Handles all API calls related to coaching, sessions, and bookings
 */

import { apiClient } from '../api-client';

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  bio: string;
  rating: number;
  reviewCount: number;
  coachingType: string[];
  hourlyRate: number;
  city?: string;
  country?: string;
  languages: string[];
  yearsExperience: number;
  totalSessions: number;
  responseTime: string;
  satisfactionRate: number;
  isActive: boolean;
  canWorkRemote: boolean;
  expertise: string[];
  certifications?: string[];
  specialties?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  coachId: string;
  userId: string;
  coach?: Coach;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  scheduledAt: string;
  duration: number;
  sessionType: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  price: number;
  notes?: string;
  playerRating?: number;
  playerReview?: string;
  coachFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
  booked?: boolean;
}

export interface Review {
  id: string;
  coachId: string;
  userId: string;
  bookingId: string;
  rating: number;
  comment: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoachStats {
  totalSessions: number;
  completedSessions: number;
  avgRating: number;
  totalReviews: number;
  responseTime: string;
  satisfactionRate: number;
}

/**
 * Coaching API functions
 */
export const coachingApi = {
  /**
   * Get all coaches with optional filters
   */
  getCoaches: async (params?: {
    coachingType?: string[];
    city?: string;
    isActive?: boolean;
    canWorkRemote?: boolean;
    minRating?: number;
    maxHourlyRate?: number;
    languages?: string[];
    page?: number;
    limit?: number;
  }) => {
    return apiClient.getCoaches<Coach[]>(params ?? {});
  },

  /**
   * Get a specific coach by ID
   */
  getCoach: async (id: string) => {
    return apiClient.request<Coach>(`/api/coaching/coaches/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Get coach statistics
   */
  getCoachStats: async (coachId: string) => {
    return apiClient.request<CoachStats>(`/api/coaching/coaches/${coachId}/stats`, {
      method: 'GET',
    });
  },

  /**
   * Get coach bookings (for coaches to view their bookings)
   */
  getCoachBookings: async (coachId: string, params?: { status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return apiClient.request<Booking[]>(`/api/coaching/coaches/${coachId}/bookings${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new booking/session
   */
  createBooking: async (data: {
    coachId: string;
    scheduledAt: string;
    duration: number;
    sessionType: string;
    notes?: string;
  }) => {
    return apiClient.request<Booking>('/api/coaching/bookings', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Get user's bookings
   */
  getMyBookings: async (params?: { status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    return apiClient.request<Booking[]>(`/api/coaching/bookings/my${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Get a specific booking by ID
   */
  getBooking: async (id: string) => {
    return apiClient.request<Booking>(`/api/coaching/bookings/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (id: string, reason?: string) => {
    return apiClient.request<Booking>(`/api/coaching/bookings/${id}`, {
      method: 'DELETE',
      body: { reason },
    });
  },

  /**
   * Rate/review a completed booking
   */
  rateBooking: async (id: string, data: { rating: number; review?: string }) => {
    return apiClient.request<Booking>(`/api/coaching/bookings/${id}/rate`, {
      method: 'PUT',
      body: {
        playerRating: data.rating,
        playerReview: data.review,
      },
    });
  },

  /**
   * Complete a booking (for coaches)
   */
  completeBooking: async (id: string, feedback?: string) => {
    return apiClient.request<Booking>(`/api/coaching/bookings/${id}/complete`, {
      method: 'PUT',
      body: { coachFeedback: feedback },
    });
  },

  /**
   * Get reviews for a coach
   */
  getCoachReviews: async (coachId: string, params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.request<{
      reviews: Review[];
      stats: {
        avgRating: number;
        totalReviews: number;
        ratingDistribution: { [key: string]: number };
      };
    }>(`/api/coaching/coaches/${coachId}/reviews${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  /**
   * Apply to become a coach
   */
  becomeCoach: async (data: {
    bio: string;
    coachingType: string[];
    hourlyRate: number;
    city?: string;
    country?: string;
    languages: string[];
    yearsExperience: number;
    canWorkRemote: boolean;
    certifications?: string[];
    specialties?: string[];
  }) => {
    return apiClient.request<Coach>('/api/coaching/coaches', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update coach profile
   */
  updateCoachProfile: async (id: string, data: Partial<Coach>) => {
    return apiClient.request<Coach>(`/api/coaching/coaches/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Get coach availability (mock - to be implemented on backend)
   */
  getCoachAvailability: async (coachId: string, startDate: string, endDate: string) => {
    // This is a placeholder - the backend needs to implement this endpoint
    // For now, return mock data
    const slots: AvailabilitySlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Mock: Available slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: Math.random() > 0.3, // Random availability for demo
          booked: Math.random() < 0.2,
        });
      }
    }

    return Promise.resolve(slots);
  },
};
