import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../types/navigation';
import { colors, spacing, typography } from '../../design/theme';
import {
  ChatMessage,
  MessageInput,
  SuggestionChips,
  TypingIndicator,
} from '../../components/arkane-match';
import { SUGGESTED_PROMPTS } from '../../types/arkane-match';
import type {
  ChatMessage as ChatMessageType,
  ConversationState,
} from '../../types/arkane-match';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<AppStackParamList, 'ArkaneMatch'>;

export const ArkaneMatchScreen: React.FC<Props> = ({ navigation }) => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    conversationId: null,
    isLoading: false,
    error: null,
  });

  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm ArkaneMatch AI, your intelligent scout search assistant. I can help you find the perfect scout for your club using natural language.\n\nTry asking me things like:\n• 'Find me a Premier League scout'\n• 'Show scouts specializing in defenders'\n• 'LaLiga specialists under €150/hour'\n\nWhat kind of scout are you looking for?",
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [welcomeMessage],
    }));
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (state.messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [state.messages]);

  const handleSendMessage = async (message: string) => {
    // Hide suggestions after first message
    setShowSuggestions(false);

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Call ArkaneMatch API
      const response = await api.arkaneMatchChat(message, state.conversationId || undefined);

      // Create assistant message with response
      const assistantMessage: ChatMessageType = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response || 'I apologize, I encountered an issue processing your request.',
        scouts: response.scouts || [],
        extractedCriteria: response.extractedCriteria,
        suggestions: response.suggestions || [],
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        conversationId: response.conversationId,
        isLoading: false,
      }));

      // Haptic feedback for response
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('ArkaneMatch chat error:', error);

      // Error message
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or rephrase your question.",
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
        error: error.message,
      }));

      // Haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleScoutPress = (scoutId: string) => {
    if (!scoutId) {
      Alert.alert('Scout Profile', 'Unable to open this profile right now.');
      return;
    }

    try {
      navigation.navigate('ScoutDetail', { scoutId });
    } catch (error) {
      console.warn('Failed to navigate to scout profile', error);
      Alert.alert(
        'Scout Profile',
        `Scout profile screen is not available at the moment.\nScout ID: ${scoutId}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearConversation = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to start a new conversation? This will clear all messages.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear conversation on server if exists
            if (state.conversationId) {
              try {
                await api.clearArkaneMatchConversation(state.conversationId);
              } catch (error) {
                console.error('Failed to clear conversation:', error);
              }
            }

            // Reset state
            setState({
              messages: [],
              conversationId: null,
              isLoading: false,
              error: null,
            });

            setShowSuggestions(true);

            // Add welcome message again
            const welcomeMessage: ChatMessageType = {
              id: 'welcome-new',
              role: 'assistant',
              content:
                "Hello! I'm ready to help you find the perfect scout. What are you looking for?",
              timestamp: new Date(),
            };

            setState((prev) => ({
              ...prev,
              messages: [welcomeMessage],
            }));

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessageType }) => (
    <ChatMessage message={item} onScoutPress={handleScoutPress} />
  );

  const renderHeader = () => {
    if (!showSuggestions || state.messages.length > 1) return null;

    return (
      <SuggestionChips
        suggestions={SUGGESTED_PROMPTS}
        onSuggestionPress={handleSuggestionPress}
      />
    );
  };

  const renderFooter = () => {
    if (!state.isLoading) return null;
    return <TypingIndicator />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ArkaneMatch AI</Text>
          <Text style={styles.headerSubtitle}>Scout Search Assistant</Text>
        </View>

        <TouchableOpacity
          onPress={handleClearConversation}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.headerIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={state.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          isLoading={state.isLoading}
          placeholder="Ask me to find scouts..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
    backgroundColor: colors.background.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});

export default ArkaneMatchScreen;
