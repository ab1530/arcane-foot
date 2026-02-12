import type { Club } from '../types';

const COUNTRY_CODE_MAP: Record<string, string> = {
  france: 'fr',
  french: 'fr',
  spain: 'es',
  spanish: 'es',
  england: 'gb',
  english: 'gb',
  uk: 'gb',
  'united kingdom': 'gb',
  'united states': 'us',
  usa: 'us',
  american: 'us',
  brazil: 'br',
  brazilian: 'br',
  argentina: 'ar',
  argentinian: 'ar',
  germany: 'de',
  german: 'de',
  italy: 'it',
  italian: 'it',
  portugal: 'pt',
  portuguese: 'pt',
  belgium: 'be',
  belgian: 'be',
  netherlands: 'nl',
  dutch: 'nl',
  senegal: 'sn',
  morocco: 'ma',
  algeria: 'dz',
  cameroon: 'cm',
  canada: 'ca',
  mexico: 'mx',
  turkey: 'tr',
  croatia: 'hr',
  sweden: 'se',
  norway: 'no',
  poland: 'pl',
};

const FLAG_CDN = 'https://flagcdn.com/w40';

export const getFlagUrl = (nationality?: string | null): string | null => {
  if (!nationality) return null;
  const key = nationality.trim().toLowerCase();
  const normalized = key.replace(/[^a-z]/g, '');
  const code =
    COUNTRY_CODE_MAP[key] ||
    COUNTRY_CODE_MAP[normalized] ||
    (key.length === 2 ? key : null) ||
    null;
  if (!code) return null;
  return `${FLAG_CDN}/${code}.png`;
};

export const getClubLogo = (club?: Pick<Club, 'logo'> | null): string | null => {
  if (!club?.logo) return null;
  return club.logo;
};
