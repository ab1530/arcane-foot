/**
 * Events Hooks
 * React Query hooks for events/calendar management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventsApi } from '@/lib/api/events';
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
  QueryEventsDto,
} from '@/types/event';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters?: QueryEventsDto) => [...eventKeys.lists(), { filters }] as const,
  upcoming: (limit?: number) => [...eventKeys.all, 'upcoming', { limit }] as const,
  myEvents: (filters?: QueryEventsDto) => [...eventKeys.all, 'my-events', { filters }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

/**
 * Hook to fetch all events with optional filters
 */
export function useEvents(filters?: QueryEventsDto) {
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: () => eventsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch upcoming events
 */
export function useUpcomingEvents(limit?: number) {
  return useQuery({
    queryKey: eventKeys.upcoming(limit),
    queryFn: () => eventsApi.getUpcoming(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch current user's events
 */
export function useMyEvents(filters?: QueryEventsDto) {
  return useQuery({
    queryKey: eventKeys.myEvents(filters),
    queryFn: () => eventsApi.getMyEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single event by ID
 */
export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDto) => eventsApi.create(data),
    onSuccess: (newEvent) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: eventKeys.all });

      // Optimistically add to cache
      queryClient.setQueryData<Event[]>(eventKeys.lists(), (old) => {
        return old ? [newEvent, ...old] : [newEvent];
      });

      toast.success('Event created successfully');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create event';
      toast.error(message);
      console.error('Create event error:', error);
    },
  });
}

/**
 * Hook to update existing event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) =>
      eventsApi.update(id, data),
    onSuccess: (updatedEvent) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: eventKeys.all });

      // Update specific event in cache
      queryClient.setQueryData<Event>(
        eventKeys.detail(updatedEvent.id),
        updatedEvent
      );

      // Update in lists
      queryClient.setQueriesData<Event[]>(
        { queryKey: eventKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((event) =>
            event.id === updatedEvent.id ? updatedEvent : event
          );
        }
      );

      toast.success('Event updated successfully');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to update event';
      toast.error(message);
      console.error('Update event error:', error);
    },
  });
}

/**
 * Hook to delete event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidate all event queries
      queryClient.invalidateQueries({ queryKey: eventKeys.all });

      // Remove from cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(deletedId) });

      // Remove from lists
      queryClient.setQueriesData<Event[]>(
        { queryKey: eventKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.filter((event) => event.id !== deletedId);
        }
      );

      toast.success('Event deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to delete event';
      toast.error(message);
      console.error('Delete event error:', error);
    },
  });
}
