/**
 * FILTER MODAL (PLACEHOLDER)
 * Advanced filtering for coach search
 *
 * TODO: Complete implementation with:
 * - Expertise multi-select
 * - Rating selector
 * - Price range slider
 * - Language multi-select
 * - Availability toggles
 * - Reset & Apply buttons
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

export const FilterModal: React.FC = () => {
  const navigation = useNavigation();

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <X size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>🔍 Filter Coaches</Text>
          <Text style={styles.subtitle}>Advanced filtering coming soon!</Text>
          <Text style={styles.description}>
            This modal will include:{'\n\n'}
            • Expertise multi-select (chips){'\n'}
            • Rating selector (stars){'\n'}
            • Price range slider{'\n'}
            • Language multi-select{'\n'}
            • Availability toggles{'\n'}
            • Reset & Apply Filters buttons
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

export default FilterModal;
