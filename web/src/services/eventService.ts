/**
 * Event Service
 * Helper functions for event data manipulation and formatting
 */

import type { Event, EventType, EventStatus } from '@/types/event';
import { isAdminRole, type UserRole } from '@/lib/roles';

type BasicUser = {
  id?: string;
  role?: UserRole | string | null;
};

const EVENT_EDIT_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];
const EVENT_DELETE_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

const hasAllowedRole = (role: string | null | undefined, allowed: UserRole[]) =>
  !!role && allowed.includes(role as UserRole);

/**
 * Format event date for display
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatEventDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return dateObj.toLocaleDateString('fr-FR', defaultOptions);
}

/**
 * Format event date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatEventDateRange(
  startDate: string | Date,
  endDate: string | Date
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const sameDay =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameDay) {
    const dateStr = start.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const startTime = start.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = end.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} - ${startTime} à ${endTime}`;
  }

  return `${formatEventDate(start)} - ${formatEventDate(end)}`;
}

/**
 * Check if event is upcoming (in the future)
 * @param event - Event object
 * @returns Boolean indicating if event is upcoming
 */
export function isEventUpcoming(event: Event): boolean {
  const now = new Date();
  const eventStart = new Date(event.startDate);
  return eventStart > now;
}

/**
 * Check if event is past
 * @param event - Event object
 * @returns Boolean indicating if event is past
 */
export function isEventPast(event: Event): boolean {
  const now = new Date();
  const eventEnd = new Date(event.endDate);
  return eventEnd < now;
}

/**
 * Check if event is ongoing
 * @param event - Event object
 * @returns Boolean indicating if event is ongoing
 */
export function isEventOngoing(event: Event): boolean {
  const now = new Date();
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);
  return now >= eventStart && now <= eventEnd;
}

/**
 * Check if user can edit event (based on role and ownership)
 * @param event - Event object
 * @param user - Current user object
 * @returns Boolean indicating edit permission
 */
export function canUserEditEvent(event: Event, user: BasicUser | null): boolean {
  if (!user) return false;

  if (isAdminRole(user.role as UserRole) || hasAllowedRole(user.role, EVENT_EDIT_ROLES)) {
    return true;
  }

  // Creator can edit their own events
  if (event.createdById === user.id) {
    return true;
  }

  return false;
}

/**
 * Check if user can delete event (stricter than edit)
 * @param event - Event object
 * @param user - Current user object
 * @returns Boolean indicating delete permission
 */
export function canUserDeleteEvent(event: Event, user: BasicUser | null): boolean {
  if (!user) return false;

  if (hasAllowedRole(user.role, EVENT_DELETE_ROLES)) {
    return true;
  }

  return false;
}

/**
 * Group events by date
 * @param events - Array of events
 * @returns Object with dates as keys and arrays of events as values
 */
export function groupEventsByDate(
  events: Event[]
): Record<string, Event[]> {
  return events.reduce((groups, event) => {
    const date = new Date(event.startDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(event);
    return groups;
  }, {} as Record<string, Event[]>);
}

/**
 * Group events by month
 * @param events - Array of events
 * @returns Object with month keys and arrays of events as values
 */
export function groupEventsByMonth(
  events: Event[]
): Record<string, Event[]> {
  return events.reduce((groups, event) => {
    const month = new Date(event.startDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    });

    if (!groups[month]) {
      groups[month] = [];
    }

    groups[month].push(event);
    return groups;
  }, {} as Record<string, Event[]>);
}

/**
 * Filter events by date range
 * @param events - Array of events
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Filtered array of events
 */
export function filterEventsByDateRange(
  events: Event[],
  startDate: Date,
  endDate: Date
): Event[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startDate);
    return eventStart >= startDate && eventStart <= endDate;
  });
}

/**
 * Get events for specific date
 * @param events - Array of events
 * @param date - Target date
 * @returns Array of events on that date
 */
export function getEventsForDate(events: Event[], date: Date): Event[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startDate);
    return (
      eventStart.getDate() === date.getDate() &&
      eventStart.getMonth() === date.getMonth() &&
      eventStart.getFullYear() === date.getFullYear()
    );
  });
}

/**
 * Sort events by date (ascending)
 * @param events - Array of events
 * @returns Sorted array of events
 */
export function sortEventsByDate(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
}

/**
 * Get event type label
 * @param type - Event type
 * @returns Localized type label
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    MATCH: 'Match',
    TRAINING: 'Entraînement',
    MEETING: 'Réunion',
    CAMP: 'Stage',
    OTHER: 'Autre',
  };
  return labels[type] || type;
}

/**
 * Get event status label
 * @param status - Event status
 * @returns Localized status label
 */
export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    PLANNED: 'Planifié',
    CONFIRMED: 'Confirmé',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
  };
  return labels[status] || status;
}

/**
 * Get event type color class
 * @param type - Event type
 * @returns Tailwind color class
 */
export function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    MATCH: 'bg-blue-500',
    TRAINING: 'bg-green-500',
    MEETING: 'bg-purple-500',
    CAMP: 'bg-orange-500',
    OTHER: 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
}

/**
 * Get event status color class
 * @param status - Event status
 * @returns Tailwind color class
 */
export function getEventStatusColor(status: EventStatus): string {
  const colors: Record<EventStatus, string> = {
    PLANNED: 'bg-yellow-500',
    CONFIRMED: 'bg-green-500',
    COMPLETED: 'bg-gray-500',
    CANCELLED: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

/**
 * Get event participants count
 * @param event - Event object
 * @returns Number of assigned users
 */
export function getEventParticipantsCount(event: Event): number {
  return event.assignedUsers?.length || 0;
}

/**
 * Check if user is assigned to event
 * @param event - Event object
 * @param userId - User ID to check
 * @returns Boolean indicating if user is assigned
 */
export function isUserAssignedToEvent(event: Event, userId: string): boolean {
  return event.assignedUsers?.some((assigned) => assigned.user.id === userId) || false;
}

/**
 * Get event duration in hours
 * @param event - Event object
 * @returns Duration in hours
 */
export function getEventDuration(event: Event): number {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const durationMs = end.getTime() - start.getTime();
  return durationMs / (1000 * 60 * 60); // Convert to hours
}
