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

jest.mock('../../../services/api/events', () => ({
  eventsApi: {
    getAll: jest.fn(),
    getMyEvents: jest.fn(),
  },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getMatches: jest.fn(),
    getMyAssignedMatches: jest.fn(),
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
  const mockApi = api as unknown as { getMatches: jest.Mock; getMyAssignedMatches: jest.Mock };
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
              role: 'SCOUT',
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
              role: 'SCOUT',
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
      expect(getByText('Lyon FC')).toBeTruthy();
      expect(queryByText('Tottenham Hotspur Stadium')).toBeNull();
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
