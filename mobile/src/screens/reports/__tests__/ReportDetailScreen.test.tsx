import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ReportDetailScreen from '../ReportDetailScreen';
import { scoutingReportsApi } from '../../../services/api/scouting-reports';
import { Alert } from 'react-native';

jest.mock('../../../services/api/scouting-reports', () => ({
  scoutingReportsApi: {
    getById: jest.fn(),
    submit: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockUseRoute(),
}));

const mockReport = {
  id: 'report-1',
  status: 'APPROVED',
  player: {
    position: 'Forward',
    user: { firstName: 'Kylian', lastName: 'Mbappé' },
  },
  scout: { firstName: 'Louis', lastName: 'Scout', email: 'scout@arcane.gg' },
  match: {
    homeClub: { name: 'PSG' },
    awayClub: { name: 'OM' },
    date: '2024-01-10T18:00:00.000Z',
    homeScore: 2,
    awayScore: 1,
  },
  overallRating: 85,
  technicalRating: 90,
  physicalRating: 82,
  mentalRating: 80,
  tacticalRating: 78,
  strengths: 'Rapidité impressionnante',
  weaknesses: 'Décisions parfois précipitées',
  conclusion: 'Profil à suivre de près',
  recommendation: 'BUY_NOW',
  recommendationNotes: 'Recruter dès cette fenêtre',
  tags: ['rapide', 'butteur'],
  createdAt: '2024-01-01T12:00:00.000Z',
  submittedAt: '2024-01-02T12:00:00.000Z',
  reviewedAt: '2024-01-03T12:00:00.000Z',
} as any;

const draftReport = { ...mockReport, id: 'report-draft', status: 'DRAFT' };

const mockGetById = scoutingReportsApi.getById as jest.Mock;
const mockSubmit = scoutingReportsApi.submit as jest.Mock;
const mockDelete = scoutingReportsApi.delete as jest.Mock;

describe('ReportDetailScreen', () => {
  const alertSpy = Alert.alert as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.goBack = jest.fn();
    mockNavigation.navigate = jest.fn();
    mockUseRoute.mockReturnValue({ params: { reportId: 'report-1' } });
    mockGetById.mockResolvedValue(mockReport);
    alertSpy.mockReset();
  });

  it('affiche un indicateur de chargement au démarrage', () => {
    mockGetById.mockReturnValue(new Promise(() => {}));
    const { getByTestId } = render(<ReportDetailScreen />);
    expect(getByTestId('report-detail-loading-indicator')).toBeTruthy();
  });

  it('charge et affiche les informations du rapport', async () => {
    const { getAllByText, getByText } = render(<ReportDetailScreen />);

    await waitFor(() => {
      expect(getAllByText('Kylian Mbappé').length).toBeGreaterThan(0);
      expect(getAllByText('PSG vs OM').length).toBeGreaterThan(0);
      expect(getByText('Rapidité impressionnante')).toBeTruthy();
      expect(getByText('Recruter maintenant')).toBeTruthy();
    });
  });

  it('soumet un rapport en brouillon après confirmation', async () => {
    mockUseRoute.mockReturnValue({ params: { reportId: 'report-draft' } });
    mockGetById.mockResolvedValue(draftReport);
    mockSubmit.mockResolvedValue({ ...draftReport, status: 'SUBMITTED' });

    alertSpy.mockImplementation((_title, _message, buttons) => {
      const submitButton = buttons?.find((btn) => btn.text === 'Soumettre');
      if (submitButton?.onPress) {
        submitButton.onPress();
      }
    });

    const { getByTestId } = render(<ReportDetailScreen />);

    await waitFor(() => expect(getByTestId('report-detail-submit')).toBeTruthy());

    fireEvent.press(getByTestId('report-detail-submit'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('report-draft');
    });
  });

  it('supprime un rapport après confirmation', async () => {
    mockDelete.mockResolvedValue(undefined);
    alertSpy.mockImplementation((_title, _message, buttons) => {
      const deleteButton = buttons?.find((btn) => btn.text === 'Supprimer');
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });

    const { getByTestId } = render(<ReportDetailScreen />);

    await waitFor(() => expect(getByTestId('report-detail-delete')).toBeTruthy());

    fireEvent.press(getByTestId('report-detail-delete'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('report-1');
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('gère une erreur lors du chargement du rapport', async () => {
    const error = new Error('Network down');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetById.mockRejectedValueOnce(error);
    alertSpy.mockImplementation(() => {});

    render(<ReportDetailScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de charger le rapport');
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
