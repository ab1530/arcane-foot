/**
 * Contact Screen
 * Contact form for support and inquiries
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { logError, logInfo } from '../../utils/logger';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

const CONTACT_TYPES = [
  { value: 'support', label: 'Technical Support' },
  { value: 'sales', label: 'Sales Inquiry' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'support',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    try {
      await api.sendContactMessage(formData);
      logInfo('Contact message sent', { type: formData.type });

      Alert.alert(
        'Message Sent!',
        'Thank you for contacting us. We\'ll get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                name: '',
                email: '',
                phone: '',
                type: 'support',
                message: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      logError('Error sending contact message', error, { screen: 'ContactScreen' });
      Alert.alert('Error', 'Failed to send message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.subtitle}>
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </Text>
          </View>

          <GlassCard variant="elevated" style={styles.form}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.text.secondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={colors.text.secondary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor={colors.text.secondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            {/* Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subject *</Text>
              <View style={styles.typesContainer}>
                {CONTACT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.type === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.type === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How can we help you?"
                placeholderTextColor={colors.text.secondary}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Contact Info */}
          <GlassCard variant="elevated" style={styles.contactInfo}>
            <Text style={styles.contactInfoTitle}>Other Ways to Reach Us</Text>
            <View style={styles.contactInfoItem}>
              <Icon name="mail" size={20} color={colors.brand.primary} />
              <Text style={styles.contactInfoText}>support@arcane.football</Text>
            </View>
            <View style={styles.contactInfoItem}>
              <Icon name="apps" size={20} color={colors.brand.primary} />
              <Text style={styles.contactInfoText}>www.arcane-football.com</Text>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  form: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.glassLight,
  },
  typeButtonActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + '20',
  },
  typeButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  typeButtonTextActive: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  contactInfo: {
    padding: spacing.lg,
  },
  contactInfoTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactInfoText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
});
