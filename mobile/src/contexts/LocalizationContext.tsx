import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTranslator } from '@shared/i18n';
import { translations, Language } from '../i18n';

const STORAGE_KEY = '@arcane.language';

type LocalizationContextValue = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, variables?: Record<string, string | number>) => string;
  dictionary: (typeof translations)[Language];
};

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

const fallbackTranslator = createTranslator(translations.fr);

const FALLBACK_VALUE: LocalizationContextValue = {
  language: 'fr',
  setLanguage: async () => {},
  t: fallbackTranslator,
  dictionary: translations.fr,
};

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'fr' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (error) {
        console.warn('[Localization] Unable to read AsyncStorage', error);
      } finally {
        setHydrated(true);
      }
    };
    load();
  }, []);

  const setLanguage = useCallback(async (next: Language) => {
    setLanguageState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      console.warn('[Localization] Unable to persist language', error);
    }
  }, []);

  const dictionary = translations[language];

  const t = useMemo(() => createTranslator(dictionary), [dictionary]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      dictionary,
    }),
    [language, setLanguage, t, dictionary],
  );

  if (!hydrated) {
    return null;
  }

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Localization] useLocalization fallback used outside provider');
    }
    return FALLBACK_VALUE;
  }
  return context;
};
