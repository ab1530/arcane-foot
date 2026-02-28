import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CalendarScreenNew } from '../CalendarScreenNew';
import api from '../../../services/api';
import { eventsApi } from '../../../services/api/events';

const mockNavigate = jest.fn();

jest.mock('react-native-maps', () => {
  throw new Error('Map module not available in this test runtime');
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../../contexts/LocalizationContext', () => ({
  useLocalization: () => {
    const { fr } = require('../../../i18n/locales/fr');
    return {
      language: 'fr',
      dictionary: fr,
      t: (key: string) => key,
      setLanguage: jest.fn(),
    };
  },
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-scout', role: 'SCOUT' },
    activeRole: 'SCOUT',
  }),
}));

jest.mock('../../../constants/features', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

jest.mock('../../../services/api/events', () => ({
  eventsApi: {
    getAll: jest.fn(),
    getMyEvents: jest.fn(),
    getTeamEvents: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getMatches: jest.fn(),
    getMyAssignedMatches: jest.fn(),
    getScoutCalendar: jest.fn(),
  },
  extractPayloadItems: (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  },
  pickDateValue: (payload: any, keys: string[] = ['scheduledAt', 'startDate', 'date', 'createdAt']) => {
    for (const key of keys) {
      if (typeof payload?.[key] === 'string') return payload[key];
    }
    return null;
  },
}));

describe('CalendarScreenNew', () => {
  const mockEventsApi = eventsApi as jest.Mocked<typeof eventsApi>;
  const mockApi = api as unknown as {
    getMatches: jest.Mock;
    getMyAssignedMatches: jest.Mock;
    getScoutCalendar: jest.Mock;
  };
  const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);

  beforeEach(() => {
    jest.clearAllMocks();
    const currentMatchDate = new Date();
    const testDate = new Date(
      Date.UTC(
        currentMatchDate.getUTCFullYear(),
        currentMatchDate.getUTCMonth(),
        currentMatchDate.getUTCDate(),
        18,
        0,
        0,
      ),
    ).toISOString();

    mockEventsApi.getMyEvents.mockResolvedValue([
      {
        id: 'event-1',
        title: 'Tottenham FC vs Basel FC',
        type: 'SCOUT',
        status: 'PLANNED',
        startDate: testDate,
        endDate: testDate,
        location: 'Tottenham Hotspur Stadium',
        assignedUsers: [
          {
            id: 'a-1',
            user: {
              id: 'u-1',
              firstName: 'Luca',
              lastName: 'Rossi',
              role: 'AGENT',
            },
          },
        ],
      },
    ] as any);

    mockEventsApi.getAll.mockResolvedValue([
      {
        id: 'event-1',
        title: 'Tottenham FC vs Basel FC',
        type: 'SCOUT',
        status: 'PLANNED',
        startDate: testDate,
        endDate: testDate,
        location: 'Tottenham Hotspur Stadium',
        assignedUsers: [
          {
            id: 'a-1',
            user: {
              id: 'u-1',
              firstName: 'Luca',
              lastName: 'Rossi',
              role: 'AGENT',
            },
          },
        ],
      },
    ] as any);

    mockEventsApi.getTeamEvents.mockResolvedValue([
      {
        id: 'event-1',
        title: 'Tottenham FC vs Basel FC',
        type: 'SCOUT',
        status: 'PLANNED',
        startDate: testDate,
        endDate: testDate,
        location: 'Tottenham Hotspur Stadium',
        assignedUsers: [
          {
            id: 'a-1',
            user: {
              id: 'u-1',
              firstName: 'Luca',
              lastName: 'Rossi',
              role: 'AGENT',
            },
          },
        ],
      },
    ] as any);

    mockApi.getMatches.mockResolvedValue({
      data: [
        {
          id: 'match-1',
          title: 'Meeting avec Lyon FC',
          status: 'EN_ROUTE',
          scheduledAt: testDate,
          matchDate: testDate,
          homeClub: { id: 'club-1', name: 'Lyon FC', logo: null },
          awayClub: { id: 'club-2', name: 'Arcane XI', logo: null },
        },
      ],
      meta: { total: 1, page: 1, totalPages: 1, limit: 20 },
    });

    mockApi.getMyAssignedMatches.mockResolvedValue({
      data: [
        {
          id: 'match-1',
          title: 'Meeting avec Lyon FC',
          status: 'ASSIGNED',
          scheduledAt: testDate,
          matchDate: testDate,
          homeClub: { id: 'club-1', name: 'Lyon FC', logo: null },
          awayClub: { id: 'club-2', name: 'Arcane XI', logo: null },
        },
      ],
      meta: { total: 1, page: 1, totalPages: 1, limit: 20 },
    });

    mockApi.getScoutCalendar.mockResolvedValue({
      filters: { countries: ['France'], leagues: ['Ligue 1'] },
      myCalendar: [
        {
          assignmentId: 'assign-1',
          matchId: 'match-1',
          missionType: 'PRIORITY',
          status: 'ASSIGNED',
          mobileStatus: 'PLANNED',
          reportSubmitted: false,
          match: {
            id: 'match-1',
            scheduledAt: testDate,
            homeClub: { id: 'club-1', name: 'Lyon FC', logo: null },
            awayClub: { id: 'club-2', name: 'Arcane XI', logo: null },
            competition: { id: 'comp-1', name: 'Ligue 1' },
            venue: { id: 'venue-1', name: 'Groupama Stadium', city: 'Lyon' },
          },
        },
      ],
      sharedCalendar: [],
      discover: [],
      meta: {
        totalMy: 1,
        totalShared: 0,
        totalDiscover: 0,
      },
    });
  });

  afterAll(() => {
    shareSpy.mockRestore();
  });

  it('bascule entre list/week/map et affiche le fallback map', async () => {
    const { getByTestId } = render(<CalendarScreenNew />);

    await waitFor(() => {
      expect(getByTestId('calendar-center-week-view')).toBeTruthy();
    });

    fireEvent.press(getByTestId('calendar-center-viewmode-list'));
    await waitFor(() => {
      expect(getByTestId('calendar-center-list-view')).toBeTruthy();
    });

    fireEvent.press(getByTestId('calendar-center-viewmode-map'));
    await waitFor(() => {
      expect(getByTestId('calendar-center-map-fallback')).toBeTruthy();
    });
  });

  it('navigue entre les semaines en vue liste', async () => {
    const now = new Date();
    const currentDay = now.getDay();
    const offsetToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStart = new Date(now);
    weekStart.setHours(12, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() + offsetToMonday);

    const currentWeekMatchDate = new Date(weekStart);
    currentWeekMatchDate.setDate(currentWeekMatchDate.getDate() + 1);

    const nextWeekMatchDate = new Date(weekStart);
    nextWeekMatchDate.setDate(nextWeekMatchDate.getDate() + 8);

    mockEventsApi.getMyEvents.mockResolvedValueOnce([] as any);
    mockApi.getScoutCalendar.mockResolvedValueOnce({
      filters: { countries: [], leagues: [] },
      myCalendar: [
        {
          assignmentId: 'assign-current-week',
          matchId: 'match-current-week',
          missionType: 'PRIORITY',
          status: 'ASSIGNED',
          mobileStatus: 'PLANNED',
          reportSubmitted: false,
          match: {
            id: 'match-current-week',
            scheduledAt: currentWeekMatchDate.toISOString(),
            homeClub: { id: 'club-current-home', name: 'Current Week FC', logo: null },
            awayClub: { id: 'club-current-away', name: 'Current Week B', logo: null },
            competition: { id: 'comp-current', name: 'Ligue Test' },
            venue: { id: 'venue-current', name: 'Current Stadium', city: 'Paris' },
          },
        },
        {
          assignmentId: 'assign-next-week',
          matchId: 'match-next-week',
          missionType: 'PRIORITY',
          status: 'ASSIGNED',
          mobileStatus: 'PLANNED',
          reportSubmitted: false,
          match: {
            id: 'match-next-week',
            scheduledAt: nextWeekMatchDate.toISOString(),
            homeClub: { id: 'club-next-home', name: 'Next Week FC', logo: null },
            awayClub: { id: 'club-next-away', name: 'Next Week B', logo: null },
            competition: { id: 'comp-next', name: 'Ligue Test' },
            venue: { id: 'venue-next', name: 'Next Stadium', city: 'Lyon' },
          },
        },
      ],
      sharedCalendar: [],
      discover: [],
      meta: {
        totalMy: 2,
        totalShared: 0,
        totalDiscover: 0,
      },
    });

    const { getByTestId, getByText, queryByText } = render(<CalendarScreenNew />);

    await waitFor(() => {
      expect(getByTestId('calendar-center-week-view')).toBeTruthy();
    });

    fireEvent.press(getByTestId('calendar-center-viewmode-list'));

    await waitFor(() => {
      expect(getByText('Current Week FC')).toBeTruthy();
    });
    expect(queryByText('Next Week FC')).toBeNull();

    fireEvent.press(getByTestId('calendar-center-week-next'));

    await waitFor(() => {
      expect(getByText('Next Week FC')).toBeTruthy();
    });
    expect(queryByText('Current Week FC')).toBeNull();

    fireEvent.press(getByTestId('calendar-center-week-current'));

    await waitFor(() => {
      expect(getByText('Current Week FC')).toBeTruthy();
    });
  });

  it('active les filtres persona et isole les demandes agents', async () => {
    const { getByTestId, getByText, queryByText } = render(<CalendarScreenNew />);

    await waitFor(() => {
      expect(getByTestId('calendar-center-viewmode-list')).toBeTruthy();
    });

    fireEvent.press(getByTestId('calendar-center-viewmode-list'));
    await waitFor(() => {
      expect(getByText('Tottenham Hotspur Stadium')).toBeTruthy();
      expect(getByText('Lyon FC')).toBeTruthy();
    });

    fireEvent.press(getByTestId('calendar-center-persona-agents'));

    await waitFor(() => {
      expect(getByText('Tottenham Hotspur Stadium')).toBeTruthy();
      expect(queryByText('Lyon FC')).toBeNull();
    });
  });

  it('partage un résumé calendrier via le CTA', async () => {
    const { getByTestId } = render(<CalendarScreenNew />);

    await waitFor(() => {
      expect(getByTestId('calendar-center-share')).toBeTruthy();
    });

    fireEvent.press(getByTestId('calendar-center-share'));

    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Arcane Calendar'),
        }),
      );
    });
  });
});
