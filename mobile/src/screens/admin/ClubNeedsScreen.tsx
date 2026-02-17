import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import api from '../../services/api';
import { colors, radius, spacing, typography } from '../../design/theme';
import { GlassCard, Icon } from '../../components/ui';
import { logError } from '../../utils/logger';
import { showError, showInfo, showSuccess } from '../../services/toast';

type ParsedAge = { min?: number; max?: number };
type PreferredFoot = 'Left' | 'Right' | 'Both';

type ClubNeedMatchPlayer = {
  playerId: string;
  firstName: string | null;
  lastName: string | null;
  position: string;
  nationality: string;
  club: { id?: string; name: string; logo: string | null } | null;
  marketValue: number | null;
  contractUntil: string | null;
  preferredFoot: string | null;
  photoUrl: string | null;
};

type ClubNeedMatchResult = {
  lineNumber: number;
  clubName: string;
  criteria: { positions: string[]; age?: ParsedAge; preferredFoot?: PreferredFoot };
  players: ClubNeedMatchPlayer[];
  warnings: string[];
  errors: string[];
};

type ParsedRequestLine = {
  lineNumber?: number;
  clubName?: string;
  positions?: string[];
  age?: ParsedAge;
  preferredFoot?: PreferredFoot;
  errors?: string[];
};

type ClubNeedLineState = {
  lineNumber: number;
  clubName: string;
  isCompleted: boolean;
  completedAt?: string | null;
  completedById?: string | null;
  reopenedAt?: string | null;
  reopenedById?: string | null;
};

type ClubNeedRequestProgress = 'ACTIVE' | 'PARTIAL' | 'COMPLETED';

type ClubNeedRequestListItem = {
  id: string;
  rawText: string;
  parsed: ParsedRequestLine[] | unknown;
  matchesSnapshot?: ClubNeedMatchResult[] | unknown;
  lineStates?: ClubNeedLineState[] | unknown;
  linesTotal?: number;
  linesCompleted?: number;
  requestProgress?: ClubNeedRequestProgress;
  createdAt: string;
};

type ShareSetListItem = {
  id: string;
  token: string;
  shareUrl: string;
  createdAt: string;
  revokedAt?: string | null;
  items?: unknown[];
  sourceRequestId?: string;
  sourceRequestLineNumber?: number;
};

type ClubNeedsAddToSharePayload = {
  requestId?: string;
  lineNumber: number;
  player: {
    playerId: string;
    firstName?: string | null;
    lastName?: string | null;
    position?: string | null;
    nationality?: string | null;
    marketValue?: number | null;
    club?: { id?: string; name?: string; logo?: string | null } | null;
    photoUrl?: string | null;
  };
};

type HistoryQuality = 'GOOD' | 'PARTIAL' | 'ERROR';

type HistoryEntryView = {
  viewKey: string;
  request: ClubNeedRequestListItem;
  clubName: string;
  clubsCount: number;
  quality: HistoryQuality;
};

type HistoryDetailCacheItem = {
  request: ClubNeedRequestListItem;
  matches: ClubNeedMatchResult[];
  loadedAt: number;
};

const EXAMPLE = [
  'Mallorca, striker, 18-35, right',
  'Rayo vallecano, winger, 18-35',
  'Girona, central back, 6, 18-35',
  'Alaves, central back, winger',
  'Betis, striker',
].join('\n');

const HISTORY_PAGE_LIMIT = 20;
const SEARCH_PAGE_LIMIT = 20;
const ALL_CLUB_FILTER = '__ALL__';
const ALL_MONTH_FILTER = '__ALL_MONTH__';

const getLineKey = (requestId: string | null | undefined, lineNumber: number) =>
  `${requestId ?? 'draft'}:${lineNumber}`;

const formatPlayerName = (player: { firstName?: string | null; lastName?: string | null }) => {
  const full = `${player.firstName ?? ''} ${player.lastName ?? ''}`.trim();
  return full || 'Joueur sans nom';
};

const getParsedLines = (request: ClubNeedRequestListItem): ParsedRequestLine[] => {
  if (!Array.isArray(request.parsed)) return [];
  return request.parsed as ParsedRequestLine[];
};

const getParsedLineByNumber = (request: ClubNeedRequestListItem, lineNumber: number) => {
  const parsedLines = getParsedLines(request);
  const byNumber = parsedLines.find((line) => Number(line?.lineNumber) === lineNumber);
  if (byNumber) return byNumber;
  return parsedLines[lineNumber - 1];
};

const getRequestClubNames = (request: ClubNeedRequestListItem): string[] => {
  const clubsFromParsed = getParsedLines(request)
    .map((line) => String(line?.clubName ?? '').trim())
    .filter(Boolean);

  const clubsFromLineStates = Array.isArray(request.lineStates)
    ? (request.lineStates as ClubNeedLineState[])
        .map((line) => String(line?.clubName ?? '').trim())
        .filter(Boolean)
    : [];

  const clubs = [...clubsFromParsed, ...clubsFromLineStates];

  if (clubs.length === 0) {
    return ['Inconnu'];
  }

  return Array.from(new Set(clubs));
};

const getRequestQuality = (request: ClubNeedRequestListItem): HistoryQuality => {
  const parsedLines = getParsedLines(request);
  if (parsedLines.length === 0) return 'ERROR';

  const errorCount = parsedLines.reduce((count, line) => {
    const hasErrors = Array.isArray(line?.errors) && line.errors.length > 0;
    return hasErrors ? count + 1 : count;
  }, 0);

  if (errorCount === 0) return 'GOOD';
  if (errorCount < parsedLines.length) return 'PARTIAL';
  return 'ERROR';
};

const qualityLabel: Record<HistoryQuality, string> = {
  GOOD: 'Valide',
  PARTIAL: 'Partiel',
  ERROR: 'Erreur',
};

const qualityColor: Record<HistoryQuality, string> = {
  GOOD: '#22C55E',
  PARTIAL: '#F59E0B',
  ERROR: '#EF4444',
};

const normalizePlayerFromApi = (player: any): ClubNeedMatchPlayer => ({
  playerId: String(player?.id ?? ''),
  firstName: player?.user?.firstName ?? player?.firstName ?? null,
  lastName: player?.user?.lastName ?? player?.lastName ?? null,
  position: player?.position ?? '—',
  nationality: player?.nationality ?? '—',
  club: player?.club
    ? {
        id: player.club.id,
        name: player.club.name,
        logo: player.club.logo ?? null,
      }
    : null,
  marketValue: typeof player?.marketValue === 'number' ? player.marketValue : null,
  contractUntil: player?.contractUntil ?? null,
  preferredFoot: player?.preferredFoot ?? null,
  photoUrl: player?.photoUrl ?? player?.user?.avatar ?? null,
});

const normalizePlayerFromRoute = (payloadPlayer: ClubNeedsAddToSharePayload['player']): ClubNeedMatchPlayer => ({
  playerId: String(payloadPlayer?.playerId ?? ''),
  firstName: payloadPlayer?.firstName ?? null,
  lastName: payloadPlayer?.lastName ?? null,
  position: payloadPlayer?.position ?? '—',
  nationality: payloadPlayer?.nationality ?? '—',
  club: payloadPlayer?.club?.name
    ? {
        id: payloadPlayer.club.id,
        name: payloadPlayer.club.name,
        logo: payloadPlayer.club.logo ?? null,
      }
    : null,
  marketValue: typeof payloadPlayer?.marketValue === 'number' ? payloadPlayer.marketValue : null,
  contractUntil: null,
  preferredFoot: null,
  photoUrl: payloadPlayer?.photoUrl ?? null,
});

const dedupePlayers = (players: ClubNeedMatchPlayer[]): ClubNeedMatchPlayer[] => {
  const map = new Map<string, ClubNeedMatchPlayer>();
  players.forEach((player) => {
    if (!player.playerId) return;
    map.set(player.playerId, player);
  });
  return Array.from(map.values());
};

