import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KanbanBoard, TaskPriority } from '../../../services/api/kanban';

interface BoardStatsModalProps {
  visible: boolean;
  board: KanbanBoard | null;
  onClose: () => void;
}

const BoardStatsModal: React.FC<BoardStatsModalProps> = ({
  visible,
  board,
  onClose,
}) => {
  const stats = useMemo(() => {
    if (!board || !board.columns) {
      return {
        totalCards: 0,
        totalColumns: 0,
        priorityBreakdown: {
          URGENT: 0,
          HIGH: 0,
          MEDIUM: 0,
          LOW: 0,
        },
        columnStats: [],
        averageCardsPerColumn: 0,
      };
    }

    const allCards = board.columns.flatMap((col) => col.cards || []);
    const totalCards = allCards.length;
    const totalColumns = board.columns.length;

    const priorityBreakdown = {
      URGENT: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    allCards.forEach((card) => {
      priorityBreakdown[card.priority]++;
    });

    const columnStats = board.columns.map((col) => ({
      id: col.id,
      name: col.name,
      color: col.color,
      cardCount: col.cards?.length || 0,
      limit: col.cardLimit,
      percentage: totalCards > 0 ? ((col.cards?.length || 0) / totalCards) * 100 : 0,
    }));

    return {
      totalCards,
      totalColumns,
      priorityBreakdown,
      columnStats,
      averageCardsPerColumn: totalColumns > 0 ? totalCards / totalColumns : 0,
    };
  }, [board]);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return '#e74c3c';
      case 'HIGH':
        return '#f39c12';
      case 'MEDIUM':
        return '#3498db';
      case 'LOW':
        return '#95a5a6';
      default:
        return '#bdc3c7';
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgente';
      case 'HIGH':
        return 'Haute';
      case 'MEDIUM':
        return 'Moyenne';
      case 'LOW':
        return 'Basse';
      default:
        return priority;
    }
  };

  if (!board) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Statistiques</Text>
              <Text style={styles.headerSubtitle}>{board.name}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Vue d'ensemble */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Ionicons name="albums-outline" size={32} color="#3498db" />
                <Text style={styles.overviewValue}>{stats.totalCards}</Text>
                <Text style={styles.overviewLabel}>Cartes totales</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="list-outline" size={32} color="#9b59b6" />
                <Text style={styles.overviewValue}>{stats.totalColumns}</Text>
                <Text style={styles.overviewLabel}>Colonnes</Text>
              </View>
              <View style={styles.overviewCard}>
                <Ionicons name="trending-up-outline" size={32} color="#27ae60" />
                <Text style={styles.overviewValue}>
                  {stats.averageCardsPerColumn.toFixed(1)}
                </Text>
                <Text style={styles.overviewLabel}>Moy./colonne</Text>
              </View>
            </View>
          </View>

          {/* Répartition par priorité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Répartition par priorité</Text>
            <View style={styles.priorityList}>
              {(Object.keys(stats.priorityBreakdown) as TaskPriority[]).map(
                (priority) => {
                  const count = stats.priorityBreakdown[priority];
                  const percentage =
                    stats.totalCards > 0 ? (count / stats.totalCards) * 100 : 0;

                  return (
                    <View key={priority} style={styles.priorityItem}>
                      <View style={styles.priorityHeader}>
                        <View style={styles.priorityLeft}>
                          <View
                            style={[
                              styles.priorityDot,
                              { backgroundColor: getPriorityColor(priority) },
                            ]}
                          />
                          <Text style={styles.priorityLabel}>
                            {getPriorityLabel(priority)}
                          </Text>
                        </View>
                        <Text style={styles.priorityCount}>
                          {count} ({percentage.toFixed(0)}%)
                        </Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: getPriorityColor(priority),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          </View>

          {/* Répartition par colonne */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Répartition par colonne</Text>
            <View style={styles.columnList}>
              {stats.columnStats
                .sort((a, b) => b.cardCount - a.cardCount)
                .map((col) => (
                  <View key={col.id} style={styles.columnItem}>
                    <View style={styles.columnHeader}>
                      <View style={styles.columnLeft}>
                        <View
                          style={[
                            styles.columnColorBar,
                            { backgroundColor: col.color || '#34495e' },
                          ]}
                        />
                        <Text style={styles.columnName}>{col.name}</Text>
                      </View>
                      <View style={styles.columnRight}>
                        <Text style={styles.columnCount}>{col.cardCount}</Text>
                        {col.limit && (
                          <Text style={styles.columnLimit}>/ {col.limit}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${col.percentage}%`,
                            backgroundColor: col.color || '#34495e',
                          },
                        ]}
                      />
                    </View>
                    {col.limit && (
                      <View style={styles.limitBar}>
                        <View
                          style={[
                            styles.limitFill,
                            {
                              width: `${(col.cardCount / col.limit) * 100}%`,
                              backgroundColor:
                                col.cardCount >= col.limit
                                  ? '#e74c3c'
                                  : col.cardCount / col.limit > 0.8
                                  ? '#f39c12'
                                  : '#27ae60',
                            },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                ))}
            </View>
          </View>

          {/* Insights */}
          {stats.totalCards > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insights</Text>
              <View style={styles.insightsList}>
                {stats.priorityBreakdown.URGENT > 0 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="warning-outline" size={20} color="#e74c3c" />
                    <Text style={styles.insightText}>
                      {stats.priorityBreakdown.URGENT} carte(s) urgente(s) nécessitent
                      une attention immédiate
                    </Text>
                  </View>
                )}
                {stats.columnStats.some((col) => col.limit && col.cardCount >= col.limit) && (
                  <View style={styles.insightItem}>
                    <Ionicons name="alert-circle-outline" size={20} color="#f39c12" />
                    <Text style={styles.insightText}>
                      Certaines colonnes ont atteint leur limite
                    </Text>
                  </View>
                )}
                {stats.averageCardsPerColumn < 2 && stats.totalCards > 0 && (
                  <View style={styles.insightItem}>
                    <Ionicons name="information-circle-outline" size={20} color="#3498db" />
                    <Text style={styles.insightText}>
                      Peu de cartes par colonne, considérez une consolidation
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  priorityList: {
    gap: 16,
  },
  priorityItem: {
    gap: 8,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  priorityCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  columnList: {
    gap: 16,
  },
  columnItem: {
    gap: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  columnColorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  columnName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  columnRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  columnCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  columnLimit: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  limitBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  limitFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default BoardStatsModal;
