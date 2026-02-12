/**
 * COACHING REACT QUERY HOOKS
 * Custom hooks for coaching feature with React Query integration
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  coachingService,
  getCoaches,
  getCoach,
  bookSession,
  getSessions,
  updateSession,
  cancelSession,
  createReview,
  getCoachReviews,
  getCoachAvailability,
  becomeCoach,
} from '../services/api/coaching';
import type {
  Coach,
  CoachProfile,
  CoachFilters,
  Session,
  SessionStatus,
  BookSessionRequest,
  UpdateSessionRequest,
  CreateReviewRequest,
  BecomeCoachRequest,
} from '../types/coaching';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const coachingKeys = {
  all: ['coaching'] as const,
  coaches: () => [...coachingKeys.all, 'coaches'] as const,
  coachesList: (filters?: CoachFilters) =>
    [...coachingKeys.coaches(), 'list', filters] as const,
  coachDetail: (id: string) => [...coachingKeys.coaches(), 'detail', id] as const,
  sessions: () => [...coachingKeys.all, 'sessions'] as const,
  sessionsList: (status?: SessionStatus) =>
    [...coachingKeys.sessions(), 'list', status] as const,
  sessionDetail: (id: string) => [...coachingKeys.sessions(), 'detail', id] as const,
  reviews: (coachId: string) => [...coachingKeys.all, 'reviews', coachId] as const,
  availability: (coachId: string, startDate: string, endDate: string) =>
    [...coachingKeys.all, 'availability', coachId, startDate, endDate] as const,
};

// ============================================================================
// COACH HOOKS
// ============================================================================

/**
 * Fetch list of coaches with optional filters
 */
export const useCoaches = (
  filters?: CoachFilters,
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: coachingKeys.coachesList(filters),
    queryFn: () => getCoaches(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Fetch featured coaches
 */
export const useFeaturedCoaches = (options?: UseQueryOptions<any, Error>) => {
  return useQuery({
    queryKey: coachingKeys.coachesList({ featured: true } as any),
    queryFn: () => getCoaches({ featured: true } as any),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Fetch detailed coach profile
 */
export const useCoach = (id: string, options?: UseQueryOptions<CoachProfile, Error>) => {
  return useQuery({
    queryKey: coachingKeys.coachDetail(id),
    queryFn: () => getCoach(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Apply to become a coach
 */
export const useBecomeCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BecomeCoachRequest) => becomeCoach(data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Application Submitted',
        'Your application to become a coach has been submitted. We will review it shortly.',
        [{ text: 'OK' }]
      );
      queryClient.invalidateQueries({ queryKey: coachingKeys.coaches() });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Application Failed',
        error?.message || 'Failed to submit your application. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
};

// ============================================================================
// SESSION HOOKS
// ============================================================================

/**
 * Fetch user's coaching sessions
 */
export const useSessions = (
  status?: SessionStatus,
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: coachingKeys.sessionsList(status),
    queryFn: () => getSessions(status),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Fetch upcoming sessions
 */
export const useUpcomingSessions = (options?: UseQueryOptions<any, Error>) => {
  return useQuery({
    queryKey: coachingKeys.sessionsList(SessionStatus.UPCOMING),
    queryFn: () => getSessions(SessionStatus.UPCOMING),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

/**
 * Fetch past sessions
 */
export const usePastSessions = (options?: UseQueryOptions<any, Error>) => {
  return useQuery({
    queryKey: coachingKeys.sessionsList(SessionStatus.COMPLETED),
    queryFn: () => getSessions(SessionStatus.COMPLETED),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Book a coaching session
 */
export const useBookSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookSessionRequest) => bookSession(data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Session Booked!',
        'Your coaching session has been successfully booked.',
        [{ text: 'OK' }]
      );
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: coachingKeys.all });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Booking Failed',
        error?.message || 'Failed to book session. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
};

/**
 * Update a coaching session
 */
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionRequest }) =>
      updateSession(id, data),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Update Failed',
        error?.message || 'Failed to update session. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
};

/**
 * Cancel a coaching session
 */
export const useCancelSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelSession(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Session Cancelled', 'Your session has been cancelled.', [
        { text: 'OK' },
      ]);
      queryClient.invalidateQueries({ queryKey: coachingKeys.sessions() });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Cancellation Failed',
        error?.message || 'Failed to cancel session. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
};

// ============================================================================
// AVAILABILITY HOOKS
// ============================================================================

/**
 * Fetch coach availability
 */
export const useCoachAvailability = (
  coachId: string,
  startDate: string,
  endDate: string,
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: coachingKeys.availability(coachId, startDate, endDate),
    queryFn: () => getCoachAvailability(coachId, startDate, endDate),
    enabled: !!coachId && !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// ============================================================================
// REVIEW HOOKS
// ============================================================================

/**
 * Fetch reviews for a coach
 */
export const useCoachReviews = (
  coachId: string,
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: coachingKeys.reviews(coachId),
    queryFn: () => getCoachReviews(coachId),
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Create a review for a coaching session
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => createReview(data),
    onSuccess: (_, variables) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Review Submitted', 'Thank you for your feedback!', [
        { text: 'OK' },
      ]);
      queryClient.invalidateQueries({
        queryKey: coachingKeys.reviews(variables.coachId),
      });
      queryClient.invalidateQueries({
        queryKey: coachingKeys.coachDetail(variables.coachId),
      });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Review Failed',
        error?.message || 'Failed to submit review. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Prefetch coach details
 */
export const usePrefetchCoach = () => {
  const queryClient = useQueryClient();

  return (coachId: string) => {
    queryClient.prefetchQuery({
      queryKey: coachingKeys.coachDetail(coachId),
      queryFn: () => getCoach(coachId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Invalidate all coaching queries
 */
export const useInvalidateCoachingQueries = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: coachingKeys.all });
  };
};
