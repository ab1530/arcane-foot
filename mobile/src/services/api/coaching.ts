/**
 * COACHING API SERVICE
 * Complete API integration for Coaching Hub feature
 *
 * Endpoints:
 * - GET /coaching/coaches - List all coaches
 * - GET /coaching/coaches/:id - Get coach details
 * - POST /coaching/sessions - Book a session
 * - GET /coaching/sessions - Get user's sessions
 * - PUT /coaching/sessions/:id - Update session
 * - DELETE /coaching/sessions/:id - Cancel session
 * - POST /coaching/reviews - Create review
 * - GET /coaching/reviews/:coachId - Get coach reviews
 * - GET /coaching/availability/:coachId - Get coach availability
 * - PUT /coaching/coaches/:id/profile - Update coach profile
 * - POST /coaching/coaches/become-coach - Apply to become coach
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import { api } from '../api';
import type {
  Coach,
  CoachProfile,
  CoachFilters,
  Session,
  SessionStatus,
  BookSessionRequest,
  UpdateSessionRequest,
  Review,
  CreateReviewRequest,
  ReviewStats,
  AvailabilitySlot,
  AvailabilityQuery,
  BecomeCoachRequest,
  PaginatedCoaches,
  PaginatedSessions,
  PaginatedReviews,
} from '../../types/coaching';

// ============================================================================
// COACH ENDPOINTS
// ============================================================================

/**
 * Get list of coaches with optional filters
 */
export const getCoaches = async (filters?: CoachFilters): Promise<PaginatedCoaches> => {
  try {
    const response = await api.getRaw<PaginatedCoaches>('/coaching/coaches', {
      params: filters,
    });
    return response;
  } catch (error) {
    console.error('Error fetching coaches:', error);
    throw error;
  }
};

/**
 * Get detailed coach profile by ID
 */
export const getCoach = async (id: string): Promise<CoachProfile> => {
  try {
    const response = await api.getRaw<CoachProfile>(`/coaching/coaches/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching coach:', error);
    throw error;
  }
};

/**
 * Update coach profile (for coaches only)
 */
export const updateCoachProfile = async (
  id: string,
  data: Partial<Coach>
): Promise<Coach> => {
  try {
    const response = await api.putRaw<Coach>(`/coaching/coaches/${id}/profile`, data);
    return response;
  } catch (error) {
    console.error('Error updating coach profile:', error);
    throw error;
  }
};

/**
 * Apply to become a coach
 */
export const becomeCoach = async (data: BecomeCoachRequest): Promise<Coach> => {
  try {
    const response = await api.postRaw<Coach>('/coaching/coaches/become-coach', data);
    return response;
  } catch (error) {
    console.error('Error applying to become coach:', error);
    throw error;
  }
};

// ============================================================================
// SESSION ENDPOINTS
// ============================================================================

/**
 * Book a coaching session
 */
export const bookSession = async (data: BookSessionRequest): Promise<Session> => {
  try {
    const response = await api.postRaw<Session>('/coaching/bookings', data);
    return response;
  } catch (error) {
    console.error('Error booking session:', error);
    throw error;
  }
};

/**
 * Get user's coaching sessions
 */
export const getSessions = async (status?: SessionStatus): Promise<PaginatedSessions> => {
  try {
    const response = await api.getRaw<PaginatedSessions>('/coaching/bookings/my', {
      params: status ? { status } : undefined,
    });
    return response;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

/**
 * Get a specific session by ID
 */
export const getSession = async (id: string): Promise<Session> => {
  try {
    const response = await api.getRaw<Session>(`/coaching/bookings/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};

/**
 * Update a coaching session
 */
export const updateSession = async (
  id: string,
  data: UpdateSessionRequest
): Promise<Session> => {
  try {
    const response = await api.putRaw<Session>(`/coaching/bookings/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

/**
 * Cancel a coaching session
 */
export const cancelSession = async (id: string): Promise<void> => {
  try {
    await api.deleteRaw(`/coaching/bookings/${id}`);
  } catch (error) {
    console.error('Error cancelling session:', error);
    throw error;
  }
};

// ============================================================================
// AVAILABILITY ENDPOINTS
// ============================================================================

/**
 * Get coach availability slots
 */
export const getCoachAvailability = async (
  coachId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> => {
  try {
    const response = await api.getRaw<AvailabilitySlot[]>(
      `/coaching/availability/${coachId}`,
      {
        params: { startDate, endDate },
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }
};

// ============================================================================
// REVIEW ENDPOINTS
// ============================================================================

/**
 * Create a review for a coaching session
 */
export const createReview = async (data: CreateReviewRequest): Promise<Review> => {
  try {
    const response = await api.postRaw<Review>('/coaching/reviews', data);
    return response;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

/**
 * Get reviews for a specific coach
 */
export const getCoachReviews = async (coachId: string): Promise<PaginatedReviews> => {
  try {
    const response = await api.getRaw<PaginatedReviews>(`/coaching/reviews/${coachId}`);
    return response;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

/**
 * Get review stats for a coach
 */
export const getReviewStats = async (coachId: string): Promise<ReviewStats> => {
  try {
    const response = await api.getRaw<ReviewStats>(`/coaching/reviews/${coachId}/stats`);
    return response;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    throw error;
  }
};

// ============================================================================
// EXPORT COACHING SERVICE
// ============================================================================

export const coachingService = {
  // Coaches
  getCoaches,
  getCoach,
  updateCoachProfile,
  becomeCoach,

  // Sessions
  bookSession,
  getSessions,
  getSession,
  updateSession,
  cancelSession,

  // Availability
  getCoachAvailability,

  // Reviews
  createReview,
  getCoachReviews,
  getReviewStats,
};

export default coachingService;
