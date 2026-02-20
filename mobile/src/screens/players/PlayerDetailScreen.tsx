import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { colors, radius, spacing, typography } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import api from '../../services/api';
import { logger } from '../../utils/logger';
import { trackRecentPlayer } from '../../services/recentPlayers';
import { DEFAULT_ROLE, isCategoryARole, type UserRole } from '../../lib/roles';
import type {
  PlayerProfileView,
  ProfileContentStatus,
  ProfileSectionKey,
} from '../../types/player-profile';

type EditorField = {
  key: string;
  label: string;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
  multiline?: boolean;
};

type AnchorKey =
  | 'identity'
  | 'scouting'
  | 'performance'
  | 'hardware'
  | 'media'
  | 'market'
  | 'transfers'
  | 'career'
  | 'nationalTeam'
  | 'achievements'
  | 'news'
  | 'rumours';

const ANCHOR_TO_SECTION: Partial<Record<AnchorKey, ProfileSectionKey>> = {
  performance: 'performance-rows',
  transfers: 'transfers',
  career: 'career',
  nationalTeam: 'national-team',
  achievements: 'achievements',
  news: 'news',
  rumours: 'rumours',
};

const STATUS_ACTIONS: Array<{ status: ProfileContentStatus; key: 'draft' | 'verify' | 'publish' | 'archive' }> = [
  { status: 'DRAFT', key: 'draft' },
  { status: 'VERIFIED', key: 'verify' },
  { status: 'PUBLISHED', key: 'publish' },
  { status: 'ARCHIVED', key: 'archive' },
];

const EDITOR_FIELDS: Record<ProfileSectionKey, EditorField[]> = {
  'performance-rows': [
    { key: 'competitionName', label: 'Competition' },
    { key: 'season', label: 'Saison', placeholder: '2025/26' },
    { key: 'possibleGames', label: 'Matchs possibles', keyboardType: 'numeric' },
    { key: 'appearances', label: 'Apparitions', keyboardType: 'numeric' },
    { key: 'goals', label: 'Buts', keyboardType: 'numeric' },
    { key: 'assists', label: 'Assists', keyboardType: 'numeric' },
    { key: 'yellowCards', label: 'Jaunes', keyboardType: 'numeric' },
    { key: 'redCards', label: 'Rouges', keyboardType: 'numeric' },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
    { key: 'sourceDate', label: 'Date source', placeholder: '2026-02-16' },
  ],
  transfers: [
    { key: 'toClubName', label: 'Club rejoint' },
    { key: 'fromClubName', label: 'Club quitté' },
    { key: 'season', label: 'Saison', placeholder: '2025/26' },
    { key: 'marketValueAtTime', label: 'Valeur du moment', keyboardType: 'numeric' },
    { key: 'feeAmount', label: 'Montant transfert', keyboardType: 'numeric' },
    { key: 'feeCurrency', label: 'Devise', placeholder: 'EUR' },
    { key: 'transferType', label: 'Type de transfert', placeholder: 'Loan/Transfer' },
    { key: 'transferDate', label: 'Date transfert', placeholder: '2026-02-16' },
    { key: 'notes', label: 'Notes', multiline: true },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
    { key: 'sourceDate', label: 'Date source', placeholder: '2026-02-16' },
  ],
  career: [
    { key: 'clubName', label: 'Club' },
    { key: 'teamLevel', label: 'Niveau', placeholder: 'YOUTH/SENIOR/NATIONAL' },
    { key: 'startDate', label: 'Date début', placeholder: '2024-07-01' },
    { key: 'endDate', label: 'Date fin', placeholder: '2025-06-30' },
    { key: 'isLoan', label: 'Prêt (true/false)' },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
    { key: 'sourceDate', label: 'Date source', placeholder: '2026-02-16' },
  ],
  achievements: [
    { key: 'title', label: 'Titre' },
    { key: 'competition', label: 'Compétition' },
    { key: 'season', label: 'Saison' },
    { key: 'count', label: 'Nombre', keyboardType: 'numeric' },
    { key: 'description', label: 'Description', multiline: true },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
    { key: 'sourceDate', label: 'Date source', placeholder: '2026-02-16' },
  ],
  'national-team': [
    { key: 'country', label: 'Pays' },
    { key: 'teamLevel', label: 'Niveau équipe', placeholder: 'U17/U19/U21/A' },
    { key: 'caps', label: 'Sélections', keyboardType: 'numeric' },
    { key: 'goals', label: 'Buts', keyboardType: 'numeric' },
    { key: 'fromDate', label: 'Date début', placeholder: '2024-01-01' },
    { key: 'toDate', label: 'Date fin', placeholder: '2025-01-01' },
    { key: 'isCurrent', label: 'Actuel (true/false)' },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
    { key: 'sourceDate', label: 'Date source', placeholder: '2026-02-16' },
  ],
  news: [
    { key: 'headline', label: 'Titre' },
    { key: 'summary', label: 'Résumé', multiline: true },
    { key: 'publishedAtSource', label: 'Publié le', placeholder: '2026-02-16' },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
  ],
  rumours: [
    { key: 'headline', label: 'Titre' },
    { key: 'summary', label: 'Résumé', multiline: true },
    { key: 'destinationClub', label: 'Club visé' },
    { key: 'probabilityPercent', label: 'Probabilité %', keyboardType: 'numeric' },
    { key: 'sourceName', label: 'Source' },
    { key: 'sourceUrl', label: 'URL source', placeholder: 'https://...' },
    { key: 'sourceDate', label: 'Date source', placeholder: '2026-02-16' },
  ],
};

const NUMERIC_FIELDS = new Set([
  'possibleGames',
  'appearances',
  'goals',
  'assists',
  'yellowCards',
  'secondYellowCards',
  'redCards',
  'startingXIPercent',
  'minutesPercent',
  'goalParticipationPercent',
  'marketValueAtTime',
  'feeAmount',
  'count',
  'caps',
  'probabilityPercent',
]);

const BOOLEAN_FIELDS = new Set(['isLoan', 'isCurrent']);

const toDateLabel = (value?: string | Date | null, language: 'fr' | 'en' = 'fr'): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toMoney = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

const parseBoolean = (value?: string): boolean | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'oui'].includes(normalized)) return true;
  if (['false', '0', 'no', 'non'].includes(normalized)) return false;
  return undefined;
};

const parseNumber = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatMaybeNumber = (value?: number | null, suffix = ''): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Number.isInteger(value) ? `${value}` : value.toFixed(2);
  return suffix ? `${rounded}${suffix}` : rounded;
};

