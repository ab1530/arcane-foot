import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { kanbanApi, KanbanBoard, KanbanColumn, KanbanCard } from '../../services/api/kanban';
import CreateBoardModal from './components/CreateBoardModal';
import CreateColumnModal from './components/CreateColumnModal';
import CreateCardModal from './components/CreateCardModal';
import CardDetailsModal from './components/CardDetailsModal';
import BoardStatsModal from './components/BoardStatsModal';

const KanbanScreen = () => {
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showCardDetailsModal, setShowCardDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedColumnForCard, setSelectedColumnForCard] = useState<string | undefined>();
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      const data = await kanbanApi.getAllBoards();
      // S'assurer que data est un tableau
      const boardsArray = Array.isArray(data) ? data : [];
      setBoards(boardsArray);

      if (boardsArray.length > 0 && !selectedBoard) {
        const firstBoard = await kanbanApi.getBoard(boardsArray[0].id);
        setSelectedBoard(firstBoard);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des boards:', error);
      setBoards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBoard]);

  useEffect(() => {
    fetchBoards();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBoards();
  };

  const getColumnColor = (type: string) => {
    switch (type) {
      case 'PROSPECT': return '#3498db';
      case 'CONTACTED': return '#9b59b6';
      case 'INTERESTED': return '#f39c12';
      case 'NEGOTIATING': return '#e67e22';
      case 'OFFER_MADE': return '#16a085';
      case 'SIGNED': return '#27ae60';
      case 'ARCHIVED': return '#95a5a6';
      default: return '#34495e';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#e74c3c';
      case 'HIGH': return '#f39c12';
      case 'MEDIUM': return '#3498db';
      case 'LOW': return '#95a5a6';
      default: return '#bdc3c7';
    }
  };

  const handleDeleteCard = (cardId: string, cardTitle: string) => {
    Alert.alert(
      'Supprimer la carte',
      `Voulez-vous vraiment supprimer la carte "${cardTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await kanbanApi.deleteCard(cardId);
              fetchBoards();
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer la carte');
            }
          },
        },
      ]
    );
  };

  const renderCard = (card: KanbanCard) => {
    const playerName = card.player?.user
      ? `${card.player.user.firstName || ''} ${card.player.user.lastName || ''}`.trim()
      : 'Joueur';

    return (
      <TouchableOpacity
        key={card.id}
        style={styles.card}
        onPress={() => {
          setSelectedCard(card);
          setShowCardDetailsModal(true);
        }}
        onLongPress={() => handleDeleteCard(card.id, playerName)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{playerName}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(card.priority) }]}>
            <Text style={styles.priorityText}>{card.priority}</Text>
          </View>
        </View>

        {card.notes && (
          <Text style={styles.cardNotes} numberOfLines={2}>{card.notes}</Text>
        )}

        {card.tags && card.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {card.tags.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {card.tags.length > 2 && (
              <Text style={styles.moreText}>+{card.tags.length - 2}</Text>
            )}
          </View>
        )}

        {card.dueDate && (
          <View style={styles.dueDateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#7f8c8d" />
            <Text style={styles.dueDateText}>
              {new Date(card.dueDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderColumn = (column: KanbanColumn) => {
    const cardCount = column.cards?.length || 0;

    return (
      <View key={column.id} style={styles.column}>
        <View style={[styles.columnHeader, { backgroundColor: column.color || getColumnColor(column.type) }]}>
          <View style={styles.columnHeaderLeft}>
            <Text style={styles.columnTitle}>{column.name}</Text>
            <View style={styles.columnCount}>
              <Text style={styles.columnCountText}>{cardCount}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedColumnForCard(column.id);
              setShowCreateCardModal(true);
            }}
            style={styles.addCardButton}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
        >
          {column.cards && column.cards.length > 0 ? (
            column.cards.map(renderCard)
          ) : (
            <TouchableOpacity
              style={styles.emptyColumn}
              onPress={() => {
                setSelectedColumnForCard(column.id);
                setShowCreateCardModal(true);
              }}
            >
              <Ionicons name="albums-outline" size={32} color="#bdc3c7" />
              <Text style={styles.emptyColumnText}>Aucune carte</Text>
              <Text style={styles.emptyColumnHint}>Appuyez pour ajouter</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3e50" />
        </View>
      </SafeAreaView>
    );
  }

  if (boards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kanban</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>Aucun tableau Kanban</Text>
          <Text style={styles.emptySubtitle}>Créez votre premier tableau pour commencer</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kanban</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart-outline" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateColumnModal(true)}
          >
            <Ionicons name="list-outline" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateBoardModal(true)}
          >
            <Ionicons name="add-circle-outline" size={28} color="#2c3e50" />
          </TouchableOpacity>
        </View>
      </View>

      {boards.length > 1 && (
        <ScrollView
          horizontal
          style={styles.boardSelector}
          showsHorizontalScrollIndicator={false}
        >
          {boards.map((board) => (
            <TouchableOpacity
              key={board.id}
              style={[
                styles.boardTab,
                selectedBoard?.id === board.id && styles.boardTabActive
              ]}
              onPress={async () => {
                const fullBoard = await kanbanApi.getBoard(board.id);
                setSelectedBoard(fullBoard);
              }}
            >
              <Text style={[
                styles.boardTabText,
                selectedBoard?.id === board.id && styles.boardTabTextActive
              ]}>
                {board.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        horizontal
        style={styles.boardContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedBoard?.columns && selectedBoard.columns.length > 0 ? (
          selectedBoard.columns
            .sort((a, b) => a.position - b.position)
            .map(renderColumn)
        ) : (
          <View style={styles.emptyBoardContainer}>
            <Ionicons name="list-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyBoardText}>Aucune colonne dans ce tableau</Text>
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      <CreateBoardModal
        visible={showCreateBoardModal}
        onClose={() => setShowCreateBoardModal(false)}
        onSuccess={fetchBoards}
      />

      {selectedBoard && (
        <>
          <CreateColumnModal
            visible={showCreateColumnModal}
            boardId={selectedBoard.id}
            onClose={() => setShowCreateColumnModal(false)}
            onSuccess={fetchBoards}
          />

          <CreateCardModal
            visible={showCreateCardModal}
            boardId={selectedBoard.id}
            columns={selectedBoard.columns || []}
            defaultColumnId={selectedColumnForCard}
            onClose={() => {
              setShowCreateCardModal(false);
              setSelectedColumnForCard(undefined);
            }}
            onSuccess={fetchBoards}
          />

          <CardDetailsModal
            visible={showCardDetailsModal}
            card={selectedCard}
            columns={selectedBoard.columns || []}
            onClose={() => {
              setShowCardDetailsModal(false);
              setSelectedCard(null);
            }}
            onUpdate={() => {
              fetchBoards();
              setShowCardDetailsModal(false);
              setSelectedCard(null);
            }}
          />

          <BoardStatsModal
            visible={showStatsModal}
            board={selectedBoard}
            onClose={() => setShowStatsModal(false)}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  boardSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 60,
  },
  boardTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  boardTabActive: {
    borderBottomColor: '#2c3e50',
  },
  boardTabText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  boardTabTextActive: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  boardContainer: {
    flex: 1,
  },
  column: {
    width: 300,
    marginHorizontal: 8,
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  columnHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  columnCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  addCardButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    padding: 4,
  },
  columnCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  columnContent: {
    padding: 12,
    maxHeight: 600,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardNotes: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#2196f3',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 11,
    color: '#95a5a6',
    alignSelf: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyColumnText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
  },
  emptyColumnHint: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyBoardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyBoardText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 12,
  },
});

export default KanbanScreen;
