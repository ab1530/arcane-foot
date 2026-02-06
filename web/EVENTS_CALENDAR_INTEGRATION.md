# Events/Calendar Feature - Technical Documentation

## Overview

This document outlines the implementation of the Events/Calendar feature for the Next.js web application, achieving feature parity with the mobile app. All API integration, types, hooks, and services have been implemented following the existing web codebase patterns.

## Implementation Summary

### Files Created

1. **Types**: `/web/src/types/event.ts` (105 lines)
   - Event interface with all fields from backend
   - CreateEventDto and UpdateEventDto interfaces
   - QueryEventsDto for filtering
   - EventType and EventStatus enums
   - Response types

2. **API Client**: `/web/src/lib/api/events.ts` (111 lines)
   - Complete API methods for all 7 backend endpoints
   - Proper TypeScript typing
   - Query parameter handling

3. **React Hooks**: `/web/src/hooks/useEvents.ts` (182 lines)
   - React Query integration with proper caching
   - All CRUD hooks with optimistic updates
   - Error handling and toast notifications
   - Cache invalidation strategies

4. **Service Layer**: `/web/src/services/eventService.ts` (375 lines)
   - Date formatting utilities
   - Permission checking functions
   - Event grouping and filtering helpers
   - Status and type label utilities

### Files Modified

1. **API Client**: `/web/src/lib/api-client.ts`
   - Added 7 events methods to ApiClient class
   - Integrated with existing authentication pattern
   - Proper query parameter handling

## Backend Endpoints Integrated

All 7 events endpoints from the backend have been integrated:

1. **POST /api/events** - Create event (requires auth, COACH/ADMIN)
2. **GET /api/events** - Get all events with filters (requires auth)
3. **GET /api/events/upcoming** - Get upcoming events (requires auth)
4. **GET /api/events/my-events** - Get user's events (requires auth)
5. **GET /api/events/:id** - Get single event (requires auth)
6. **PATCH /api/events/:id** - Update event (requires auth, COACH/ADMIN)
7. **DELETE /api/events/:id** - Delete event (requires auth, COACH/ADMIN)

## TypeScript Types Defined

### Core Types

```typescript
export type EventType = 'MATCH' | 'TRAINING' | 'MEETING' | 'CAMP' | 'OTHER';
export type EventStatus = 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

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
```

### DTOs

- **CreateEventDto**: For creating new events
- **UpdateEventDto**: For updating existing events (partial)
- **QueryEventsDto**: For filtering events with query parameters

## React Query Hooks

### Available Hooks

1. **useEvents(filters?)** - Get all events with optional filters
   - Returns: `{ data, isLoading, error, refetch }`
   - Caching: 5 minutes stale time

2. **useUpcomingEvents(limit?)** - Get upcoming events
   - Returns: `{ data, isLoading, error, refetch }`
   - Caching: 5 minutes stale time

3. **useMyEvents(filters?)** - Get current user's events
   - Returns: `{ data, isLoading, error, refetch }`
   - Caching: 5 minutes stale time

4. **useEvent(id)** - Get single event
   - Returns: `{ data, isLoading, error, refetch }`
   - Caching: 5 minutes stale time

5. **useCreateEvent()** - Mutation for creating events
   - Returns: `{ mutate, mutateAsync, isLoading, error }`
   - Invalidates all event queries on success
   - Optimistic updates

6. **useUpdateEvent()** - Mutation for updating events
   - Returns: `{ mutate, mutateAsync, isLoading, error }`
   - Updates specific event in cache
   - Invalidates related queries

7. **useDeleteEvent()** - Mutation for deleting events
   - Returns: `{ mutate, mutateAsync, isLoading, error }`
   - Removes from cache on success
   - Invalidates related queries

### Usage Example

```typescript
import { useEvents, useCreateEvent } from '@/hooks/useEvents';

function EventsPage() {
  const { data: events, isLoading } = useEvents({ status: 'CONFIRMED' });
  const createEvent = useCreateEvent();

  const handleCreate = () => {
    createEvent.mutate({
      title: 'Team Training',
      startDate: '2025-11-15T10:00:00Z',
      endDate: '2025-11-15T12:00:00Z',
      location: 'Stadium A',
      type: 'TRAINING',
    });
  };

  // ... rest of component
}
```

## Service Layer Functions

