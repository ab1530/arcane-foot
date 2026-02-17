import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PassportPreviewScreen from '../PassportPreviewScreen';
import passportService from '../../../services/passportService';

jest.mock('../../../services/passportService', () => ({
  __esModule: true,
  default: {
    getPassportByPlayer: jest.fn(),
    createPassport: jest.fn(),
    generateQRCodeValue: jest.fn(),
  },
}));

jest.mock('../../../services/toast', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
}));

describe('PassportPreviewScreen', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  } as any;

  const mockPassport = {
    id: 'passport-1',
    token: 'token-1',
    player: {
      id: 'player-1',
      firstName: 'Kylian',
      lastName: 'Mbappé',
      position: 'Striker',
      nationality: 'France',
      marketValue: 120000000,
      contractUntil: '2029-06-30',
      club: { id: 'club-1', name: 'PSG', logo: null },
      user: {
        firstName: 'Kylian',
        lastName: 'Mbappé',
        avatar: null,
      },
    },
  };

  const mockGetPassportByPlayer = (passportService as any).getPassportByPlayer as jest.Mock;
  const mockGenerateQRCodeValue = (passportService as any).generateQRCodeValue as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPassportByPlayer.mockResolvedValue(mockPassport);
    mockGenerateQRCodeValue.mockReturnValue('https://arcane.example/passport/token-1');
  });

  it('renders profile card and keeps QR hidden by default', async () => {
    const route = { params: { playerId: 'player-1' } } as any;

    const { getByText, queryByText, getByTestId } = render(
      <PassportPreviewScreen navigation={navigation} route={route} />,
    );

    await waitFor(() => {
      expect(getByText('Kylian Mbappé')).toBeTruthy();
    });

    expect(queryByText('QR secondaire (fallback)')).toBeNull();

    fireEvent.press(getByTestId('passport-preview-toggle-qr'));

    await waitFor(() => {
      expect(getByText('QR secondaire (fallback)')).toBeTruthy();
    });
  });

  it('navigates back to ClubNeeds with addToShare payload', async () => {
    const route = {
      params: {
        playerId: 'player-1',
        source: {
          requestId: '11111111-1111-4111-8111-111111111111',
          lineNumber: 2,
          clubName: 'Mallorca',
        },
      },
    } as any;

    const { getByTestId } = render(
      <PassportPreviewScreen navigation={navigation} route={route} />,
    );

    await waitFor(() => {
      expect(getByTestId('passport-preview-add-to-share')).toBeTruthy();
    });

    fireEvent.press(getByTestId('passport-preview-add-to-share'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      'ClubNeeds',
      expect.objectContaining({
        addToShare: expect.objectContaining({
          requestId: '11111111-1111-4111-8111-111111111111',
          lineNumber: 2,
          player: expect.objectContaining({
            playerId: 'player-1',
            position: 'Striker',
            nationality: 'France',
          }),
        }),
      }),
    );
  });
});
