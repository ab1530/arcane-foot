export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type TranslationVariables = Record<string, string | number>;

export type TranslationDictionary = Record<string, any>;

const traverse = (key: string, dictionary: TranslationDictionary): string | undefined => {
  return key
    .split('.')
    .reduce<any>((acc, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return acc[part];
      }
      return undefined;
    }, dictionary) as string | undefined;
};

export const resolveTranslationKey = (key: string, dictionary: TranslationDictionary) => {
  return traverse(key, dictionary);
};

export const replaceTranslationVariables = (
  value: string,
  variables?: TranslationVariables,
) => {
  if (!variables) return value;
  return Object.keys(variables).reduce(
    (acc, token) => acc.replaceAll(`{{${token}}}`, String(variables[token])),
    value,
  );
};

export const translate = (
  dictionary: TranslationDictionary,
  key: string,
  variables?: TranslationVariables,
) => {
  const raw = resolveTranslationKey(key, dictionary);
  return typeof raw === 'string' ? replaceTranslationVariables(raw, variables) : key;
};

export const createTranslator = (dictionary: TranslationDictionary) => {
  return (key: string, variables?: TranslationVariables) =>
    translate(dictionary, key, variables);
};
