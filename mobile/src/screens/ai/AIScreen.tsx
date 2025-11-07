import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

type Props = NativeStackScreenProps<AppStackParamList, 'AI'>;

type FeatureCardProps = {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
};

export const AIScreen: React.FC<Props> = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuickChat = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      const response = await api.chatWithArkaneGPT(trimmed);
      const summary =
        response?.summary ??
        "Je n'ai pas de réponse disponible pour le moment, réessaie avec plus de contexte.";
      setLastResponse(summary);
    } catch (err) {
      console.error('AI quick chat failed:', err);
      setError(
        "Impossible de récupérer une réponse IA. Vérifie ta connexion ou réessaie plus tard."
      );
    } finally {
      setIsSending(false);
      setMessage('');
    }
  }, [isSending, message]);

  const AIFeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    icon,
    onPress,
  }) => (
    <TouchableOpacity style={styles.featureCardWrapper} onPress={onPress}>
      <GlassCard variant="elevated">
        <View style={styles.featureCard}>
          <View style={styles.featureIcon}>
            <Icon name={icon} size={28} color={colors.brand.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
          </View>
          <Icon name="chevronForward" size={20} color={colors.brand.primary} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <GlassCard variant="elevated" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Icon name="ai" size={64} color={colors.brand.primary} />
            <Text style={styles.heroTitle}>ARCANE AI</Text>
            <Text style={styles.heroSubtitle}>
              Your intelligent football scouting assistant
            </Text>
          </View>
        </GlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Chat</Text>
          <GlassCard variant="bordered">
            <View style={styles.chatContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask me anything about scouting..."
                placeholderTextColor={colors.text.secondary}
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (isSending || !message.trim()) && styles.sendButtonDisabled,
                ]}
                onPress={handleQuickChat}
                disabled={isSending || !message.trim()}
              >
                {isSending ? (
                  <ActivityIndicator color={colors.background.primary} size="small" />
                ) : (
                  <Icon name="arrowForward" size={20} color={colors.background.primary} />
                )}
              </TouchableOpacity>
            </View>
            {(lastResponse || error) && (
              <View style={styles.chatResponse}>
                <Text style={styles.chatResponseLabel}>ArkaneGPT</Text>
                <Text style={styles.chatResponseText}>{error ?? lastResponse}</Text>
              </View>
            )}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <AIFeatureCard
            title="ArkaneMatch AI"
            description="Find scouts using conversational AI"
            icon="search"
            onPress={() => navigation.navigate('ArkaneMatch')}
          />
          <AIFeatureCard
            title="ARCANE GPT"
            description="Chat with AI for insights and analysis"
            icon="chat"
            onPress={() => navigation.navigate('ArcaneGPT')}
          />
          <AIFeatureCard
            title="ARCANE Index"
            description="Advanced player search and recommendations"
            icon="search"
            onPress={() => navigation.navigate('ArcaneIndex')}
          />
          <AIFeatureCard
            title="Market Value AI"
            description="AI-powered player market valuation"
            icon="cash"
            onPress={() => navigation.navigate('MarketValue', {})}
          />
          <AIFeatureCard
            title="SmartScout AI"
            description="Smart suggestions and autocomplete for reports"
            icon="documentText"
            onPress={() => navigation.navigate('SmartScout')}
          />
          <AIFeatureCard
            title="AutoScout AI"
            description="Generate comprehensive AI-powered scouting reports"
            icon="document"
            onPress={() => navigation.navigate('AutoScout')}
          />
          <AIFeatureCard
            title="Player Comparison"
            description="Compare players using AI"
            icon="scale"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          <GlassCard variant="elevated">
            <View style={styles.emptyState}>
              <Icon name="chatOutline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No recent conversations</Text>
              <Text style={styles.emptySubtext}>
                Start chatting with ARCANE AI to see your history
              </Text>
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Usage</Text>
          <GlassCard variant="elevated">
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>47</Text>
                <Text style={styles.statLabel}>Queries</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Reports Analyzed</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  heroCard: {
    marginBottom: spacing.xl,
  },
  heroContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chatContainer: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    minHeight: 45,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  chatResponse: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  chatResponseLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  chatResponseText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  featureCardWrapper: {
    marginBottom: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  featureDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: spacing.lg,
  },
});