### Date & Time Functions
- `formatEventDate(date, options?)` - Format event date for display
- `formatEventDateRange(startDate, endDate)` - Format date range
- `isEventUpcoming(event)` - Check if event is in future
- `isEventPast(event)` - Check if event is past
- `isEventOngoing(event)` - Check if event is currently happening

### Permission Functions
- `canUserEditEvent(event, user)` - Check edit permissions (ADMIN/SUPER_ADMIN/COACH/Creator)
- `canUserDeleteEvent(event, user)` - Check delete permissions (ADMIN/SUPER_ADMIN/COACH only)

### Data Organization Functions
- `groupEventsByDate(events)` - Group events by date
- `groupEventsByMonth(events)` - Group events by month
- `filterEventsByDateRange(events, startDate, endDate)` - Filter by date range
- `getEventsForDate(events, date)` - Get events for specific date
- `sortEventsByDate(events)` - Sort events chronologically

### Utility Functions
- `getEventTypeLabel(type)` - Get localized type label (French)
- `getEventStatusLabel(status)` - Get localized status label (French)
- `getEventTypeColor(type)` - Get Tailwind color class for type
- `getEventStatusColor(status)` - Get Tailwind color class for status
- `getEventParticipantsCount(event)` - Count assigned users
- `isUserAssignedToEvent(event, userId)` - Check user assignment
- `getEventDuration(event)` - Calculate duration in hours

## Role-Based Access Control

### Event Creation
- **Allowed Roles**: COACH, ADMIN, SUPER_ADMIN
- **Backend Validation**: JwtAuthGuard ensures authentication
- **Frontend Check**: Use `canUserEditEvent()` to show/hide create button

### Event Update
- **Allowed Roles**: COACH, ADMIN, SUPER_ADMIN, or event creator
- **Backend Validation**: JwtAuthGuard + ownership check
- **Frontend Check**: Use `canUserEditEvent(event, user)`

### Event Delete
- **Allowed Roles**: COACH, ADMIN, SUPER_ADMIN only
- **Backend Validation**: JwtAuthGuard + role check
- **Frontend Check**: Use `canUserDeleteEvent(event, user)`

### Event Read
- **Allowed Roles**: All authenticated users
- **Backend Validation**: JwtAuthGuard only
- **Note**: Users can see all events but `/my-events` filters by assignment

## Differences from Mobile Implementation

1. **API Client Pattern**:
   - Mobile: Separate file with axios instance (`mobile/src/services/api/events.ts`)
   - Web: Integrated into main ApiClient class + separate API module

2. **State Management**:
   - Mobile: Custom hooks with useState/useEffect
   - Web: React Query for server state management

3. **Error Handling**:
   - Mobile: Custom error logging with logger utility
   - Web: Toast notifications + React Query error states + Sentry integration

4. **Caching Strategy**:
   - Mobile: Manual cache management
   - Web: Automatic with React Query (5 min stale time, smart invalidation)

5. **Type Structure**:
   - Both use same backend types
   - Web has additional response wrapper types

## Calendar Library Recommendations

The web app currently **does not have a calendar library installed**. For UI implementation, consider:

### Option 1: React Big Calendar (Recommended)
```bash
npm install react-big-calendar date-fns
```
- **Pros**: Full-featured, month/week/day views, drag & drop
- **Cons**: Large bundle size (~200KB)
- **Use Case**: Full calendar interface

### Option 2: React Calendar
```bash
npm install react-calendar
```
- **Pros**: Lightweight (~50KB), customizable
- **Cons**: Limited built-in features
- **Use Case**: Simple date picker with event markers

### Option 3: FullCalendar
```bash
npm install @fullcalendar/react @fullcalendar/daygrid
```
- **Pros**: Very feature-rich, excellent UX
- **Cons**: Expensive for commercial use
- **Use Case**: Enterprise-grade calendar

### Option 4: Custom Build (Recommended for MVP)
- Use existing date utilities
- Build simple list/grid view with Tailwind
- Add calendar picker later if needed
- **Pros**: Lightweight, full control, fast initial delivery
- **Cons**: More development time for advanced features

## UI Integration Guide

### 1. Events List Page

