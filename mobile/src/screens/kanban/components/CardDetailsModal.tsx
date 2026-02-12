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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { kanbanApi, KanbanCard, TaskPriority, KanbanColumn } from '../../../services/api/kanban';

interface CardDetailsModalProps {
  visible: boolean;
  card: KanbanCard | null;
  columns: KanbanColumn[];
  onClose: () => void;
  onUpdate: () => void;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Basse', color: '#95a5a6' },
  { value: 'MEDIUM', label: 'Moyenne', color: '#3498db' },
  { value: 'HIGH', label: 'Haute', color: '#f39c12' },
  { value: 'URGENT', label: 'Urgente', color: '#e74c3c' },
];

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  visible,
  card,
  columns,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [tags, setTags] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (card && visible) {
      setNotes(card.notes || '');
      setPriority(card.priority);
      setTags(card.tags?.join(', ') || '');
      setSelectedColumnId(card.columnId);
      loadActivities();
    }
  }, [card, visible]);

  const loadActivities = async () => {
    if (!card) return;
    setLoadingActivities(true);
    try {
      const data = await kanbanApi.getCardActivities(card.id);
      setActivities(data);
    } catch (err) {
      console.error('Erreur lors du chargement des activités:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSave = async () => {
    if (!card) return;

    setLoading(true);
    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Mise à jour des informations de la carte
      await kanbanApi.updateCard(card.id, {
        notes: notes.trim() || undefined,
        priority,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      // Déplacement de la carte si la colonne a changé
      if (selectedColumnId !== card.columnId) {
        await kanbanApi.moveCard(card.id, {
          targetColumnId: selectedColumnId,
        });
      }

      setIsEditing(false);
      onUpdate();
      Alert.alert('Succès', 'La carte a été mise à jour');
    } catch (err: any) {
      Alert.alert(
        'Erreur',
        err.response?.data?.message || 'Impossible de mettre à jour la carte'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!card) return;

    Alert.alert(
      'Supprimer la carte',
      'Voulez-vous vraiment supprimer cette carte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await kanbanApi.deleteCard(card.id);
              onUpdate();
              onClose();
              Alert.alert('Succès', 'La carte a été supprimée');
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer la carte');
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!card) return null;

  const playerName = card.player?.user
    ? `${card.player.user.firstName || ''} ${card.player.user.lastName || ''}`.trim()
    : 'Joueur';

  const currentColumn = columns.find((c) => c.id === card.columnId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2c3e50" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{playerName}</Text>
              {currentColumn && (
                <Text style={styles.headerSubtitle}>{currentColumn.name}</Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {!isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={24} color="#3498db" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsEditing(false)}
                  disabled={loading}
                >
                  <Ionicons name="close-outline" size={24} color="#95a5a6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#27ae60" />
                  ) : (
                    <Ionicons name="checkmark-outline" size={24} color="#27ae60" />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Informations du joueur */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Joueur</Text>
            <View style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{playerName}</Text>
                {card.player?.position && (
                  <Text style={styles.playerPosition}>{card.player.position}</Text>
                )}
              </View>
              {card.player?.birthDate && (
                <Text style={styles.playerAge}>
                  {new Date().getFullYear() -
                    new Date(card.player.birthDate).getFullYear()}{' '}
                  ans
                </Text>
              )}
            </View>
          </View>

          {/* Colonne */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colonne</Text>
            {isEditing ? (
              <View style={styles.columnGrid}>
                {columns.map((column) => (
                  <TouchableOpacity
                    key={column.id}
                    style={[
                      styles.columnOption,
                      selectedColumnId === column.id && styles.columnOptionSelected,
                    ]}
                    onPress={() => setSelectedColumnId(column.id)}
                  >
                    <View
                      style={[
                        styles.columnColorBar,
                        { backgroundColor: column.color || '#34495e' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.columnOptionText,
                        selectedColumnId === column.id &&
                          styles.columnOptionTextSelected,
                      ]}
                    >
                      {column.name}
                    </Text>
                    {selectedColumnId === column.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#3498db" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.columnDisplay}>
                <View
                  style={[
                    styles.columnColorDot,
                    { backgroundColor: currentColumn?.color || '#34495e' },
                  ]}
                />
                <Text style={styles.columnDisplayText}>
                  {currentColumn?.name || 'Colonne inconnue'}
                </Text>
              </View>
            )}
          </View>

          {/* Priorité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priorité</Text>
            {isEditing ? (
              <View style={styles.priorityGrid}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityOption,
                      priority === p.value && [
                        styles.priorityOptionSelected,
                        { borderColor: p.color },
                      ],
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: p.color }]}
                    />
                    <Text
                      style={[
                        styles.priorityOptionText,
                        priority === p.value && styles.priorityOptionTextSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.priorityDisplay}>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        PRIORITIES.find((p) => p.value === card.priority)?.color ||
                        '#bdc3c7',
                    },
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>
                    {PRIORITIES.find((p) => p.value === card.priority)?.label ||
                      card.priority}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ajoutez des notes..."
                placeholderTextColor="#95a5a6"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={500}
              />
            ) : (
              <Text style={styles.notesText}>
                {card.notes || 'Aucune note ajoutée'}
              </Text>
            )}
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="Ex: urgent, prioritaire, mercato"
                placeholderTextColor="#95a5a6"
                maxLength={200}
              />
            ) : card.tags && card.tags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {card.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Aucun tag</Text>
            )}
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
              <Text style={styles.infoLabel}>Créée le :</Text>
              <Text style={styles.infoValue}>
                {new Date(card.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#7f8c8d" />
              <Text style={styles.infoLabel}>Dernière modification :</Text>
              <Text style={styles.infoValue}>
                {new Date(card.updatedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="arrow-forward-outline" size={16} color="#7f8c8d" />
              <Text style={styles.infoLabel}>Déplacée le :</Text>
              <Text style={styles.infoValue}>
                {new Date(card.movedAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          {/* Activités */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {loadingActivities ? (
              <ActivityIndicator size="small" color="#3498db" />
            ) : activities.length > 0 ? (
              <View style={styles.activitiesList}>
                {activities.map((activity, idx) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityAction}>{activity.action}</Text>
                      {activity.description && (
                        <Text style={styles.activityDescription}>
                          {activity.description}
                        </Text>
                      )}
                      <Text style={styles.activityDate}>
                        {new Date(activity.createdAt).toLocaleString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Aucune activité enregistrée</Text>
            )}
          </View>
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
    backgroundColor: '#fff',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  playerAge: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  columnGrid: {
    gap: 8,
  },
  columnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  columnOptionSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  columnColorBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  columnOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  columnOptionTextSelected: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  columnDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  columnColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  columnDisplayText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    minWidth: '47%',
  },
  priorityOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  priorityOptionTextSelected: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  priorityDisplay: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
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
    minHeight: 120,
    paddingTop: 12,
  },
  notesText: {
    fontSize: 15,
    color: '#2c3e50',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#2196f3',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  activitiesList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
});

export default CardDetailsModal;
