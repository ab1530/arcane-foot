import React from 'react';
import { Share } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import ClubNeedsScreen from '../ClubNeedsScreen';
import api from '../../../services/api';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    createClubNeedRequest: jest.fn(),
    listClubNeedRequests: jest.fn(),
    getClubNeedRequest: jest.fn(),
    updateClubNeedLineStatus: jest.fn(),
    listPassportShareSets: jest.fn(),
    createPassportShareSet: jest.fn(),
    getPlayers: jest.fn(),
  },
}));

jest.mock('../../../services/toast', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
}));

describe('ClubNeedsScreen', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
  } as any;

  const route = {
    params: {},
  } as any;

  const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);

  const mockCreateClubNeedRequest = (api as any).createClubNeedRequest as jest.Mock;
  const mockListClubNeedRequests = (api as any).listClubNeedRequests as jest.Mock;
  const mockGetClubNeedRequest = (api as any).getClubNeedRequest as jest.Mock;
  const mockUpdateClubNeedLineStatus = (api as any).updateClubNeedLineStatus as jest.Mock;
  const mockListPassportShareSets = (api as any).listPassportShareSets as jest.Mock;
  const mockCreatePassportShareSet = (api as any).createPassportShareSet as jest.Mock;
  const mockGetPlayers = (api as any).getPlayers as jest.Mock;

  const baseRequestId = '11111111-1111-4111-8111-111111111111';

  const makeRequest = (isCompleted: boolean = false) => ({
    id: baseRequestId,
    rawText: 'Mallorca, striker, 18-35, right',
    parsed: [
      {
        lineNumber: 1,
        clubName: 'Mallorca',
        positions: ['Striker'],
        age: { min: 18, max: 35 },
        preferredFoot: 'Right',
        errors: [],
      },
    ],
    lineStates: [
      {
        lineNumber: 1,
        clubName: 'Mallorca',
        isCompleted,
        completedAt: isCompleted ? '2026-02-16T17:00:00.000Z' : null,
        completedById: isCompleted ? 'admin-1' : null,
        reopenedAt: null,
        reopenedById: null,
      },
    ],
    linesTotal: 1,
    linesCompleted: isCompleted ? 1 : 0,
    requestProgress: isCompleted ? 'COMPLETED' : 'ACTIVE',
    createdAt: '2026-02-16T16:51:00',
  });

  const makeMatches = () => [
    {
      lineNumber: 1,
      clubName: 'Mallorca',
      criteria: { positions: ['Striker'], age: { min: 18, max: 35 }, preferredFoot: 'Right' },
      warnings: [],
      errors: [],
      players: [
        {
          playerId: 'player-1',
          firstName: 'Kylian',
          lastName: 'Mbappé',
          position: 'Striker',
          nationality: 'France',
          club: { id: 'club-1', name: 'PSG', logo: null },
          marketValue: 120000000,
          contractUntil: null,
          preferredFoot: 'Right',
          photoUrl: null,
        },
      ],
    },
  ];

  const setupDefaultApiMocks = () => {
    mockCreateClubNeedRequest.mockResolvedValue({
      request: makeRequest(false),
      matches: makeMatches(),
    });

    mockListClubNeedRequests.mockResolvedValue({
      data: [makeRequest(true)],
      meta: { total: 1, page: 1, totalPages: 1, limit: 20 },
    });

    mockGetClubNeedRequest.mockResolvedValue({
      request: makeRequest(true),
      matches: makeMatches(),
    });

    mockUpdateClubNeedLineStatus.mockResolvedValue(makeRequest(true));

    mockListPassportShareSets.mockResolvedValue({
      data: [
        {
          id: 'share-1',
          token: 'short-token',
          shareUrl: 'https://arcane.example/shortlist/short-token',
          createdAt: '2026-02-16T17:05:00.000Z',
          revokedAt: null,
          items: [
            {
              playerId: 'player-1',
              firstName: 'Kylian',
              lastName: 'Mbappé',
              position: 'Striker',
              clubName: 'PSG',
            },
          ],
        },
      ],
      meta: { total: 1, page: 1, totalPages: 1, limit: 20 },
    });

    mockCreatePassportShareSet.mockResolvedValue({
      token: 'short-token',
      shareUrl: 'https://arcane.example/shortlist/short-token',
      shareSet: { id: 'set-1' },
    });

    mockGetPlayers.mockResolvedValue({
      data: [
        {
          id: 'player-extra',
          firstName: 'Erling',
          lastName: 'Haaland',
          position: 'Striker',
          nationality: 'Norway',
          club: { id: 'club-2', name: 'Man City', logo: null },
          marketValue: 150000000,
        },
      ],
      meta: { page: 1, totalPages: 1, total: 1, limit: 20 },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultApiMocks();
  });

  afterAll(() => {
    shareSpy.mockRestore();
  });

  it('renders generated shortlist with zero selected players by default', async () => {
    const { getByTestId, getByText } = render(
      <ClubNeedsScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByTestId('club-needs-generate'));

    await waitFor(() => {
      expect(getByText('Partager (0)')).toBeTruthy();
    });
  });

  it('updates selection and shares selected shortlist with source metadata', async () => {
    const { getByTestId, getByText } = render(
      <ClubNeedsScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByTestId('club-needs-generate'));

    await waitFor(() => {
      expect(getByText('Partager (0)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-checkbox-1-player-1'));

    await waitFor(() => {
      expect(getByText('Partager (1)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-share-line-1'));

    await waitFor(() => {
      expect(mockCreatePassportShareSet).toHaveBeenCalledWith(
        expect.objectContaining({
          playerIds: ['player-1'],
          sourceFeature: 'CLUB_NEEDS',
          sourceRequestId: baseRequestId,
          sourceRequestLineNumber: 1,
        }),
      );
    });

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        'https://arcane.example/shortlist/short-token',
      );
      expect(Share.share).toHaveBeenCalled();
    });
  });

  it('adds manual players without duplicates in share group', async () => {
    jest.useFakeTimers();

    const { getByTestId, getByText } = render(
      <ClubNeedsScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByTestId('club-needs-generate'));

    await waitFor(() => {
      expect(getByText('Groupe de partage (0 ajout manuel)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-open-add-1'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('club-needs-search-player-player-extra')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-search-player-player-extra'));
    fireEvent.press(getByTestId('club-needs-confirm-add'));

    await waitFor(() => {
      expect(getByText('Groupe de partage (1 ajout manuel)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-open-add-1'));

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(getByTestId('club-needs-search-player-player-extra')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-search-player-player-extra'));
    fireEvent.press(getByTestId('club-needs-confirm-add'));

    await waitFor(() => {
      expect(getByText('Groupe de partage (1 ajout manuel)')).toBeTruthy();
    });

    jest.useRealTimers();
  });

  it('reloads history when selecting a month filter', async () => {
    const { getByTestId } = render(<ClubNeedsScreen navigation={navigation} route={route} />);

    fireEvent.press(getByTestId('club-needs-toggle-history'));

    await waitFor(() => {
      expect(mockListClubNeedRequests).toHaveBeenCalledWith(1, 20, undefined);
    });

    fireEvent.press(getByTestId('club-needs-open-month-filter'));
    fireEvent.press(getByTestId('club-needs-month-option-2026-02'));

    await waitFor(() => {
      expect(mockListClubNeedRequests).toHaveBeenCalledWith(1, 20, '2026-02');
    });
  });

  it('completes an active line and hides it from active list', async () => {
    mockUpdateClubNeedLineStatus.mockResolvedValueOnce(makeRequest(true));

    const { getByTestId, getByText } = render(
      <ClubNeedsScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByTestId('club-needs-generate'));

    await waitFor(() => {
      expect(getByText('Mallorca')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-complete-line-1'));

    await waitFor(() => {
      expect(mockUpdateClubNeedLineStatus).toHaveBeenCalledWith(baseRequestId, 1, true);
      expect(
        getByText('Tous les besoins actifs sont terminés. Ouvre l’historique pour réouvrir une ligne.'),
      ).toBeTruthy();
    });
  });

  it('shows human-readable history label and allows reopening completed lines', async () => {
    mockUpdateClubNeedLineStatus.mockResolvedValueOnce(makeRequest(false));

    const { getByTestId, getByText } = render(
      <ClubNeedsScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByTestId('club-needs-toggle-history'));

    await waitFor(() => {
      expect(getByText('Demande 16/02/2026 16:51')).toBeTruthy();
    });

    fireEvent.press(getByText('Voir détails'));

    await waitFor(() => {
      expect(getByText('Demande initiale')).toBeTruthy();
      expect(getByText('Joueurs partagés (finaux)')).toBeTruthy();
    });

    fireEvent.press(getByTestId('club-needs-reopen-line-1'));

    await waitFor(() => {
      expect(mockUpdateClubNeedLineStatus).toHaveBeenCalledWith(baseRequestId, 1, false);
    });
  });
});
