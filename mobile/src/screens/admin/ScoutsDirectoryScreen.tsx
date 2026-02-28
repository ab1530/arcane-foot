import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import api from '../../services/api';
import type { DashboardScoutDirectoryItem } from '../../types';

type Props = NativeStackScreenProps<AppStackParamList, 'ScoutsDirectory'>;

const formatDate = (value?: string | null) => {
  if (!value) return 'Jamais connecté';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '—';
  }
};

const buildInitials = (item: DashboardScoutDirectoryItem) => {
  const first = item.firstName?.trim()?.[0] ?? '';
  const last = item.lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'SC';
};

export default function ScoutsDirectoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [items, setItems] = useState<DashboardScoutDirectoryItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchValue(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadScouts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const payload = await api.getDashboardScouts({
          page: 1,
          limit: 100,
          search: searchValue || undefined,
        });
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        setItems(list);
        setTotal(payload?.meta?.total ?? list.length);
      } catch (error) {
        console.error('Impossible de charger la liste des scouts', error);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchValue],
  );

  useEffect(() => {
    void loadScouts(false);
  }, [loadScouts]);

  const onRefresh = useCallback(async () => {
    await loadScouts(true);
  }, [loadScouts]);

  const emptyLabel = useMemo(() => {
    if (searchValue) return 'Aucun scout pour cette recherche.';
    return 'Aucun scout disponible.';
  }, [searchValue]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text style={styles.loadingText}>Chargement des scouts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.brand.primary} />
          <Text style={styles.backLabel}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Liste des scouts</Text>
        <Text style={styles.subtitle}>{total} scout(s) visible(s)</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={16} color={theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un scout..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchInput}
          onChangeText={setSearchInput}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ScoutAdminDetail', { scout: item })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{buildInitials(item)}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.name}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.meta}>
                Rapports: {item.reportsCount} • Dernière connexion: {formatDate(item.lastLoginAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyState}>{emptyLabel}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  header: {
    marginBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  backLabel: {
    color: theme.colors.brand.primary,
    fontWeight: '600',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.text.secondary,
  },
  searchWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    paddingHorizontal: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 255, 74, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(233, 255, 74, 0.55)',
  },
  avatarLabel: {
    color: theme.colors.brand.primary,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
  },
  name: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  email: {
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontSize: 12,
  },
  meta: {
    color: theme.colors.text.secondary,
    marginTop: 6,
    fontSize: 12,
  },
  emptyState: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
