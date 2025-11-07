import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scoutingReportsApi, ScoutingReport, ReportStatus } from '../../services/api/scouting-reports';

type FilterType = 'all' | 'my-reports' | 'draft' | 'submitted' | 'approved';

const ReportsListScreen = () => {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchReports = useCallback(async () => {
    try {
      let data: ScoutingReport[];

      switch (filter) {
        case 'draft':
          data = await scoutingReportsApi.getAll({ status: 'DRAFT' });
          break;
        case 'submitted':
          data = await scoutingReportsApi.getAll({ status: 'SUBMITTED' });
          break;
        case 'approved':
          data = await scoutingReportsApi.getAll({ status: 'APPROVED' });
          break;
        default:
          data = await scoutingReportsApi.getAll();
      }

      setReports(data);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'DRAFT': return '#95a5a6';
      case 'SUBMITTED': return '#3498db';
      case 'APPROVED': return '#2ecc71';
      case 'REJECTED': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'SUBMITTED': return 'Soumis';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case 'BUY_NOW': return '#e74c3c';
      case 'MONITOR': return '#f39c12';
      case 'FOLLOW_UP': return '#3498db';
      case 'NOT_INTERESTED': return '#95a5a6';
      case 'NEEDS_MORE_DATA': return '#9b59b6';
      default: return '#bdc3c7';
    }
  };

  const getRecommendationLabel = (recommendation?: string) => {
    switch (recommendation) {
      case 'BUY_NOW': return 'Recruter maintenant';
      case 'MONITOR': return 'Surveiller';
      case 'FOLLOW_UP': return 'Suivre';
      case 'NOT_INTERESTED': return 'Pas intéressé';
      case 'NEEDS_MORE_DATA': return 'Plus de données';
      default: return 'Non défini';
    }
  };

  const renderReportCard = ({ item }: { item: ScoutingReport }) => {
    const playerName = item.player?.user
      ? `${item.player.user.firstName || ''} ${item.player.user.lastName || ''}`.trim()
      : 'Joueur inconnu';

    const scoutName = item.scout
      ? `${item.scout.firstName || ''} ${item.scout.lastName || ''}`.trim()
      : 'Scout inconnu';

    const matchInfo = item.match
      ? `${item.match.homeClub?.name || 'Home'} vs ${item.match.awayClub?.name || 'Away'}`
      : 'Match inconnu';

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => navigation.navigate('ReportDetail' as never, { reportId: item.id } as never)}
      >
        <View style={styles.reportHeader}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{playerName}</Text>
            {item.player?.position && (
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{item.player.position}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.matchInfo}>
          <Ionicons name="football-outline" size={14} color="#7f8c8d" />
          <Text style={styles.matchText}>{matchInfo}</Text>
        </View>

        {item.overallRating !== undefined && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Note globale:</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{item.overallRating}/100</Text>
            </View>
          </View>
        )}

        {item.recommendation && (
          <View style={styles.recommendationContainer}>
            <View style={[styles.recommendationBadge, { backgroundColor: getRecommendationColor(item.recommendation) }]}>
              <Text style={styles.recommendationText}>{getRecommendationLabel(item.recommendation)}</Text>
            </View>
          </View>
        )}

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.reportFooter}>
          <View style={styles.scoutInfo}>
            <Ionicons name="person-outline" size={14} color="#7f8c8d" />
            <Text style={styles.scoutText}>{scoutName}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTab = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      key={filterType}
      testID={`reports-filter-${filterType}`}
      style={[styles.filterTab, filter === filterType && styles.filterTabActive]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterTabText, filter === filterType && styles.filterTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rapports de Scouting</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="reports-loading-indicator" size="large" color="#2c3e50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rapports de Scouting</Text>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterTab('all', 'Tous')}
        {renderFilterTab('draft', 'Brouillons')}
        {renderFilterTab('submitted', 'Soumis')}
        {renderFilterTab('approved', 'Approuvés')}
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>Aucun rapport trouvé</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'Créez votre premier rapport de scouting'
                : 'Aucun rapport dans cette catégorie'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        testID="reports-fab"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReport' as never)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  filterTabActive: {
    backgroundColor: '#2c3e50',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  positionBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  matchText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ratingBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  recommendationContainer: {
    marginBottom: 12,
  },
  recommendationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#7f8c8d',
    alignSelf: 'center',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  scoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoutText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  dateText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default ReportsListScreen;
