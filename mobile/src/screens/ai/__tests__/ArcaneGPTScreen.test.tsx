import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ArcaneGPTScreen } from '../ArcaneGPTScreen';
import api from '../../../services/api';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    chatWithArkaneGPT: jest.fn().mockResolvedValue({ summary: 'Test response' }),
  },
  api: {
    chatWithArkaneGPT: jest.fn().mockResolvedValue({ summary: 'Test response' }),
  },
}));

const createNavigation = () => ({ goBack: jest.fn() });
const mockApi = api as unknown as { chatWithArkaneGPT: jest.Mock };

describe('ArcaneGPTScreen', () => {
  it('renders header text', async () => {
    const { getByText } = render(<ArcaneGPTScreen navigation={createNavigation()} />);
    await waitFor(() => expect(getByText('ArkaneGPT')).toBeTruthy());
  });

  it('envoie une question et affiche la réponse IA', async () => {
    mockApi.chatWithArkaneGPT.mockResolvedValueOnce({ summary: 'Réponse IA' });

    const { getByTestId, getByText } = render(<ArcaneGPTScreen navigation={createNavigation()} />);

    fireEvent.changeText(getByTestId('arkane-gpt-input'), 'Qui est le meilleur attaquant ?');
    fireEvent.press(getByTestId('arkane-gpt-send-button'));

    await waitFor(() => expect(getByText('Réponse IA')).toBeTruthy());
    expect(mockApi.chatWithArkaneGPT).toHaveBeenCalledWith('Qui est le meilleur attaquant ?');
  });

  it('affiche un message de secours en cas d’erreur IA', async () => {
    mockApi.chatWithArkaneGPT.mockRejectedValueOnce(new Error('AI down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByTestId, getByText } = render(<ArcaneGPTScreen navigation={createNavigation()} />);

    fireEvent.changeText(getByTestId('arkane-gpt-input'), 'Mon message');
    fireEvent.press(getByTestId('arkane-gpt-send-button'));

    await waitFor(() =>
      expect(
        getByText("Je rencontre un souci pour répondre. Peux-tu reformuler ta question ?")
      ).toBeTruthy()
    );

    consoleSpy.mockRestore();
  });
});
