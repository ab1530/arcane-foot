import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  FileDown,
  ListFilter,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, typography } from '../../design/theme';
import { EmptyState, GlassCard, LoadingSpinner } from '../../components/ui';
import ScoutCard from '../../components/marketplace/ScoutCard';
import { marketplaceApi } from '../../services/marketplace.api';
import { api } from '../../services/api';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { isFeatureEnabled } from '../../constants/features';
import { logError } from '../../utils/logger';
import type { Club, Player } from '../../types';
import type { MarketplaceListing } from '../../types/marketplace';
import type {
  CreateTransferRequestInput,
  TransferMarketCountryItem,
  TransferMarketFilters,
  TransferMarketLeagueItem,
  TransferRequest,
  TransferRequestActivity,
  TransferRequestPriority,
  TransferRequestStatus,
  TransferRequestVisibility,
  TransferSuggestion,
  TransferSuggestionStatus,
} from '../../types/transfer-market';

type Segment = 'REQUESTS' | 'LEGACY';
type ScopeStep = 'COUNTRIES' | 'LEAGUES' | 'REQUESTS';
type CreateMode = 'STRUCTURED' | 'LEGACY_RAW';

type ClubNeedProgress = 'ACTIVE' | 'PARTIAL' | 'COMPLETED';

type LegacyClubNeedLine = {
  lineNumber: number;
  clubName: string;
  positions?: string[];
  age?: { min?: number; max?: number };
  preferredFoot?: string;
};

type LegacyClubNeedLineState = {
  lineNumber: number;
  clubName?: string;
  isCompleted?: boolean;
};

type LegacyClubNeedMatchLine = {
  lineNumber: number;
  clubName: string;
  players?: Array<{ playerId: string }>;
};

type LegacyClubNeedRequest = {
  id: string;
  createdById: string;
  rawText: string;
  parsed?: LegacyClubNeedLine[];
  lineStates?: LegacyClubNeedLineState[];
  createdAt: string;
  updatedAt?: string;
  linesTotal?: number;
  linesCompleted?: number;
  requestProgress?: ClubNeedProgress;
};

const STATUS_FILTERS: Array<'ALL' | TransferRequestStatus> = [
  'ALL',
  'OPEN',
  'IN_DISCUSSION',
  'CLOSED',
];

