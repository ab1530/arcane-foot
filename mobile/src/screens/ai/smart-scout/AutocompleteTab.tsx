import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Icon } from '../../../components/ui';
import { AutocompleteSuggestion } from '../../../components/smart-scout';
import { colors, spacing, typography, radius } from '../../../design/theme';
import { smartScoutApi } from '../../../services/api/smart-scout';
import type { AutocompleteRequest, FieldName } from '../../../types/smart-scout';
import { AUTOCOMPLETE_FIELDS, POSITIONS } from '../../../types/smart-scout';
import Toast from 'react-native-toast-message';

const DEBOUNCE_DELAY = 500; // ms

export const AutocompleteTab: React.FC = () => {
  const [selectedField, setSelectedField] = useState<FieldName>('strengths');
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState({
    position: POSITIONS[0],
    league: '',
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAI, setIsAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const request: AutocompleteRequest = {
        fieldName: selectedField,
        partialValue: text,
        context: {
          position: context.position,
          league: context.league || undefined,
        },
      };

      const response = await smartScoutApi.autocomplete(request);
      setSuggestions(response.suggestions || []);
      setIsAI(response.usingAI);
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch suggestions',
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedField, context]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    if (inputText.trim().length >= 3) {
      const timer = setTimeout(() => {
        fetchSuggestions(inputText);
      }, DEBOUNCE_DELAY);
      setDebounceTimer(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [inputText, selectedField, context]);

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    setSuggestions([]);
    Toast.show({
      type: 'success',
      text1: 'Suggestion Applied',
      text2: 'Text has been inserted',
    });
  };

  const getPlaceholder = () => {
    const placeholders: Record<FieldName, string> = {
      strengths: 'e.g., Good ball control, excellent positioning...',
      weaknesses: 'e.g., Needs to improve defensive awareness...',
      summary: 'e.g., Talented midfielder with great vision...',
      notes: 'e.g., Additional observations...',
      position: 'e.g., Central Midfielder...',
      preferredFoot: 'e.g., Right...',
      tags: 'e.g., fast, technical...',
    };
    return placeholders[selectedField] || 'Start typing...';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Field Selection */}
        <GlassCard variant="bordered" style={styles.card}>
          <Text style={styles.sectionTitle}>Select Field</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedField}
              onValueChange={(value) => {
                setSelectedField(value as FieldName);
                setInputText('');
                setSuggestions([]);
              }}
              style={styles.picker}
              dropdownIconColor={colors.text.primary}
            >
              {AUTOCOMPLETE_FIELDS.map((field) => (
                <Picker.Item key={field.value} label={field.label} value={field.value} />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {/* Context (Optional) */}
        <GlassCard variant="bordered" style={styles.card}>
          <Text style={styles.sectionTitle}>Context (Optional)</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Position</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={context.position}
                onValueChange={(value) =>
                  setContext({ ...context, position: value })
                }
                style={styles.picker}
                dropdownIconColor={colors.text.primary}
              >
                {POSITIONS.map((pos) => (
                  <Picker.Item key={pos} label={pos} value={pos} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>League</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Premier League"
              placeholderTextColor={colors.text.secondary}
              value={context.league}
              onChangeText={(value) => setContext({ ...context, league: value })}
            />
          </View>
        </GlassCard>

        {/* Text Input */}
        <GlassCard variant="bordered" style={styles.card}>
          <View style={styles.inputHeader}>
            <Text style={styles.sectionTitle}>Enter Text</Text>
            {isLoading && (
              <ActivityIndicator size="small" color={colors.brand.primary} />
            )}
          </View>
          <TextInput
            style={styles.textArea}
            placeholder={getPlaceholder()}
            placeholderTextColor={colors.text.secondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.hint}>
            Type at least 3 characters to get suggestions
          </Text>
        </GlassCard>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              {isAI && (
                <View style={styles.aiBadge}>
                  <Icon name="sparkles" size={14} color={colors.status.warning} />
                  <Text style={styles.aiText}>AI Powered</Text>
                </View>
              )}
            </View>
            <View style={styles.suggestionsList}>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <AutocompleteSuggestion
                  key={index}
                  text={suggestion}
                  isAI={isAI}
                  onPress={() => handleSuggestionPress(suggestion)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && inputText.trim().length >= 3 && suggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="searchOutline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyText}>No suggestions available</Text>
            <Text style={styles.emptySubtext}>
              Try different text or context
            </Text>
          </View>
        )}

        {/* Info */}
        {inputText.trim().length === 0 && (
          <View style={styles.infoBox}>
            <Icon name="informationCircle" size={24} color={colors.status.info} />
            <Text style={styles.infoText}>
              Start typing to get AI-powered suggestions for your scouting report
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text.primary,
    height: 50,
  },
  input: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  suggestionsSection: {
    marginBottom: spacing.md,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.status.warning + '20',
    borderRadius: radius.sm,
  },
  aiText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.status.warning,
  },
  suggestionsList: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.status.info + '20',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.status.info + '40',
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
});
