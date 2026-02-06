import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AutoScoutScreen } from '../AutoScoutScreen';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { translations } from '../../../i18n';
import autoScoutApi from '../../../services/api/auto-scout';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('../../../services/api/auto-scout', () => ({
  __esModule: true,
  default: {
    getAnalytics: jest.fn(),
    generate: jest.fn(),
  },
}));

jest.mock('../../../contexts/LocalizationContext', () => ({
  useLocalization: jest.fn(),
}));

jest.mock('../../../components/auto-scout/TemplateSelector', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    TemplateSelector: ({ onSelectTemplate }: any) => (
      <TouchableOpacity
        testID="mock-template-selector"
        onPress={() => onSelectTemplate('template-1', 'MATCH_PERFORMANCE')}
      >
        <Text>mock-template</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../../components/auto-scout/PlayerConfig', () => {
  const React = require('react');
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    PlayerConfig: ({ onPlayerSelect }: any) => (
      <View>
        <TouchableOpacity testID="mock-player-select" onPress={() => onPlayerSelect('player-1', 'Jean Dupont')}>
          <Text>mock-player</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock('../../../components/auto-scout/GenerationProgress', () => ({
  GenerationProgress: () => null,
}));

jest.mock('../../../components/auto-scout/ReportPreview', () => ({
  ReportPreview: () => null,
}));

const mockUseLocalization = useLocalization as jest.Mock;
const mockApi = autoScoutApi as unknown as {
  getAnalytics: jest.Mock;
  generate: jest.Mock;
};

const mockLocalization = (lang: 'fr' | 'en') => ({
  language: lang,
  setLanguage: jest.fn(),
  t: jest.fn(),
  dictionary: translations[lang],
});

describe('AutoScoutScreen i18n', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  } as any;

  const alertSpy = Alert.alert as jest.Mock;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalization.mockReturnValue(mockLocalization('fr'));
    mockApi.getAnalytics.mockResolvedValue({ data: {} });
    mockApi.generate.mockResolvedValue({ success: true, data: null });
    alertSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockReset();
  });

  it('affiche les libellés principaux en français', async () => {
    const { getByText } = render(<AutoScoutScreen navigation={navigation} route={undefined as any} />);
    await waitFor(() => expect(mockApi.getAnalytics).toHaveBeenCalled());

    expect(getByText(translations.fr.autoScout.wizard.header.title)).toBeTruthy();
    expect(getByText(translations.fr.autoScout.wizard.navigation.continue)).toBeTruthy();
    expect(getByText(translations.fr.autoScout.wizard.template.title)).toBeTruthy();
  });

  it('déclenche les alertes localisées lors d’un échec de génération', async () => {
    mockApi.generate.mockRejectedValue({ response: { status: 429 } });
    const { getByTestId, getByText, getAllByText } = render(
      <AutoScoutScreen navigation={navigation} route={undefined as any} />
    );
    await waitFor(() => expect(mockApi.getAnalytics).toHaveBeenCalled());

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fireEvent.press(getByTestId('mock-template-selector'));
    fireEvent.press(getByText(translations.fr.autoScout.wizard.navigation.continue));
    await waitFor(() => expect(getByTestId('mock-player-select')).toBeTruthy());
    fireEvent.press(getByTestId('mock-player-select'));
    await act(async () => {});
    const generateButton = getByTestId('auto-scout-generate-button');
    expect(generateButton.props.disabled).toBeFalsy();
    fireEvent.press(generateButton);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => expect(mockApi.generate).toHaveBeenCalled());

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        translations.fr.autoScout.wizard.alerts.save.errorTitle,
        translations.fr.autoScout.wizard.alerts.failure.message
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