const formatStatus = (status?: ProfileContentStatus | null, language: 'fr' | 'en' = 'fr'): string => {
  if (!status) return '—';
  if (language === 'fr') {
    if (status === 'DRAFT') return 'Brouillon';
    if (status === 'VERIFIED') return 'Vérifié';
    if (status === 'PUBLISHED') return 'Publié';
    return 'Archivé';
  }
  if (status === 'DRAFT') return 'Draft';
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'PUBLISHED') return 'Published';
  return 'Archived';
};

const statusColor = (status?: ProfileContentStatus | null) => {
  switch (status) {
    case 'PUBLISHED':
      return { bg: 'rgba(70, 192, 122, 0.15)', border: 'rgba(70, 192, 122, 0.45)', text: '#46C07A' };
    case 'VERIFIED':
      return { bg: 'rgba(68, 155, 255, 0.15)', border: 'rgba(68, 155, 255, 0.45)', text: '#449BFF' };
    case 'ARCHIVED':
      return { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.45)', text: '#F43F5E' };
    case 'DRAFT':
    default:
      return { bg: 'rgba(228, 255, 59, 0.14)', border: 'rgba(228, 255, 59, 0.45)', text: colors.brand.primary };
  }
};

const toEditorValue = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return '';
};

const getInitials = (fullName: string) => {
  const parts = fullName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const normalizeMeterToKm = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return null;
  return Number((value / 1000).toFixed(2));
};

type PlayerMediaItem = {
  id: string;
  type: string;
  url: string;
  playbackUrl?: string;
  playbackExpiresAt?: string;
  filename?: string | null;
  mimeType?: string | null;
  size?: number | null;
  duration?: number | null;
  uploadedAt?: string | null;
};

