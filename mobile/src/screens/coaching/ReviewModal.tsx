/**
 * REVIEW MODAL (PLACEHOLDER)
 * Submit reviews for completed coaching sessions
 *
 * TODO: Complete implementation with:
 * - Coach info summary
 * - Interactive star rating
 * - Comment textarea with character count
 * - Form validation
 * - Submit button with loading state
 *
 * @version 1.0.0 (Placeholder)
 * @date 2025-11-11
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens, typography } from '../../design';

export const ReviewModal: React.FC = () => {
  const navigation = useNavigation();

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leave a Review</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <X size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>⭐ Leave a Review</Text>
          <Text style={styles.subtitle}>Review submission coming soon!</Text>
          <Text style={styles.description}>
            This modal will include:{'\n\n'}
            • Coach info summary{'\n'}
            • Interactive star rating selector{'\n'}
            • Comment textarea{'\n'}
            • Character count indicator{'\n'}
            • Form validation{'\n'}
            • Submit Review button{'\n'}
            • Skip option
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surface.borderLight,
  },
  headerTitle: {
    ...typography.heading3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    ...typography.heading1,
    fontSize: tokens.fontSize['4xl'],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.heading4,
    color: tokens.colors.yellow.DEFAULT,
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    textAlign: 'center',
    lineHeight: tokens.fontSize.base * 1.6,
  },
});

export default ReviewModal;