const PRIORITY_FILTERS: Array<'ALL' | TransferRequestPriority> = [
  'ALL',
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const VISIBILITY_FILTERS: Array<'ALL' | TransferRequestVisibility> = ['ALL', 'PRIVATE', 'SHARED'];

const suggestionStatusOptions: TransferSuggestionStatus[] = ['PROPOSED', 'SHORTLISTED', 'REJECTED'];

const statusLabelMap: Record<TransferRequestStatus, string> = {
  OPEN: 'Ouverte',
  IN_DISCUSSION: 'En discussion',
  CLOSED: 'Fermée',
};

const priorityLabelMap: Record<TransferRequestPriority, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

const visibilityLabelMap: Record<TransferRequestVisibility, string> = {
  PRIVATE: 'Privée',
  SHARED: 'Partagée',
};

const suggestionStatusLabelMap: Record<TransferSuggestionStatus, string> = {
  PROPOSED: 'Proposé',
  SHORTLISTED: 'Shortlisté',
  REJECTED: 'Rejeté',
};

const DEFAULT_FREE_REQUEST_MARKETS: Record<string, string[]> = {
  FR: ['Ligue 1', 'Ligue 2', 'National'],
  DE: ['Bundesliga', '2. Bundesliga', '3. Liga'],
  GB: ['Premier League', 'Championship', 'League One', 'League Two'],
  ES: ['La Liga', 'LaLiga 2', 'Primera RFEF'],
};

const LEAGUE_LOGO_RULES: Array<{
  pattern: RegExp;
  logoUri: string;
  shortLabel: string;
  countryCode: string;
  accentColor: string;
}> = [
  {
    pattern: /ligue\s*1/i,
    logoUri: 'https://media.api-sports.io/football/leagues/61.png',
    shortLabel: 'L1',
    countryCode: 'FR',
    accentColor: '#E9FF4A',
  },
  {
    pattern: /ligue\s*2/i,
    logoUri: 'https://media.api-sports.io/football/leagues/62.png',
    shortLabel: 'L2',
    countryCode: 'FR',
    accentColor: '#6CCBFF',
  },
  {
    pattern: /national/i,
    logoUri: 'https://media.api-sports.io/football/leagues/63.png',
    shortLabel: 'NAT',
    countryCode: 'FR',
    accentColor: '#8B7CFF',
  },
  {
    pattern: /^bundesliga$/i,
    logoUri: 'https://media.api-sports.io/football/leagues/78.png',
    shortLabel: 'BL',
    countryCode: 'DE',
    accentColor: '#FF5C75',
  },
  {
    pattern: /2\.\s*bundesliga/i,
    logoUri: 'https://media.api-sports.io/football/leagues/79.png',
    shortLabel: '2BL',
    countryCode: 'DE',
    accentColor: '#FF8AA3',
  },
  {
    pattern: /3\.\s*liga/i,
    logoUri: 'https://media.api-sports.io/football/leagues/80.png',
    shortLabel: '3L',
    countryCode: 'DE',
    accentColor: '#FFB4C3',
  },
  {
    pattern: /premier\s*league/i,
    logoUri: 'https://media.api-sports.io/football/leagues/39.png',
    shortLabel: 'EPL',
    countryCode: 'GB',
    accentColor: '#B87BFF',
  },
  {
    pattern: /championship/i,
    logoUri: 'https://media.api-sports.io/football/leagues/40.png',
    shortLabel: 'CH',
    countryCode: 'GB',
    accentColor: '#7FD7FF',
  },
  {
    pattern: /league\s*one/i,
    logoUri: 'https://media.api-sports.io/football/leagues/41.png',
    shortLabel: 'L1',
    countryCode: 'GB',
    accentColor: '#7FD7FF',
  },
  {
    pattern: /league\s*two/i,
    logoUri: 'https://media.api-sports.io/football/leagues/42.png',
    shortLabel: 'L2',
    countryCode: 'GB',
    accentColor: '#7FD7FF',
  },
  {
    pattern: /la\s*liga/i,
    logoUri: 'https://media.api-sports.io/football/leagues/140.png',
    shortLabel: 'LL',
    countryCode: 'ES',
    accentColor: '#6BEFAF',
  },
  {
    pattern: /laliga\s*2|segunda/i,
    logoUri: 'https://media.api-sports.io/football/leagues/141.png',
    shortLabel: 'LL2',
    countryCode: 'ES',
    accentColor: '#7FD7FF',
  },
  {
    pattern: /primera\s*(r?fef|federaci[oó]n|federation)/i,
    logoUri: 'https://media.api-sports.io/football/leagues/435.png',
    shortLabel: 'RFEF',
    countryCode: 'ES',
    accentColor: '#9FD866',
  },
];

const clubNeedProgressLabelMap: Record<ClubNeedProgress, string> = {
  ACTIVE: 'Active',
  PARTIAL: 'Partielle',
  COMPLETED: 'Terminée',
};

const normalizeRole = (role?: string | null) => String(role ?? '').trim().toUpperCase();

const fullName = (person?: { firstName?: string | null; lastName?: string | null } | null) => {
  const label = `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim();
  return label || 'Inconnu';
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (value?: number | null, currency?: string | null) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const resolvedCurrency = currency || 'EUR';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: resolvedCurrency,
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const parseOptionalInt = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const COUNTRY_CODE_TO_LABEL: Record<string, string> = {
  FR: 'France',
  DE: 'Allemagne',
  IT: 'Italie',
  ES: 'Espagne',
  GB: 'Angleterre',
  PT: 'Portugal',
  NL: 'Pays-Bas',
  BE: 'Belgique',
  CH: 'Suisse',
  AT: 'Autriche',
  IE: 'Irlande',
  PL: 'Pologne',
  CZ: 'République tchèque',
  RO: 'Roumanie',
  HU: 'Hongrie',
  DK: 'Danemark',
  SE: 'Suède',
  NO: 'Norvège',
  FI: 'Finlande',
  TR: 'Turquie',
  HR: 'Croatie',
  RS: 'Serbie',
  GR: 'Grèce',
  UA: 'Ukraine',
  US: 'États-Unis',
  CA: 'Canada',
  MX: 'Mexique',
  BR: 'Brésil',
  AR: 'Argentine',
  UY: 'Uruguay',
  CL: 'Chili',
  CO: 'Colombie',
  MA: 'Maroc',
  DZ: 'Algérie',
  TN: 'Tunisie',
  EG: 'Égypte',
  CM: 'Cameroun',
  SN: 'Sénégal',
  CI: "Côte d'Ivoire",
  GH: 'Ghana',
  NG: 'Nigeria',
  ZA: 'Afrique du Sud',
  QA: 'Qatar',
  SA: 'Arabie saoudite',
  AE: 'Émirats arabes unis',
  JP: 'Japon',
  KR: 'Corée du Sud',
  CN: 'Chine',
  AU: 'Australie',
  NZ: 'Nouvelle-Zélande',
  HT: 'Haïti',
};

const COUNTRY_CODE_ALIASES: Record<string, string> = {
  UK: 'GB',
  ENG: 'GB',
  FRA: 'FR',
  DEU: 'DE',
  GER: 'DE',
  ITA: 'IT',
  ESP: 'ES',
  PRT: 'PT',
  NLD: 'NL',
  BEL: 'BE',
  CHE: 'CH',
  AUT: 'AT',
  POL: 'PL',
  CZE: 'CZ',
  ROU: 'RO',
  HUN: 'HU',
  DNK: 'DK',
  SWE: 'SE',
  NOR: 'NO',
  FIN: 'FI',
  TUR: 'TR',
  HRV: 'HR',
  SRB: 'RS',
  GRC: 'GR',
  UKR: 'UA',
  USA: 'US',
  CAN: 'CA',
  MEX: 'MX',
  BRA: 'BR',
  ARG: 'AR',
  URY: 'UY',
  CHL: 'CL',
  COL: 'CO',
  MAR: 'MA',
  ALG: 'DZ',
  TUN: 'TN',
  EGY: 'EG',
  CMR: 'CM',
  SEN: 'SN',
  CIV: 'CI',
  GHA: 'GH',
  NGA: 'NG',
  ZAF: 'ZA',
  QAT: 'QA',
  SAU: 'SA',
  ARE: 'AE',
  JPN: 'JP',
  KOR: 'KR',
  CHN: 'CN',
  AUS: 'AU',
  NZL: 'NZ',
  HTI: 'HT',
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  france: 'FR',
  germany: 'DE',
  allemagne: 'DE',
  italy: 'IT',
  italie: 'IT',
  spain: 'ES',
  espagne: 'ES',
  england: 'GB',
  angleterre: 'GB',
  portugal: 'PT',
  'pays-bas': 'NL',
  netherlands: 'NL',
  belgique: 'BE',
  belgium: 'BE',
  switzerland: 'CH',
  suisse: 'CH',
  austria: 'AT',
  autriche: 'AT',
  ireland: 'IE',
  irlande: 'IE',
  poland: 'PL',
  pologne: 'PL',
  croatia: 'HR',
  croatie: 'HR',
  serbia: 'RS',
  serbie: 'RS',
  greece: 'GR',
  grece: 'GR',
  'grèce': 'GR',
  ukraine: 'UA',
  usa: 'US',
  'etats-unis': 'US',
  'états-unis': 'US',
  canada: 'CA',
  mexico: 'MX',
  mexique: 'MX',
  brazil: 'BR',
  bresil: 'BR',
  brésil: 'BR',
  argentina: 'AR',
  argentine: 'AR',
  uruguay: 'UY',
  chili: 'CL',
  colombia: 'CO',
  colombie: 'CO',
  morocco: 'MA',
  maroc: 'MA',
  algeria: 'DZ',
  algerie: 'DZ',
  algérie: 'DZ',
  tunisia: 'TN',
  tunisie: 'TN',
  egypt: 'EG',
  egypte: 'EG',
  égypte: 'EG',
  cameroon: 'CM',
  cameroun: 'CM',
  senegal: 'SN',
  sénégal: 'SN',
  ghana: 'GH',
  nigeria: 'NG',
  'south africa': 'ZA',
  'afrique du sud': 'ZA',
  qatar: 'QA',
  'saudi arabia': 'SA',
  'arabie saoudite': 'SA',
  'united arab emirates': 'AE',
  'emirats arabes unis': 'AE',
  'émirats arabes unis': 'AE',
  japan: 'JP',
  japon: 'JP',
  'south korea': 'KR',
  'corée du sud': 'KR',
  'coree du sud': 'KR',
  china: 'CN',
  chine: 'CN',
  australia: 'AU',
  australie: 'AU',
  'new zealand': 'NZ',
  'nouvelle-zélande': 'NZ',
  'nouvelle-zelande': 'NZ',
  'haïti': 'HT',
  haiti: 'HT',
};

const normalizeCountryCode = (raw?: string | null): string | null => {
  const source = String(raw ?? '').trim();
  if (!source) return null;

  const upper = source.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  if (COUNTRY_CODE_ALIASES[upper]) return COUNTRY_CODE_ALIASES[upper];

  const lower = source.toLowerCase();
  if (COUNTRY_NAME_TO_CODE[lower]) return COUNTRY_NAME_TO_CODE[lower];

  return null;
};

const flagFromCountryCode = (code?: string | null): string => {
  if (!code || code.length !== 2) return '🏳️';
  const points = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
};

const formatCountryDisplay = (raw?: string | null): string => {
  const source = String(raw ?? '').trim();
  if (!source) return '🏳️ Pays inconnu';

  const code = normalizeCountryCode(source);
  if (!code) return `🏳️ ${source}`;

  const label = COUNTRY_CODE_TO_LABEL[code] ?? source;
  return `${flagFromCountryCode(code)} ${label}`;
};

const mergeDefaultCountries = (items: TransferMarketCountryItem[]): TransferMarketCountryItem[] => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const country = String(item.country ?? '').trim();
    if (!country) return;
    map.set(country, (map.get(country) ?? 0) + Number(item.requestsCount ?? 0));
  });

  Object.keys(DEFAULT_FREE_REQUEST_MARKETS).forEach((country) => {
    if (!map.has(country)) {
      map.set(country, 0);
    }
  });

  const preferred = ['FR', 'DE', 'GB', 'ES'];
  return Array.from(map.entries())
    .map(([country, requestsCount]) => ({ country, requestsCount }))
    .sort((a, b) => {
      const rankA = preferred.indexOf(a.country);
      const rankB = preferred.indexOf(b.country);
      if (rankA !== rankB) {
        if (rankA === -1) return 1;
        if (rankB === -1) return -1;
        return rankA - rankB;
      }
      return a.country.localeCompare(b.country, undefined, { sensitivity: 'base' });
    });
};

const mergeDefaultLeagues = (
  country: string,
  items: TransferMarketLeagueItem[],
): TransferMarketLeagueItem[] => {
  const normalizedCountry = normalizeCountryCode(country) ?? country;
  const defaults = DEFAULT_FREE_REQUEST_MARKETS[normalizedCountry] ?? [];

  if (defaults.length === 0) {
    return items;
  }

  const map = new Map<string, number>();
  items.forEach((item) => {
    const league = String(item.league ?? '').trim();
    if (!league) return;
    map.set(league, (map.get(league) ?? 0) + Number(item.requestsCount ?? 0));
  });
  defaults.forEach((league) => {
    if (!map.has(league)) {
      map.set(league, 0);
    }
  });

  return Array.from(map.entries())
    .map(([league, requestsCount]) => ({ league, requestsCount }))
    .sort((a, b) => {
      const rankA = defaults.indexOf(a.league);
      const rankB = defaults.indexOf(b.league);
      if (rankA !== rankB) {
        if (rankA === -1) return 1;
        if (rankB === -1) return -1;
        return rankA - rankB;
      }
      return a.league.localeCompare(b.league, undefined, { sensitivity: 'base' });
    });
};

const guessCountryCodeFromLeague = (
  league: string,
  selectedCountry?: string | null,
): string | null => {
  const selected = normalizeCountryCode(selectedCountry);
  if (selected) return selected;

  const normalizedLeague = String(league ?? '').trim();
  if (!normalizedLeague) return null;

  const match = LEAGUE_LOGO_RULES.find((rule) => rule.pattern.test(normalizedLeague));
  return match?.countryCode ?? null;
};

const getLeagueVisual = (league: string, selectedCountry?: string | null) => {
  const normalizedLeague = String(league ?? '').trim();
  const match = LEAGUE_LOGO_RULES.find((rule) => rule.pattern.test(normalizedLeague));
  const countryCode = guessCountryCodeFromLeague(normalizedLeague, selectedCountry);

  return {
    countryCode,
    logoUri: match?.logoUri || null,
    shortLabel: match?.shortLabel || normalizedLeague.slice(0, 3).toUpperCase(),
    accentColor: match?.accentColor || '#374151',
  };
};

const roleCanOpenHub = (role: string) =>
  ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SCOUT'].includes(role);

const roleCanCreateRequest = (role: string) => ['SUPER_ADMIN', 'ADMIN', 'AGENT'].includes(role);

const roleIsAdmin = (role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role);

const roleCanSuggest = (role: string) => role === 'SCOUT';

const buildRequirementsRows = (request: TransferRequest): Array<{ label: string; value: string }> => {
  const requirements = request.requirements ?? {};
  const rows: Array<{ label: string; value: string }> = [];

  if (requirements.position) rows.push({ label: 'Poste', value: requirements.position });

  if (requirements.ageMin != null || requirements.ageMax != null) {
    rows.push({
      label: 'Âge',
      value: `${requirements.ageMin ?? '?'} - ${requirements.ageMax ?? '?'}`,
    });
  }

  if (requirements.birthYearMin != null || requirements.birthYearMax != null) {
    rows.push({
      label: 'Année naissance',
      value: `${requirements.birthYearMin ?? '?'} - ${requirements.birthYearMax ?? '?'}`,
    });
  }

  if (requirements.budgetMin != null || requirements.budgetMax != null) {
    rows.push({
      label: 'Budget',
      value: `${formatMoney(requirements.budgetMin, requirements.currency)} -> ${formatMoney(
        requirements.budgetMax,
        requirements.currency,
      )}`,
    });
  }

  if (requirements.dealType) rows.push({ label: 'Deal', value: requirements.dealType });
  if (requirements.timing) rows.push({ label: 'Timing', value: requirements.timing });

  if (requirements.euPassportRequired != null) {
    rows.push({
      label: 'Passeport UE',
      value: requirements.euPassportRequired ? 'Oui' : 'Non',
    });
  }

  return rows;
};

const buildPlayerDisplayName = (player?: Player | null) => {
  if (!player) return 'Joueur';
  const label = `${player.user?.firstName ?? player.firstName ?? ''} ${
    player.user?.lastName ?? player.lastName ?? ''
  }`.trim();
  return label || 'Joueur';
};

const MarketplaceScreen: React.FC = () => {
  const { dictionary } = useLocalization();
  const { user, activeRole } = useAuth();
  const role = normalizeRole(activeRole ?? user?.role);
  const isHubEnabled = isFeatureEnabled('transferMarketHub');
  const canOpenHub = isHubEnabled && roleCanOpenHub(role);
  const canCreateRequest = roleCanCreateRequest(role);
  const canSuggestPlayers = roleCanSuggest(role);
  const canUseLegacyRawMode = roleIsAdmin(role);

  const navigation = useNavigation<any>();
  const [segment, setSegment] = useState<Segment>('REQUESTS');

  const [scoutSearch, setScoutSearch] = useState('');
  const [scoutListings, setScoutListings] = useState<MarketplaceListing[]>([]);
  const [loadingScouts, setLoadingScouts] = useState(false);
  const [refreshingScouts, setRefreshingScouts] = useState(false);

  const [scopeStep, setScopeStep] = useState<ScopeStep>('COUNTRIES');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const [countries, setCountries] = useState<TransferMarketCountryItem[]>([]);
  const [leagues, setLeagues] = useState<TransferMarketLeagueItem[]>([]);
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [legacyRequests, setLegacyRequests] = useState<LegacyClubNeedRequest[]>([]);
  const [failedLeagueLogos, setFailedLeagueLogos] = useState<Record<string, boolean>>({});

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  const [loadingLegacyRequests, setLoadingLegacyRequests] = useState(false);
  const [refreshingLegacyRequests, setRefreshingLegacyRequests] = useState(false);
  const [legacyMineOnly, setLegacyMineOnly] = useState(true);

  const [filters, setFilters] = useState<{
    status: 'ALL' | TransferRequestStatus;
    priority: 'ALL' | TransferRequestPriority;
    visibility: 'ALL' | TransferRequestVisibility;
    createdByMe: boolean;
  }>({
    status: 'ALL',
    priority: 'ALL',
    visibility: 'ALL',
    createdByMe: role === 'AGENT',
  });
  const [showRequestFiltersModal, setShowRequestFiltersModal] = useState(false);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRequest, setDetailRequest] = useState<TransferRequest | null>(null);
  const [detailSuggestions, setDetailSuggestions] = useState<TransferSuggestion[]>([]);
  const [detailActivity, setDetailActivity] = useState<TransferRequestActivity[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedLegacyRequestId, setSelectedLegacyRequestId] = useState<string | null>(null);
  const [legacyDetail, setLegacyDetail] = useState<{
    request: LegacyClubNeedRequest;
    matches: LegacyClubNeedMatchLine[];
  } | null>(null);
  const [legacyDetailLoading, setLegacyDetailLoading] = useState(false);
  const [legacyDetailTopN, setLegacyDetailTopN] = useState(5);

  const [suggestionPlayers, setSuggestionPlayers] = useState<Player[]>([]);
  const [loadingSuggestionPlayers, setLoadingSuggestionPlayers] = useState(false);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [newSuggestionPlayerId, setNewSuggestionPlayerId] = useState('');
  const [newSuggestionComment, setNewSuggestionComment] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('STRUCTURED');
  const [createRawText, setCreateRawText] = useState('');
  const [createRawTopN, setCreateRawTopN] = useState(5);
  const [clubSearch, setClubSearch] = useState('');
  const [clubOptions, setClubOptions] = useState<Club[]>([]);
  const [loadingClubOptions, setLoadingClubOptions] = useState(false);
  const [showClubMenu, setShowClubMenu] = useState(false);

  const [createForm, setCreateForm] = useState({
    clubId: '',
    clubName: '',
    country: selectedCountry ?? '',
    league: selectedLeague ?? '',
    title: '',
    priority: 'MEDIUM' as TransferRequestPriority,
    visibility: 'PRIVATE' as TransferRequestVisibility,
    deadlineAt: '',
    position: '',
    ageMin: '',
    ageMax: '',
    budgetMin: '',
    budgetMax: '',
    currency: 'EUR',
    dealType: '',
    timing: '',
    euPassportRequired: false,
  });

  const currentUserId = user?.id ?? '';

  const resetCreateForm = useCallback(() => {
    setCreateMode('STRUCTURED');
    setCreateRawText('');
    setCreateRawTopN(5);
    setCreateForm({
      clubId: '',
      clubName: '',
      country: selectedCountry ?? '',
      league: selectedLeague ?? '',
      title: '',
      priority: 'MEDIUM',
      visibility: 'PRIVATE',
      deadlineAt: '',
      position: '',
      ageMin: '',
      ageMax: '',
      budgetMin: '',
      budgetMax: '',
      currency: 'EUR',
      dealType: '',
      timing: '',
      euPassportRequired: false,
    });
    setClubSearch('');
    setShowClubMenu(false);
    setClubOptions([]);
  }, [selectedCountry, selectedLeague]);

  const fetchScouts = useCallback(async () => {
    try {
      setLoadingScouts(true);
      const payload = await marketplaceApi.searchListings({
        search: scoutSearch.trim() || undefined,
        limit: 40,
        page: 1,
      } as any);
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : [];
      setScoutListings(items);
    } catch (error) {
      logError('Failed to fetch scout marketplace listings', error);
      Alert.alert(dictionary.common.feedback.error, 'Impossible de charger les scouts.');
      setScoutListings([]);
    } finally {
      setLoadingScouts(false);
      setRefreshingScouts(false);
    }
  }, [dictionary.common.feedback.error, scoutSearch]);

  const fetchCountries = useCallback(async () => {
    if (!canOpenHub) return;
    try {
      setLoadingCountries(true);
      const payload = await api.listTransferMarketCountries();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setCountries(mergeDefaultCountries(rows));
    } catch (error) {
      logError('Failed to fetch transfer-market countries', error);
      Alert.alert(dictionary.common.feedback.error, 'Impossible de charger les pays du marché.');
      setCountries(mergeDefaultCountries([]));
    } finally {
      setLoadingCountries(false);
    }
  }, [canOpenHub, dictionary.common.feedback.error]);

  const fetchLeagues = useCallback(
    async (country: string) => {
      if (!canOpenHub) return;
      try {
        setLoadingLeagues(true);
        const payload = await api.listTransferMarketLeagues(country);
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setLeagues(mergeDefaultLeagues(country, rows));
      } catch (error) {
        logError('Failed to fetch transfer-market leagues', error);
        Alert.alert(dictionary.common.feedback.error, 'Impossible de charger les ligues du pays.');
        setLeagues(mergeDefaultLeagues(country, []));
      } finally {
        setLoadingLeagues(false);
      }
    },
    [canOpenHub, dictionary.common.feedback.error],
  );

  const fetchRequests = useCallback(async () => {
    if (!selectedCountry || !selectedLeague || !canOpenHub) {
      setRequests([]);
      return;
    }

    const query: TransferMarketFilters = {
      country: selectedCountry,
      league: selectedLeague,
      page: 1,
      limit: 100,
      ...(filters.status !== 'ALL' ? { status: filters.status } : {}),
      ...(filters.priority !== 'ALL' ? { priority: filters.priority } : {}),
      ...(filters.visibility !== 'ALL' ? { visibility: filters.visibility } : {}),
      ...(filters.createdByMe ? { createdByMe: true } : {}),
    };

    try {
      setLoadingRequests(true);
      const payload = await api.listTransferMarketRequests(query);
      setRequests(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      logError('Failed to fetch transfer-market requests', error);
      Alert.alert(dictionary.common.feedback.error, 'Impossible de charger les requests.');
      setRequests([]);
    } finally {
      setLoadingRequests(false);
      setRefreshingRequests(false);
    }
  }, [canOpenHub, dictionary.common.feedback.error, filters, selectedCountry, selectedLeague]);

  const fetchLegacyRequests = useCallback(async () => {
    if (!canUseLegacyRawMode) {
      setLegacyRequests([]);
      return;
    }

    try {
      setLoadingLegacyRequests(true);
      const payload = await api.listClubNeedRequests({ page: 1, limit: 100 });
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : [];

      const normalized = rows as LegacyClubNeedRequest[];
      const filtered = legacyMineOnly
        ? normalized.filter((item) => item.createdById === currentUserId)
        : normalized;

      setLegacyRequests(filtered);
    } catch (error: any) {
      logError('Failed to fetch legacy club-need requests', error);
      if (error?.response?.status !== 403) {
        Alert.alert(dictionary.common.feedback.error, 'Impossible de charger l’historique des demandes libres.');
      }
      setLegacyRequests([]);
    } finally {
      setLoadingLegacyRequests(false);
      setRefreshingLegacyRequests(false);
    }
  }, [canUseLegacyRawMode, currentUserId, dictionary.common.feedback.error, legacyMineOnly]);

  const loadRequestDetail = useCallback(
    async (requestId: string) => {
      try {
        setDetailLoading(true);
        const [request, suggestionsPayload, activityPayload] = await Promise.all([
          api.getTransferMarketRequest(requestId),
          api.listTransferMarketSuggestions(requestId),
          api.listTransferMarketActivity(requestId),
        ]);

        setDetailRequest(request);
        setDetailSuggestions(Array.isArray(suggestionsPayload?.data) ? suggestionsPayload.data : []);
        setDetailActivity(Array.isArray(activityPayload?.data) ? activityPayload.data : []);
      } catch (error) {
        logError('Failed to fetch transfer request detail', error);
        Alert.alert(dictionary.common.feedback.error, 'Impossible de charger le détail de la request.');
        setDetailRequest(null);
        setDetailSuggestions([]);
        setDetailActivity([]);
      } finally {
        setDetailLoading(false);
      }
    },
    [dictionary.common.feedback.error],
  );

  const loadLegacyDetail = useCallback(
    async (requestId: string, topN: number = legacyDetailTopN) => {
      try {
        setLegacyDetailLoading(true);
        const payload = await api.getClubNeedRequest(requestId, topN);
        const request = (payload?.request ?? null) as LegacyClubNeedRequest | null;
        const matches = Array.isArray(payload?.matches) ? (payload.matches as LegacyClubNeedMatchLine[]) : [];

        if (!request) {
          throw new Error('Legacy request payload missing request');
        }

        setLegacyDetail({ request, matches });
      } catch (error) {
        logError('Failed to fetch legacy club-need request detail', error);
        Alert.alert(dictionary.common.feedback.error, 'Impossible de charger le détail de la request club.');
        setLegacyDetail(null);
      } finally {
        setLegacyDetailLoading(false);
      }
    },
    [dictionary.common.feedback.error, legacyDetailTopN],
  );

  const loadSuggestionPlayers = useCallback(async () => {
    if (!canSuggestPlayers) return;
    try {
      setLoadingSuggestionPlayers(true);
      const payload = await api.getPlayers({ search: playerSearch.trim() || undefined, page: 1, limit: 80 });
      setSuggestionPlayers(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      logError('Failed to fetch players for transfer suggestion', error);
      setSuggestionPlayers([]);
    } finally {
      setLoadingSuggestionPlayers(false);
    }
  }, [canSuggestPlayers, playerSearch]);

  const loadClubOptions = useCallback(async () => {
    if (!canCreateRequest) return;
    try {
      setLoadingClubOptions(true);
      const payload = await api.getClubs({ search: clubSearch.trim() || undefined, page: 1, limit: 40 });
      setClubOptions(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      logError('Failed to fetch clubs for transfer request creation', error);
      setClubOptions([]);
    } finally {
      setLoadingClubOptions(false);
    }
  }, [canCreateRequest, clubSearch]);

  useEffect(() => {
    if (canOpenHub) return;
    fetchScouts();
  }, [canOpenHub, fetchScouts]);

  useEffect(() => {
    if (!canOpenHub || segment !== 'REQUESTS') return;
    fetchCountries();
  }, [canOpenHub, fetchCountries, segment]);

  useEffect(() => {
    if (!selectedCountry || !canOpenHub || segment !== 'REQUESTS') return;
    fetchLeagues(selectedCountry);
  }, [canOpenHub, fetchLeagues, segment, selectedCountry]);

  useEffect(() => {
    if (!selectedCountry || !selectedLeague || segment !== 'REQUESTS') return;
    fetchRequests();
  }, [fetchRequests, segment, selectedCountry, selectedLeague]);

  useEffect(() => {
    if (segment !== 'LEGACY') return;
    fetchLegacyRequests();
  }, [fetchLegacyRequests, segment]);

  useEffect(() => {
    if (!selectedRequestId) return;
    loadRequestDetail(selectedRequestId);
  }, [loadRequestDetail, selectedRequestId]);

  useEffect(() => {
    if (!selectedLegacyRequestId) return;
    loadLegacyDetail(selectedLegacyRequestId);
  }, [loadLegacyDetail, selectedLegacyRequestId]);

  useEffect(() => {
    if (!showCreateModal || !canCreateRequest) return;
    loadClubOptions();
  }, [canCreateRequest, loadClubOptions, showCreateModal]);

  useEffect(() => {
    if (!showPlayerMenu || !canSuggestPlayers) return;
    loadSuggestionPlayers();
  }, [canSuggestPlayers, loadSuggestionPlayers, showPlayerMenu]);

  const refreshRequests = useCallback(async () => {
    setRefreshingRequests(true);
    await fetchRequests();
  }, [fetchRequests]);

  const refreshLegacyRequests = useCallback(async () => {
    setRefreshingLegacyRequests(true);
    await fetchLegacyRequests();
  }, [fetchLegacyRequests]);

  const openRequestDetail = useCallback((requestId: string) => {
    setSelectedRequestId(requestId);
  }, []);

  const openLegacyRequestDetail = useCallback((requestId: string) => {
    setLegacyDetailTopN(5);
    setSelectedLegacyRequestId(requestId);
  }, []);

  const closeRequestDetail = useCallback(() => {
    setSelectedRequestId(null);
    setDetailRequest(null);
    setDetailSuggestions([]);
    setDetailActivity([]);
    setShowPlayerMenu(false);
    setPlayerSearch('');
    setNewSuggestionPlayerId('');
    setNewSuggestionComment('');
  }, []);

  const closeLegacyRequestDetail = useCallback(() => {
    setSelectedLegacyRequestId(null);
    setLegacyDetail(null);
    setLegacyDetailTopN(5);
  }, []);

  const canManageCurrentRequest = useMemo(() => {
    if (!detailRequest) return false;
    if (roleIsAdmin(role)) return true;
    return role === 'AGENT' && detailRequest.createdBy?.id === currentUserId;
  }, [currentUserId, detailRequest, role]);

  const selectedPlayer = useMemo(
    () => suggestionPlayers.find((player) => player.id === newSuggestionPlayerId) ?? null,
    [newSuggestionPlayerId, suggestionPlayers],
  );

  const filteredSuggestionPlayers = useMemo(() => {
    if (!playerSearch.trim()) return suggestionPlayers;
    const search = playerSearch.trim().toLowerCase();
    return suggestionPlayers.filter((player) => {
      const name = buildPlayerDisplayName(player).toLowerCase();
      const club = String(player.club?.name ?? '').toLowerCase();
      return name.includes(search) || club.includes(search);
    });
  }, [playerSearch, suggestionPlayers]);

  const selectedClub = useMemo(
    () => clubOptions.find((club) => club.id === createForm.clubId) ?? null,
    [clubOptions, createForm.clubId],
  );

  const filteredClubs = useMemo(() => {
    if (!clubSearch.trim()) return clubOptions;
    const search = clubSearch.trim().toLowerCase();
    return clubOptions.filter((club) => {
      const label = `${club.name} ${club.country ?? ''}`.toLowerCase();
      return label.includes(search);
    });
  }, [clubOptions, clubSearch]);

  const resetRequestFilters = useCallback(() => {
    setFilters({
      status: 'ALL',
      priority: 'ALL',
      visibility: 'ALL',
      createdByMe: role === 'AGENT',
    });
  }, [role]);

  const activeRequestFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'ALL') count += 1;
    if (filters.priority !== 'ALL') count += 1;
    if (filters.visibility !== 'ALL') count += 1;
    if ((role === 'AGENT' || roleIsAdmin(role)) && filters.createdByMe) count += 1;
    return count;
  }, [filters.createdByMe, filters.priority, filters.status, filters.visibility, role]);

  const handleBackScope = useCallback(() => {
    if (scopeStep === 'REQUESTS') {
      setSelectedLeague(null);
      setScopeStep('LEAGUES');
      return;
    }
    if (scopeStep === 'LEAGUES') {
      setSelectedCountry(null);
      setLeagues([]);
      setRequests([]);
      setScopeStep('COUNTRIES');
    }
  }, [scopeStep]);

  const handleSelectCountry = useCallback((country: string) => {
    setSelectedCountry(country);
    setSelectedLeague(null);
    setRequests([]);
    setScopeStep('LEAGUES');
    setCreateForm((prev) => ({ ...prev, country }));
  }, []);

  const handleSelectLeague = useCallback((league: string) => {
    setSelectedLeague(league);
    setScopeStep('REQUESTS');
    setCreateForm((prev) => ({ ...prev, league }));
  }, []);

  const handleUpdateRequest = useCallback(
    async (payload: Partial<TransferRequest>) => {
      if (!detailRequest?.id || !canManageCurrentRequest) return;
      try {
        setActionLoading(true);
        await api.updateTransferMarketRequest(detailRequest.id, payload as any);
        await Promise.all([loadRequestDetail(detailRequest.id), fetchRequests()]);
      } catch (error) {
        logError('Failed to update transfer request', error);
        Alert.alert(dictionary.common.feedback.error, 'Mise à jour impossible.');
      } finally {
        setActionLoading(false);
      }
    },
    [canManageCurrentRequest, detailRequest?.id, dictionary.common.feedback.error, fetchRequests, loadRequestDetail],
  );

  const handleCreateSuggestion = useCallback(async () => {
    if (!detailRequest?.id || !canSuggestPlayers) return;
    if (!newSuggestionPlayerId) {
      Alert.alert('Validation', 'Sélectionne un joueur à proposer.');
      return;
    }

    try {
      setActionLoading(true);
      await api.createTransferMarketSuggestion(detailRequest.id, {
        playerId: newSuggestionPlayerId,
        comment: newSuggestionComment.trim() || undefined,
      });
      setNewSuggestionPlayerId('');
      setNewSuggestionComment('');
      setPlayerSearch('');
      setShowPlayerMenu(false);
      await Promise.all([loadRequestDetail(detailRequest.id), fetchRequests()]);
    } catch (error: any) {
      logError('Failed to create transfer suggestion', error);
      Alert.alert(
        dictionary.common.feedback.error,
        String(error?.response?.data?.message ?? 'Impossible de proposer ce joueur.'),
      );
    } finally {
      setActionLoading(false);
    }
  }, [
    canSuggestPlayers,
    detailRequest?.id,
    dictionary.common.feedback.error,
    fetchRequests,
    loadRequestDetail,
    newSuggestionComment,
    newSuggestionPlayerId,
  ]);

  const handleUpdateSuggestionStatus = useCallback(
    async (suggestionId: string, status: TransferSuggestionStatus) => {
      if (!detailRequest?.id || !canManageCurrentRequest) return;
      try {
        setActionLoading(true);
        await api.updateTransferMarketSuggestionStatus(suggestionId, status);
        await Promise.all([loadRequestDetail(detailRequest.id), fetchRequests()]);
      } catch (error) {
        logError('Failed to update transfer suggestion status', error);
        Alert.alert(dictionary.common.feedback.error, 'Impossible de mettre à jour la suggestion.');
      } finally {
        setActionLoading(false);
      }
    },
    [canManageCurrentRequest, detailRequest?.id, dictionary.common.feedback.error, fetchRequests, loadRequestDetail],
  );

  const handleCreateShortlist = useCallback(async () => {
    if (!detailRequest?.id || !canManageCurrentRequest) return;
    try {
      setActionLoading(true);
      const shortlist = await api.createTransferMarketShortlist(detailRequest.id);
      let csvLength = 0;
      if (isFeatureEnabled('transferMarketShortlistExport')) {
        const csv = await api.exportTransferMarketShortlistCsv(detailRequest.id);
        csvLength = csv.length;
      }
      Alert.alert(
        'Shortlist prête',
        `Lien: ${shortlist.shareUrl}${csvLength > 0 ? `\nCSV généré (${csvLength} chars)` : ''}`,
      );
      await loadRequestDetail(detailRequest.id);
    } catch (error: any) {
      logError('Failed to create/export transfer shortlist', error);
      Alert.alert(
        dictionary.common.feedback.error,
        String(error?.response?.data?.message ?? 'Impossible de générer la shortlist.'),
      );
    } finally {
      setActionLoading(false);
    }
  }, [canManageCurrentRequest, detailRequest?.id, dictionary.common.feedback.error, loadRequestDetail]);

  const handleOpenCreateModal = useCallback(() => {
    resetCreateForm();
    setShowCreateModal(true);
  }, [resetCreateForm]);

  const handleOpenLegacyCreateModal = useCallback(() => {
    resetCreateForm();
    setCreateMode('LEGACY_RAW');
    setShowCreateModal(true);
  }, [resetCreateForm]);

  const handleCreateLegacyRequest = useCallback(async () => {
    if (!canUseLegacyRawMode) {
      Alert.alert('Accès refusé', 'Le mode request club est réservé aux admins.');
      return;
    }

    const rawText = createRawText.trim();
    if (!rawText) {
      Alert.alert('Validation', 'Renseigne un texte de demande club.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const payload = await api.createClubNeedRequest(rawText, createRawTopN);
      const lineCount = Array.isArray(payload?.request?.parsed) ? payload.request.parsed.length : 0;
      const matchedPlayers = Array.isArray(payload?.matches)
        ? payload.matches.reduce(
            (total: number, line: any) => total + (Array.isArray(line?.players) ? line.players.length : 0),
            0,
          )
        : 0;

      setShowCreateModal(false);
      resetCreateForm();

      Alert.alert(
        'Request club créée',
        `${lineCount} ligne(s) analysée(s) • ${matchedPlayers} profil(s) proposé(s).`,
      );

      await Promise.all([
        fetchCountries(),
        selectedCountry ? fetchLeagues(selectedCountry) : Promise.resolve(),
        fetchRequests(),
        fetchLegacyRequests(),
      ]);
    } catch (error: any) {
      logError('Failed to create legacy club-need request', error);
      Alert.alert(
        dictionary.common.feedback.error,
        String(error?.response?.data?.message ?? 'Impossible de créer la request club.'),
      );
    } finally {
      setCreateSubmitting(false);
    }
  }, [
    canUseLegacyRawMode,
    createRawText,
    createRawTopN,
    dictionary.common.feedback.error,
    fetchCountries,
    fetchLegacyRequests,
    fetchLeagues,
    fetchRequests,
    resetCreateForm,
    selectedCountry,
  ]);

  const handleCreateRequest = useCallback(async () => {
    if (!canCreateRequest) return;

    if (createMode === 'LEGACY_RAW') {
      await handleCreateLegacyRequest();
      return;
    }

    const league = createForm.league.trim();
    if (!league) {
      Alert.alert('Validation', 'La ligue est obligatoire.');
      return;
    }

    if (!createForm.clubId && !createForm.clubName.trim()) {
      Alert.alert('Validation', 'Sélectionne un club ou renseigne un club libre.');
      return;
    }

    const payload: CreateTransferRequestInput = {
      clubId: createForm.clubId || undefined,
      clubName: createForm.clubId ? undefined : createForm.clubName.trim() || undefined,
      country: createForm.country.trim() || undefined,
      league,
      title: createForm.title.trim() || undefined,
      priority: createForm.priority,
      visibility: createForm.visibility,
      deadlineAt: createForm.deadlineAt.trim() || undefined,
      requirements: {
        position: createForm.position.trim() || undefined,
        ageMin: parseOptionalInt(createForm.ageMin),
        ageMax: parseOptionalInt(createForm.ageMax),
        budgetMin: parseOptionalNumber(createForm.budgetMin),
        budgetMax: parseOptionalNumber(createForm.budgetMax),
        currency: createForm.currency.trim() || undefined,
        dealType: createForm.dealType.trim() || undefined,
        timing: createForm.timing.trim() || undefined,
        euPassportRequired: createForm.euPassportRequired,
      },
    };

    const requirementValues = Object.values(payload.requirements ?? {}).filter(
      (value) => value !== undefined && value !== '' && value !== false && value !== null,
    );

    if (requirementValues.length === 0) {
      delete payload.requirements;
    }

    try {
      setCreateSubmitting(true);
      await api.createTransferMarketRequest(payload);
      setShowCreateModal(false);
      resetCreateForm();
      await Promise.all([fetchCountries(), selectedCountry ? fetchLeagues(selectedCountry) : Promise.resolve(), fetchRequests()]);
    } catch (error: any) {
      logError('Failed to create transfer request', error);
      Alert.alert(
        dictionary.common.feedback.error,
        String(error?.response?.data?.message ?? 'Impossible de créer la request.'),
      );
    } finally {
      setCreateSubmitting(false);
    }
  }, [
    canCreateRequest,
    createMode,
    createForm.ageMax,
    createForm.ageMin,
    createForm.budgetMax,
    createForm.budgetMin,
    createForm.clubId,
    createForm.clubName,
    createForm.country,
    createForm.currency,
    createForm.deadlineAt,
    createForm.dealType,
    createForm.euPassportRequired,
    createForm.league,
    createForm.position,
    createForm.priority,
    createForm.timing,
    createForm.title,
    createForm.visibility,
    dictionary.common.feedback.error,
    fetchCountries,
    fetchLeagues,
    fetchRequests,
    handleCreateLegacyRequest,
    resetCreateForm,
    selectedCountry,
  ]);

  const renderSegmentSwitcher = () => {
    if (!canOpenHub) return null;
    return (
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, segment === 'REQUESTS' && styles.segmentButtonActive]}
          onPress={() => setSegment('REQUESTS')}
        >
          <Sparkles size={16} color={segment === 'REQUESTS' ? '#0f172a' : colors.text.secondary} />
          <Text style={[styles.segmentLabel, segment === 'REQUESTS' && styles.segmentLabelActive]}>
            Demandes libres
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, segment === 'LEGACY' && styles.segmentButtonActive]}
          onPress={() => {
            if (!canUseLegacyRawMode) {
              Alert.alert('Accès refusé', 'Les requests clubs complètes sont réservées aux admins.');
              return;
            }
            navigation.navigate('ClubNeeds');
          }}
        >
          <Sparkles size={16} color={segment === 'LEGACY' ? '#0f172a' : colors.text.secondary} />
          <Text style={[styles.segmentLabel, segment === 'LEGACY' && styles.segmentLabelActive]}>
            Requests Clubs
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderScopeHeader = () => {
    if (scopeStep === 'COUNTRIES') {
      return (
        <View style={styles.scopeHeaderRow}>
          <Text style={styles.scopeTitle}>Marché par pays</Text>
          <Text style={styles.scopeSubtitle}>Demandes libres: sélectionne un pays puis une ligue</Text>
        </View>
      );
    }

    if (scopeStep === 'LEAGUES') {
      return (
        <View style={styles.scopeHeaderRow}>
          <View style={styles.scopeHeaderLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackScope}>
              <ChevronLeft size={18} color={colors.text.primary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.scopeTitle}>
                {selectedCountry ? formatCountryDisplay(selectedCountry) : 'Pays'}
              </Text>
              <Text style={styles.scopeSubtitle}>Choisis la ligue</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.scopeHeaderRow}>
        <View style={styles.scopeHeaderLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackScope}>
            <ChevronLeft size={18} color={colors.text.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.scopeTitle}>
              {selectedCountry ? formatCountryDisplay(selectedCountry) : 'Pays'}
              {' -> '}
              {selectedLeague}
            </Text>
            <Text style={styles.scopeSubtitle}>Demandes libres actives</Text>
          </View>
        </View>
        {canCreateRequest ? (
          <TouchableOpacity style={styles.createCta} onPress={handleOpenCreateModal}>
            <Plus size={16} color="#0f172a" />
            <Text style={styles.createCtaText}>Nouvelle demande</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderRequestFilters = () => {
    if (scopeStep !== 'REQUESTS') return null;

    return (
      <GlassCard variant="elevated" style={styles.filtersCompactCard}>
        <TouchableOpacity
          style={styles.filtersCompactHeader}
          onPress={() => setShowRequestFiltersModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.filtersCompactTitleWrap}>
            <Text style={styles.cardTitle}>Filtres</Text>
            {activeRequestFilterCount > 0 ? (
              <Text style={styles.filtersCompactSummary} numberOfLines={1}>
                {activeRequestFilterCount} actif(s)
              </Text>
            ) : null}
          </View>

          <View style={styles.filtersCompactActions}>
            {activeRequestFilterCount > 0 ? (
              <View style={styles.filtersCountBadge}>
                <Text style={styles.filtersCountBadgeText}>{activeRequestFilterCount}</Text>
              </View>
            ) : null}
            <ChevronRight size={16} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>

        {activeRequestFilterCount > 0 ? (
          <TouchableOpacity style={styles.filtersResetInline} onPress={resetRequestFilters}>
            <Text style={styles.filtersResetInlineText}>Réinitialiser les filtres</Text>
          </TouchableOpacity>
        ) : null}
      </GlassCard>
    );
  };

  const renderRequestFiltersModal = () => {
    return (
      <Modal visible={showRequestFiltersModal} animationType="slide" onRequestClose={() => setShowRequestFiltersModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalIconButton} onPress={() => setShowRequestFiltersModal(false)}>
              <ChevronLeft size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity style={styles.modalIconButton} onPress={() => setShowRequestFiltersModal(false)}>
              <X size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.cardTitle}>Statut</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {STATUS_FILTERS.map((status) => {
                  const active = filters.status === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilters((prev) => ({ ...prev, status }))}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {status === 'ALL' ? 'Tous statuts' : statusLabelMap[status]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </GlassCard>

            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.cardTitle}>Priorité</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {PRIORITY_FILTERS.map((priority) => {
                  const active = filters.priority === priority;
                  return (
                    <TouchableOpacity
                      key={priority}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilters((prev) => ({ ...prev, priority }))}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {priority === 'ALL' ? 'Toutes priorités' : priorityLabelMap[priority]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </GlassCard>

            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.cardTitle}>Visibilité</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {VISIBILITY_FILTERS.map((visibility) => {
                  const active = filters.visibility === visibility;
                  return (
                    <TouchableOpacity
                      key={visibility}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setFilters((prev) => ({ ...prev, visibility }))}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {visibility === 'ALL' ? 'Toutes visibilités' : visibilityLabelMap[visibility]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </GlassCard>

            {(role === 'AGENT' || roleIsAdmin(role)) ? (
              <GlassCard variant="elevated" style={styles.modalCard}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Créées par moi uniquement</Text>
                  <Switch
                    value={filters.createdByMe}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, createdByMe: value }))}
                    thumbColor={filters.createdByMe ? colors.brand.primary : '#e5e7eb'}
                    trackColor={{ true: '#b4f03a', false: '#4b5563' }}
                  />
                </View>
              </GlassCard>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.buttonRowButton]}
                onPress={resetRequestFilters}
              >
                <Text style={styles.secondaryButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.buttonRowButton]}
                onPress={() => setShowRequestFiltersModal(false)}
              >
                <Text style={styles.primaryButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderCountries = () => {
    if (loadingCountries) {
      return <LoadingSpinner />;
    }

    if (countries.length === 0) {
      return (
        <EmptyState
          title="Aucun pays"
          description="Aucune request transfer-market visible pour ton rôle."
          icon={<CircleDashed size={24} color={colors.text.secondary} />}
        />
      );
    }

    return (
      <FlatList
        data={countries}
        keyExtractor={(item) => item.country}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.scopeCard} onPress={() => handleSelectCountry(item.country)}>
            <View>
              <Text style={styles.scopeCardTitle}>{formatCountryDisplay(item.country)}</Text>
              <Text style={styles.scopeCardMeta}>{item.requestsCount} request(s)</Text>
            </View>
            <ChevronRight size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderLeagues = () => {
    if (loadingLeagues) {
      return <LoadingSpinner />;
    }

    if (leagues.length === 0) {
      return (
        <EmptyState
          title="Aucune ligue"
          description="Aucune ligue trouvée pour ce pays."
          icon={<CircleDashed size={24} color={colors.text.secondary} />}
        />
      );
    }

    return (
      <FlatList
        data={leagues}
        keyExtractor={(item) => item.league}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.scopeCard} onPress={() => handleSelectLeague(item.league)}>
            <View style={styles.leagueCardLeft}>
              {(() => {
                const visual = getLeagueVisual(item.league, selectedCountry);
                const hasLogo = Boolean(visual.logoUri) && !failedLeagueLogos[item.league];
                const flag = visual.countryCode ? flagFromCountryCode(visual.countryCode) : '🏳️';

                return (
                  <View style={styles.leagueVisualWrap}>
                    <View style={styles.leagueFlagBadge}>
                      <Text style={styles.leagueFlagText}>{flag}</Text>
                    </View>
                    {hasLogo ? (
                      <Image
                        source={{ uri: visual.logoUri as string }}
                        style={styles.leagueLogoImage}
                        resizeMode="contain"
                        onError={() =>
                          setFailedLeagueLogos((prev) => ({
                            ...prev,
                            [item.league]: true,
                          }))
                        }
                      />
                    ) : (
                      <View
                        style={[
                          styles.leagueLogoFallback,
                          { backgroundColor: visual.accentColor },
                        ]}
                      >
                        <Text style={styles.leagueLogoFallbackText}>{visual.shortLabel}</Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              <View>
                <Text style={styles.scopeCardTitle} numberOfLines={1}>
                  {item.league}
                </Text>
                <Text style={styles.scopeCardMeta}>{item.requestsCount} request(s)</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderRequests = () => {
    if (loadingRequests && !refreshingRequests) {
      return <LoadingSpinner />;
    }

    if (requests.length === 0) {
      return (
        <EmptyState
          title="Aucune request"
          description="Aucune request active avec les filtres sélectionnés."
          icon={<CircleDashed size={24} color={colors.text.secondary} />}
        />
      );
    }

    return (
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshingRequests}
            onRefresh={refreshRequests}
            tintColor={colors.brand.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.requestCard} onPress={() => openRequestDetail(item.id)}>
            <View style={styles.requestCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle} numberOfLines={2}>
                  {item.title || `${item.clubName ?? 'Club'} • ${item.league ?? 'Ligue'}`}
                </Text>
                <Text style={styles.requestSubline} numberOfLines={1}>
                  {item.clubName ?? 'Club non listé'} • {formatCountryDisplay(item.country)}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.text.secondary} />
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, styles.badgeStatus]}>
                <Text style={styles.badgeText}>{statusLabelMap[item.status]}</Text>
              </View>
              <View style={[styles.badge, styles.badgePriority]}>
                <Text style={styles.badgeText}>{priorityLabelMap[item.priority]}</Text>
              </View>
              <View style={[styles.badge, styles.badgeVisibility]}>
                <Text style={styles.badgeText}>{visibilityLabelMap[item.visibility]}</Text>
              </View>
            </View>

            <View style={styles.requestMetaRow}>
              <Text style={styles.requestMetaText}>Créée par {fullName(item.createdBy)}</Text>
              <Text style={styles.requestMetaText}>Sug. {item.counts?.suggestions ?? 0}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderRequestsHub = () => {
    return (
      <View style={styles.requestsHubContainer}>
        {renderScopeHeader()}
        {renderRequestFilters()}
        {scopeStep === 'COUNTRIES' ? renderCountries() : scopeStep === 'LEAGUES' ? renderLeagues() : renderRequests()}
      </View>
    );
  };

  const renderLegacyRequestsTab = () => {
    if (!canUseLegacyRawMode) {
      return (
        <View style={styles.requestsHubContainer}>
          <EmptyState
            title="Requests clubs réservées Admin"
            description="Connecte-toi en ADMIN/SUPER_ADMIN pour créer et suivre les requests clubs."
            icon={<CircleDashed size={24} color={colors.text.secondary} />}
          />
        </View>
      );
    }

    return (
      <View style={styles.requestsHubContainer}>
        <View style={styles.scopeHeaderRow}>
          <View>
            <Text style={styles.scopeTitle}>Requests clubs</Text>
            <Text style={styles.scopeSubtitle}>Historique des requests texte + matching</Text>
          </View>
          <TouchableOpacity style={styles.createCta} onPress={handleOpenLegacyCreateModal}>
            <Sparkles size={16} color="#0f172a" />
            <Text style={styles.createCtaText}>Nouvelle request</Text>
          </TouchableOpacity>
        </View>

        <GlassCard variant="elevated" style={styles.filtersCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Créées par moi uniquement</Text>
            <Switch
              value={legacyMineOnly}
              onValueChange={setLegacyMineOnly}
              thumbColor={legacyMineOnly ? colors.brand.primary : '#e5e7eb'}
              trackColor={{ true: '#b4f03a', false: '#4b5563' }}
            />
          </View>
        </GlassCard>

        {loadingLegacyRequests && !refreshingLegacyRequests ? (
          <LoadingSpinner />
        ) : legacyRequests.length === 0 ? (
          <EmptyState
            title="Aucune request club"
            description="Crée ta première request club pour générer des profils automatiquement."
            icon={<CircleDashed size={24} color={colors.text.secondary} />}
          />
        ) : (
          <FlatList
            data={legacyRequests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingLegacyRequests}
                onRefresh={refreshLegacyRequests}
                tintColor={colors.brand.primary}
              />
            }
            renderItem={({ item }) => {
              const progress = (item.requestProgress ?? 'ACTIVE') as ClubNeedProgress;
              const preview = String(item.rawText ?? '').replace(/\s+/g, ' ').trim();
              return (
                <TouchableOpacity style={styles.requestCard} onPress={() => openLegacyRequestDetail(item.id)}>
                  <View style={styles.requestCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestTitle} numberOfLines={1}>
                        Request club
                      </Text>
                      <Text style={styles.requestSubline} numberOfLines={2}>
                        {preview || 'Sans contenu'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.text.secondary} />
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={[styles.badge, styles.badgeStatus]}>
                      <Text style={styles.badgeText}>{clubNeedProgressLabelMap[progress]}</Text>
                    </View>
                    <View style={[styles.badge, styles.badgeVisibility]}>
                      <Text style={styles.badgeText}>
                        {item.linesCompleted ?? 0}/{item.linesTotal ?? 0} lignes
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestMetaRow}>
                    <Text style={styles.requestMetaText}>Créée le {formatDate(item.createdAt)}</Text>
                    <Text style={styles.requestMetaText}>ID: {item.id.slice(0, 8)}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  };

  const renderScoutsTab = () => {
    return (
      <View style={styles.scoutsContainer}>
        <View style={styles.searchWrap}>
          <TextInput
            value={scoutSearch}
            onChangeText={setScoutSearch}
            placeholder="Recherche scout, ligue, poste..."
            placeholderTextColor={colors.text.secondary}
            style={styles.searchInput}
            onSubmitEditing={fetchScouts}
          />
          <TouchableOpacity style={styles.searchButton} onPress={fetchScouts}>
            <ListFilter size={16} color="#0f172a" />
            <Text style={styles.searchButtonText}>Chercher</Text>
          </TouchableOpacity>
        </View>

        {loadingScouts ? (
          <LoadingSpinner />
        ) : scoutListings.length === 0 ? (
          <EmptyState
            title="Aucun scout"
            description="Aucun profil scout ne correspond à la recherche."
            icon={<Users size={24} color={colors.text.secondary} />}
          />
        ) : (
          <FlatList
            data={scoutListings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingScouts}
                onRefresh={() => {
                  setRefreshingScouts(true);
                  fetchScouts();
                }}
                tintColor={colors.brand.primary}
              />
            }
            renderItem={({ item }) => (
              <ScoutCard
                listing={item}
                onPress={() => (navigation as any)?.navigate?.('ScoutDetail', { listingId: item.id })}
              />
            )}
          />
        )}
      </View>
    );
  };

  const renderRequirements = (request: TransferRequest) => {
    const rows = buildRequirementsRows(request);
    if (rows.length === 0) {
      return <Text style={styles.emptyInlineText}>Aucun requirement structuré.</Text>;
    }

    return (
      <View style={styles.requirementsList}>
        {rows.map((row) => (
          <View key={row.label} style={styles.requirementRow}>
            <Text style={styles.requirementLabel}>{row.label}</Text>
            <Text style={styles.requirementValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDetailModal = () => {
    const visible = !!selectedRequestId;

    return (
      <Modal visible={visible} animationType="slide" onRequestClose={closeRequestDetail}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalIconButton} onPress={closeRequestDetail}>
              <ChevronLeft size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détail request</Text>
            <TouchableOpacity style={styles.modalIconButton} onPress={closeRequestDetail}>
              <X size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {detailLoading || !detailRequest ? (
            <LoadingSpinner />
          ) : (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <GlassCard variant="elevated" style={styles.modalCard}>
                <Text style={styles.cardTitle}>{detailRequest.title}</Text>
                <Text style={styles.detailSubline}>
                  {detailRequest.clubName ?? 'Club non listé'} • {formatCountryDisplay(detailRequest.country)} •{' '}
                  {detailRequest.league ?? 'Ligue ?'}
                </Text>
                <Text style={styles.detailSmallText}>Créateur: {fullName(detailRequest.createdBy)}</Text>
                <Text style={styles.detailSmallText}>Deadline: {formatDate(detailRequest.deadlineAt)}</Text>

                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeStatus]}>
                    <Text style={styles.badgeText}>{statusLabelMap[detailRequest.status]}</Text>
                  </View>
                  <View style={[styles.badge, styles.badgePriority]}>
                    <Text style={styles.badgeText}>{priorityLabelMap[detailRequest.priority]}</Text>
                  </View>
                  <View style={[styles.badge, styles.badgeVisibility]}>
                    <Text style={styles.badgeText}>{visibilityLabelMap[detailRequest.visibility]}</Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Besoin club</Text>
                {renderRequirements(detailRequest)}
              </GlassCard>

              {canManageCurrentRequest ? (
                <GlassCard variant="elevated" style={styles.modalCard}>
                  <Text style={styles.cardTitle}>Actions request</Text>

                  <Text style={styles.sectionLabel}>Statut</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {(['OPEN', 'IN_DISCUSSION', 'CLOSED'] as TransferRequestStatus[]).map((status) => {
                      const active = detailRequest.status === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                          onPress={() => handleUpdateRequest({ status })}
                          disabled={actionLoading}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                            {statusLabelMap[status]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.sectionLabel}>Priorité</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TransferRequestPriority[]).map((priority) => {
                      const active = detailRequest.priority === priority;
                      return (
                        <TouchableOpacity
                          key={priority}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                          onPress={() => handleUpdateRequest({ priority })}
                          disabled={actionLoading}
                        >
                          <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                            {priorityLabelMap[priority]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {isFeatureEnabled('transferMarketSharedVisibility') ? (
                    <>
                      <Text style={styles.sectionLabel}>Visibilité</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        {(['PRIVATE', 'SHARED'] as TransferRequestVisibility[]).map((visibility) => {
                          const active = detailRequest.visibility === visibility;
                          return (
                            <TouchableOpacity
                              key={visibility}
                              style={[styles.filterChip, active && styles.filterChipActive]}
                              onPress={() => handleUpdateRequest({ visibility })}
                              disabled={actionLoading}
                            >
                              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                {visibilityLabelMap[visibility]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </>
                  ) : null}
                </GlassCard>
              ) : null}

              <GlassCard variant="elevated" style={styles.modalCard}>
                <View style={styles.blockHeaderRow}>
                  <Text style={styles.cardTitle}>Suggestions scouts</Text>
                  <Text style={styles.detailSmallText}>{detailSuggestions.length} item(s)</Text>
                </View>

                {canSuggestPlayers && detailRequest.visibility === 'SHARED' && detailRequest.status !== 'CLOSED' ? (
                  <View style={styles.suggestionForm}>
                    <Text style={styles.sectionLabel}>Proposer un joueur</Text>
                    <TouchableOpacity
                      style={[styles.dropdownTrigger, showPlayerMenu && styles.dropdownTriggerOpen]}
                      onPress={() => setShowPlayerMenu((prev) => !prev)}
                    >
                      <Text
                        style={[
                          styles.dropdownValue,
                          !selectedPlayer && styles.dropdownPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {selectedPlayer ? buildPlayerDisplayName(selectedPlayer) : 'Sélectionner un joueur'}
                      </Text>
                      <ChevronRight size={16} color={colors.text.secondary} />
                    </TouchableOpacity>

                    {showPlayerMenu ? (
                      <View style={styles.dropdownPanel}>
                        <TextInput
                          value={playerSearch}
                          onChangeText={setPlayerSearch}
                          placeholder="Rechercher joueur..."
                          placeholderTextColor={colors.text.secondary}
                          style={styles.dropdownSearchInput}
                        />
                        {loadingSuggestionPlayers ? (
                          <ActivityIndicator size="small" color={colors.brand.primary} />
                        ) : (
                          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                            {filteredSuggestionPlayers.length === 0 ? (
                              <Text style={styles.dropdownEmpty}>Aucun joueur trouvé.</Text>
                            ) : (
                              filteredSuggestionPlayers.map((player) => {
                                const active = player.id === newSuggestionPlayerId;
                                return (
                                  <TouchableOpacity
                                    key={player.id}
                                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                                    onPress={() => {
                                      setNewSuggestionPlayerId(player.id);
                                      setShowPlayerMenu(false);
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.dropdownItemTitle,
                                        active && styles.dropdownItemTitleActive,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {buildPlayerDisplayName(player)}
                                    </Text>
                                    <Text style={styles.dropdownItemMeta} numberOfLines={1}>
                                      {player.position ?? 'Position ?'} • {player.club?.name ?? 'Club ?'}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })
                            )}
                          </ScrollView>
                        )}
                      </View>
                    ) : null}

                    <TextInput
                      value={newSuggestionComment}
                      onChangeText={setNewSuggestionComment}
                      placeholder="Commentaire scout (optionnel)"
                      placeholderTextColor={colors.text.secondary}
                      style={styles.textArea}
                      multiline
                    />

                    <TouchableOpacity
                      style={[styles.primaryButton, actionLoading && styles.disabledButton]}
                      onPress={handleCreateSuggestion}
                      disabled={actionLoading}
                    >
                      <Text style={styles.primaryButtonText}>Envoyer la suggestion</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {detailSuggestions.length === 0 ? (
                  <Text style={styles.emptyInlineText}>Aucune suggestion sur cette request.</Text>
                ) : (
                  detailSuggestions.map((suggestion) => (
                    <View key={suggestion.id} style={styles.suggestionCard}>
                      <Text style={styles.suggestionPlayerName}>{suggestion.player?.fullName ?? 'Joueur'}</Text>
                      <Text style={styles.suggestionMeta}>
                        Scout: {fullName(suggestion.scout)} • {formatDateTime(suggestion.createdAt)}
                      </Text>
                      <Text style={styles.suggestionMeta}>Statut: {suggestionStatusLabelMap[suggestion.status]}</Text>
                      {suggestion.comment ? (
                        <Text style={styles.suggestionComment}>{suggestion.comment}</Text>
                      ) : null}

                      {canManageCurrentRequest ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                          {suggestionStatusOptions.map((status) => {
                            const active = suggestion.status === status;
                            return (
                              <TouchableOpacity
                                key={status}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                                onPress={() => handleUpdateSuggestionStatus(suggestion.id, status)}
                                disabled={actionLoading}
                              >
                                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                  {suggestionStatusLabelMap[status]}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      ) : null}
                    </View>
                  ))
                )}

                {canManageCurrentRequest ? (
                  <TouchableOpacity
                    style={[styles.secondaryButton, actionLoading && styles.disabledButton]}
                    onPress={handleCreateShortlist}
                    disabled={actionLoading}
                  >
                    <FileDown size={16} color={colors.brand.primary} />
                    <Text style={styles.secondaryButtonText}>Créer / Exporter shortlist</Text>
                  </TouchableOpacity>
                ) : null}
              </GlassCard>

              <GlassCard variant="elevated" style={styles.modalCard}>
                <View style={styles.blockHeaderRow}>
                  <Text style={styles.cardTitle}>Timeline activité</Text>
                  <Text style={styles.detailSmallText}>{detailActivity.length}</Text>
                </View>
                {detailActivity.length === 0 ? (
                  <Text style={styles.emptyInlineText}>Aucune activité enregistrée.</Text>
                ) : (
                  detailActivity.map((activity) => (
                    <View key={activity.id} style={styles.activityRow}>
                      <CircleDashed size={14} color={colors.brand.primary} />
                      <View style={styles.activityBody}>
                        <Text style={styles.activityTitle}>{activity.actionType}</Text>
                        <Text style={styles.activityMeta}>
                          {fullName(activity.actor)} • {formatDateTime(activity.createdAt)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </GlassCard>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  const renderLegacyDetailModal = () => {
    const visible = !!selectedLegacyRequestId;
    const detailRequest = legacyDetail?.request;
    const parsedLines = Array.isArray(detailRequest?.parsed) ? detailRequest?.parsed : [];
    const lineStates = Array.isArray(detailRequest?.lineStates) ? detailRequest?.lineStates : [];
    const matches = Array.isArray(legacyDetail?.matches) ? legacyDetail?.matches : [];

    const completionByLine = new Map<number, boolean>(
      lineStates.map((line) => [Number(line.lineNumber), Boolean(line.isCompleted)]),
    );

    return (
      <Modal visible={visible} animationType="slide" onRequestClose={closeLegacyRequestDetail}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalIconButton} onPress={closeLegacyRequestDetail}>
              <ChevronLeft size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détail request club</Text>
            <TouchableOpacity style={styles.modalIconButton} onPress={closeLegacyRequestDetail}>
              <X size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {legacyDetailLoading || !detailRequest ? (
            <LoadingSpinner />
          ) : (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <GlassCard variant="elevated" style={styles.modalCard}>
                <Text style={styles.cardTitle}>Texte source</Text>
                <Text style={styles.suggestionComment}>{detailRequest.rawText || '—'}</Text>
                <Text style={styles.detailSmallText}>Créée le {formatDateTime(detailRequest.createdAt)}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, styles.badgeStatus]}>
                    <Text style={styles.badgeText}>
                      {clubNeedProgressLabelMap[(detailRequest.requestProgress ?? 'ACTIVE') as ClubNeedProgress]}
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.badgeVisibility]}>
                    <Text style={styles.badgeText}>
                      {detailRequest.linesCompleted ?? 0}/{detailRequest.linesTotal ?? 0} lignes
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Top profils par ligne</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                  {[3, 5, 8, 10].map((topN) => {
                    const active = legacyDetailTopN === topN;
                    return (
                      <TouchableOpacity
                        key={topN}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => {
                          setLegacyDetailTopN(topN);
                          if (selectedLegacyRequestId) {
                            void loadLegacyDetail(selectedLegacyRequestId, topN);
                          }
                        }}
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          Top {topN}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </GlassCard>

              <GlassCard variant="elevated" style={styles.modalCard}>
                <Text style={styles.cardTitle}>Lignes parsées</Text>
                {parsedLines.length === 0 ? (
                  <Text style={styles.emptyInlineText}>Aucune ligne parsée.</Text>
                ) : (
                  parsedLines.map((line) => {
                    const isCompleted = completionByLine.get(Number(line.lineNumber)) ?? false;
                    const positions = Array.isArray(line.positions) && line.positions.length > 0
                      ? line.positions.join(', ')
                      : 'Poste non précisé';
                    const ageLabel = line.age
                      ? `${line.age.min ?? '?'}-${line.age.max ?? '?'} ans`
                      : 'Âge non précisé';
                    return (
                      <View key={`${line.lineNumber}-${line.clubName}`} style={styles.suggestionCard}>
                        <Text style={styles.suggestionPlayerName}>
                          Ligne {line.lineNumber} • {line.clubName}
                        </Text>
                        <Text style={styles.suggestionMeta}>{positions}</Text>
                        <Text style={styles.suggestionMeta}>{ageLabel}</Text>
                        <Text style={styles.suggestionMeta}>{isCompleted ? 'Statut: traité' : 'Statut: en cours'}</Text>
                      </View>
                    );
                  })
                )}
              </GlassCard>

              <GlassCard variant="elevated" style={styles.modalCard}>
                <Text style={styles.cardTitle}>Matching généré</Text>
                {matches.length === 0 ? (
                  <Text style={styles.emptyInlineText}>Aucun matching disponible.</Text>
                ) : (
                  matches.map((matchLine) => (
                    <View key={`${matchLine.lineNumber}-${matchLine.clubName}`} style={styles.activityRow}>
                      <CircleDashed size={14} color={colors.brand.primary} />
                      <View style={styles.activityBody}>
                        <Text style={styles.activityTitle}>
                          Ligne {matchLine.lineNumber} • {matchLine.clubName}
                        </Text>
                        <Text style={styles.activityMeta}>
                          {(Array.isArray(matchLine.players) ? matchLine.players.length : 0)} profil(s) proposé(s)
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </GlassCard>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  const renderCreateModal = () => {
    if (!canCreateRequest) return null;

    return (
      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalIconButton} onPress={() => setShowCreateModal(false)}>
              <ChevronLeft size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {createMode === 'LEGACY_RAW' ? 'Nouvelle request club' : 'Nouvelle demande libre'}
            </Text>
            <TouchableOpacity style={styles.modalIconButton} onPress={() => setShowCreateModal(false)}>
              <X size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {canUseLegacyRawMode ? (
              <GlassCard variant="elevated" style={styles.modalCard}>
                <Text style={styles.cardTitle}>Mode de création</Text>
                <Text style={styles.formHint}>
                  Choisis un flux rapide: structuré pour une demande propre, ou Club Needs en texte libre.
                </Text>
                <View style={styles.createModeRow}>
                  <TouchableOpacity
                    style={[styles.createModeChip, createMode === 'STRUCTURED' && styles.createModeChipActive]}
                    onPress={() => setCreateMode('STRUCTURED')}
                  >
                    <Text
                      style={[
                        styles.createModeChipText,
                        createMode === 'STRUCTURED' && styles.createModeChipTextActive,
                      ]}
                    >
                      Structurée
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createModeChip, createMode === 'LEGACY_RAW' && styles.createModeChipActive]}
                    onPress={() => setCreateMode('LEGACY_RAW')}
                  >
                    <Text
                      style={[
                        styles.createModeChipText,
                        createMode === 'LEGACY_RAW' && styles.createModeChipTextActive,
                      ]}
                    >
                      Texte libre
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.createCtaSecondary}
                  onPress={() => {
                    setShowCreateModal(false);
                    navigation.navigate('ClubNeeds');
                  }}
                >
                  <Text style={styles.createCtaSecondaryText}>Ouvrir l'outil Club Needs complet</Text>
                </TouchableOpacity>
              </GlassCard>
            ) : null}

            {createMode === 'LEGACY_RAW' ? (
              <GlassCard variant="elevated" style={styles.modalCard}>
                <Text style={styles.cardTitle}>Request club (texte)</Text>
                <Text style={styles.scopeSubtitle}>
                  Écris la demande en langage naturel, on parse et on propose des profils adaptés.
                </Text>

                <Text style={styles.fieldLabel}>Message *</Text>
                <TextInput
                  value={createRawText}
                  onChangeText={setCreateRawText}
                  placeholder="Ex: Monaco cherche un DC gaucher 22-26 ans, budget 12M, dispo été."
                  placeholderTextColor={colors.text.secondary}
                  style={styles.textArea}
                  multiline
                />

                <Text style={styles.fieldLabel}>Top profils par ligne</Text>
                <View style={styles.filterRow}>
                  {[3, 5, 8, 10].map((topN) => {
                    const active = createRawTopN === topN;
                    return (
                      <TouchableOpacity
                        key={topN}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setCreateRawTopN(topN)}
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          Top {topN}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, createSubmitting && styles.disabledButton]}
                  onPress={handleCreateRequest}
                  disabled={createSubmitting}
                >
                  {createSubmitting ? (
                    <ActivityIndicator size="small" color={colors.background.primary} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Créer la request club</Text>
                  )}
                </TouchableOpacity>
              </GlassCard>
            ) : (
            <>
            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.cardTitle}>Informations demande</Text>
              <Text style={styles.formHint}>Les champs marqués * sont requis.</Text>

              <Text style={styles.fieldLabel}>Club (base interne)</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, showClubMenu && styles.dropdownTriggerOpen]}
                onPress={() => {
                  setShowClubMenu((prev) => !prev);
                  if (!showClubMenu) {
                    void loadClubOptions();
                  }
                }}
              >
                <Text
                  style={[
                    styles.dropdownValue,
                    !selectedClub && styles.dropdownPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {selectedClub
                    ? `${selectedClub.name}${
                        selectedClub.country ? ` (${formatCountryDisplay(selectedClub.country)})` : ''
                      }`
                    : 'Sélectionner un club (DB)'}
                </Text>
                <ChevronRight size={16} color={colors.text.secondary} />
              </TouchableOpacity>

              {showClubMenu ? (
                <View style={styles.dropdownPanel}>
                  <TextInput
                    value={clubSearch}
                    onChangeText={setClubSearch}
                    placeholder="Rechercher club..."
                    placeholderTextColor={colors.text.secondary}
                    style={styles.dropdownSearchInput}
                  />
                  {loadingClubOptions ? (
                    <ActivityIndicator size="small" color={colors.brand.primary} />
                  ) : (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredClubs.length === 0 ? (
                        <Text style={styles.dropdownEmpty}>Aucun club trouvé.</Text>
                      ) : (
                        filteredClubs.map((club) => {
                          const active = createForm.clubId === club.id;
                          return (
                            <TouchableOpacity
                              key={club.id}
                              style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                              onPress={() => {
                                setCreateForm((prev) => ({
                                  ...prev,
                                  clubId: club.id,
                                  clubName: '',
                                  country: prev.country || club.country || '',
                                }));
                                setShowClubMenu(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemTitle,
                                  active && styles.dropdownItemTitleActive,
                                ]}
                              >
                                {club.name}
                              </Text>
                              <Text style={styles.dropdownItemMeta}>
                                {formatCountryDisplay(club.country)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>
                  )}
                </View>
              ) : null}

              <Text style={styles.fieldLabel}>Club libre (fallback)</Text>
              <TextInput
                value={createForm.clubName}
                onChangeText={(value) => setCreateForm((prev) => ({ ...prev, clubName: value, clubId: '' }))}
                placeholder="Ex: US Montfermeil"
                placeholderTextColor={colors.text.secondary}
                style={styles.fieldInput}
              />
              <Text style={styles.fieldHint}>
                Utilise ce champ seulement si le club n'existe pas dans la base.
              </Text>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Pays</Text>
                  <TextInput
                    value={createForm.country}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, country: value }))}
                    placeholder="France"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Ligue *</Text>
                  <TextInput
                    value={createForm.league}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, league: value }))}
                    placeholder="Ligue 1"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Titre</Text>
              <TextInput
                value={createForm.title}
                onChangeText={(value) => setCreateForm((prev) => ({ ...prev, title: value }))}
                placeholder="Besoins attaquant U23"
                placeholderTextColor={colors.text.secondary}
                style={styles.fieldInput}
              />
              <Text style={styles.fieldHint}>Optionnel. Si vide, un titre est généré automatiquement.</Text>

              <Text style={styles.fieldLabel}>Deadline (optionnel)</Text>
              <TextInput
                value={createForm.deadlineAt}
                onChangeText={(value) => setCreateForm((prev) => ({ ...prev, deadlineAt: value }))}
                placeholder="2026-03-31"
                placeholderTextColor={colors.text.secondary}
                style={styles.fieldInput}
              />
            </GlassCard>

            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.cardTitle}>Profil recherché</Text>
              <Text style={styles.formHint}>Décris le besoin sportif principal du club.</Text>

              <Text style={styles.fieldLabel}>Poste</Text>
              <TextInput
                value={createForm.position}
                onChangeText={(value) => setCreateForm((prev) => ({ ...prev, position: value }))}
                placeholder="Ex: Avant-centre"
                placeholderTextColor={colors.text.secondary}
                style={styles.fieldInput}
              />

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Âge min</Text>
                  <TextInput
                    value={createForm.ageMin}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, ageMin: value }))}
                    placeholder="18"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Âge max</Text>
                  <TextInput
                    value={createForm.ageMax}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, ageMax: value }))}
                    placeholder="24"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Budget min</Text>
                  <TextInput
                    value={createForm.budgetMin}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, budgetMin: value }))}
                    placeholder="500000"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Budget max</Text>
                  <TextInput
                    value={createForm.budgetMax}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, budgetMax: value }))}
                    placeholder="5000000"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Devise</Text>
                  <TextInput
                    value={createForm.currency}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, currency: value }))}
                    placeholder="EUR"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>Deal type</Text>
                  <TextInput
                    value={createForm.dealType}
                    onChangeText={(value) => setCreateForm((prev) => ({ ...prev, dealType: value }))}
                    placeholder="Prêt, achat, prêt + OA"
                    placeholderTextColor={colors.text.secondary}
                    style={styles.fieldInput}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Timing</Text>
              <TextInput
                value={createForm.timing}
                onChangeText={(value) => setCreateForm((prev) => ({ ...prev, timing: value }))}
                placeholder="Ex: Immédiat / Été 2026"
                placeholderTextColor={colors.text.secondary}
                style={styles.fieldInput}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Passeport UE requis</Text>
                <Switch
                  value={createForm.euPassportRequired}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, euPassportRequired: value }))
                  }
                  thumbColor={createForm.euPassportRequired ? colors.brand.primary : '#e5e7eb'}
                  trackColor={{ true: '#b4f03a', false: '#4b5563' }}
                />
              </View>
            </GlassCard>

            <GlassCard variant="elevated" style={styles.modalCard}>
              <Text style={styles.cardTitle}>Publication</Text>
              <Text style={styles.formHint}>Définis l'urgence et qui peut voir la demande.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TransferRequestPriority[]).map((priority) => {
                  const active = createForm.priority === priority;
                  return (
                    <TouchableOpacity
                      key={priority}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setCreateForm((prev) => ({ ...prev, priority }))}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {priorityLabelMap[priority]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {isFeatureEnabled('transferMarketSharedVisibility') ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                  {(['PRIVATE', 'SHARED'] as TransferRequestVisibility[]).map((visibility) => {
                    const active = createForm.visibility === visibility;
                    return (
                      <TouchableOpacity
                        key={visibility}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setCreateForm((prev) => ({ ...prev, visibility }))}
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          {visibilityLabelMap[visibility]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.buttonRowButton]}
                  onPress={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  <Text style={styles.secondaryButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.buttonRowButton, createSubmitting && styles.disabledButton]}
                  onPress={handleCreateRequest}
                  disabled={createSubmitting}
                >
                  {createSubmitting ? (
                    <ActivityIndicator size="small" color={colors.background.primary} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Créer la demande</Text>
                  )}
                </TouchableOpacity>
              </View>
            </GlassCard>
            </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (!canOpenHub) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{dictionary.marketplace.header.title}</Text>
          <Text style={styles.headerSubtitle}>{dictionary.marketplace.header.subtitle}</Text>
        </View>
        {renderScoutsTab()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transfer Market</Text>
        <Text style={styles.headerSubtitle}>
          Hub opportunités clubs ({role || 'Rôle inconnu'})
        </Text>
      </View>

      {renderSegmentSwitcher()}
      {segment === 'REQUESTS' ? renderRequestsHub() : renderLegacyRequestsTab()}
      {renderRequestFiltersModal()}
      {renderDetailModal()}
      {renderLegacyDetailModal()}
      {renderCreateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    height: 42,
  },
  segmentButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  segmentLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    color: '#0f172a',
  },
  requestsHubContainer: {
    flex: 1,
  },
  scoutsContainer: {
    flex: 1,
  },
  scopeHeaderRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scopeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  scopeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  scopeTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  scopeSubtitle: {
    marginTop: 2,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
  },
  createCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
  },
  createCtaText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    color: '#0f172a',
  },
  createCtaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    backgroundColor: '#b4f03a14',
  },
  createCtaSecondaryText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.brand.primary,
  },
  filtersCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersCompactCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  filtersCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  filtersCompactTitleWrap: {
    flex: 1,
  },
  filtersCompactSummary: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  filtersCompactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filtersCountBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
  },
  filtersCountBadgeText: {
    color: '#0f172a',
    fontSize: 11,
    fontFamily: typography.fonts.bold,
  },
  filtersResetInline: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  filtersResetInlineText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  formHint: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  createModeRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  createModeChip: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  createModeChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  createModeChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  createModeChipTextActive: {
    color: '#0f172a',
  },
  linkButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  filterRow: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  filterChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  filterChipTextActive: {
    color: '#0f172a',
  },
  switchRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  switchLabel: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  scopeCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  leagueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  leagueVisualWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leagueFlagBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueFlagText: {
    fontSize: 14,
  },
  leagueLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface.glassLight,
  },
  leagueLogoFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueLogoFallbackText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: typography.fonts.bold,
  },
  scopeCardTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semiBold,
  },
  scopeCardMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  requestCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requestTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
  },
  requestSubline: {
    color: colors.text.secondary,
    marginTop: 2,
    fontSize: typography.sizes.sm,
  },
  badgesRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeStatus: {
    backgroundColor: '#1e3a8a40',
    borderColor: '#1e3a8a',
  },
  badgePriority: {
    backgroundColor: '#9a341240',
    borderColor: '#f97316',
  },
  badgeVisibility: {
    backgroundColor: '#14532d40',
    borderColor: '#22c55e',
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
  },
  requestMetaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  requestMetaText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
  },
  searchButton: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchButtonText: {
    color: '#0f172a',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.h3,
    fontFamily: typography.fonts.bold,
  },
  modalIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  modalCard: {
    marginBottom: spacing.md,
  },
  detailSubline: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  detailSmallText: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  requirementsList: {
    gap: spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  requirementLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  requirementValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  blockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  suggestionForm: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dropdownTrigger: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dropdownTriggerOpen: {
    borderColor: colors.brand.primary,
  },
  dropdownValue: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
  },
  dropdownPlaceholder: {
    color: colors.text.secondary,
  },
  dropdownPanel: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  dropdownSearchInput: {
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownEmpty: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.sm,
  },
  dropdownItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  dropdownItemActive: {
    borderColor: colors.brand.primary,
    backgroundColor: '#b4f03a22',
  },
  dropdownItemTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  dropdownItemTitleActive: {
    color: colors.brand.primary,
  },
  dropdownItemMeta: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  textArea: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 92,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#0f172a',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
  },
  disabledButton: {
    opacity: 0.6,
  },
  suggestionCard: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
    padding: spacing.sm,
    gap: 2,
  },
  suggestionPlayerName: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semiBold,
  },
  suggestionMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  suggestionComment: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  emptyInlineText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  activityRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  activityBody: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  activityMeta: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  fieldLabel: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldHint: {
    marginTop: spacing.xs,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  fieldInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glass,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridCol: {
    flex: 1,
  },
  buttonRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonRowButton: {
    marginTop: 0,
    flex: 1,
  },
});

export default MarketplaceScreen;