const formatBytes = (bytes?: number | null) => {
  if (!Number.isFinite(bytes ?? null) || bytes == null) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(mb))} MB`;
};

const decodeFileName = (filename?: string | null) => {
  if (!filename) return 'Vidéo';
  const plusReplaced = filename.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(plusReplaced);
  } catch {
    return plusReplaced;
  }
};

export const PlayerDetailScreen = ({ route, navigation }: any) => {
  const playerId = route.params?.playerId || route.params?.params?.playerId || route.params?.id;
  const { user, activeRole } = useAuth();
  const { language, dictionary } = useLocalization();

  const copy = (dictionary as any)?.players?.profileView;
  const effectiveRole = (activeRole ?? user?.role ?? DEFAULT_ROLE) as UserRole;
  const isAdmin = isCategoryARole(effectiveRole);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<PlayerProfileView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<PlayerMediaItem[]>([]);
  const [mediaErrors, setMediaErrors] = useState<Record<string, string>>({});

  const scrollRef = useRef<ScrollView | null>(null);
  const sectionOffsets = useRef<Partial<Record<AnchorKey, number>>>({});
  const mediaRetryRef = useRef<Record<string, boolean>>({});

  const [editorVisible, setEditorVisible] = useState(false);
  const [editorSection, setEditorSection] = useState<ProfileSectionKey>('news');
  const [editorValues, setEditorValues] = useState<Record<string, string>>({});
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorItemId, setEditorItemId] = useState<string | null>(null);
  const [savingEditor, setSavingEditor] = useState(false);
  const [statusLoadingKey, setStatusLoadingKey] = useState<string | null>(null);
  const [deletingItemKey, setDeletingItemKey] = useState<string | null>(null);

  const txt = useCallback(
    (value: string | undefined, fallbackFr: string, fallbackEn: string) => {
      if (value) return value;
      return language === 'fr' ? fallbackFr : fallbackEn;
    },
    [language],
  );

  const statusActionLabels = useMemo(
    () => ({
      draft: txt(copy?.actions?.statusDraft, 'Brouillon', 'Save draft'),
      verify: txt(copy?.actions?.statusVerify, 'Vérifier', 'Verify'),
      publish: txt(copy?.actions?.statusPublish, 'Publier', 'Publish'),
      archive: txt(copy?.actions?.statusArchive, 'Archiver', 'Archive'),
    }),
    [copy?.actions?.statusArchive, copy?.actions?.statusDraft, copy?.actions?.statusPublish, copy?.actions?.statusVerify, txt],
  );

  const anchors = useMemo(
    () => [
      { key: 'identity' as const, label: txt(copy?.anchors?.identity, 'Profil', 'Profile') },
      { key: 'scouting' as const, label: txt(copy?.anchors?.scouting, 'Scouting', 'Scouting') },
      { key: 'performance' as const, label: txt(copy?.anchors?.performance, 'Performance', 'Performance') },
      { key: 'hardware' as const, label: txt(copy?.anchors?.hardware, 'Hardware', 'Hardware') },
      { key: 'media' as const, label: txt(copy?.anchors?.media, 'Vidéos', 'Videos') },
      { key: 'market' as const, label: txt(copy?.anchors?.market, 'Marché', 'Market') },
      { key: 'transfers' as const, label: txt(copy?.anchors?.transfers, 'Transferts', 'Transfers') },
      { key: 'career' as const, label: txt(copy?.anchors?.career, 'Carrière', 'Career') },
      { key: 'nationalTeam' as const, label: txt(copy?.anchors?.nationalTeam, 'Nation', 'National Team') },
      { key: 'achievements' as const, label: txt(copy?.anchors?.achievements, 'Palmarès', 'Achievements') },
      { key: 'news' as const, label: txt(copy?.anchors?.news, 'News', 'News') },
      { key: 'rumours' as const, label: txt(copy?.anchors?.rumours, 'Rumeurs', 'Rumours') },
    ],
    [
      copy?.anchors?.achievements,
      copy?.anchors?.career,
      copy?.anchors?.hardware,
      copy?.anchors?.identity,
      copy?.anchors?.media,
      copy?.anchors?.market,
      copy?.anchors?.nationalTeam,
      copy?.anchors?.news,
      copy?.anchors?.performance,
      copy?.anchors?.rumours,
      copy?.anchors?.scouting,
      copy?.anchors?.transfers,
      txt,
    ],
  );

  const registerSection = useCallback((key: AnchorKey, y: number) => {
    sectionOffsets.current[key] = y;
  }, []);

  const scrollToSection = useCallback((key: AnchorKey) => {
    const y = sectionOffsets.current[key];
    if (typeof y === 'number' && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 96), animated: true });
    }
  }, []);

  const loadProfile = useCallback(
    async (silent = false) => {
      if (!playerId) {
        setError(txt(copy?.errors?.playerNotFound, 'Joueur introuvable', 'Player not found'));
        setLoading(false);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setMediaLoading(true);

        const [data, mediaList] = await Promise.all([
          api.getPlayerProfileView(playerId, {
            includeUnpublished: isAdmin,
          }),
          api
            .getPlayerMedia(playerId)
            .then((response) => (Array.isArray(response) ? response : []))
            .catch((mediaError) => {
              logger.warn('player-profile', 'Failed to load player media', {
                error: (mediaError as Error)?.message,
                playerId,
              });
              return [];
            }),
        ]);

        setProfile(data);
        setMediaItems(mediaList as PlayerMediaItem[]);
        setMediaErrors((prev) => {
          const validIds = new Set((mediaList as PlayerMediaItem[]).map((item) => item.id));
          return Object.fromEntries(Object.entries(prev).filter(([mediaId]) => validIds.has(mediaId)));
        });
        setError(null);

        trackRecentPlayer({
          id: playerId,
          fullName: data.identity.fullName,
          position: data.identity.positions?.main ?? undefined,
          clubName: data.identity.club?.name,
          photoUrl: data.identity.profile?.avatar ?? undefined,
          lastViewedAt: new Date().toISOString(),
        });
      } catch (err) {
        logger.error('player-profile', 'Failed to load player profile view', {
          error: (err as Error)?.message,
          playerId,
        });
        setError(txt(copy?.errors?.loadFailed, 'Impossible de charger le profil', 'Failed to load profile'));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setMediaLoading(false);
      }
    },
    [copy?.errors?.loadFailed, copy?.errors?.playerNotFound, isAdmin, playerId, txt],
  );

  const videoItems = useMemo(
    () =>
      mediaItems
        .filter((item) => String(item.type).toUpperCase() === 'VIDEO')
        .slice(0, 3),
    [mediaItems],
  );

  const canManageHighlights = useMemo(() => {
    if (isAdmin) return true;
    return !!user?.playerId && user.playerId === playerId;
  }, [isAdmin, playerId, user?.playerId]);

  const openMediaVideo = useCallback(async (item: PlayerMediaItem) => {
    try {
      await Linking.openURL(item.playbackUrl ?? item.url);
    } catch (err) {
      logger.error('player-profile', 'Failed to open media URL', {
        mediaId: item.id,
        error: (err as Error)?.message,
      });
      Alert.alert(
        txt(copy?.errors?.genericTitle, 'Erreur', 'Error'),
        txt(copy?.errors?.genericMessage, 'Impossible d’ouvrir cette vidéo.', 'Unable to open this video.'),
      );
    }
  }, [copy?.errors?.genericMessage, copy?.errors?.genericTitle, txt]);

  const handleMediaPlaybackError = useCallback((item: PlayerMediaItem, rawError?: unknown) => {
    const rawMessage =
      typeof rawError === 'string'
        ? rawError
        : rawError instanceof Error
        ? rawError.message
        : JSON.stringify(rawError ?? 'unknown error');

    logger.warn('player-profile', 'Video playback failed, refreshing signed URL', {
      mediaId: item.id,
      playerId,
      error: rawMessage,
    });

    setMediaErrors((prev) => ({
      ...prev,
      [item.id]: txt(
        copy?.errors?.mediaPlayback,
        'Lecture indisponible, actualisation du lien en cours…',
        'Playback unavailable, refreshing secure link…',
      ),
    }));

    if (mediaRetryRef.current[item.id]) return;
    mediaRetryRef.current[item.id] = true;
    void loadProfile(true);
  }, [copy?.errors?.mediaPlayback, loadProfile, playerId, txt]);

  useEffect(() => {
    loadProfile(false);
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile(true);
    }, [loadProfile]),
  );

  const openEditor = useCallback((section: ProfileSectionKey, item?: any) => {
    const fields = EDITOR_FIELDS[section];
    const nextValues: Record<string, string> = {};

    for (const field of fields) {
      nextValues[field.key] = item ? toEditorValue(item[field.key]) : '';
    }

    setEditorSection(section);
    setEditorValues(nextValues);
    setEditorMode(item ? 'edit' : 'create');
    setEditorItemId(item?.id ?? null);
    setEditorVisible(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorVisible(false);
    setEditorItemId(null);
    setEditorMode('create');
  }, []);

  const createPayload = useCallback((): Record<string, any> => {
    const payload: Record<string, any> = {};

    for (const [key, rawValue] of Object.entries(editorValues)) {
      const value = rawValue?.trim();
      if (!value) continue;

      if (NUMERIC_FIELDS.has(key)) {
        const parsed = parseNumber(value);
        if (parsed !== undefined) payload[key] = parsed;
        continue;
      }

      if (BOOLEAN_FIELDS.has(key)) {
        const parsed = parseBoolean(value);
        if (parsed !== undefined) payload[key] = parsed;
        continue;
      }

      payload[key] = value;
    }

    return payload;
  }, [editorValues]);

  const saveEditor = useCallback(async () => {
    if (!playerId) return;

    try {
      setSavingEditor(true);
      const payload = createPayload();

      if (!payload.sourceName) {
        Alert.alert(
          txt(copy?.editor?.sourceRequiredTitle, 'Source requise', 'Source required'),
          txt(
            copy?.editor?.sourceRequiredMessage,
            'Le champ sourceName est obligatoire pour cette section.',
            'sourceName is required for this section.',
          ),
        );
        return;
      }

      if (editorMode === 'create') {
        await api.createPlayerProfileSectionItem(playerId, editorSection, payload);
      } else if (editorItemId) {
        await api.updatePlayerProfileSectionItem(playerId, editorSection, editorItemId, payload);
      }

      closeEditor();
      await loadProfile(true);
    } catch (err) {
      logger.error('player-profile', 'Failed to save profile section item', {
        section: editorSection,
        mode: editorMode,
        itemId: editorItemId,
        error: (err as Error)?.message,
      });

      Alert.alert(
        txt(copy?.errors?.genericTitle, 'Erreur', 'Error'),
        txt(copy?.errors?.saveFailed, 'Impossible d’enregistrer cette modification.', 'Unable to save this change.'),
      );
    } finally {
      setSavingEditor(false);
    }
  }, [
    closeEditor,
    copy?.editor?.sourceRequiredMessage,
    copy?.editor?.sourceRequiredTitle,
    copy?.errors?.genericTitle,
    copy?.errors?.saveFailed,
    createPayload,
    editorItemId,
    editorMode,
    editorSection,
    loadProfile,
    playerId,
    txt,
  ]);

  const deleteItem = useCallback(
    async (section: ProfileSectionKey, itemId: string) => {
      if (!playerId) return;
      const key = `${section}-${itemId}`;

      try {
        setDeletingItemKey(key);
        await api.deletePlayerProfileSectionItem(playerId, section, itemId);
        await loadProfile(true);
      } catch (err) {
        logger.error('player-profile', 'Failed to delete profile section item', {
          section,
          itemId,
          error: (err as Error)?.message,
        });
        Alert.alert(
          txt(copy?.errors?.genericTitle, 'Erreur', 'Error'),
          txt(copy?.errors?.deleteFailed, 'Suppression impossible.', 'Delete failed.'),
        );
      } finally {
        setDeletingItemKey(null);
      }
    },
    [copy?.errors?.deleteFailed, copy?.errors?.genericTitle, loadProfile, playerId, txt],
  );

  const confirmDelete = useCallback(
    (section: ProfileSectionKey, itemId: string) => {
      Alert.alert(
        txt(copy?.actions?.delete, 'Supprimer', 'Delete'),
        txt(copy?.editor?.deleteConfirm, 'Confirmer la suppression de cet élément ?', 'Confirm item deletion?'),
        [
          { text: txt(copy?.actions?.cancel, 'Annuler', 'Cancel'), style: 'cancel' },
          {
            text: txt(copy?.actions?.delete, 'Supprimer', 'Delete'),
            style: 'destructive',
            onPress: () => {
              deleteItem(section, itemId);
            },
          },
        ],
      );
    },
    [copy?.actions?.cancel, copy?.actions?.delete, copy?.editor?.deleteConfirm, deleteItem, txt],
  );

  const applyStatus = useCallback(
    async (section: ProfileSectionKey, itemId: string, status: ProfileContentStatus) => {
      if (!playerId) return;
      const statusKey = `${section}-${itemId}-${status}`;

      try {
        setStatusLoadingKey(statusKey);
        await api.updatePlayerProfileSectionStatus(playerId, section, itemId, status);
        await loadProfile(true);
      } catch (err) {
        logger.error('player-profile', 'Failed to update profile status', {
          section,
          itemId,
          status,
          error: (err as Error)?.message,
        });

        Alert.alert(
          txt(copy?.errors?.genericTitle, 'Erreur', 'Error'),
          txt(
            copy?.errors?.statusFailed,
            'Impossible de changer le statut avec cette transition.',
            'Unable to apply this status transition.',
          ),
        );
      } finally {
        setStatusLoadingKey(null);
      }
    },
    [copy?.errors?.genericTitle, copy?.errors?.statusFailed, loadProfile, playerId, txt],
  );

  const openExternalMarket = useCallback(async () => {
    const url = profile?.market?.externalMarketUrl;
    if (!url) {
      Alert.alert(
        txt(copy?.market?.linkUnavailableTitle, 'Lien indisponible', 'Link unavailable'),
        txt(
          copy?.market?.linkUnavailableMessage,
          'Aucun lien externe n’est configuré pour ce joueur.',
          'No external link is configured for this player.',
        ),
      );
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        txt(copy?.market?.openFailedTitle, 'Ouverture impossible', 'Open failed'),
        txt(copy?.market?.openFailedMessage, 'Impossible d’ouvrir ce lien.', 'Unable to open this link.'),
      );
      return;
    }

    await Linking.openURL(url);
  }, [
    copy?.market?.linkUnavailableMessage,
    copy?.market?.linkUnavailableTitle,
    copy?.market?.openFailedMessage,
    copy?.market?.openFailedTitle,
    profile?.market?.externalMarketUrl,
    txt,
  ]);

  const renderProgressBar = useCallback((label: string, value?: number | null, max = 10) => {
    const normalized = value == null || !Number.isFinite(value) ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${normalized}%` }]} />
        </View>
        <Text style={styles.progressValue}>{value == null ? '—' : value.toFixed(1)}</Text>
      </View>
    );
  }, []);

  const sectionItems = useMemo(() => {
    if (!profile) {
      return {
        transfers: [] as any[],
        career: [] as any[],
        nationalTeam: [] as any[],
        achievements: [] as any[],
        news: [] as any[],
        rumours: [] as any[],
        performance: [] as any[],
      };
    }

    return {
      transfers: profile.transfers,
      career: profile.career,
      nationalTeam: profile.nationalTeam,
      achievements: profile.achievements,
      news: profile.news,
      rumours: profile.rumours,
      performance: profile.performance.competitionRows,
    };
  }, [profile]);

  const playerSummary = useMemo(() => {
    if (!profile) {
      return {
        scoutingRating: '—',
        performanceFocus: '—',
        hardwareFocus: '—',
      };
    }

    const firstCompetition = profile.performance.competitionRows[0];
    const totalGoalActions =
      (firstCompetition?.goals ?? 0) + (firstCompetition?.assists ?? 0);

    return {
      scoutingRating: formatMaybeNumber(profile.scouting.averageRating),
      performanceFocus: firstCompetition
        ? `${formatMaybeNumber(totalGoalActions)} ${txt(copy?.labels?.goalActions, 'actions déc.', 'goal actions')}`
        : txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
      hardwareFocus:
        profile.hardware.maxSpeedKmh != null
          ? `${formatMaybeNumber(profile.hardware.maxSpeedKmh)} km/h`
          : txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
    };
  }, [copy?.empty?.noData, copy?.labels?.goalActions, profile, txt]);

  const renderMetaBadge = (status?: ProfileContentStatus | null) => {
    const palette = statusColor(status);

    return (
      <View style={[styles.statusBadge, { backgroundColor: palette.bg, borderColor: palette.border }]}> 
        <Text style={[styles.statusBadgeText, { color: palette.text }]}>{formatStatus(status, language)}</Text>
      </View>
    );
  };

  const renderItemHeader = (anchor: AnchorKey, item: any) => {
    switch (anchor) {
      case 'transfers':
        return {
          title: `${item.fromClubName ?? '—'} → ${item.toClubName ?? '—'}`,
          subtitle: `${item.season ?? '—'} • ${toDateLabel(item.transferDate, language)}`,
        };
      case 'career':
        return {
          title: item.clubName ?? '—',
          subtitle: `${item.teamLevel ?? '—'} • ${toDateLabel(item.startDate, language)} → ${toDateLabel(item.endDate, language)}`,
        };
      case 'nationalTeam':
        return {
          title: `${item.country ?? '—'} ${item.teamLevel ?? ''}`,
          subtitle: `${txt(copy?.labels?.caps, 'Sélections', 'Caps')} ${item.caps ?? '—'} • ${txt(copy?.labels?.goals, 'Buts', 'Goals')} ${item.goals ?? '—'}`,
        };
      case 'achievements':
        return {
          title: item.title ?? '—',
          subtitle: `${item.competition ?? '—'} • ${item.season ?? '—'} • x${item.count ?? 1}`,
        };
      case 'news':
        return {
          title: item.headline ?? '—',
          subtitle: `${toDateLabel(item.publishedAtSource, language)}`,
        };
      case 'rumours':
        return {
          title: item.headline ?? '—',
          subtitle: `${item.destinationClub ?? '—'} • ${item.probabilityPercent ?? '—'}%`,
        };
      case 'performance':
      default:
        return {
          title: `${item.competitionName ?? '—'} ${item.season ?? ''}`.trim(),
          subtitle: `${txt(copy?.labels?.apps, 'App.', 'Apps')} ${item.appearances ?? '—'} • ${txt(copy?.labels?.goals, 'Buts', 'Goals')} ${item.goals ?? '—'} • ${txt(copy?.labels?.assists, 'Assists', 'Assists')} ${item.assists ?? '—'}`,
        };
    }
  };

  const renderAdminControls = (section: ProfileSectionKey, item: any) => {
    if (!isAdmin) return null;

    const deleteKey = `${section}-${item.id}`;

    return (
      <View style={styles.adminItemWrap}>
        <View style={styles.inlineActionsRow}>
          <TouchableOpacity style={styles.inlineActionBtn} onPress={() => openEditor(section, item)}>
            <Ionicons name="create-outline" size={14} color={colors.text.primary} />
            <Text style={styles.inlineActionText}>{txt(copy?.actions?.edit, 'Modifier', 'Edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inlineActionBtn, styles.inlineDangerBtn]}
            disabled={deletingItemKey === deleteKey}
            onPress={() => confirmDelete(section, item.id)}
          >
            <Ionicons name="trash-outline" size={14} color="#F43F5E" />
            <Text style={[styles.inlineActionText, { color: '#F43F5E' }]}> 
              {deletingItemKey === deleteKey
                ? txt(copy?.actions?.deleting, 'Suppression…', 'Deleting…')
                : txt(copy?.actions?.delete, 'Supprimer', 'Delete')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusActionRow}>
          {STATUS_ACTIONS.map((action) => {
            const actionKey = `${section}-${item.id}-${action.status}`;
            const label = statusActionLabels[action.key];
            return (
              <TouchableOpacity
                key={actionKey}
                style={styles.statusActionBtn}
                disabled={statusLoadingKey === actionKey}
                onPress={() => applyStatus(section, item.id, action.status)}
              >
                <Text style={styles.statusActionText}>
                  {statusLoadingKey === actionKey
                    ? txt(copy?.actions?.saving, '...', '...')
                    : label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSectionList = (
    anchor: AnchorKey,
    items: any[],
    title: string,
    emptyMessage: string,
  ) => {
    const section = ANCHOR_TO_SECTION[anchor];

    return (
      <View
        style={styles.sectionCard}
        onLayout={(event) => registerSection(anchor, event.nativeEvent.layout.y)}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {isAdmin && section ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => openEditor(section)}>
              <Ionicons name="add" size={14} color={colors.brand.primary} />
              <Text style={styles.addBtnText}>{txt(copy?.actions?.add, 'Ajouter', 'Add')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!items.length ? (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        ) : (
          items.map((item) => {
            const { title: itemTitle, subtitle } = renderItemHeader(anchor, item);
            const itemStatus = item.sourceMeta?.status as ProfileContentStatus | undefined;
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <View style={styles.itemTopTextWrap}>
                    <Text style={styles.itemTitle}>{itemTitle}</Text>
                    <Text style={styles.itemSubtitle}>{subtitle}</Text>
                  </View>
                  {renderMetaBadge(itemStatus)}
                </View>

                {!!item.summary && <Text style={styles.itemDescription}>{item.summary}</Text>}
                {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                {!!item.notes && <Text style={styles.itemDescription}>{item.notes}</Text>}

                {anchor === 'performance' ? (
                  <View style={styles.performanceGrid}>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.possibleGames, 'Matchs possibles', 'Possible games')}</Text>
                      <Text style={styles.smallStatValue}>{item.possibleGames ?? '—'}</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.goalParticipation, 'Implication buts', 'Goal participation')}</Text>
                      <Text style={styles.smallStatValue}>{formatMaybeNumber(item.goalParticipationPercent, '%')}</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.startingXI, 'Titulaire', 'Starting XI')}</Text>
                      <Text style={styles.smallStatValue}>{formatMaybeNumber(item.startingXIPercent, '%')}</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.minutesPercent, 'Minutes', 'Minutes')}</Text>
                      <Text style={styles.smallStatValue}>{formatMaybeNumber(item.minutesPercent, '%')}</Text>
                    </View>
                  </View>
                ) : null}

                <Text style={styles.metaText}>
                  {(item.sourceMeta?.sourceName ?? '—') +
                    ' • ' +
                    toDateLabel(item.sourceMeta?.sourceDate, language) +
                    ' • ' +
                    formatStatus(itemStatus, language)}
                </Text>

                {section ? renderAdminControls(section, item) : null}
              </View>
            );
          })
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
          <Text style={styles.loadingText}>{txt(copy?.loading, 'Chargement du profil…', 'Loading profile…')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.text.secondary} />
          <Text style={styles.errorText}>{error ?? txt(copy?.errors?.playerNotFound, 'Profil introuvable', 'Profile not found')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>{txt(copy?.actions?.back, 'Retour', 'Back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.heroCard} onLayout={(event) => registerSection('identity', event.nativeEvent.layout.y)}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => loadProfile(true)}>
              <Ionicons name="refresh" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.identityRow}>
            {profile.identity.profile.avatar ? (
              <Image source={{ uri: profile.identity.profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(profile.identity.fullName)}</Text>
              </View>
            )}

            <View style={styles.identityTextWrap}>
              <Text style={styles.heroName}>{profile.identity.fullName}</Text>
              <Text style={styles.heroSub}>
                {(profile.identity.positions?.main ?? '—') + ' • ' + (profile.identity.club?.name ?? '—')}
              </Text>
              <Text style={styles.heroSub}> 
                {(profile.identity.nationality ?? '—') +
                  ' • ' +
                  txt(copy?.labels?.age, 'Âge', 'Age') +
                  ': ' +
                  (profile.identity.age ?? '—')}
              </Text>
            </View>
          </View>

          <Text style={styles.metaText}>
            {txt(copy?.labels?.updatedAt, 'Dernière mise à jour', 'Last update') +
              ': ' +
              toDateLabel(profile.lastUpdatedAt, language)}
          </Text>

          {refreshing ? (
            <Text style={styles.metaText}>{txt(copy?.refreshing, 'Actualisation en cours…', 'Refreshing…')}</Text>
          ) : null}
        </View>

        <View style={styles.kpiPriorityCard}>
          <Text style={styles.sectionTitle}>{txt(copy?.sections?.decisionBoard, 'Vue décision club', 'Club decision board')}</Text>
          <View style={styles.kpiPriorityRow}>
            <View style={styles.kpiPriorityItem}>
              <Text style={styles.kpiPriorityLabel}>{txt(copy?.labels?.scoutingScore, 'Scouting', 'Scouting')}</Text>
              <Text style={styles.kpiPriorityValue}>{playerSummary.scoutingRating}</Text>
            </View>
            <View style={styles.kpiPriorityItem}>
              <Text style={styles.kpiPriorityLabel}>{txt(copy?.labels?.performanceImpact, 'Performance', 'Performance')}</Text>
              <Text style={styles.kpiPriorityValue}>{playerSummary.performanceFocus}</Text>
            </View>
            <View style={styles.kpiPriorityItem}>
              <Text style={styles.kpiPriorityLabel}>{txt(copy?.labels?.hardwarePeak, 'Hardware', 'Hardware')}</Text>
              <Text style={styles.kpiPriorityValue}>{playerSummary.hardwareFocus}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.anchorRow}>
          {anchors.map((anchor) => (
            <TouchableOpacity key={anchor.key} style={styles.anchorChip} onPress={() => scrollToSection(anchor.key)}>
              <Text style={styles.anchorChipText}>{anchor.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={styles.sectionCard}
          onLayout={(event) => registerSection('scouting', event.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionTitle}>{txt(copy?.sections?.scouting, 'Résumé scouting', 'Scouting summary')}</Text>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.averageRating, 'Note moyenne', 'Average rating')}</Text>
              <Text style={styles.kpiValue}>{formatMaybeNumber(profile.scouting.averageRating)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.reports, 'Rapports', 'Reports')}</Text>
              <Text style={styles.kpiValue}>{profile.scouting.totalReports}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.recommendation, 'Reco dominante', 'Dominant recommendation')}</Text>
              <Text style={styles.kpiValue}>{profile.scouting.recommendation ?? '—'}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.lastReport, 'Dernier rapport', 'Last report')}</Text>
              <Text style={styles.kpiValue}>{toDateLabel(profile.scouting.lastReportAt, language)}</Text>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.inlineTitle}>{txt(copy?.labels?.ratingsBreakdown, 'Breakdown des notes', 'Ratings breakdown')}</Text>
            {renderProgressBar(txt(copy?.labels?.technical, 'Technique', 'Technical'), profile.scouting.ratingBreakdown?.technical)}
            {renderProgressBar(txt(copy?.labels?.tactical, 'Tactique', 'Tactical'), profile.scouting.ratingBreakdown?.tactical)}
            {renderProgressBar(txt(copy?.labels?.physical, 'Physique', 'Physical'), profile.scouting.ratingBreakdown?.physical)}
            {renderProgressBar(txt(copy?.labels?.mental, 'Mental', 'Mental'), profile.scouting.ratingBreakdown?.mental)}
          </View>

          <Text style={styles.inlineTitle}>{txt(copy?.labels?.strengths, 'Forces clés', 'Top strengths')}</Text>
          <View style={styles.tagWrap}>
            {profile.scouting.strengthsTop.length ? (
              profile.scouting.strengthsTop.map((strength) => (
                <View key={strength} style={styles.tagChip}>
                  <Text style={styles.tagText}>{strength}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data')}</Text>
            )}
          </View>

          <Text style={styles.inlineTitle}>{txt(copy?.labels?.weaknesses, 'Points de vigilance', 'Watch points')}</Text>
          <View style={styles.tagWrap}>
            {profile.scouting.weaknessesTop.length ? (
              profile.scouting.weaknessesTop.map((weakness) => (
                <View key={weakness} style={styles.tagChipWarning}>
                  <Text style={styles.tagText}>{weakness}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>{txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data')}</Text>
            )}
          </View>
        </View>

        <View
          style={styles.sectionCard}
          onLayout={(event) => registerSection('performance', event.nativeEvent.layout.y)}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{txt(copy?.sections?.performance, 'Performance data', 'Performance data')}</Text>
            {isAdmin ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => openEditor('performance-rows')}>
                <Ionicons name="add" size={14} color={colors.brand.primary} />
                <Text style={styles.addBtnText}>{txt(copy?.actions?.add, 'Ajouter', 'Add')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {sectionItems.performance.length === 0 ? (
            Object.keys(profile.performance.statsFallback).length === 0 ? (
              <Text style={styles.emptyText}>{txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data')}</Text>
            ) : (
              <View style={styles.fallbackStatsWrap}>
                {Object.entries(profile.performance.statsFallback).map(([key, value]) => (
                  <View key={key} style={styles.fallbackStatChip}>
                    <Text style={styles.fallbackStatLabel}>{key}</Text>
                    <Text style={styles.fallbackStatValue}>{formatMaybeNumber(value)}</Text>
                  </View>
                ))}
              </View>
            )
          ) : (
            sectionItems.performance.map((item) => {
              const itemStatus = item.sourceMeta?.status as ProfileContentStatus | undefined;
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <View style={styles.itemTopTextWrap}>
                      <Text style={styles.itemTitle}>{`${item.competitionName ?? '—'} ${item.season ?? ''}`.trim()}</Text>
                      <Text style={styles.itemSubtitle}>
                        {`${txt(copy?.labels?.apps, 'App.', 'Apps')} ${item.appearances ?? '—'} • ${txt(copy?.labels?.goals, 'Buts', 'Goals')} ${item.goals ?? '—'} • ${txt(copy?.labels?.assists, 'Assists', 'Assists')} ${item.assists ?? '—'}`}
                      </Text>
                    </View>
                    {renderMetaBadge(itemStatus)}
                  </View>

                  <View style={styles.performanceGrid}>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.possibleGames, 'Matchs possibles', 'Possible games')}</Text>
                      <Text style={styles.smallStatValue}>{item.possibleGames ?? '—'}</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.goalParticipation, 'Implication buts', 'Goal participation')}</Text>
                      <Text style={styles.smallStatValue}>{formatMaybeNumber(item.goalParticipationPercent, '%')}</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.startingXI, 'Titulaire', 'Starting XI')}</Text>
                      <Text style={styles.smallStatValue}>{formatMaybeNumber(item.startingXIPercent, '%')}</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                      <Text style={styles.smallStatLabel}>{txt(copy?.labels?.minutesPercent, 'Minutes', 'Minutes')}</Text>
                      <Text style={styles.smallStatValue}>{formatMaybeNumber(item.minutesPercent, '%')}</Text>
                    </View>
                  </View>

                  <Text style={styles.metaText}>
                    {(item.sourceMeta?.sourceName ?? '—') +
                      ' • ' +
                      toDateLabel(item.sourceMeta?.sourceDate, language) +
                      ' • ' +
                      formatStatus(itemStatus, language)}
                  </Text>

                  {renderAdminControls('performance-rows', item)}
                </View>
              );
            })
          )}
        </View>

        <View
          style={styles.sectionCard}
          onLayout={(event) => registerSection('hardware', event.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionTitle}>{txt(copy?.sections?.hardware, 'Hardware sync', 'Hardware sync')}</Text>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.sessions, 'Sessions', 'Sessions')}</Text>
              <Text style={styles.kpiValue}>{profile.hardware.totalSessions}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.distance, 'Distance totale', 'Total distance')}</Text>
              <Text style={styles.kpiValue}>{formatMaybeNumber(profile.hardware.totalDistanceKm, ' km')}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.sprintDistance, 'Distance sprint', 'Sprint distance')}</Text>
              <Text style={styles.kpiValue}>{formatMaybeNumber(profile.hardware.sprintDistanceKm, ' km')}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.maxSpeed, 'Vitesse max', 'Max speed')}</Text>
              <Text style={styles.kpiValue}>{formatMaybeNumber(profile.hardware.maxSpeedKmh, ' km/h')}</Text>
            </View>
          </View>

          <Text style={styles.inlineTitle}>{txt(copy?.labels?.lastSync, 'Dernière sync', 'Last sync')}</Text>
          <Text style={styles.itemSubtitle}>{toDateLabel(profile.hardware.lastSyncedAt, language)}</Text>

          <Text style={styles.inlineTitle}>{txt(copy?.labels?.recentSessions, 'Sessions récentes', 'Recent sessions')}</Text>

          {profile.hardware.recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>{txt(copy?.empty?.noHardware, 'Aucune session synchronisée', 'No synced session')}</Text>
          ) : (
            <View style={styles.hardwareSeriesWrap}>
              {(() => {
                const maxDistance = Math.max(
                  ...profile.hardware.recentSessions.map((session) => session.movementDistanceM ?? 0),
                  1,
                );

                return profile.hardware.recentSessions.slice(0, 8).map((session) => {
                  const distanceM = session.movementDistanceM ?? 0;
                  const widthPercent = Math.max(8, (distanceM / maxDistance) * 100);

                  return (
                    <View key={session.id} style={styles.hardwareRow}>
                      <View style={styles.hardwareRowHead}>
                        <Text style={styles.hardwareRowTitle}>{`${session.source ?? '—'} • ${session.type ?? '—'}`}</Text>
                        <Text style={styles.hardwareRowValue}>{formatMaybeNumber(normalizeMeterToKm(distanceM), ' km')}</Text>
                      </View>
                      <View style={styles.hardwareTrack}>
                        <View style={[styles.hardwareFill, { width: `${widthPercent}%` }]} />
                      </View>
                      <Text style={styles.metaText}>
                        {toDateLabel(session.startedAt, language) +
                          ' • ' +
                          formatMaybeNumber(session.maxSpeedKmh, ' km/h')}
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: spacing.md }]}
            onPress={() =>
              navigation.navigate('HardwareSessions', {
                playerId,
                playerName: profile.identity.fullName,
              })
            }
          >
            <Text style={styles.primaryBtnText}>
              {txt(copy?.actions?.openHardwareSessions, 'Voir sessions GPS', 'View GPS sessions')}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.sectionCard}
          onLayout={(event) => registerSection('media', event.nativeEvent.layout.y)}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {txt(copy?.sections?.media, 'Vidéos / Highlights', 'Videos / Highlights')}
            </Text>
            {canManageHighlights ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() =>
                  navigation.navigate('PlayerHighlights', {
                    playerId,
                    mode: isAdmin ? 'adminView' : 'owner',
                  })
                }
              >
                <Ionicons name="videocam-outline" size={14} color={colors.brand.primary} />
                <Text style={styles.addBtnText}>
                  {txt(copy?.actions?.manageVideos, 'Gérer les vidéos', 'Manage videos')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {mediaLoading ? (
            <View style={styles.mediaLoadingWrap}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={styles.metaText}>
                {txt(copy?.loading, 'Chargement du profil…', 'Loading profile…')}
              </Text>
            </View>
          ) : videoItems.length === 0 ? (
            <Text style={styles.emptyText}>
              {txt(copy?.empty?.noVideos, 'Aucune vidéo highlight disponible.', 'No highlight video available.')}
            </Text>
          ) : (
            <View style={styles.videoList}>
              {videoItems.map((item) => (
                <View key={item.id} style={styles.videoCard}>
                  <View style={styles.videoCardHead}>
                    <Text style={styles.videoBadgeText}>VIDEO</Text>
                    {item.duration ? (
                      <Text style={styles.videoDuration}>{`${Math.floor(item.duration / 60)}:${String(
                        item.duration % 60,
                      ).padStart(2, '0')}`}</Text>
                    ) : null}
                  </View>
                  <View style={styles.videoFrame}>
                    <Video
                      source={{ uri: item.playbackUrl ?? item.url }}
                      style={styles.videoPlayer}
                      resizeMode={ResizeMode.CONTAIN}
                      useNativeControls
                      isLooping={false}
                      onError={(error) => handleMediaPlaybackError(item, error)}
                    />
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {decodeFileName(item.filename || txt(copy?.labels?.video, 'Vidéo', 'Video'))}
                  </Text>
                  {mediaErrors[item.id] ? (
                    <Text style={styles.mediaPlaybackError}>{mediaErrors[item.id]}</Text>
                  ) : null}
                  <Text style={styles.metaText}>
                    {`${txt(copy?.labels?.fileSize, 'Taille', 'Size')}: ${formatBytes(item.size)} • ${txt(
                      copy?.labels?.uploadedAt,
                      'Upload',
                      'Uploaded',
                    )}: ${toDateLabel(item.uploadedAt, language)}`}
                  </Text>
                  <TouchableOpacity style={styles.videoOpenBtn} onPress={() => openMediaVideo(item)}>
                    <Ionicons name="play-circle-outline" size={14} color={colors.text.primary} />
                    <Text style={styles.videoOpenText}>{txt(copy?.actions?.openLink, 'Lire', 'Play')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View
          style={styles.sectionCard}
          onLayout={(event) => registerSection('market', event.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionTitle}>{txt(copy?.sections?.market, 'Marché', 'Market')}</Text>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.currentValue, 'Valeur actuelle', 'Current value')}</Text>
              <Text style={styles.kpiValue}>{toMoney(profile.market.currentValue)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.highestValue, 'Valeur max', 'Highest value')}</Text>
              <Text style={styles.kpiValue}>{toMoney(profile.market.highestValue)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.contractUntil, 'Fin contrat', 'Contract end')}</Text>
              <Text style={styles.kpiValue}>{toDateLabel(profile.market.contractUntil, language)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{txt(copy?.labels?.preferredFoot, 'Pied', 'Foot')}</Text>
              <Text style={styles.kpiValue}>{profile.market.preferredFoot ?? profile.identity.physical.preferredFoot ?? '—'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={openExternalMarket}>
            <Text style={styles.secondaryBtnText}>{txt(copy?.actions?.openMarket, 'Ouvrir lien marché', 'Open market link')}</Text>
          </TouchableOpacity>
        </View>

        {renderSectionList(
          'transfers',
          sectionItems.transfers,
          txt(copy?.sections?.transfers, 'Historique transferts', 'Transfer history'),
          txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
        )}

        {renderSectionList(
          'career',
          sectionItems.career,
          txt(copy?.sections?.career, 'Historique carrière', 'Career history'),
          txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
        )}

        {renderSectionList(
          'nationalTeam',
          sectionItems.nationalTeam,
          txt(copy?.sections?.nationalTeam, 'Parcours national', 'National team'),
          txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
        )}

        {renderSectionList(
          'achievements',
          sectionItems.achievements,
          txt(copy?.sections?.achievements, 'Palmarès', 'Achievements'),
          txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
        )}

        {renderSectionList(
          'news',
          sectionItems.news,
          txt(copy?.sections?.news, 'News', 'News'),
          txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
        )}

        {renderSectionList(
          'rumours',
          sectionItems.rumours,
          txt(copy?.sections?.rumours, 'Rumeurs', 'Rumours'),
          txt(copy?.empty?.noData, 'Aucune donnée vérifiée', 'No verified data'),
        )}
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={closeEditor}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>
              {editorMode === 'create'
                ? txt(copy?.editor?.createTitle, 'Ajouter un élément', 'Create item')
                : txt(copy?.editor?.editTitle, 'Modifier un élément', 'Edit item')}
            </Text>

            <ScrollView>
              {EDITOR_FIELDS[editorSection].map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, field.multiline ? styles.inputMultiline : null]}
                    value={editorValues[field.key] ?? ''}
                    onChangeText={(text) =>
                      setEditorValues((prev) => ({
                        ...prev,
                        [field.key]: text,
                      }))
                    }
                    placeholder={field.placeholder ?? ''}
                    placeholderTextColor={colors.text.muted}
                    keyboardType={field.keyboardType ?? 'default'}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 4 : 1}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} disabled={savingEditor} onPress={closeEditor}>
                <Text style={styles.secondaryBtnText}>{txt(copy?.actions?.cancel, 'Annuler', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} disabled={savingEditor} onPress={saveEditor}>
                <Text style={styles.primaryBtnText}>
                  {savingEditor
                    ? txt(copy?.actions?.saving, 'Enregistrement…', 'Saving…')
                    : editorMode === 'create'
                    ? txt(copy?.actions?.saveDraft, 'Save Draft', 'Save Draft')
                    : txt(copy?.actions?.saveChanges, 'Enregistrer', 'Save changes')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  errorText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: typography.sizes.base,
    marginBottom: spacing.md,
  },
  heroCard: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    gap: spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
  },
  identityTextWrap: {
    flex: 1,
  },
  heroName: {
    color: colors.text.primary,
    fontSize: typography.sizes.h4,
    fontWeight: '800',
  },
  heroSub: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  kpiPriorityCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
  },
  kpiPriorityRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiPriorityItem: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    padding: spacing.sm,
    backgroundColor: colors.surface.glassLight,
  },
  kpiPriorityLabel: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
  },
  kpiPriorityValue: {
    marginTop: 4,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  anchorRow: {
    marginVertical: spacing.xs,
  },
  anchorChip: {
    marginRight: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface.glassLight,
  },
  anchorChipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    flexShrink: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface.glass,
  },
  addBtnText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  inlineTitle: {
    marginTop: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  kpiCard: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  kpiLabel: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginBottom: 2,
  },
  kpiValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  breakdownCard: {
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glassLight,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressLabel: {
    width: 82,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.brand.primary,
  },
  progressValue: {
    width: 38,
    textAlign: 'right',
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(70, 192, 122, 0.45)',
    backgroundColor: 'rgba(70, 192, 122, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  tagChipWarning: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.45)',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  fallbackStatsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  fallbackStatChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.surface.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fallbackStatLabel: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
  },
  fallbackStatValue: {
    marginTop: 2,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemTopTextWrap: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  itemSubtitle: {
    marginTop: 2,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  itemDescription: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 19,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  metaText: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  smallStatCard: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  smallStatLabel: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginBottom: 2,
  },
  smallStatValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  adminItemWrap: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  inlineActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  inlineDangerBtn: {
    borderColor: 'rgba(244, 63, 94, 0.45)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  inlineActionText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  statusActionRow: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  statusActionBtn: {
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    borderRadius: 999,
    backgroundColor: colors.surface.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusActionText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  hardwareSeriesWrap: {
    gap: spacing.sm,
  },
  hardwareRow: {
    gap: 4,
  },
  hardwareRowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hardwareRowTitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  hardwareRowValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },
  hardwareTrack: {
    width: '100%',
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  hardwareFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#46C07A',
  },
  mediaLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  videoList: {
    gap: spacing.sm,
  },
  videoCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.surface.glass,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  videoCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  videoBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: colors.brand.primary,
    backgroundColor: 'rgba(210, 248, 38, 0.15)',
    borderColor: 'rgba(210, 248, 38, 0.45)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  videoDuration: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  videoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  mediaPlaybackError: {
    color: '#FDBA74',
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  videoOpenBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.surface.glassLight,
  },
  videoOpenText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '800',
  },
  primaryBtn: {
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  primaryBtnText: {
    color: colors.background.primary,
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    backgroundColor: colors.surface.glass,
  },
  secondaryBtnText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBody: {
    maxHeight: '84%',
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: 6,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
