/**
 * React Query Hooks for Coaching API
 * Provides data fetching, caching, and mutations for coaching features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachingApi, Coach, Booking, Review } from '@/lib/api/coaching';
import { toast } from 'sonner';

/**
 * Fetch all coaches with optional filters
 */
export const useCoaches = (filters?: {
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
  return useQuery({
    queryKey: ['coaches', filters],
    queryFn: () => coachingApi.getCoaches(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch a specific coach by ID
 */
export const useCoach = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['coach', id],
    queryFn: () => coachingApi.getCoach(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch coach statistics
 */
export const useCoachStats = (coachId: string) => {
  return useQuery({
    queryKey: ['coach-stats', coachId],
    queryFn: () => coachingApi.getCoachStats(coachId),
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch coach bookings
 */
export const useCoachBookings = (coachId: string, status?: string) => {
  return useQuery({
    queryKey: ['coach-bookings', coachId, status],
    queryFn: () => coachingApi.getCoachBookings(coachId, { status }),
    enabled: !!coachId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Fetch user's bookings
 */
export const useMyBookings = (status?: string) => {
  return useQuery({
    queryKey: ['my-bookings', status],
    queryFn: () => coachingApi.getMyBookings({ status }),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Fetch a specific booking
 */
export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => coachingApi.getBooking(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Fetch coach reviews
 */
export const useCoachReviews = (coachId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['coach-reviews', coachId, page, limit],
    queryFn: () => coachingApi.getCoachReviews(coachId, { page, limit }),
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch coach availability
 */
export const useCoachAvailability = (coachId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['coach-availability', coachId, startDate, endDate],
    queryFn: () => coachingApi.getCoachAvailability(coachId, startDate, endDate),
    enabled: !!coachId && !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Create a new booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coachingApi.createBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['coach-bookings', data.coachId] });
      queryClient.invalidateQueries({ queryKey: ['coach-availability', data.coachId] });
      toast.success('Session booked successfully!', {
        description: 'Check your email for confirmation details.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to book session', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
};

/**
 * Cancel a booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      coachingApi.cancelBooking(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
      queryClient.invalidateQueries({ queryKey: ['coach-bookings', data.coachId] });
      toast.success('Booking cancelled successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to cancel booking', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
};

/**
 * Rate a booking
 */
export const useRateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rating, review }: { id: string; rating: number; review?: string }) =>
      coachingApi.rateBooking(id, { rating, review }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['coach-reviews', data.coachId] });
      queryClient.invalidateQueries({ queryKey: ['coach', data.coachId] });
      toast.success('Thank you for your feedback!');
    },
    onError: (error: any) => {
      toast.error('Failed to submit rating', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
};

/**
 * Complete a booking (for coaches)
 */
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback?: string }) =>
      coachingApi.completeBooking(id, feedback),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking', data.id] });
      queryClient.invalidateQueries({ queryKey: ['coach-bookings', data.coachId] });
      toast.success('Session marked as completed');
    },
    onError: (error: any) => {
      toast.error('Failed to complete booking', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
};

/**
 * Apply to become a coach
 */
export const useBecomeCoach = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coachingApi.becomeCoach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      toast.success('Application submitted successfully!', {
        description: 'We will review your application and get back to you soon.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to submit application', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
};

/**
 * Update coach profile
 */
export const useUpdateCoachProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coach> }) =>
      coachingApi.updateCoachProfile(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coach', data.id] });
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update profile', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
};
