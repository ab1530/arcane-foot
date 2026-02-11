import { resolveTranslationKey, type Language as SharedLanguage } from '@shared/i18n';
import { en, ENTranslations } from './locales/en';
import { fr, FRTranslations } from './locales/fr';

export type Language = SharedLanguage;
export type TranslationShape = FRTranslations & ENTranslations;

export const translations = {
  fr,
  en,
} satisfies Record<Language, TranslationShape>;

export const translationHelpers = {
  resolveKey: resolveTranslationKey,
};