```typescript
'use client';

import { useEvents } from '@/hooks/useEvents';
import { formatEventDate, getEventTypeColor } from '@/services/eventService';

export default function EventsListPage() {
  const { data: events, isLoading } = useEvents();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {events?.map((event) => (
        <div key={event.id} className="border rounded-lg p-4">
          <div className={`inline-block px-2 py-1 rounded text-white text-sm ${getEventTypeColor(event.type)}`}>
            {event.type}
          </div>
          <h3 className="text-xl font-bold mt-2">{event.title}</h3>
          <p className="text-gray-600">{formatEventDate(event.startDate)}</p>
          <p className="text-gray-600">{event.location}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Create Event Form

```typescript
'use client';

import { useCreateEvent } from '@/hooks/useEvents';
import { useState } from 'react';

export default function CreateEventForm() {
  const createEvent = useCreateEvent();
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    type: 'TRAINING' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Event Title"
        className="w-full border rounded px-3 py-2"
      />
      {/* Add more form fields */}
      <button
        type="submit"
        disabled={createEvent.isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {createEvent.isLoading ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  );
}
```

### 3. Calendar View Integration

```typescript
'use client';

import { useEvents } from '@/hooks/useEvents';
import { groupEventsByDate } from '@/services/eventService';
import { useState } from 'react';

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: events } = useEvents({
    startDate: startOfMonth(selectedDate).toISOString(),
    endDate: endOfMonth(selectedDate).toISOString(),
  });

  const groupedEvents = groupEventsByDate(events || []);

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Calendar grid implementation */}
      {/* Use groupedEvents to show markers on dates with events */}
    </div>
  );
}
```

### 4. Permission Checking

```typescript
'use client';

import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { canUserEditEvent, canUserDeleteEvent } from '@/services/eventService';

export default function EventDetailPage({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Get current user from auth context
  const user = useCurrentUser(); // Implement based on your auth system

  const canEdit = event && user ? canUserEditEvent(event, user) : false;
  const canDelete = event && user ? canUserDeleteEvent(event, user) : false;

  return (
    <div>
      <h1>{event?.title}</h1>
      {canEdit && (
        <button onClick={() => {/* open edit modal */}}>
          Edit Event
        </button>
      )}
      {canDelete && (
        <button onClick={() => deleteEvent.mutate(eventId)}>
          Delete Event
        </button>
      )}
    </div>
  );
}
```

## Testing Considerations

### Unit Tests
- Test service functions with mock data
- Test permission logic
- Test date formatting

### Integration Tests
- Test API calls with MSW (Mock Service Worker)
- Test React Query hooks
- Test form submissions

### E2E Tests
- Test event creation flow
- Test event filtering
- Test role-based access

## Next Steps for UI Implementation

1. **Create Events Pages**:
   - `/app/events/page.tsx` - Events list
   - `/app/events/[id]/page.tsx` - Event detail
   - `/app/events/create/page.tsx` - Create event form
   - `/app/events/calendar/page.tsx` - Calendar view

2. **Create Components**:
   - `EventCard.tsx` - Display event summary
   - `EventFilters.tsx` - Filter events by type/status/date
   - `EventForm.tsx` - Create/edit event form
   - `CalendarGrid.tsx` - Calendar view component

3. **Add to Navigation**:
   - Add "Calendar" or "Events" link to main navigation
   - Show upcoming events count badge (optional)

4. **Implement Calendar Library** (if needed):
   - Choose library based on requirements
   - Create wrapper component
   - Map events to calendar format

5. **Add Notifications**:
   - Integrate with existing notification system
   - Send reminders for upcoming events
   - Notify assigned users

## Performance Considerations

1. **Caching**: React Query provides automatic caching with 5-minute stale time
2. **Pagination**: Consider adding pagination for large event lists
3. **Lazy Loading**: Load calendar library only when needed with dynamic imports
4. **Optimistic Updates**: Already implemented in mutations
5. **Query Invalidation**: Smart invalidation prevents unnecessary refetches

## Compatibility Notes

- TypeScript: All files use strict typing
- React: Compatible with React 19
- Next.js: Compatible with Next.js 15.1.7
- React Query: Uses @tanstack/react-query v5.90.6
- Browser Support: Modern browsers (ES6+)

## Additional Resources

- Backend API Docs: `/BACKEND_API_ENDPOINTS.json`
- Mobile Reference: `/mobile/src/services/api/events.ts`
- Mobile Hooks: `/mobile/src/hooks/useCalendar.ts`
- Web API Client: `/web/src/lib/api-client.ts`
- Type Definitions: `/web/src/types/event.ts`
