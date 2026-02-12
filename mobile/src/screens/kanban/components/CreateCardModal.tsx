import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { kanbanApi, TaskPriority, KanbanColumn } from '../../../services/api/kanban';
import { playersApi, Player } from '../../../services/api/players';

interface CreateCardModalProps {
  visible: boolean;
  boardId: string;
  columns: KanbanColumn[];
  defaultColumnId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Basse', color: '#95a5a6' },
  { value: 'MEDIUM', label: 'Moyenne', color: '#3498db' },
  { value: 'HIGH', label: 'Haute', color: '#f39c12' },
  { value: 'URGENT', label: 'Urgente', color: '#e74c3c' },
];

const CreateCardModal: React.FC<CreateCardModalProps> = ({
  visible,
  boardId,
  columns,
  defaultColumnId,
  onClose,
  onSuccess,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>(defaultColumnId || '');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      loadPlayers();
      if (defaultColumnId) {
        setSelectedColumnId(defaultColumnId);
      } else if (columns.length > 0) {
        setSelectedColumnId(columns[0].id);
      }
    }
  }, [visible, defaultColumnId, columns]);

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const data = await playersApi.getAllPlayers();
      setPlayers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des joueurs:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedPlayerId) {
      setError('Veuillez sélectionner un joueur');
      return;
    }

    if (!selectedColumnId) {
      setError('Veuillez sélectionner une colonne');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await kanbanApi.createCard({
        playerId: selectedPlayerId,
        columnId: selectedColumnId,
        notes: notes.trim() || undefined,
        priority,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      // Réinitialiser le formulaire
      setSelectedPlayerId('');
      setSelectedColumnId(defaultColumnId || columns[0]?.id || '');
      setNotes('');
      setPriority('MEDIUM');
      setTags('');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la carte');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlayerId('');
    setSelectedColumnId(defaultColumnId || '');
    setNotes('');
    setPriority('MEDIUM');
    setTags('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle carte</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Joueur *</Text>
              {loadingPlayers ? (
                <ActivityIndicator size="small" color="#3498db" style={styles.loader} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.playerScroll}
                >
                  {players.map((player) => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.playerCard,
                        selectedPlayerId === player.id && styles.playerCardSelected,
                      ]}
                      onPress={() => setSelectedPlayerId(player.id)}
                    >
                      <Text
                        style={[
                          styles.playerName,
                          selectedPlayerId === player.id && styles.playerNameSelected,
                        ]}
                      >
                        {player.user?.firstName} {player.user?.lastName}
                      </Text>
                      <Text style={styles.playerPosition}>{player.position || 'N/A'}</Text>
                      {selectedPlayerId === player.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#3498db"
                          style={styles.playerCheckmark}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Colonne *</Text>
              <View style={styles.columnGrid}>
                {columns.map((column) => (
                  <TouchableOpacity
                    key={column.id}
                    style={[
                      styles.columnCard,
                      selectedColumnId === column.id && styles.columnCardSelected,
                    ]}
                    onPress={() => setSelectedColumnId(column.id)}
                  >
                    <View
                      style={[
                        styles.columnColorBar,
                        { backgroundColor: column.color || '#34495e' },
                      ]}
                    />
                    <View style={styles.columnInfo}>
                      <Text
                        style={[
                          styles.columnName,
                          selectedColumnId === column.id && styles.columnNameSelected,
                        ]}
                      >
                        {column.name}
                      </Text>
                      <Text style={styles.columnCardCount}>
                        {column.cards?.length || 0} cartes
                      </Text>
                    </View>
                    {selectedColumnId === column.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ajoutez des notes sur ce joueur..."
                placeholderTextColor="#95a5a6"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priorité</Text>
              <View style={styles.priorityGrid}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityCard,
                      priority === p.value && [
                        styles.priorityCardSelected,
                        { borderColor: p.color },
                      ],
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: p.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        priority === p.value && styles.priorityLabelSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (séparés par des virgules)</Text>
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="Ex: urgent, prioritaire, mercato"
                placeholderTextColor="#95a5a6"
                maxLength={200}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  loader: {
    paddingVertical: 20,
  },
  playerScroll: {
    maxHeight: 120,
  },
  playerCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    minWidth: 140,
    position: 'relative',
  },
  playerCardSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  playerNameSelected: {
    color: '#2c3e50',
  },
  playerPosition: {
    fontSize: 12,
    color: '#95a5a6',
  },
  playerCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  columnGrid: {
    gap: 8,
  },
  columnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  columnCardSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  columnColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  columnInfo: {
    flex: 1,
  },
  columnName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 2,
  },
  columnNameSelected: {
    color: '#2c3e50',
  },
  columnCardCount: {
    fontSize: 12,
    color: '#95a5a6',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    minWidth: '47%',
  },
  priorityCardSelected: {
    backgroundColor: '#e3f2fd',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  priorityLabelSelected: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  createButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#3498db',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateCardModal;
