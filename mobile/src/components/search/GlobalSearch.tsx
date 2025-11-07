/**
 * Global Search Component for Mobile
 * Unified search across players, clubs, camps, and reports
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { logError, logInfo } from '../../utils/logger';

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

type SearchResultType = 'player' | 'club' | 'camp' | 'report';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  metadata?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ visible, onClose, navigation }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      logInfo('Global search initiated', { query: searchQuery });

      // Search across all entities in parallel
      const [playersData, clubsData, campsData, reportsData] = await Promise.all([
        api.getPlayers({ search: searchQuery, limit: 10 }).catch(() => ({ items: [], data: [] })),
        api.getClubs({ search: searchQuery, limit: 10 }).catch(() => ({ items: [], data: [] })),
        api.getCamps({ search: searchQuery, limit: 10 }).catch(() => []),
        api.getReports({ status: 'APPROVED', limit: 10 }).catch(() => ({ items: [], data: [] })),
      ]);

      const players = playersData?.items ?? playersData?.data ?? [];
      const clubs = clubsData?.items ?? clubsData?.data ?? [];
      const camps = Array.isArray(campsData) ? campsData : campsData?.items ?? campsData?.data ?? [];
      const reports = reportsData?.items ?? reportsData?.data ?? [];

      // Transform to unified search results
      const allResults: SearchResult[] = [];

      // Add players
      players.forEach((player: any) => {
        const playerName = `${player.user?.firstName || player.firstName || ''} ${player.user?.lastName || player.lastName || ''}`.trim();
        if (playerName.toLowerCase().includes(searchQuery.toLowerCase())) {
          allResults.push({
            id: player.id,
            type: 'player',
            title: playerName,
            subtitle: player.position || 'Player',
            metadata: player.club?.name || '',
          });
        }
      });

      // Add clubs
      clubs.forEach((club: any) => {
        if (club.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          allResults.push({
            id: club.id,
            type: 'club',
            title: club.name,
            subtitle: 'Football Club',
            metadata: `${club.city || ''}${club.city && club.country ? ', ' : ''}${club.country || ''}`.trim(),
          });
        }
      });

      // Add camps
      camps.forEach((camp: any) => {
        if (camp.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
          allResults.push({
            id: camp.id,
            type: 'camp',
            title: camp.name,
            subtitle: camp.type || 'Camp',
            metadata: camp.location || '',
          });
        }
      });

      // Add reports (search in player names)
      reports.forEach((report: any) => {
        const playerName = `${report.player?.user?.firstName || ''} ${report.player?.user?.lastName || ''}`.trim();
        if (playerName.toLowerCase().includes(searchQuery.toLowerCase()) || report.summary?.toLowerCase().includes(searchQuery.toLowerCase())) {
          allResults.push({
            id: report.id,
            type: 'report',
            title: `Report: ${playerName}`,
            subtitle: 'Scouting Report',
            metadata: report.match?.competition || '',
          });
        }
      });

      setResults(allResults);
    } catch (error) {
      logError('Error performing global search', error, { query: searchQuery });
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    logInfo('Search result selected', { type: result.type, id: result.id });

    // Close modal first, then navigate
    onClose();
    setQuery('');

    // Use setTimeout to ensure modal is closed before navigation
    setTimeout(() => {
      try {
        // Get the parent stack navigator (AppNavigator) from tab navigator
        const parentNav = navigation.getParent();
        const targetNav = parentNav || navigation;

        switch (result.type) {
          case 'player':
            targetNav.navigate('PlayerDetail', { playerId: result.id });
            break;
          case 'club':
            targetNav.navigate('ClubDetail', { clubId: result.id });
            break;
          case 'camp':
            targetNav.navigate('Camps');
            break;
          case 'report':
            targetNav.navigate('ReportDetail', { reportId: result.id });
            break;
        }
      } catch (error) {
        logError('Error navigating from search', error, { type: result.type, id: result.id });
      }
    }, 300);
  };

  const getResultIcon = (type: SearchResultType): string => {
    switch (type) {
      case 'player':
        return '👤';
      case 'club':
        return '⚽';
      case 'camp':
        return '🏕️';
      case 'report':
        return '📊';
      default:
        return '🔍';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search players, clubs, camps..."
            placeholderTextColor={colors.text.secondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>

        {/* Results */}
        <ScrollView style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          ) : results.length > 0 ? (
            <>
              <Text style={styles.resultsCount}>{results.length} results</Text>
              {results.map((result) => (
                <TouchableOpacity
                  key={`${result.type}-${result.id}`}
                  style={styles.resultItem}
                  onPress={() => handleResultPress(result)}
                >
                  <GlassCard>
                    <View style={styles.resultContent}>
                      <Text style={styles.resultIcon}>{getResultIcon(result.type)}</Text>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>{result.title}</Text>
                        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                        {result.metadata && (
                          <Text style={styles.resultMetadata}>{result.metadata}</Text>
                        )}
                      </View>
                      <Text style={styles.resultArrow}>→</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </>
          ) : query.trim().length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Start typing to search...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.brand.primary,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  searchContainer: {
    padding: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  resultsCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing["2xl"],
    alignItems: 'center',
  },
  resultItem: {
    marginBottom: spacing.sm,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  resultIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  resultSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  resultMetadata: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  resultArrow: {
    fontSize: typography.sizes.xl,
    color: colors.brand.primary,
  },
  emptyContainer: {
    paddingVertical: spacing["2xl"],
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
