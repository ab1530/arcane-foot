/**
 * BOOK SESSION SCREEN (PLACEHOLDER)
 * Multi-step booking flow for coaching sessions
 *
 * TODO: Complete implementation with:
 * - Step 1: Select Date (Calendar)
 * - Step 2: Select Time Slot
 * - Step 3: Session Details (type, duration, notes)
 * - Step 4: Confirm & Pay
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
  SafeAreaView,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens, typography } from '../../design';

export const BookSessionScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>📅 Book Session</Text>
        <Text style={styles.subtitle}>
          Multi-step booking flow coming soon!
        </Text>
        <Text style={styles.description}>
          This screen will include:{'\n\n'}
          • Step 1: Select Date (Calendar view){'\n'}
          • Step 2: Select Time Slot{'\n'}
          • Step 3: Session Details (type, duration, notes){'\n'}
          • Step 4: Confirm & Pay
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading3,
  },
  headerSpacer: {
    width: 40,
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

export default BookSessionScreen;
