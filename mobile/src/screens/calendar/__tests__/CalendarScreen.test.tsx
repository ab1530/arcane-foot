import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import CalendarScreen from '../CalendarScreen';
import { eventsApi } from '../../../services/api/events';

jest.mock('../../../services/api/events', () => ({
  eventsApi: {
    getAll: jest.fn(),
    getUpcoming: jest.fn(),
    getMyEvents: jest.fn(),
  },
}));

describe('CalendarScreen', () => {
  const mockEvents = [
    {
      id: 'evt-1',
      title: 'Match amical',
      type: 'MATCH',
      status: 'CONFIRMED',
      startDate: '2024-01-10T18:00:00.000Z',
      endDate: '2024-01-10T20:00:00.000Z',
      location: 'Stade Arcane',
      assignedUsers: [{ id: '1', user: { firstName: 'Coach', lastName: 'One' } }],
      createdById: 'coach-1',
      createdBy: { id: 'coach-1', email: 'coach@arcane.gg', firstName: 'Coach', lastName: 'One', role: 'SCOUT' },
      createdAt: '2024-01-01T12:00:00.000Z',
      updatedAt: '2024-01-02T12:00:00.000Z',
      match: {
        id: 'match-1',
        homeClub: { id: 'club-1', name: 'Arcane FC' },
        awayClub: { id: 'club-2', name: 'Rivals FC' },
        scheduledAt: '2024-01-10T18:00:00.000Z',
      },
    },
  ];

  const mockUpcoming = [
    {
      ...mockEvents[0],
      id: 'evt-2',
      title: 'Camp Elite',
      type: 'CAMP',
      status: 'PLANNED',
    },
  ];

  const mockMyEvents = [
    {
      ...mockEvents[0],
      id: 'evt-3',
      title: 'Réunion analyse',
      type: 'MEETING',
      status: 'PLANNED',
    },
  ];

  const mockGetAll = eventsApi.getAll as jest.Mock;
  const mockGetUpcoming = eventsApi.getUpcoming as jest.Mock;
const mockGetMyEvents = eventsApi.getMyEvents as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockEvents);
    mockGetUpcoming.mockResolvedValue(mockUpcoming);
    mockGetMyEvents.mockResolvedValue(mockMyEvents);
  });

  it('affiche un indicateur de chargement au montage', async () => {
    const { getByTestId } = render(<CalendarScreen />);
    expect(getByTestId('calendar-loading-indicator')).toBeTruthy();
    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());
  });

  it('charge et affiche les événements par défaut', async () => {
    const { getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledTimes(1);
      expect(getByText('Match amical')).toBeTruthy();
      expect(getByText('Arcane FC vs Rivals FC')).toBeTruthy();
    });
  });

  it('permet de filtrer les événements à venir', async () => {
    const { getByTestId, getByText } = render(<CalendarScreen />);

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());

    fireEvent.press(getByTestId('calendar-filter-upcoming'));

    await waitFor(() => {
      expect(mockGetUpcoming).toHaveBeenCalledWith(20);
      expect(getByText('Camp Elite')).toBeTruthy();
    });
  });

  it('permet de filtrer les événements assignés', async () => {
    const { getByTestId, getByText } = render(<CalendarScreen />);

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());

    fireEvent.press(getByTestId('calendar-filter-my'));

    await waitFor(() => {
      expect(mockGetMyEvents).toHaveBeenCalled();
      expect(getByText('Réunion analyse')).toBeTruthy();
    });
  });

  it('bascule en vue Calendrier', async () => {
    const { getByTestId, getByText } = render(<CalendarScreen />);

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());

    fireEvent.press(getByTestId('calendar-viewmode-calendar'));
    await waitFor(() => {
      expect(getByText('Vue calendrier')).toBeTruthy();
    });
  });

  it('affiche une bannière d’erreur avec bouton retry en cas de failure API', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetAll.mockRejectedValueOnce(new Error('Network down'));

    const { getByTestId, getByText } = render(<CalendarScreen />);

    await waitFor(() => {
      expect(getByText('Impossible de charger les événements')).toBeTruthy();
      expect(getByTestId('calendar-retry-inline')).toBeTruthy();
    });

    mockGetAll.mockResolvedValueOnce(mockEvents);
    fireEvent.press(getByTestId('calendar-retry-inline'));
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(2));
    consoleSpy.mockRestore();
  });

  it('affiche un CTA sur état vide et charge les événements à venir', async () => {
    mockGetAll.mockResolvedValueOnce([]);
    const { getByTestId, getByText } = render(<CalendarScreen />);

    await waitFor(() => expect(getByText('Aucun événement')).toBeTruthy());
    fireEvent.press(getByTestId('calendar-empty-cta'));
    await waitFor(() => expect(mockGetUpcoming).toHaveBeenCalledWith(20));
  });

  it('rafraîchit la liste via pull-to-refresh', async () => {
    const { getByTestId } = render(<CalendarScreen />);

    await waitFor(() => expect(mockGetAll).toHaveBeenCalled());

    mockGetAll.mockResolvedValueOnce(mockEvents);
    const flatList = getByTestId('calendar-list');
    mockGetAll.mockResolvedValueOnce(mockEvents);

    act(() => {
      flatList.props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(2));
  });
});
