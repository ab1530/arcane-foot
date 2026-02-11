import React, { useState } from 'react';
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
import { kanbanApi, KanbanColumnType } from '../../../services/api/kanban';

interface CreateColumnModalProps {
  visible: boolean;
  boardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const COLUMN_TYPES: { type: KanbanColumnType; label: string; color: string }[] = [
  { type: 'PROSPECT', label: 'Prospect', color: '#3498db' },
  { type: 'CONTACTED', label: 'Contacté', color: '#9b59b6' },
  { type: 'INTERESTED', label: 'Intéressé', color: '#f39c12' },
  { type: 'NEGOTIATING', label: 'Négociation', color: '#e67e22' },
  { type: 'OFFER_MADE', label: 'Offre faite', color: '#16a085' },
  { type: 'SIGNED', label: 'Signé', color: '#27ae60' },
  { type: 'ARCHIVED', label: 'Archivé', color: '#95a5a6' },
  { type: 'CUSTOM', label: 'Personnalisé', color: '#34495e' },
];

const CreateColumnModal: React.FC<CreateColumnModalProps> = ({
  visible,
  boardId,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<KanbanColumnType>('PROSPECT');
  const [cardLimit, setCardLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Le nom de la colonne est requis');
      return;
    }

    const limit = cardLimit ? parseInt(cardLimit, 10) : undefined;
    if (cardLimit && (isNaN(limit!) || limit! < 1)) {
      setError('La limite doit être un nombre supérieur à 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedColumn = COLUMN_TYPES.find((c) => c.type === selectedType);

      await kanbanApi.createColumn(boardId, {
        name: name.trim(),
        type: selectedType,
        color: selectedColumn?.color,
      });

      // Réinitialiser le formulaire
      setName('');
      setSelectedType('PROSPECT');
      setCardLimit('');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la colonne');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedType('PROSPECT');
    setCardLimit('');
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
            <Text style={styles.title}>Nouvelle colonne</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de la colonne *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: En attente de réponse"
                placeholderTextColor="#95a5a6"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type de colonne</Text>
              <View style={styles.typeGrid}>
                {COLUMN_TYPES.map((col) => (
                  <TouchableOpacity
                    key={col.type}
                    style={[
                      styles.typeCard,
                      selectedType === col.type && styles.typeCardSelected,
                    ]}
                    onPress={() => setSelectedType(col.type)}
                  >
                    <View
                      style={[
                        styles.typeColorDot,
                        { backgroundColor: col.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        selectedType === col.type && styles.typeLabelSelected,
                      ]}
                    >
                      {col.label}
                    </Text>
                    {selectedType === col.type && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#3498db"
                        style={styles.typeCheckmark}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Limite de cartes (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={cardLimit}
                onChangeText={setCardLimit}
                placeholder="Ex: 10"
                placeholderTextColor="#95a5a6"
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.helperText}>
                Nombre maximum de cartes autorisées dans cette colonne
              </Text>
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
    maxHeight: '80%',
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
  helperText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    minWidth: '47%',
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  typeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  typeLabelSelected: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  typeCheckmark: {
    marginLeft: 4,
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

export default CreateColumnModal;
