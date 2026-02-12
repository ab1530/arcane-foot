import type { Language as SharedLanguage } from '@shared/i18n';
import { en, ENTranslations } from './locales/en';
import { fr, FRTranslations } from './locales/fr';

export type Language = SharedLanguage;
export type TranslationShape = FRTranslations & ENTranslations;

export const translations = {
  fr,
  en,
} satisfies Record<Language, TranslationShape>;

export type TranslationPaths<T> = T extends object
  ? {
      [K in keyof T & (string | number)]: T[K] extends object
        ? `${K}` | `${K}.${TranslationPaths<T[K]>}`
        : `${K}`;
    }[keyof T & (string | number)]
  : never;

export type TranslationKey = TranslationPaths<typeof fr>;
