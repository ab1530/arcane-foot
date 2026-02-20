import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../design/theme';
import api from '../../services/api';
import { SkeletonCard } from '../../components/ui/Skeleton';
import type { NewsCategory, NewsFeedItem, NewsFeedResponse } from '../../types';

const ARCHIVED_NEWS_KEY = '@arcane/news/archived-items';

const BREAKPOINTS = {
  desktop: 1080,
};

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    return hex;
  }

  const ratio = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(ratio * 255)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');

  return `#${clean}${alphaHex}`;
};

type NewsSection = {
  key: NewsCategory;
  label: string;
};

const SECTIONS: NewsSection[] = [
  { key: 'clubs', label: 'Clubs' },
  { key: 'players', label: 'Joueurs' },
  { key: 'market', label: 'Marché' },
  { key: 'notifications', label: 'Notifications' },
];

const categoryLabelMap: Record<NewsCategory, string> = {
  clubs: 'Clubs',
  players: 'Joueurs',
  market: 'Marché',
  notifications: 'Notifications',
};

const safeLocaleDate = (value: string) => {
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const resolveEmptyText = (category: NewsCategory) => {
  switch (category) {
    case 'clubs':
      return 'Aucune info club pour le moment';
    case 'players':
      return 'Aucune info joueur pour le moment';
    case 'market':
      return 'Aucune info marché pour le moment';
    case 'notifications':
      return 'Aucune notification importante';
  }
};

const formatSourceLine = (item: NewsFeedItem) => {
  const dateText = safeLocaleDate(item.timestamp);
  return `${item.source} • ${dateText}`;
};

type AnimatedNewsCardProps = {
  item: NewsFeedItem;
  archived: boolean;
  index: number;
  isWideLayout: boolean;
  onToggleArchive: (itemId: string) => Promise<void>;
};

const AnimatedNewsCard = ({
  item,
  archived,
  index,
  isWideLayout,
  onToggleArchive,
}: AnimatedNewsCardProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: Math.min(index * 70, 420),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: Math.min(index * 70, 420),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.card,
        isWideLayout ? styles.cardWide : undefined,
        archived ? styles.cardArchived : undefined,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{categoryLabelMap[item.category]}</Text>
        <TouchableOpacity
          onPress={() => onToggleArchive(item.id)}
          activeOpacity={0.7}
          style={styles.archiveButtonWrap}
        >
          <Text style={styles.archiveButton}>{archived ? 'Réactiver' : 'Archiver'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>

      {!!item.summary && <Text style={styles.summary}>{item.summary}</Text>}

      <Text style={styles.source}>{formatSourceLine(item)}</Text>

      {!!item.details && item.details !== item.summary && (
        <Text style={styles.details} numberOfLines={2}>
          {item.details}
        </Text>
      )}
    </Animated.View>
  );
};

export const NewsScreen = () => {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= BREAKPOINTS.desktop;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<NewsCategory[]>([
    'clubs',
    'players',
    'market',
    'notifications',
  ]);
  const [feed, setFeed] = useState<NewsFeedResponse | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const loadingPulse = useRef(new Animated.Value(0)).current;

  const selectedCount = activeFilters.length;
  const hasArchivedItems = archivedIds.size > 0;

  const filteredItems = useMemo(() => {
    const selectedSet = new Set(activeFilters);
    return (feed?.data ?? []).filter((item) => selectedSet.has(item.category));
  }, [feed?.data, activeFilters]);
  const visibleItems = useMemo(() => filteredItems.filter((item) => !archivedIds.has(item.id)), [filteredItems, archivedIds]);

  const groupedItems = useMemo(() => {
    const map: Record<NewsCategory, NewsFeedItem[]> = {
      clubs: [],
      players: [],
      market: [],
      notifications: [],
    };
    visibleItems.forEach((item) => {
      map[item.category]?.push(item);
    });
    return map;
  }, [visibleItems]);

  const groupedArchivedItems = useMemo(() => {
    const map: Record<NewsCategory, NewsFeedItem[]> = {
      clubs: [],
      players: [],
      market: [],
      notifications: [],
    };
    filteredItems.forEach((item) => {
      if (!archivedIds.has(item.id)) {
        return;
      }
      map[item.category]?.push(item);
    });
    return map;
  }, [filteredItems, archivedIds]);

  const loadArchived = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ARCHIVED_NEWS_KEY);
      if (!raw) {
        setArchivedIds(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setArchivedIds(new Set(parsed.filter((entry): entry is string => typeof entry === 'string')));
      } else {
        setArchivedIds(new Set());
      }
    } catch {
      setArchivedIds(new Set());
    }
  }, []);

  const loadFeed = useCallback(
    async (options?: { skipRefresh?: boolean }) => {
      const shouldShowSpinner = options?.skipRefresh ? false : true;
      if (shouldShowSpinner) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await api.getNewsFeed({
          limit: 30,
          categories:
            activeFilters.length > 0
              ? activeFilters
              : ['clubs', 'players', 'market', 'notifications'],
        });
        setFeed(response);
      } catch {
        setError("Impossible de charger l'actualité.");
      } finally {
        if (shouldShowSpinner) {
          setLoading(false);
        }
      }
    },
    [activeFilters],
  );

  const saveArchived = useCallback(async (next: Set<string>) => {
    setArchivedIds(next);
    await AsyncStorage.setItem(ARCHIVED_NEWS_KEY, JSON.stringify(Array.from(next)));
  }, []);

  const archiveItem = useCallback(async (itemId: string) => {
    const next = new Set(archivedIds);
    if (!next.has(itemId)) {
      next.add(itemId);
      await saveArchived(next);
      return;
    }
    next.delete(itemId);
    await saveArchived(next);
  }, [archivedIds, saveArchived]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFeed({ skipRefresh: true });
      await loadArchived();
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed, loadArchived]);

  const unarchiveItem = useCallback(async (itemId: string) => {
    if (!archivedIds.has(itemId)) {
      return;
    }
    const next = new Set(archivedIds);
    next.delete(itemId);
    await saveArchived(next);
  }, [archivedIds, saveArchived]);

  const toggleFilter = useCallback((section: NewsCategory) => {
    setActiveFilters((current) => {
      const set = new Set(current);
      if (set.has(section)) {
        set.delete(section);
      } else {
        set.add(section);
      }
      const next = Array.from(set);
      if (next.length === 0) {
        return ['clubs', 'players', 'market', 'notifications'];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(loadingPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [loading, loadingPulse]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await loadArchived();
      if (!isMounted) {
        return;
      }
      await loadFeed();
      setLoading(false);
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, [loadArchived, loadFeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadFeed({ skipRefresh: true });
    }, 45_000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const loadingProgressStyle = useMemo(
    () => ({
      width: loadingPulse.interpolate({
        inputRange: [0, 1],
        outputRange: ['25%', '78%'],
      }),
    }),
    [loadingPulse],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.loadingContent}>
          <View style={styles.loadingHeader}>
            <View style={styles.loadingIndicatorWrap}>
              <ActivityIndicator size="large" color={theme.colors.brand.primary} />
            </View>
            <Text style={styles.loadingText}>Chargement de la news</Text>
            <Text style={styles.loadingSubtext}>Mise à jour du flux en cours</Text>
            <View style={styles.loadingProgressTrack}>
              <Animated.View style={[styles.loadingProgressFill, loadingProgressStyle]} />
            </View>
          </View>

          <Text style={styles.loadingSectionTitle}>Aperçu du fil</Text>
          <View style={styles.loadingSkeletons}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.loadingSkeletonRow}>
                <SkeletonCard />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Échec de chargement</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void loadFeed()} style={styles.retryButton} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.content, isWideLayout && styles.contentWide]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand.primary} />}
      >
        <View style={styles.headerSurface}>
          <Text style={styles.title}>News</Text>
          <Text style={styles.subtitle}>Informations club, joueurs, marché et notifications importantes</Text>

          <View style={styles.metricsRow}>
            <Text style={styles.metricText}>
              Flux actif: {selectedCount}/{SECTIONS.length} catégorie(s)
            </Text>
            {refreshing ? (
              <View style={styles.liveBadge}>
                <ActivityIndicator size="small" color={theme.colors.text.primary} />
                <Text style={styles.liveBadgeText}>Mise à jour</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.filterRow}>
          {SECTIONS.map((section) => {
            const isActive = activeFilters.includes(section.key);
            return (
              <TouchableOpacity
                key={section.key}
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                onPress={() => toggleFilter(section.key)}
                activeOpacity={0.8}
              >
                <View style={styles.filterInner}>
                  <Text style={isActive ? styles.filterTextActive : styles.filterText}>{section.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {visibleItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune actualité disponible pour votre sélection.</Text>
            {hasArchivedItems ? <Text style={styles.emptyText}>Des éléments sont masqués par archivage.</Text> : null}
          </View>
        ) : (
          SECTIONS.map((section) => {
            if (!activeFilters.includes(section.key)) {
              return null;
            }

            const items = groupedItems[section.key] ?? [];
            const archivedItems = groupedArchivedItems[section.key] ?? [];

            if (items.length === 0 && archivedItems.length === 0) {
              return (
                <View key={`${section.key}-empty`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                  <Text style={styles.emptyText}>{resolveEmptyText(section.key)}</Text>
                </View>
              );
            }

            return (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                  <Text style={styles.sectionMeta}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
                </View>

                {items.length > 0 ? (
                  <View style={styles.cardsRow}>
                    {items.map((item, index) => (
                      <AnimatedNewsCard
                        key={item.id}
                        item={item}
                        archived={false}
                        index={index}
                        isWideLayout={isWideLayout}
                        onToggleArchive={archiveItem}
                      />
                    ))}
                  </View>
                ) : null}

                {archivedItems.length > 0 ? (
                  <TouchableOpacity
                    style={styles.restoreRow}
                    onPress={() => {
                      void Promise.all(archivedItems.map((item) => unarchiveItem(item.id)));
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.restoreText}>
                      Afficher {archivedItems.length} éléments archivés
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {items.length > 0 && archivedItems.length > 0 ? (
                  <Text style={styles.sectionMetaMuted}>Swipe down pour réafficher les archivés</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  contentWide: {
    width: '100%',
    maxWidth: 1250,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  headerSurface: {
    backgroundColor: withAlpha(theme.colors.surface.glass, 0.9),
    borderColor: theme.colors.surface.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.surface.glass,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 14,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.h3,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    marginTop: 6,
    lineHeight: 20,
    fontSize: theme.typography.sizes.base,
  },
  metricsRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metricText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: withAlpha(theme.colors.semantic.success, 0.18),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.semantic.success, 0.35),
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: theme.colors.semantic.success,
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fonts.medium,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: withAlpha(theme.colors.brand.primary, 0.2),
  },
  filterChipInactive: {
    borderColor: theme.colors.surface.border,
    backgroundColor: withAlpha(theme.colors.surface.glass, 0.3),
  },
  filterInner: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  filterText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.sm,
  },
  filterTextActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.sm,
  },

  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
    fontSize: 20,
  },
  sectionMeta: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.sm,
    marginBottom: 2,
  },
  sectionMetaMuted: {
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'column',
    backgroundColor: withAlpha(theme.colors.surface.glass, 0.95),
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    minHeight: 150,
    width: '100%',
    shadowColor: theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  cardWide: {
    width: '48.5%',
  },
  cardArchived: {
    opacity: 0.78,
    borderStyle: 'dashed',
    borderColor: withAlpha(theme.colors.semantic.info, 0.45),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: theme.spacing.sm,
  },
  category: {
    color: theme.colors.brand.primary,
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  archiveButtonWrap: {
    borderColor: withAlpha(theme.colors.semantic.info, 0.42),
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  archiveButton: {
    color: theme.colors.semantic.info,
    fontSize: theme.typography.sizes.xs,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.bold,
    fontSize: theme.typography.sizes.base,
    marginBottom: 6,
    lineHeight: 20,
  },
  summary: {
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 20,
  },
  source: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 'auto',
  },
  details: {
    color: theme.colors.text.secondary,
    marginTop: 8,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 17,
  },
  restoreRow: {
    marginTop: 2,
  },
  restoreText: {
    color: theme.colors.semantic.info,
    fontSize: theme.typography.sizes.xs,
  },
  restoreChevron: {
    color: theme.colors.semantic.info,
    fontSize: theme.typography.sizes.xs,
  },

  emptyState: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glass,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
  },
  loadingContent: {
    width: '100%',
    maxWidth: 560,
  },
  loadingHeader: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.surface.border, 0.7),
    backgroundColor: withAlpha(theme.colors.surface.glass, 0.85),
  },
  loadingIndicatorWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.brand.primary, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.medium,
    marginTop: 6,
  },
  loadingSubtext: {
    marginTop: 4,
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.sm,
  },
  loadingProgressTrack: {
    marginTop: theme.spacing.md,
    height: 4,
    borderRadius: 999,
    backgroundColor: withAlpha(theme.colors.text.primary, 0.12),
    width: '100%',
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.brand.primary,
  },
  loadingSectionTitle: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  loadingSkeletons: {
    gap: theme.spacing.md,
  },
  loadingSkeletonRow: {
    width: '100%',
  },

  errorCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: withAlpha(theme.colors.surface.glass, 0.96),
    padding: theme.spacing.lg,
  },
  errorTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.bold,
    fontSize: 20,
    marginBottom: 8,
  },
  errorText: {
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fonts.bold,
  },
});