const normalizeLineStates = (
  parsed: ParsedRequestLine[] | unknown,
  input: ClubNeedLineState[] | unknown,
): ClubNeedLineState[] => {
  const parsedLines = Array.isArray(parsed) ? (parsed as ParsedRequestLine[]) : [];

  const stateMap = new Map<number, ClubNeedLineState>();
  if (Array.isArray(input)) {
    (input as ClubNeedLineState[]).forEach((state) => {
      const lineNumber = Number(state?.lineNumber);
      if (!Number.isInteger(lineNumber) || lineNumber < 1) return;
      stateMap.set(lineNumber, {
        lineNumber,
        clubName: state?.clubName ?? `Ligne ${lineNumber}`,
        isCompleted: Boolean(state?.isCompleted),
        completedAt: state?.completedAt ?? null,
        completedById: state?.completedById ?? null,
        reopenedAt: state?.reopenedAt ?? null,
        reopenedById: state?.reopenedById ?? null,
      });
    });
  }

  if (parsedLines.length === 0) {
    return Array.from(stateMap.values());
  }

  return parsedLines.map((line, index) => {
    const lineNumber =
      Number.isInteger(line?.lineNumber) && Number(line.lineNumber) > 0
        ? Number(line.lineNumber)
        : index + 1;
    const existing = stateMap.get(lineNumber);
    return (
      existing ?? {
        lineNumber,
        clubName: String(line?.clubName ?? `Ligne ${lineNumber}`),
        isCompleted: false,
        completedAt: null,
        completedById: null,
        reopenedAt: null,
        reopenedById: null,
      }
    );
  });
};

const formatRequestLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return 'Demande';
  return `Demande ${date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
};

const progressLabel: Record<ClubNeedRequestProgress, string> = {
  ACTIVE: 'ACTIVE',
  PARTIAL: 'PARTIEL',
  COMPLETED: 'TERMINÉE',
};

const progressColor: Record<ClubNeedRequestProgress, string> = {
  ACTIVE: '#22C55E',
  PARTIAL: '#F59E0B',
  COMPLETED: '#64748B',
};

const computeRequestProgress = (lineStates: ClubNeedLineState[]) => {
  const linesTotal = lineStates.length;
  const linesCompleted = lineStates.filter((line) => line.isCompleted).length;

  let requestProgress: ClubNeedRequestProgress = 'ACTIVE';
  if (linesTotal > 0 && linesCompleted === linesTotal) {
    requestProgress = 'COMPLETED';
  } else if (linesCompleted > 0) {
    requestProgress = 'PARTIAL';
  }

  return { linesTotal, linesCompleted, requestProgress };
};

const toMonthValue = (dateIso: string) => {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return '';
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
};

const toMonthValueFromDate = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
};

const formatMonthLabel = (monthValue: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthValue)) return monthValue;
  const [year, month] = monthValue.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export default function ClubNeedsScreen({ navigation, route }: any) {
  const [rawText, setRawText] = useState(EXAMPLE);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<ClubNeedMatchResult[] | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const [history, setHistory] = useState<ClubNeedRequestListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyClubFilter, setHistoryClubFilter] = useState(ALL_CLUB_FILTER);
  const [historyMonthFilter, setHistoryMonthFilter] = useState(ALL_MONTH_FILTER);
  const [monthFilterModalVisible, setMonthFilterModalVisible] = useState(false);
  const [historyShareCountByRequest, setHistoryShareCountByRequest] = useState<Record<string, number>>({});
  const [requestLineStatesByRequest, setRequestLineStatesByRequest] = useState<Record<string, ClubNeedLineState[]>>({});
  const [lineStatusLoadingByKey, setLineStatusLoadingByKey] = useState<Record<string, boolean>>({});
  const [historyDetailsByRequest, setHistoryDetailsByRequest] = useState<Record<string, HistoryDetailCacheItem>>({});
  const [historyDetailsLoadingByRequest, setHistoryDetailsLoadingByRequest] = useState<Record<string, boolean>>({});
  const [expandedHistoryEntryByKey, setExpandedHistoryEntryByKey] = useState<Record<string, boolean>>({});

  const [selectedByLine, setSelectedByLine] = useState<Record<string, Record<string, boolean>>>({});
  const [manualPlayersByLine, setManualPlayersByLine] = useState<Record<string, ClubNeedMatchPlayer[]>>({});
  const [shareHistoryByLine, setShareHistoryByLine] = useState<Record<string, ShareSetListItem[]>>({});

  const [lastOpenedRequestId, setLastOpenedRequestId] = useState<string | null>(null);

  const [addPlayersVisible, setAddPlayersVisible] = useState(false);
  const [addPlayersLineNumber, setAddPlayersLineNumber] = useState<number | null>(null);
  const [addPlayersQuery, setAddPlayersQuery] = useState('');
  const [addPlayersLoading, setAddPlayersLoading] = useState(false);
  const [addPlayersLoadingMore, setAddPlayersLoadingMore] = useState(false);
  const [addPlayersPage, setAddPlayersPage] = useState(1);
  const [addPlayersHasMore, setAddPlayersHasMore] = useState(false);
  const [addPlayersResults, setAddPlayersResults] = useState<ClubNeedMatchPlayer[]>([]);
  const [addPlayersSelectedIds, setAddPlayersSelectedIds] = useState<Record<string, boolean>>({});

  const validCount = useMemo(() => {
    if (!matches) return 0;
    return matches.filter((m) => !m.errors?.length).length;
  }, [matches]);

  const activeLineStates = useMemo(() => {
    if (!activeRequestId) return [];
    return requestLineStatesByRequest[activeRequestId] ?? [];
  }, [activeRequestId, requestLineStatesByRequest]);

  const visibleMatches = useMemo(() => {
    if (!matches) return null;
    if (!activeLineStates.length) return matches;
    const completed = new Set(
      activeLineStates.filter((line) => line.isCompleted).map((line) => line.lineNumber),
    );
    return matches.filter((match) => !completed.has(match.lineNumber));
  }, [activeLineStates, matches]);

  const formatAge = (age?: ParsedAge) => {
    if (!age) return null;
    if (age.min != null && age.max != null) return `${age.min}-${age.max}`;
    if (age.max != null) return `U${age.max}`;
    if (age.min != null) return `${age.min}+`;
    return null;
  };

  const formatValue = (value: number | null) => {
    if (value == null) return '—';
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `€${Math.round(value / 1_000)}k`;
    return `€${value}`;
  };

  const formatInitialNeedSummary = (
    request: ClubNeedRequestListItem,
    lineNumber: number,
    match?: ClubNeedMatchResult,
  ) => {
    const parsedLine = getParsedLineByNumber(request, lineNumber);
    const positions = match?.criteria?.positions ?? parsedLine?.positions ?? [];
    const age = formatAge(match?.criteria?.age ?? parsedLine?.age);
    const preferredFoot = match?.criteria?.preferredFoot ?? parsedLine?.preferredFoot;

    const chunks = [
      positions?.length ? `Poste: ${positions.join(', ')}` : null,
      age ? `Âge: ${age}` : null,
      preferredFoot ? `Pied: ${preferredFoot}` : null,
    ].filter(Boolean);

    return chunks.length ? chunks.join(' • ') : 'Critères non disponibles';
  };

  const resetLineStateForMatches = useCallback(
    (requestId: string | null, lineMatches: ClubNeedMatchResult[]) => {
      const selectedUpdates: Record<string, Record<string, boolean>> = {};
      const manualUpdates: Record<string, ClubNeedMatchPlayer[]> = {};
      const shareUpdates: Record<string, ShareSetListItem[]> = {};

      lineMatches.forEach((line) => {
        const key = getLineKey(requestId, line.lineNumber);
        selectedUpdates[key] = {};
        manualUpdates[key] = [];
        shareUpdates[key] = [];
      });

      setSelectedByLine((prev) => ({ ...prev, ...selectedUpdates }));
      setManualPlayersByLine((prev) => ({ ...prev, ...manualUpdates }));
      setShareHistoryByLine((prev) => ({ ...prev, ...shareUpdates }));
    },
    [],
  );

  const setLineStatesForRequest = useCallback(
    (requestId: string | null | undefined, request: ClubNeedRequestListItem | undefined) => {
      if (!requestId || !request) return;
      const normalized = normalizeLineStates(request.parsed, request.lineStates);
      setRequestLineStatesByRequest((prev) => ({ ...prev, [requestId]: normalized }));
    },
    [],
  );

  const refreshHistoryShareCount = useCallback(async (requestId: string) => {
    try {
      const response = await (api as any).listPassportShareSets({
        sourceRequestId: requestId,
        includeRevoked: true,
        page: 1,
        limit: 1,
      });

      const total = Number(response?.meta?.total ?? 0);
      setHistoryShareCountByRequest((prev) => ({ ...prev, [requestId]: total }));
    } catch (e) {
      logError('Failed to refresh passport share count', e);
    }
  }, []);

  const refreshHistoryShareCounts = useCallback(
    async (requests: ClubNeedRequestListItem[]) => {
      const ids = Array.from(new Set(requests.map((item) => item.id).filter(Boolean)));
      if (ids.length === 0) return;

      await Promise.all(ids.map((requestId) => refreshHistoryShareCount(requestId)));
    },
    [refreshHistoryShareCount],
  );

  const loadShareHistoryForLines = useCallback(
    async (requestId: string, lineNumbers: number[]) => {
      const uniqueLines = Array.from(new Set(lineNumbers.filter((line) => Number.isFinite(line))));
      if (!requestId || uniqueLines.length === 0) return;

      const updates: Record<string, ShareSetListItem[]> = {};

      await Promise.all(
        uniqueLines.map(async (lineNumber) => {
          try {
            const response = await (api as any).listPassportShareSets({
              sourceRequestId: requestId,
              sourceRequestLineNumber: lineNumber,
              includeRevoked: true,
              page: 1,
              limit: 20,
            });

            updates[getLineKey(requestId, lineNumber)] =
              ((response?.data ?? []) as ShareSetListItem[]).map((item) => ({
                ...item,
                sourceRequestId: item.sourceRequestId ?? requestId,
                sourceRequestLineNumber: item.sourceRequestLineNumber ?? lineNumber,
              }));
          } catch (e) {
            logError('Failed to load passport share history', e);
          }
        }),
      );

      if (Object.keys(updates).length > 0) {
        setShareHistoryByLine((prev) => ({ ...prev, ...updates }));
      }
    },
    [],
  );

  const loadHistory = useCallback(
    async (reset: boolean = false) => {
      if (reset) {
        setHistoryLoading(true);
      } else {
        if (!historyHasMore || historyLoadingMore) return;
        setHistoryLoadingMore(true);
      }

      try {
        const pageToLoad = reset ? 1 : historyPage;
        const response = await (api as any).listClubNeedRequests(
          pageToLoad,
          HISTORY_PAGE_LIMIT,
          historyMonthFilter === ALL_MONTH_FILTER ? undefined : historyMonthFilter,
        );
        const items = (response?.data ?? []) as ClubNeedRequestListItem[];

        setHistory((prev) => (reset ? items : [...prev, ...items]));
        setRequestLineStatesByRequest((prev) => {
          const next = { ...prev };
          items.forEach((item) => {
            next[item.id] = normalizeLineStates(item.parsed, item.lineStates);
          });
          return next;
        });

        const totalPages = Number(response?.meta?.totalPages ?? 1);
        setHistoryHasMore(pageToLoad < totalPages);
        setHistoryPage(pageToLoad + 1);

        await refreshHistoryShareCounts(items);
      } catch (e) {
        logError('Failed to load club needs history', e);
      } finally {
        if (reset) {
          setHistoryLoading(false);
        } else {
          setHistoryLoadingMore(false);
        }
      }
    },
    [
      historyHasMore,
      historyLoadingMore,
      historyMonthFilter,
      historyPage,
      refreshHistoryShareCounts,
    ],
  );

  useEffect(() => {
    if (!showHistory) return;
    loadHistory(true).catch((e) => {
      logError('Failed to initialize club needs history', e);
    });
  }, [showHistory, historyMonthFilter, loadHistory]);

  const openHistoryItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const res = await (api as any).getClubNeedRequest(id, 5);
      const nextMatches = (res?.matches ?? []) as ClubNeedMatchResult[];
      const request = res?.request;
      const requestId = request?.id ?? id;

      setMatches(nextMatches);
      setActiveRequestId(requestId);
      setLastOpenedRequestId(requestId);
      if (request?.rawText) setRawText(request.rawText);
      setShowHistory(false);
      setLineStatesForRequest(requestId, request);

      resetLineStateForMatches(requestId, nextMatches);
      await loadShareHistoryForLines(
        requestId,
        nextMatches.map((match) => match.lineNumber),
      );
      await refreshHistoryShareCount(requestId);
    } catch (e: any) {
      logError('Failed to open club needs request', e);
      Alert.alert('Erreur', e?.message ?? 'Impossible d’ouvrir l’historique');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await (api as any).createClubNeedRequest(rawText, 5);
      const nextMatches = (res?.matches ?? []) as ClubNeedMatchResult[];
      const request = res?.request;
      const requestId = request?.id ?? null;

      setMatches(nextMatches);
      setActiveRequestId(requestId);
      setLastOpenedRequestId(requestId);
      setShowHistory(false);
      setLineStatesForRequest(requestId, request);

      resetLineStateForMatches(requestId, nextMatches);

      if (requestId) {
        await loadShareHistoryForLines(
          requestId,
          nextMatches.map((match) => match.lineNumber),
        );
        await refreshHistoryShareCount(requestId);
      }
    } catch (e: any) {
      logError('Failed to generate club needs', e);
      Alert.alert('Erreur', e?.message ?? 'Impossible de générer la shortlist');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestedPlayer = (lineNumber: number, playerId: string) => {
    const key = getLineKey(activeRequestId, lineNumber);
    setSelectedByLine((prev) => {
      const lineMap = { ...(prev[key] ?? {}) };
      if (lineMap[playerId]) {
        delete lineMap[playerId];
      } else {
        lineMap[playerId] = true;
      }
      return { ...prev, [key]: lineMap };
    });
  };

  const addManualPlayersToLine = (lineNumber: number, players: ClubNeedMatchPlayer[]) => {
    const key = getLineKey(activeRequestId, lineNumber);
    setManualPlayersByLine((prev) => {
      const current = prev[key] ?? [];
      const merged = dedupePlayers([...current, ...players]);
      return { ...prev, [key]: merged };
    });
  };

  const removeManualPlayerFromLine = (lineNumber: number, playerId: string) => {
    const key = getLineKey(activeRequestId, lineNumber);
    setManualPlayersByLine((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((player) => player.playerId !== playerId),
    }));
  };

  const getLineManualPlayers = useCallback(
    (lineNumber: number) => {
      const key = getLineKey(activeRequestId, lineNumber);
      return manualPlayersByLine[key] ?? [];
    },
    [activeRequestId, manualPlayersByLine],
  );

  const getSelectedPlayerIdsForLine = useCallback(
    (match: ClubNeedMatchResult) => {
      const key = getLineKey(activeRequestId, match.lineNumber);
      const selectedMap = selectedByLine[key] ?? {};
      const selectedSuggested = match.players
        .filter((player) => selectedMap[player.playerId])
        .map((player) => player.playerId);
      const manualPlayerIds = (manualPlayersByLine[key] ?? []).map((player) => player.playerId);
      return Array.from(new Set([...selectedSuggested, ...manualPlayerIds]));
    },
    [activeRequestId, manualPlayersByLine, selectedByLine],
  );

  const openAddPlayersModal = (lineNumber: number) => {
    setAddPlayersLineNumber(lineNumber);
    setAddPlayersVisible(true);
    setAddPlayersQuery('');
    setAddPlayersResults([]);
    setAddPlayersPage(1);
    setAddPlayersHasMore(false);
    setAddPlayersSelectedIds({});
  };

  const closeAddPlayersModal = () => {
    setAddPlayersVisible(false);
    setAddPlayersLineNumber(null);
    setAddPlayersQuery('');
    setAddPlayersResults([]);
    setAddPlayersSelectedIds({});
    setAddPlayersHasMore(false);
    setAddPlayersPage(1);
  };

  const fetchPlayersForModal = useCallback(
    async (reset: boolean) => {
      if (!addPlayersVisible) return;

      const pageToLoad = reset ? 1 : addPlayersPage;
      if (reset) {
        setAddPlayersLoading(true);
      } else {
        if (!addPlayersHasMore || addPlayersLoadingMore) return;
        setAddPlayersLoadingMore(true);
      }

      try {
        const response = await (api as any).getPlayers({
          search: addPlayersQuery.trim() || undefined,
          page: pageToLoad,
          limit: SEARCH_PAGE_LIMIT,
        });

        const rawPlayers = (response?.items ?? response?.data ?? []) as any[];
        const normalized = dedupePlayers(rawPlayers.map((player) => normalizePlayerFromApi(player)));

        setAddPlayersResults((prev) => {
          if (reset) return normalized;
          return dedupePlayers([...prev, ...normalized]);
        });

        const totalPages = Number(response?.meta?.totalPages ?? 1);
        setAddPlayersHasMore(pageToLoad < totalPages);
        setAddPlayersPage(pageToLoad + 1);
      } catch (e) {
        logError('Failed to search players for manual shortlist', e);
      } finally {
        if (reset) {
          setAddPlayersLoading(false);
        } else {
          setAddPlayersLoadingMore(false);
        }
      }
    },
    [
      addPlayersHasMore,
      addPlayersLoadingMore,
      addPlayersPage,
      addPlayersQuery,
      addPlayersVisible,
    ],
  );

  useEffect(() => {
    if (!addPlayersVisible) return;
    const timer = setTimeout(() => {
      fetchPlayersForModal(true).catch((e) => {
        logError('Failed to initialize player search modal', e);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [addPlayersQuery, addPlayersVisible, fetchPlayersForModal]);

  const confirmAddPlayers = () => {
    if (addPlayersLineNumber == null) return;
    const selectedPlayers = addPlayersResults.filter((player) => addPlayersSelectedIds[player.playerId]);
    if (selectedPlayers.length === 0) {
      showInfo('Aucun joueur sélectionné', 'Sélectionne au moins un joueur à ajouter.');
      return;
    }

    addManualPlayersToLine(addPlayersLineNumber, selectedPlayers);
    showSuccess('Joueurs ajoutés', `${selectedPlayers.length} joueur(s) ajouté(s) au groupe de partage.`);
    closeAddPlayersModal();
  };

  const toggleSearchPlayerSelection = (playerId: string) => {
    setAddPlayersSelectedIds((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const handleShareLine = async (match: ClubNeedMatchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const playerIds = getSelectedPlayerIdsForLine(match);
    if (playerIds.length < 1) {
      Alert.alert('Sélection requise', 'Sélectionne au moins un joueur avant de partager.');
      return;
    }

    if (playerIds.length > 20) {
      Alert.alert('Limite dépassée', 'Tu peux partager au maximum 20 joueurs par lien.');
      return;
    }

    setLoading(true);
    try {
      const title = `${match.clubName || 'Club'} • ${new Date().toLocaleDateString('fr-FR')}`;
      const payload: any = {
        playerIds,
        title,
        clubName: match.clubName,
      };

      if (activeRequestId) {
        payload.sourceFeature = 'CLUB_NEEDS';
        payload.sourceRequestId = activeRequestId;
        payload.sourceRequestLineNumber = match.lineNumber;
      }

      const response = await (api as any).createPassportShareSet(payload);
      const shareUrl = String(response?.shareUrl ?? '');
      if (!shareUrl) {
        throw new Error('Lien de partage indisponible');
      }

      await Clipboard.setStringAsync(shareUrl);
      await Share.share({
        title: `Shortlist ${match.clubName}`,
        message: `Shortlist ${match.clubName}: ${shareUrl}`,
        url: shareUrl,
      });

      showSuccess('Partage prêt', 'Le lien a été copié et le menu de partage est ouvert.');

      if (activeRequestId) {
        await loadShareHistoryForLines(activeRequestId, [match.lineNumber]);
        await refreshHistoryShareCount(activeRequestId);
      }
    } catch (e: any) {
      logError('Failed to share club need shortlist', e);
      showError('Partage impossible', e?.message ?? 'Une erreur est survenue pendant le partage.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryDetailsForRequest = useCallback(
    async (requestId: string) => {
      if (!requestId || historyDetailsLoadingByRequest[requestId]) return;
      if (historyDetailsByRequest[requestId]) return;

      setHistoryDetailsLoadingByRequest((prev) => ({ ...prev, [requestId]: true }));
      try {
        const res = await (api as any).getClubNeedRequest(requestId, 5);
        const request = (res?.request ?? {}) as ClubNeedRequestListItem;
        const requestMatches = (res?.matches ?? []) as ClubNeedMatchResult[];

        setLineStatesForRequest(requestId, request);
        setHistoryDetailsByRequest((prev) => ({
          ...prev,
          [requestId]: {
            request,
            matches: requestMatches,
            loadedAt: Date.now(),
          },
        }));

        await loadShareHistoryForLines(
          requestId,
          requestMatches.map((item) => item.lineNumber),
        );
      } catch (e) {
        logError('Failed to load club needs history details', e);
      } finally {
        setHistoryDetailsLoadingByRequest((prev) => ({ ...prev, [requestId]: false }));
      }
    },
    [
      historyDetailsByRequest,
      historyDetailsLoadingByRequest,
      loadShareHistoryForLines,
      setLineStatesForRequest,
    ],
  );

  const toggleHistoryEntryExpanded = async (entry: HistoryEntryView) => {
    const nextExpanded = !expandedHistoryEntryByKey[entry.viewKey];
    setExpandedHistoryEntryByKey((prev) => ({ ...prev, [entry.viewKey]: nextExpanded }));
    if (nextExpanded) {
      await loadHistoryDetailsForRequest(entry.request.id);
    }
  };

  const updateRequestLineStatusLocal = useCallback(
    (requestId: string, nextLineStates: ClubNeedLineState[]) => {
      const progress = computeRequestProgress(nextLineStates);
      setRequestLineStatesByRequest((prev) => ({ ...prev, [requestId]: nextLineStates }));
      setHistory((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                lineStates: nextLineStates,
                ...progress,
              }
            : item,
        ),
      );
      setHistoryDetailsByRequest((prev) => {
        const existing = prev[requestId];
        if (!existing) return prev;
        return {
          ...prev,
          [requestId]: {
            ...existing,
            request: {
              ...existing.request,
              lineStates: nextLineStates,
              ...progress,
            },
          },
        };
      });
    },
    [],
  );

  const patchLineStatus = useCallback(
    async (requestId: string, lineNumber: number, isCompleted: boolean) => {
      if (!requestId) return;

      const lineKey = getLineKey(requestId, lineNumber);
      const requestFromHistory = history.find((item) => item.id === requestId);
      const currentLineStates =
        requestLineStatesByRequest[requestId] ??
        normalizeLineStates(requestFromHistory?.parsed, requestFromHistory?.lineStates);
      const previousLineStates = [...currentLineStates];

      const optimisticLineStates = currentLineStates.map((line) =>
        line.lineNumber === lineNumber
          ? {
              ...line,
              isCompleted,
              ...(isCompleted
                ? { completedAt: new Date().toISOString() }
                : { reopenedAt: new Date().toISOString() }),
            }
          : line,
      );

      setLineStatusLoadingByKey((prev) => ({ ...prev, [lineKey]: true }));
      updateRequestLineStatusLocal(requestId, optimisticLineStates);

      try {
        const updated = (await (api as any).updateClubNeedLineStatus(
          requestId,
          lineNumber,
          isCompleted,
        )) as ClubNeedRequestListItem;

        const updatedLineStates = normalizeLineStates(updated?.parsed, updated?.lineStates);
        updateRequestLineStatusLocal(requestId, updatedLineStates);

        showSuccess(
          isCompleted ? 'Besoin terminé' : 'Besoin réouvert',
          isCompleted
            ? 'La ligne a été classée dans l’historique.'
            : 'La ligne est de nouveau active.',
        );
      } catch (e: any) {
        logError('Failed to update club need line status', e);
        updateRequestLineStatusLocal(requestId, previousLineStates);
        showError(
          isCompleted ? 'Impossible de terminer la ligne' : 'Impossible de réouvrir la ligne',
          e?.message ?? 'Réessaie dans quelques instants.',
        );
      } finally {
        setLineStatusLoadingByKey((prev) => ({ ...prev, [lineKey]: false }));
      }
    },
    [history, requestLineStatesByRequest, updateRequestLineStatusLocal],
  );

  const handleCompleteActiveLine = async (lineNumber: number) => {
    if (!activeRequestId) return;
    await patchLineStatus(activeRequestId, lineNumber, true);
  };

  const handleReopenHistoryLine = async (requestId: string, lineNumber: number) => {
    await patchLineStatus(requestId, lineNumber, false);
  };

  const getFinalSharedPlayersForLine = useCallback(
    (requestId: string, lineNumber: number) => {
      const items = shareHistoryByLine[getLineKey(requestId, lineNumber)] ?? [];
      const activeShareSets = items.filter((item) => !item.revokedAt);
      const playersMap = new Map<string, ClubNeedMatchPlayer>();

      activeShareSets.forEach((shareSet) => {
        const shareItems = Array.isArray(shareSet.items) ? shareSet.items : [];
        shareItems.forEach((shareItem: any) => {
          const playerId = String(shareItem?.playerId ?? '');
          if (!playerId) return;
          playersMap.set(playerId, {
            playerId,
            firstName: shareItem?.firstName ?? null,
            lastName: shareItem?.lastName ?? null,
            position: shareItem?.position ?? '—',
            nationality: shareItem?.nationality ?? '—',
            club: shareItem?.clubName ? { name: shareItem.clubName, logo: null } : null,
            marketValue: null,
            contractUntil: null,
            preferredFoot: null,
            photoUrl: shareItem?.avatarUrl ?? null,
          });
        });
      });

      return {
        players: Array.from(playersMap.values()),
        activeShareSetsCount: activeShareSets.length,
        totalShareSetsCount: items.length,
        lastSharedAt: items[0]?.createdAt ?? null,
      };
    },
    [shareHistoryByLine],
  );

  const handleViewPassport = (playerId: string, lineNumber: number, clubName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PassportPreview', {
      playerId,
      source: {
        requestId: activeRequestId ?? undefined,
        lineNumber,
        clubName,
      },
    });
  };

  const historyClubOptions = useMemo(() => {
    const clubs = new Set<string>();
    history.forEach((item) => {
      getRequestClubNames(item).forEach((clubName) => clubs.add(clubName));
    });
    return [ALL_CLUB_FILTER, ...Array.from(clubs).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [history]);

  const historyMonthOptions = useMemo(() => {
    const options = new Set<string>();
    options.add(ALL_MONTH_FILTER);

    const today = new Date();
    for (let offset = 0; offset < 12; offset += 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      options.add(toMonthValueFromDate(date));
    }

    history.forEach((item) => {
      const monthValue = toMonthValue(item.createdAt);
      if (monthValue) options.add(monthValue);
    });

    return Array.from(options).sort((a, b) => {
      if (a === ALL_MONTH_FILTER) return -1;
      if (b === ALL_MONTH_FILTER) return 1;
      return b.localeCompare(a);
    });
  }, [history]);

  const historyEntries = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    const rows: HistoryEntryView[] = [];

    history.forEach((request) => {
      const clubs = getRequestClubNames(request);
      const quality = getRequestQuality(request);

      clubs.forEach((clubName, index) => {
        const clubLower = clubName.toLowerCase();
        const matchesClubFilter = historyClubFilter === ALL_CLUB_FILTER || historyClubFilter === clubName;
        const humanLabel = formatRequestLabel(request.createdAt).toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          humanLabel.includes(query) ||
          request.id.toLowerCase().includes(query) ||
          request.rawText.toLowerCase().includes(query) ||
          clubLower.includes(query);

        if (!matchesClubFilter || !matchesSearch) return;

        rows.push({
          viewKey: `${request.id}:${clubName}:${index}`,
          request,
          clubName,
          clubsCount: clubs.length,
          quality,
        });
      });
    });

    rows.sort((a, b) => {
      const aPinned = a.request.id === lastOpenedRequestId ? 1 : 0;
      const bPinned = b.request.id === lastOpenedRequestId ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return +new Date(b.request.createdAt) - +new Date(a.request.createdAt);
    });

    return rows;
  }, [history, historyClubFilter, historySearch, lastOpenedRequestId]);

  useEffect(() => {
    if (!matches || !route?.params?.addToShare) return;

    const payload = route.params.addToShare as ClubNeedsAddToSharePayload;

    navigation.setParams({ addToShare: undefined });

    if (!payload?.player?.playerId || !payload?.lineNumber) {
      return;
    }

    if (payload.requestId && activeRequestId && payload.requestId !== activeRequestId) {
      showError('Contexte expiré', 'Le joueur vient d’une autre demande. Recharge la demande concernée.');
      return;
    }

    const hasLine = matches.some((match) => match.lineNumber === payload.lineNumber);
    if (!hasLine) {
      showError('Ligne introuvable', 'La ligne de besoin ciblée n’est plus affichée.');
      return;
    }

    addManualPlayersToLine(payload.lineNumber, [normalizePlayerFromRoute(payload.player)]);
    showSuccess('Joueur ajouté', 'Le joueur a été ajouté au groupe de partage.');
  }, [activeRequestId, matches, navigation, route?.params?.addToShare]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrowBack" size="md" color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Besoins clubs</Text>
        <TouchableOpacity
          testID="club-needs-toggle-history"
          style={styles.historyBtn}
          onPress={() => setShowHistory((value) => !value)}
        >
          <Icon name="time" size="md" color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GlassCard variant="elevated" style={styles.card}>
          <Text style={styles.label}>Coller la liste (1 ligne = 1 club)</Text>
          <TextInput
            style={styles.input}
            multiline
            value={rawText}
            onChangeText={setRawText}
            placeholder={EXAMPLE}
            placeholderTextColor={colors.text.secondary}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              testID="club-needs-generate"
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleGenerate}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Générer & sauvegarder</Text>
              )}
            </TouchableOpacity>
          </View>

          {matches ? (
            <Text style={styles.meta}>
              {validCount} besoins valides • Top 5 joueurs / club
            </Text>
          ) : null}
        </GlassCard>

        {showHistory ? (
          <GlassCard variant="bordered" style={styles.card}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.sectionTitle}>Historique des demandes</Text>
              <TouchableOpacity
                style={styles.historyRefreshBtn}
                onPress={() => loadHistory(true)}
                disabled={historyLoading}
              >
                <Icon name="refresh" size="sm" color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.historySearchRow}>
              <Icon name="search" size="sm" color={colors.text.secondary} />
              <TextInput
                style={styles.historySearchInput}
                placeholder="Rechercher (ID, texte, club...)"
                placeholderTextColor={colors.text.secondary}
                value={historySearch}
                onChangeText={setHistorySearch}
              />
              {historySearch.length > 0 ? (
                <TouchableOpacity onPress={() => setHistorySearch('')}>
                  <Icon name="close" size="sm" color={colors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubFilterRow}
            >
              {historyClubOptions.map((clubName) => {
                const isActive = historyClubFilter === clubName;
                const label = clubName === ALL_CLUB_FILTER ? 'Tous les clubs' : clubName;
                return (
                  <TouchableOpacity
                    key={clubName}
                    style={[styles.clubFilterChip, isActive && styles.clubFilterChipActive]}
                    onPress={() => setHistoryClubFilter(clubName)}
                  >
                    <Text style={[styles.clubFilterChipText, isActive && styles.clubFilterChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.monthFilterRow}>
              <TouchableOpacity
                testID="club-needs-open-month-filter"
                style={styles.monthFilterBtn}
                onPress={() => setMonthFilterModalVisible(true)}
                activeOpacity={0.9}
              >
                <Icon name="calendar" size="sm" color={colors.text.secondary} />
                <Text style={styles.monthFilterBtnText}>
                  Calendrier: {historyMonthFilter === ALL_MONTH_FILTER ? 'Tous les mois' : formatMonthLabel(historyMonthFilter)}
                </Text>
              </TouchableOpacity>
              {historyMonthFilter !== ALL_MONTH_FILTER ? (
                <TouchableOpacity onPress={() => setHistoryMonthFilter(ALL_MONTH_FILTER)}>
                  <Text style={styles.monthFilterResetText}>Réinitialiser</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {historyLoading ? (
              <ActivityIndicator color={colors.brand.primary} />
            ) : historyEntries.length === 0 ? (
              <Text style={styles.empty}>Aucune demande correspondante.</Text>
            ) : (
              <View style={styles.historyList}>
                {historyEntries.map((entry) => {
                  const shareCount = historyShareCountByRequest[entry.request.id] ?? 0;
                  const isPinned = entry.request.id === lastOpenedRequestId;
                  const isExpanded = Boolean(expandedHistoryEntryByKey[entry.viewKey]);
                  const detail = historyDetailsByRequest[entry.request.id];
                  const detailLoading = Boolean(historyDetailsLoadingByRequest[entry.request.id]);
                  const lineStates =
                    requestLineStatesByRequest[entry.request.id] ??
                    normalizeLineStates(entry.request.parsed, entry.request.lineStates);
                  const lineStatesForClub = lineStates.filter(
                    (line) =>
                      String(line.clubName ?? '').trim().toLowerCase() ===
                      entry.clubName.trim().toLowerCase(),
                  );
                  const progressInfo =
                    entry.request.linesTotal != null &&
                    entry.request.linesCompleted != null &&
                    entry.request.requestProgress
                      ? {
                          linesTotal: entry.request.linesTotal,
                          linesCompleted: entry.request.linesCompleted,
                          requestProgress: entry.request.requestProgress,
                        }
                      : computeRequestProgress(lineStates);
                  const progress = progressInfo.requestProgress;

                  return (
                    <View key={entry.viewKey} style={styles.historyItem}>
                      <View style={styles.historyItemHeader}>
                        <Text style={styles.historyTitle}>{formatRequestLabel(entry.request.createdAt)}</Text>
                        <View style={styles.historyMetaRight}>
                          {isPinned ? (
                            <View style={styles.pinnedBadge}>
                              <Icon name="checkmark" size="xs" color={colors.background.primary} />
                              <Text style={styles.pinnedBadgeText}>Dernière ouverte</Text>
                            </View>
                          ) : null}
                          <View
                            style={[
                              styles.qualityBadge,
                              {
                                borderColor: progressColor[progress],
                                backgroundColor: `${progressColor[progress]}22`,
                              },
                            ]}
                          >
                            <Text style={[styles.qualityText, { color: progressColor[progress] }]}>
                              {progressLabel[progress]}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.qualityBadge,
                              { borderColor: qualityColor[entry.quality], backgroundColor: `${qualityColor[entry.quality]}22` },
                            ]}
                          >
                            <Text style={[styles.qualityText, { color: qualityColor[entry.quality] }]}>
                              {qualityLabel[entry.quality]}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.historyClubName}>{entry.clubName}</Text>

                      <View style={styles.historyStatsRow}>
                        <Text style={styles.historySub}>
                          {new Date(entry.request.createdAt).toLocaleString('fr-FR')}
                        </Text>
                        <Text style={styles.historySub}>
                          {entry.clubsCount} club(s) • {shareCount} partage(s) • {progressInfo.linesCompleted}/{progressInfo.linesTotal} terminé(s)
                        </Text>
                      </View>
                      <Text style={styles.historyTechId}>ID technique: {entry.request.id}</Text>

                      <View style={styles.historyActionsRow}>
                        <TouchableOpacity
                          style={styles.historyActionBtn}
                          onPress={() => openHistoryItem(entry.request.id)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.historyActionBtnText}>Ouvrir la demande</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.historyActionBtn}
                          onPress={() => toggleHistoryEntryExpanded(entry)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.historyActionBtnText}>
                            {isExpanded ? 'Masquer détails' : 'Voir détails'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isExpanded ? (
                        detailLoading ? (
                          <ActivityIndicator color={colors.brand.primary} />
                        ) : (
                          <View style={styles.historyDetailSection}>
                            {lineStatesForClub.length === 0 ? (
                              <Text style={styles.historySub}>Aucune ligne pour ce club.</Text>
                            ) : (
                              lineStatesForClub.map((lineState) => {
                                const lineKey = getLineKey(entry.request.id, lineState.lineNumber);
                                const lineMatch = detail?.matches?.find(
                                  (line) => line.lineNumber === lineState.lineNumber,
                                );
                                const finalShared = getFinalSharedPlayersForLine(
                                  entry.request.id,
                                  lineState.lineNumber,
                                );
                                const lineLoading = Boolean(lineStatusLoadingByKey[lineKey]);

                                return (
                                  <View key={lineKey} style={styles.historyLineCard}>
                                    <View style={styles.historyLineHeader}>
                                      <Text style={styles.historyLineTitle}>
                                        Ligne {lineState.lineNumber} • {lineState.clubName}
                                      </Text>
                                      {lineState.isCompleted ? (
                                        <TouchableOpacity
                                          testID={`club-needs-reopen-line-${lineState.lineNumber}`}
                                          style={[
                                            styles.reopenLineBtn,
                                            lineLoading && styles.btnDisabled,
                                          ]}
                                          onPress={() =>
                                            handleReopenHistoryLine(
                                              entry.request.id,
                                              lineState.lineNumber,
                                            )
                                          }
                                          disabled={lineLoading}
                                        >
                                          {lineLoading ? (
                                            <ActivityIndicator
                                              size="small"
                                              color={colors.background.primary}
                                            />
                                          ) : (
                                            <Text style={styles.reopenLineBtnText}>Réouvrir</Text>
                                          )}
                                        </TouchableOpacity>
                                      ) : (
                                        <Text style={styles.historyLineActive}>Active</Text>
                                      )}
                                    </View>

                                    <View style={styles.historyInitialBlock}>
                                      <Text style={styles.historyBlockTitle}>Demande initiale</Text>
                                      <Text style={styles.historyBlockText}>
                                        {formatInitialNeedSummary(
                                          detail?.request ?? entry.request,
                                          lineState.lineNumber,
                                          lineMatch,
                                        )}
                                      </Text>
                                      <Text style={styles.historyBlockText}>
                                        Joueurs initiaux:{' '}
                                        {lineMatch?.players?.length
                                          ? lineMatch.players
                                              .slice(0, 6)
                                              .map((player) => formatPlayerName(player))
                                              .join(', ')
                                          : 'Aucun snapshot'}
                                      </Text>
                                    </View>

                                    <View style={styles.historyFinalBlock}>
                                      <Text style={styles.historyBlockTitle}>Joueurs partagés (finaux)</Text>
                                      <Text style={styles.historyBlockText}>
                                        {finalShared.players.length
                                          ? finalShared.players
                                              .slice(0, 8)
                                              .map((player) => formatPlayerName(player))
                                              .join(', ')
                                          : 'Aucun joueur partagé actif'}
                                      </Text>
                                      <Text style={styles.historyBlockSub}>
                                        {finalShared.activeShareSetsCount} actif(s) / {finalShared.totalShareSetsCount} total
                                        {finalShared.lastSharedAt
                                          ? ` • Dernier partage ${new Date(
                                              finalShared.lastSharedAt,
                                            ).toLocaleString('fr-FR')}`
                                          : ''}
                                      </Text>
                                    </View>

                                    <View style={styles.historyLineActions}>
                                      <TouchableOpacity
                                        style={styles.historyLineOpenBtn}
                                        onPress={() => openHistoryItem(entry.request.id)}
                                      >
                                        <Text style={styles.historyLineOpenBtnText}>Ouvrir ce besoin</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                );
                              })
                            )}
                          </View>
                        )
                      ) : null}
                    </View>
                  );
                })}

                {historyHasMore ? (
                  <TouchableOpacity
                    style={[styles.loadMoreBtn, historyLoadingMore && styles.btnDisabled]}
                    onPress={() => loadHistory(false)}
                    disabled={historyLoadingMore}
                  >
                    {historyLoadingMore ? (
                      <ActivityIndicator color={colors.brand.primary} size="small" />
                    ) : (
                      <Text style={styles.loadMoreText}>Charger plus</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </GlassCard>
        ) : null}

        {visibleMatches ? (
          <View style={styles.results}>
            {visibleMatches.length === 0 ? (
              <GlassCard variant="bordered" style={styles.card}>
                <Text style={styles.empty}>
                  Tous les besoins actifs sont terminés. Ouvre l’historique pour réouvrir une ligne.
                </Text>
              </GlassCard>
            ) : null}

            {visibleMatches.map((match) => {
              const lineKey = getLineKey(activeRequestId, match.lineNumber);
              const lineSelectedMap = selectedByLine[lineKey] ?? {};
              const manualPlayers = manualPlayersByLine[lineKey] ?? [];
              const selectedIds = getSelectedPlayerIdsForLine(match);
              const lineShareHistory = shareHistoryByLine[lineKey] ?? [];
              const activeShares = lineShareHistory.filter((item) => !item.revokedAt).length;
              const isUpdatingLineStatus = Boolean(lineStatusLoadingByKey[lineKey]);

              return (
                <GlassCard key={`${match.lineNumber}-${match.clubName}`} variant="bordered" style={styles.card}>
                  <View style={styles.resultHeader}>
                    <View style={styles.clubTitleRow}>
                      <Text style={styles.clubName}>{match.clubName || `Ligne ${match.lineNumber}`}</Text>
                      <TouchableOpacity
                        testID={`club-needs-share-line-${match.lineNumber}`}
                        style={[styles.shareBtn, selectedIds.length < 1 && styles.shareBtnDisabled]}
                        onPress={() => handleShareLine(match)}
                        activeOpacity={0.95}
                        disabled={selectedIds.length < 1 || loading}
                      >
                        <Icon name="share" size="sm" color={selectedIds.length < 1 ? colors.text.secondary : colors.brand.primary} />
                        <Text
                          style={[
                            styles.shareBtnText,
                            selectedIds.length < 1 && styles.shareBtnTextDisabled,
                          ]}
                        >
                          Partager ({selectedIds.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      testID={`club-needs-complete-line-${match.lineNumber}`}
                      style={[styles.completeLineBtn, isUpdatingLineStatus && styles.btnDisabled]}
                      onPress={() => handleCompleteActiveLine(match.lineNumber)}
                      disabled={isUpdatingLineStatus}
                      activeOpacity={0.9}
                    >
                      {isUpdatingLineStatus ? (
                        <ActivityIndicator size="small" color={colors.background.primary} />
                      ) : (
                        <>
                          <Icon name="checkmark" size="xs" color={colors.background.primary} />
                          <Text style={styles.completeLineBtnText}>Terminer ce besoin</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.chipsRow}>
                      {match.criteria.positions?.slice(0, 4).map((position) => (
                        <View key={position} style={styles.chip}>
                          <Text style={styles.chipText}>{position}</Text>
                        </View>
                      ))}
                      {formatAge(match.criteria.age) ? (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>{formatAge(match.criteria.age)}</Text>
                        </View>
                      ) : null}
                      {match.criteria.preferredFoot ? (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>{match.criteria.preferredFoot}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.shareHistoryBadgeRow}>
                      <Text style={styles.shareHistoryLabel}>
                        Partages: {activeShares} actif(s) / {lineShareHistory.length} total
                      </Text>
                      {lineShareHistory.length > 0 ? (
                        <Text style={styles.shareHistoryDate}>
                          Dernier: {new Date(lineShareHistory[0].createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {match.errors?.length ? (
                    <View style={styles.errorBox}>
                      {match.errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>{error}</Text>
                      ))}
                    </View>
                  ) : null}

                  {match.players?.length ? (
                    match.players.map((player) => {
                      const selected = Boolean(lineSelectedMap[player.playerId]);
                      return (
                        <View key={player.playerId} style={styles.playerRow}>
                          <TouchableOpacity
                            testID={`club-needs-checkbox-${match.lineNumber}-${player.playerId}`}
                            style={styles.checkboxBtn}
                            onPress={() => toggleSuggestedPlayer(match.lineNumber, player.playerId)}
                          >
                            <Ionicons
                              name={selected ? 'checkbox' : 'square-outline'}
                              size={22}
                              color={selected ? colors.brand.primary : colors.text.secondary}
                            />
                          </TouchableOpacity>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.playerName}>{formatPlayerName(player)}</Text>
                            <Text style={styles.playerMeta}>
                              {player.position} • {player.club?.name ?? 'Free agent'} • {formatValue(player.marketValue)}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.passportBtn}
                            onPress={() => handleViewPassport(player.playerId, match.lineNumber, match.clubName)}
                            activeOpacity={0.9}
                          >
                            <Text style={styles.passportBtnText}>Aperçu</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.empty}>Aucun joueur trouvé.</Text>
                  )}

                  <View style={styles.manualSection}>
                    <View style={styles.manualHeaderRow}>
                      <Text style={styles.manualTitle}>Groupe de partage ({manualPlayers.length} ajout manuel)</Text>
                      <TouchableOpacity
                        testID={`club-needs-open-add-${match.lineNumber}`}
                        style={styles.addPlayerBtn}
                        onPress={() => openAddPlayersModal(match.lineNumber)}
                        activeOpacity={0.9}
                      >
                        <Icon name="add" size="xs" color={colors.brand.primary} />
                        <Text style={styles.addPlayerBtnText}>Ajouter d’autres joueurs</Text>
                      </TouchableOpacity>
                    </View>

                    {manualPlayers.length === 0 ? (
                      <Text style={styles.manualEmpty}>Aucun joueur ajouté manuellement.</Text>
                    ) : (
                      manualPlayers.map((player) => (
                        <View key={player.playerId} style={styles.manualPlayerRow}>
                          <View style={styles.manualPlayerInfo}>
                            <Text style={styles.manualPlayerName}>{formatPlayerName(player)}</Text>
                            <Text style={styles.manualPlayerMeta}>
                              {player.position} • {player.club?.name ?? 'Free agent'}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.passportBtn}
                            onPress={() => handleViewPassport(player.playerId, match.lineNumber, match.clubName)}
                          >
                            <Text style={styles.passportBtnText}>Aperçu</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.removeManualBtn}
                            onPress={() => removeManualPlayerFromLine(match.lineNumber, player.playerId)}
                          >
                            <Icon name="close" size="sm" color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={monthFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthFilterModalVisible(false)}
      >
        <View style={styles.monthModalOverlay}>
          <View style={styles.monthModalCard}>
            <View style={styles.monthModalHeader}>
              <Text style={styles.monthModalTitle}>Filtrer par mois</Text>
              <TouchableOpacity onPress={() => setMonthFilterModalVisible(false)}>
                <Icon name="close" size="md" color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={historyMonthOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = historyMonthFilter === item;
                return (
                  <TouchableOpacity
                    testID={`club-needs-month-option-${item}`}
                    style={[styles.monthOptionRow, isSelected && styles.monthOptionRowActive]}
                    onPress={() => {
                      setHistoryMonthFilter(item);
                      setMonthFilterModalVisible(false);
                    }}
                  >
                    <Text style={[styles.monthOptionText, isSelected && styles.monthOptionTextActive]}>
                      {item === ALL_MONTH_FILTER ? 'Tous les mois' : formatMonthLabel(item)}
                    </Text>
                    {isSelected ? (
                      <Icon name="checkmark" size="sm" color={colors.brand.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={addPlayersVisible} transparent animationType="slide" onRequestClose={closeAddPlayersModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter des joueurs au partage</Text>
              <TouchableOpacity onPress={closeAddPlayersModal}>
                <Icon name="close" size="md" color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchRow}>
              <Icon name="search" size="sm" color={colors.text.secondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Recherche joueur, club, poste..."
                placeholderTextColor={colors.text.secondary}
                value={addPlayersQuery}
                onChangeText={setAddPlayersQuery}
              />
            </View>

            {addPlayersLoading ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={colors.brand.primary} />
              </View>
            ) : (
              <FlatList
                data={addPlayersResults}
                keyExtractor={(item) => item.playerId}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => {
                  const selected = Boolean(addPlayersSelectedIds[item.playerId]);
                  return (
                    <TouchableOpacity
                      testID={`club-needs-search-player-${item.playerId}`}
                      style={[styles.modalPlayerRow, selected && styles.modalPlayerRowSelected]}
                      onPress={() => toggleSearchPlayerSelection(item.playerId)}
                    >
                      <View style={styles.modalPlayerAvatar}>
                        {item.photoUrl ? (
                          <Image source={{ uri: item.photoUrl }} style={styles.modalPlayerAvatarImage} />
                        ) : (
                          <Text style={styles.modalPlayerAvatarText}>
                            {formatPlayerName(item).slice(0, 1).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalPlayerName}>{formatPlayerName(item)}</Text>
                        <Text style={styles.modalPlayerMeta}>
                          {item.position} • {item.club?.name ?? 'Free agent'}
                        </Text>
                      </View>
                      <Ionicons
                        name={selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={selected ? colors.brand.primary : colors.text.secondary}
                      />
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.empty}>Aucun joueur trouvé pour cette recherche.</Text>
                }
              />
            )}

            {addPlayersHasMore ? (
              <TouchableOpacity
                style={[styles.modalLoadMoreBtn, addPlayersLoadingMore && styles.btnDisabled]}
                onPress={() => fetchPlayersForModal(false)}
                disabled={addPlayersLoadingMore}
              >
                {addPlayersLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.brand.primary} />
                ) : (
                  <Text style={styles.modalLoadMoreText}>Charger plus de joueurs</Text>
                )}
              </TouchableOpacity>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeAddPlayersModal}>
                <Text style={styles.modalCancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="club-needs-confirm-add"
                style={styles.modalConfirmBtn}
                onPress={confirmAddPlayers}
              >
                <Text style={styles.modalConfirmBtnText}>Ajouter à la sélection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.glass,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.glass,
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  input: {
    minHeight: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    color: colors.text.primary,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontSize: typography.sizes.sm,
  },
  actionsRow: { flexDirection: 'row', marginTop: spacing.md },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.background.primary, fontWeight: '800' },
  meta: { marginTop: spacing.sm, color: colors.text.secondary, fontSize: typography.sizes.xs },
  sectionTitle: { color: colors.text.primary, fontWeight: '800' },
  empty: { color: colors.text.secondary },

  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyRefreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.glass,
  },
  historySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  historySearchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    paddingVertical: 10,
  },
  clubFilterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  clubFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface.glass,
  },
  clubFilterChipActive: {
    backgroundColor: `${colors.brand.primary}33`,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}88`,
  },
  clubFilterChipText: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: typography.sizes.xs,
  },
  clubFilterChipTextActive: {
    color: colors.brand.primary,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    gap: spacing.xs,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyTitle: { color: colors.text.primary, fontWeight: '800' },
  historyClubName: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  historySub: { color: colors.text.secondary, fontSize: typography.sizes.xs },
  historyTechId: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  historyActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  historyActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface.elevated,
  },
  historyActionBtnText: {
    color: colors.brand.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  historyDetailSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  historyLineCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.elevated,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  historyLineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyLineActions: {
    marginTop: spacing.xs,
  },
  historyLineOpenBtn: {
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLineOpenBtnText: {
    color: colors.brand.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  historyLineTitle: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
    flex: 1,
  },
  historyLineActive: {
    color: '#22C55E',
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  reopenLineBtn: {
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reopenLineBtnText: {
    color: colors.background.primary,
    fontWeight: '900',
    fontSize: typography.sizes.xs,
  },
  historyInitialBlock: {
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
    padding: spacing.sm,
    gap: 4,
  },
  historyFinalBlock: {
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
    padding: spacing.sm,
    gap: 4,
  },
  historyBlockTitle: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  historyBlockText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  historyBlockSub: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  monthFilterRow: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  monthFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    flex: 1,
  },
  monthFilterBtnText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  monthFilterResetText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
  },
  qualityBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qualityText: {
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  pinnedBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.primary,
  },
  pinnedBadgeText: {
    color: colors.background.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  loadMoreText: {
    color: colors.brand.primary,
    fontWeight: '800',
    fontSize: typography.sizes.sm,
  },

  results: { gap: spacing.lg },
  resultHeader: { gap: spacing.sm, marginBottom: spacing.md },
  clubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  clubName: { color: colors.text.primary, fontWeight: '900', fontSize: typography.sizes.md },
  completeLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    minHeight: 34,
  },
  completeLineBtnText: {
    color: colors.background.primary,
    fontWeight: '900',
    fontSize: typography.sizes.xs,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}44`,
  },
  shareBtnText: { color: colors.brand.primary, fontWeight: '900', fontSize: typography.sizes.xs },
  shareBtnDisabled: {
    opacity: 0.55,
    borderColor: colors.surface.border,
  },
  shareBtnTextDisabled: {
    color: colors.text.secondary,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface.glass,
  },
  chipText: { color: colors.text.secondary, fontSize: typography.sizes.xs, fontWeight: '700' },
  shareHistoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  shareHistoryLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  shareHistoryDate: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  errorBox: {
    backgroundColor: '#EF444420',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: '#EF4444', fontWeight: '700', fontSize: typography.sizes.sm },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface.border,
  },
  checkboxBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: { color: colors.text.primary, fontWeight: '800' },
  playerMeta: { color: colors.text.secondary, marginTop: 2, fontSize: typography.sizes.xs },
  passportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  passportBtnText: { color: colors.brand.primary, fontWeight: '900', fontSize: typography.sizes.xs },

  manualSection: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  manualHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  manualTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  addPlayerBtnText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
  },
  manualEmpty: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  manualPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
    padding: spacing.sm,
  },
  manualPlayerInfo: { flex: 1 },
  manualPlayerName: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  manualPlayerMeta: {
    color: colors.text.secondary,
    marginTop: 2,
    fontSize: typography.sizes.xs,
  },
  removeManualBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444422',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  monthModalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  monthModalCard: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    padding: spacing.lg,
    maxHeight: '70%',
    gap: spacing.sm,
  },
  monthModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthModalTitle: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: typography.sizes.md,
  },
  monthOptionRow: {
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  monthOptionRowActive: {
    borderWidth: 1,
    borderColor: `${colors.brand.primary}77`,
  },
  monthOptionText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    textTransform: 'capitalize',
  },
  monthOptionTextActive: {
    color: colors.brand.primary,
    fontWeight: '800',
  },
  modalCard: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '82%',
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '800',
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.sm,
  },
  modalLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    gap: spacing.sm,
  },
  modalPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    padding: spacing.sm,
  },
  modalPlayerRowSelected: {
    borderWidth: 1,
    borderColor: `${colors.brand.primary}77`,
  },
  modalPlayerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalPlayerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modalPlayerAvatarText: {
    color: colors.text.primary,
    fontWeight: '800',
  },
  modalPlayerName: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  modalPlayerMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  modalLoadMoreBtn: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  modalLoadMoreText: {
    color: colors.brand.primary,
    fontWeight: '800',
    fontSize: typography.sizes.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  modalCancelBtnText: {
    color: colors.text.secondary,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  modalConfirmBtnText: {
    color: colors.background.primary,
    fontWeight: '800',
  },
});
