/**
 * Membership Screen
 * Displays subscription plans and manages user subscription
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { logError, logInfo } from '../../utils/logger';

const SUBSCRIPTION_TIERS = [
  {
    tier: 'FREE',
    name: 'Free',
    price: '0€',
    priceMonthly: 0,
    features: [
      'Access to basic player database',
      'View public scouting reports',
      'Limited analytics',
      'Community support',
    ],
    color: colors.text.secondary,
  },
  {
    tier: 'BASIC',
    name: 'Scout',
    price: '29€',
    priceMonthly: 29,
    features: [
      'Everything in Free',
      'ArkaneGPT AI Assistant',
      'Create scouting reports',
      'Advanced player filters',
      'Email support',
    ],
    color: colors.semantic.info,
    popular: false,
  },
  {
    tier: 'PRO',
    name: 'Agent',
    price: '79€',
    priceMonthly: 79,
    features: [
      'Everything in Scout',
      'AI-powered matchmaking',
      'Automated scouting reports',
      'Calendar & match management',
      'Priority support',
    ],
    color: colors.brand.primary,
    popular: true,
  },
  {
    tier: 'GOLD',
    name: 'Agency',
    price: '149€',
    priceMonthly: 149,
    features: [
      'Everything in Agent',
      'ArkaneIndex™ player ratings',
      'Unlimited AI features',
      'Multi-user accounts',
      'Dedicated account manager',
      '24/7 premium support',
    ],
    color: '#FFD700',
    popular: false,
  },
];

export default function MembershipScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  const fetchSubscription = async () => {
    try {
      const subscription = await api.getMySubscription();
      setCurrentSubscription(subscription);
      logInfo('Subscription loaded', { tier: subscription?.tier });
    } catch (error) {
      logError('Error fetching subscription', error, { screen: 'MembershipScreen' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubscription();
  };

  const handleUpgrade = (tier: string, priceMonthly: number) => {
    if (currentSubscription?.tier === tier) {
      Alert.alert('Already Subscribed', `You are already on the ${tier} plan.`);
      return;
    }

    Alert.alert(
      'Upgrade Subscription',
      `Would you like to upgrade to the ${tier} plan for ${priceMonthly}€/month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              await api.createOrUpdateSubscription(tier, 'MONTHLY');
              Alert.alert('Success', 'Subscription upgraded successfully!');
              fetchSubscription();
            } catch (error) {
              logError('Error upgrading subscription', error, { tier });
              Alert.alert('Error', 'Failed to upgrade subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelSubscription('User requested cancellation');
              Alert.alert('Cancelled', 'Your subscription has been cancelled.');
              fetchSubscription();
            } catch (error) {
              logError('Error cancelling subscription', error);
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  const currentTier = currentSubscription?.tier || 'FREE';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Membership Plans</Text>
          <Text style={styles.subtitle}>
            Choose the plan that fits your scouting needs
          </Text>
        </View>

        {/* Current Subscription */}
        {currentSubscription && currentTier !== 'FREE' && (
          <GlassCard variant="elevated" style={styles.currentPlan}>
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <Text style={styles.currentPlanName}>{currentTier}</Text>
            <Text style={styles.currentPlanStatus}>
              Status: {currentSubscription.status}
            </Text>
            {currentSubscription.status === 'ACTIVE' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        )}

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_TIERS.map((plan) => {
            const isCurrentPlan = currentTier === plan.tier;

            return (
              <GlassCard
                key={plan.tier}
                variant="elevated"
                style={[
                  styles.planCard,
                  isCurrentPlan && styles.currentPlanCard,
                  plan.popular && styles.popularPlanCard,
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: plan.color }]}>
                    {plan.name}
                  </Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPriceLabel}>/month</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isCurrentPlan && styles.currentButton,
                    { borderColor: plan.color },
                  ]}
                  onPress={() => handleUpgrade(plan.tier, plan.priceMonthly)}
                  disabled={isCurrentPlan}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      isCurrentPlan && styles.currentButtonText,
                      { color: isCurrentPlan ? colors.text.secondary : plan.color },
                    ]}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
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
  },
  currentPlan: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  currentPlanLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  currentPlanName: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.brand.primary,
    marginBottom: spacing.sm,
  },
  currentPlanStatus: {
    fontSize: typography.sizes.base,
    color: colors.semantic.success,
    marginBottom: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.semantic.error,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: colors.semantic.error,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  plansContainer: {
    gap: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    position: 'relative',
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  popularBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  planHeader: {
    marginBottom: spacing.lg,
  },
  planName: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  planPrice: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  planPriceLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  featuresContainer: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  featureCheck: {
    fontSize: typography.sizes.base,
    color: colors.semantic.success,
    marginRight: spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  selectButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  currentButton: {
    borderColor: colors.background.tertiary,
    backgroundColor: colors.surface.glassLight,
  },
  selectButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
  currentButtonText: {
    color: colors.text.secondary,
  },
});
