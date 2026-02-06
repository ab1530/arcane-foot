/**
 * Membership Screen (Arcane Design System 2.0)
 * Affiche les plans d'abonnement Arcane et permet de gérer l'abonnement mobile.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Users,
  Trophy,
  Crown,
  Building2,
  ShieldCheck,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import { tokens, typography } from '../../design';
import api from '../../services/api';
import { logError, logInfo } from '../../utils/logger';
import { useLocalization } from '../../contexts/LocalizationContext';

type PlanTier = 'FREE' | 'BASIC' | 'GOLD' | 'PRO' | 'ENTERPRISE';
type BillingPeriod = 'MONTHLY' | 'YEARLY';

interface PricingPlan {
  tier: PlanTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  interval?: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  cta?: string;
}

type LocalizedPlan = PricingPlan & { tagline?: string };

interface PricingResponse {
  plans?: PricingPlan[];
  notes?: string[];
  currency?: string;
}

interface SubscriptionSummary {
  id?: string;
  tier: PlanTier;
  status: string;
  cancelAt?: string | null;
  endDate?: string | null;
  trialEndsAt?: string | null;
}

const PLAN_ORDER: PlanTier[] = ['FREE', 'BASIC', 'GOLD', 'PRO', 'ENTERPRISE'];

interface PlanMeta {
  icon: React.ComponentType<{ color?: string; size?: number }>;
  accent: string;
  gradient: [string, string];
}

const PLAN_META: Record<PlanTier, PlanMeta> = {
  FREE: {
    icon: Sparkles,
    accent: tokens.colors.gray[400],
    gradient: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
  },
  BASIC: {
    icon: Users,
    accent: tokens.colors.feature.scouting,
    gradient: ['rgba(59,130,246,0.25)', 'rgba(59,130,246,0.05)'],
  },
  GOLD: {
    icon: Trophy,
    accent: tokens.colors.feature.gamification,
    gradient: ['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.05)'],
  },
  PRO: {
    icon: Crown,
    accent: tokens.colors.feature.ai,
    gradient: ['rgba(139,92,246,0.25)', 'rgba(139,92,246,0.08)'],
  },
  ENTERPRISE: {
    icon: Building2,
    accent: tokens.colors.semantic.info,
    gradient: ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.03)'],
  },
};

const BILLING_OPTIONS: BillingPeriod[] = ['MONTHLY', 'YEARLY'];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: tokens.colors.semantic.success,
  TRIAL: tokens.colors.semantic.info,
  CANCELLED: tokens.colors.semantic.warning,
  EXPIRED: tokens.colors.semantic.error,
  PAST_DUE: tokens.colors.semantic.error,
};

const withAlpha = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatCurrency = (value: number, currency = 'EUR') => {
  if (!value || value <= 0) return 'Gratuit';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatPlanPrice = (plan: PricingPlan, period: BillingPeriod) => {
  const amount = period === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly;
  const suffix = period === 'MONTHLY' ? '/mois' : '/an';
  return `${formatCurrency(amount, plan.currency)} ${suffix}`.trim();
};

const yearlyToMonthly = (plan: PricingPlan) => {
  if (!plan.priceYearly) return null;
  const monthly = plan.priceYearly / 12;
  return formatCurrency(monthly, plan.currency);
};

const MembershipScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [pricingNotes, setPricingNotes] = useState<string[]>([]);
  const [pricingOffline, setPricingOffline] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionSummary | null>(null);
  const { t, dictionary } = useLocalization();
  const membershipCopy = dictionary.membership;

  const fetchSubscription = useCallback(async () => {
    try {
      const subscription = await api.getMySubscription();
      setCurrentSubscription(subscription ?? null);
      logInfo('Subscription loaded', { tier: subscription?.tier });
    } catch (error) {
      logError('Erreur abonnement', error, { screen: 'MembershipScreen', scope: 'getMySubscription' });
      setCurrentSubscription(null);
    }
  }, []);

  const fetchPricing = useCallback(async () => {
    try {
      const response: PricingResponse = await api.getSubscriptionPricing();
      const rawPlans = (response as any)?.plans ?? response;
      const extractedPlans = Array.isArray(rawPlans) ? (rawPlans as PricingPlan[]) : [];
      setPricingPlans(extractedPlans);
      setPricingNotes(Array.isArray((response as any)?.notes) ? (response as any).notes : []);
      setPricingOffline(false);
    } catch (error) {
      logError('Erreur tarifs', error, { screen: 'MembershipScreen', scope: 'getSubscriptionPricing' });
      setPricingPlans([]);
      setPricingNotes([]);
      setPricingOffline(true);
    }
  }, []);

  const initialize = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      try {
        await Promise.all([fetchSubscription(), fetchPricing()]);
      } finally {
        if (showSpinner) setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchPricing, fetchSubscription]
  );

  useEffect(() => {
    initialize(true);
  }, [initialize]);

  const onRefresh = () => {
    setRefreshing(true);
    initialize(false);
  };

  const currentTier: PlanTier = currentSubscription?.tier ?? 'FREE';

  const localizedPlans = useMemo<LocalizedPlan[]>(() => {
    const planTranslations = membershipCopy.plans;
    return PLAN_ORDER.map(tier => {
      const remotePlan = pricingPlans.find(plan => plan.tier === tier);
      const translationPlan = planTranslations[tier];
      return {
        tier,
        name: translationPlan?.name ?? remotePlan?.name ?? tier,
        description: translationPlan?.description ?? remotePlan?.description ?? '',
        priceMonthly: remotePlan?.priceMonthly ?? translationPlan?.priceMonthly ?? 0,
        priceYearly: remotePlan?.priceYearly ?? translationPlan?.priceYearly ?? 0,
        currency: translationPlan?.currency ?? remotePlan?.currency ?? 'EUR',
        interval: remotePlan?.interval ?? translationPlan?.interval,
        features: translationPlan?.features ?? remotePlan?.features ?? [],
        cta: translationPlan?.cta ?? remotePlan?.cta ?? '',
        isPopular: remotePlan?.isPopular ?? tier === 'GOLD',
        tagline: translationPlan?.tagline ?? '',
      };
    });
  }, [membershipCopy.plans, pricingPlans]);

  const orderedPlans = useMemo(() => {
    const plansByTier = new Map(pricingPlans.map((plan) => [plan.tier, plan]));

    return PLAN_ORDER.map((tier) => {
      const apiPlan = plansByTier.get(tier);
      if (apiPlan) {
        return apiPlan;
      }

      const fallbackPlan = membershipCopy.plans?.[tier] as Partial<PricingPlan> | undefined;
      return {
        tier,
        name: fallbackPlan?.name ?? tier,
        description: fallbackPlan?.description ?? '',
        priceMonthly: fallbackPlan?.priceMonthly ?? 0,
        priceYearly: fallbackPlan?.priceYearly ?? 0,
        currency: fallbackPlan?.currency ?? 'EUR',
        features: fallbackPlan?.features ?? [],
        isPopular: false,
      } as PricingPlan;
    });
  }, [pricingPlans, membershipCopy.plans]);

  const handlePlanSelection = (plan: LocalizedPlan) => {
    if (plan.tier === 'ENTERPRISE') {
      navigation.navigate('Contact');
      return;
    }

    if (plan.tier === currentTier) {
      Alert.alert(
        membershipCopy.modals.confirmTitle,
        t('membership.modals.alreadyOnPlan', { plan: plan.name }),
        [{ text: t('common.actions.close'), style: 'cancel' }],
      );
      return;
    }

    const actionLabel =
      plan.tier === 'FREE'
        ? t('membership.actions.downgrade', { plan: plan.name })
        : t('membership.actions.upgrade', {
            plan: plan.name,
            price: formatPlanPrice(plan, billingPeriod),
          });

    Alert.alert(
      membershipCopy.modals.confirmTitle,
      t('membership.modals.confirmDescription', { action: actionLabel }),
      [
        { text: t('common.actions.cancel'), style: 'cancel' },
        {
          text: t('common.actions.confirm'),
          onPress: async () => {
            try {
              await api.createOrUpdateSubscription(plan.tier, billingPeriod);
              Alert.alert(
                membershipCopy.modals.confirmTitle,
                membershipCopy.modals.success,
                [{ text: t('common.actions.close') }],
              );
              fetchSubscription();
            } catch (error) {
              logError('Erreur upgrade abonnement', error, { tier: plan.tier });
              Alert.alert(
                t('common.actions.close'),
                membershipCopy.modals.error,
                [{ text: t('common.actions.close') }],
              );
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      membershipCopy.modals.cancelTitle,
      membershipCopy.modals.cancelMessage,
      [
        { text: t('common.actions.cancel'), style: 'cancel' },
        {
          text: membershipCopy.modals.cancelConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelSubscription('Résiliation via application mobile');
              Alert.alert(
                membershipCopy.modals.cancelSuccess,
                membershipCopy.modals.cancelSuccessMessage,
              );
              fetchSubscription();
            } catch (error) {
              logError('Erreur annulation abonnement', error);
              Alert.alert(t('common.actions.close'), membershipCopy.modals.cancelError);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    try {
      await api.reactivateSubscription();
      Alert.alert(
        membershipCopy.modals.reactivateSuccess,
        membershipCopy.modals.reactivateSuccessMessage,
      );
      fetchSubscription();
    } catch (error) {
      logError('Erreur réactivation abonnement', error);
      Alert.alert(t('common.actions.close'), membershipCopy.modals.reactivateError);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
      </View>
    );
  }

  const statusKey = currentSubscription?.status ?? 'ACTIVE';
  const statusLabel = membershipCopy.status[statusKey] ?? statusKey;
  const currentPlanTranslation = membershipCopy.plans[currentTier];
  const benefits = membershipCopy.benefits.map((benefit, index) => {
    const icons = [Sparkles, ShieldCheck, Zap];
    return {
      ...benefit,
      icon: icons[index] || Sparkles,
    };
  });
  const notesToDisplay = pricingNotes.length > 0 ? pricingNotes : membershipCopy.notes;
  const statusColor = STATUS_COLORS[currentSubscription?.status ?? 'ACTIVE'] ?? tokens.colors.gray[500];
  const nextBillingDate =
    currentSubscription?.status === 'CANCELLED'
      ? formatDate(currentSubscription.cancelAt)
      : formatDate(currentSubscription?.endDate || currentSubscription?.trialEndsAt);
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.yellow.DEFAULT} />
        }
      >
        <LinearGradient
          colors={tokens.colors.gradients.dark}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBackground}
        />

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{membershipCopy.hero.eyebrow}</Text>
          <Text style={styles.heroTitle}>
            {membershipCopy.hero.title}
          </Text>
          <Text style={styles.heroSubtitle}>
            {membershipCopy.hero.subtitle}
          </Text>
        </View>

        <GlassCard variant="elevated" style={styles.currentPlanCard}>
          <Text style={styles.sectionLabel}>{membershipCopy.current.label}</Text>
          <View style={styles.currentHeader}>
            <View>
              <Text style={styles.currentPlanName}>
                {currentPlanTranslation?.tagline || currentPlanTranslation?.name || currentTier}
              </Text>
              <Text style={styles.currentPlanTier}>
                {currentTier === 'FREE'
                  ? membershipCopy.current.tierFree
                  : currentPlanTranslation?.name || currentTier}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: withAlpha(statusColor, 0.15), borderColor: withAlpha(statusColor, 0.4) }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          {nextBillingDate && (
            <Text style={styles.currentMeta}>
              {currentSubscription?.status === 'CANCELLED'
                ? t('membership.current.infoCancelled', { date: nextBillingDate })
                : t('membership.current.infoActive', { date: nextBillingDate })}
            </Text>
          )}
          <View style={styles.currentActions}>
            {currentSubscription?.status === 'CANCELLED' ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleReactivate}>
                <Text style={styles.primaryButtonText}>{membershipCopy.current.reactivate}</Text>
              </TouchableOpacity>
            ) : currentTier !== 'FREE' ? (
              <TouchableOpacity style={styles.outlinedButton} onPress={handleCancelSubscription}>
                <Text style={styles.outlinedButtonText}>{membershipCopy.current.cancel}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.helperText}>
                {membershipCopy.current.helper}
              </Text>
            )}
          </View>
        </GlassCard>

        <View style={styles.billingToggle}>
          {BILLING_OPTIONS.map(option => {
            const isActive = billingPeriod === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                onPress={() => setBillingPeriod(option)}
              >
                <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                  {option === 'MONTHLY'
                    ? membershipCopy.billing.monthly
                    : membershipCopy.billing.yearly}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.billingHelper}>
          {billingPeriod === 'MONTHLY'
            ? membershipCopy.billing.monthlyHelper
            : membershipCopy.billing.yearlyHelper}
        </Text>
        {pricingOffline && (
          <Text style={styles.warningText}>{membershipCopy.warnings.pricingFallback}</Text>
        )}

        <View style={styles.plansGrid}>
          {orderedPlans.map(plan => {
            const meta = PLAN_META[plan.tier];
            const Icon = meta.icon;
            const isCurrent = plan.tier === currentTier;
            const monthlyEquivalent = billingPeriod === 'YEARLY' ? yearlyToMonthly(plan) : null;

            return (
              <GlassCard
                key={plan.tier}
                variant="elevated"
                style={[
                  styles.planCard,
                  isCurrent && styles.planCardCurrent,
                  plan.isPopular && styles.planCardPopular,
                ]}
              >
                <LinearGradient colors={meta.gradient} style={styles.planGradient} />
                <View style={styles.planHeader}>
                  <View style={[styles.iconWrapper, { borderColor: withAlpha(meta.accent, 0.4), backgroundColor: withAlpha(meta.accent, 0.15) }]}>
                    <Icon color={meta.accent} size={20} />
                  </View>
                  <View style={styles.planHeaderText}>
                    <Text style={styles.planEyebrow}>{plan.tagline}</Text>
                    <Text style={styles.planTitle}>{plan.name}</Text>
                  </View>
                  <View style={styles.planBadges}>
                    {plan.isPopular && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{membershipCopy.current.popularBadge}</Text>
                      </View>
                    )}
                    {isCurrent && (
                      <View style={styles.badgeCurrent}>
                        <Text style={styles.badgeCurrentText}>{membershipCopy.current.currentBadge}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceValue, { color: meta.accent }]}>
                    {formatPlanPrice(plan, billingPeriod)}
                  </Text>
                  {monthlyEquivalent && (
                    <Text style={styles.priceSub}>
                      ≈ {monthlyEquivalent} {membershipCopy.billing.monthlyShort}
                    </Text>
                  )}
                </View>

                <View style={styles.featuresList}>
                  {plan.features.slice(0, 6).map(feature => (
                    <View style={styles.featureRow} key={`${plan.tier}-${feature}`}>
                      <ShieldCheck size={16} color={meta.accent} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                  {plan.features.length > 6 && (
                    <Text style={styles.featureMore}>
                      {t('membership.current.moreFeatures', {
                        count: plan.features.length - 6,
                      })}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planButton,
                    {
                      borderColor: meta.accent,
                      backgroundColor: isCurrent ? withAlpha(meta.accent, 0.18) : 'transparent',
                    },
                  ]}
                  onPress={() => handlePlanSelection(plan)}
                >
                  <Text style={[styles.planButtonText, { color: meta.accent }]}>
                    {plan.tier === 'ENTERPRISE'
                      ? membershipCopy.actions.contact
                      : isCurrent
                      ? membershipCopy.current.currentBadge
                      : plan.cta || t('common.actions.confirm')}
                  </Text>
                  <ArrowRight size={16} color={meta.accent} />
                </TouchableOpacity>
              </GlassCard>
            );
          })}
        </View>

        <GlassCard variant="elevated" style={styles.benefitsCard}>
          <Text style={styles.sectionLabel}>{membershipCopy.sections.benefitsTitle}</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map(benefit => {
              const IconComp = benefit.icon;
              return (
                <View key={benefit.title} style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <IconComp size={18} color={tokens.colors.yellow.DEFAULT} />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {notesToDisplay.length > 0 && (
          <GlassCard variant="elevated" style={styles.notesCard}>
            <Text style={styles.sectionLabel}>{membershipCopy.sections.notesTitle}</Text>
            {notesToDisplay.map(note => (
              <View key={note} style={styles.noteRow}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.arcane.black,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    opacity: 0.4,
  },
  hero: {
    marginBottom: 24,
  },
  heroEyebrow: {
    ...typography.overline,
    color: tokens.colors.yellow.DEFAULT,
    marginBottom: 8,
  },
  heroTitle: {
    ...typography.displayLarge,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...typography.bodyLarge,
    color: tokens.colors.gray[300],
  },
  sectionLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  currentPlanCard: {
    marginBottom: 20,
    padding: 20,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanName: {
    ...typography.heading4,
    color: tokens.colors.gray[50],
  },
  currentPlanTier: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentMeta: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
    marginBottom: 16,
  },
  currentActions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
  },
  outlinedButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.error,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlinedButtonText: {
    ...typography.buttonText,
    color: tokens.colors.semantic.error,
  },
  helperText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  billingToggle: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    marginBottom: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: withAlpha(tokens.colors.yellow.DEFAULT, 0.15),
  },
  toggleText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  toggleTextActive: {
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '700',
  },
  billingHelper: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
    marginBottom: 12,
  },
  warningText: {
    ...typography.caption,
    color: tokens.colors.semantic.warning,
    marginBottom: 12,
  },
  plansGrid: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    overflow: 'hidden',
  },
  planCardCurrent: {
    borderColor: withAlpha(tokens.colors.yellow.DEFAULT, 0.6),
  },
  planCardPopular: {
    borderColor: withAlpha(tokens.colors.feature.gamification, 0.6),
  },
  planGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planHeaderText: {
    flex: 1,
  },
  planEyebrow: {
    ...typography.overline,
    color: tokens.colors.gray[400],
    marginBottom: 2,
  },
  planTitle: {
    ...typography.heading4,
    color: tokens.colors.gray[50],
  },
  planBadges: {
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: withAlpha(tokens.colors.feature.gamification, 0.2),
  },
  badgeText: {
    ...typography.caption,
    color: tokens.colors.feature.gamification,
    fontWeight: '700',
  },
  badgeCurrent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: withAlpha(tokens.colors.yellow.DEFAULT, 0.2),
  },
  badgeCurrentText: {
    ...typography.caption,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '700',
  },
  planDescription: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  priceValue: {
    ...typography.heading3,
  },
  priceSub: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  featuresList: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    flex: 1,
  },
  featureMore: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  planButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planButtonText: {
    ...typography.buttonText,
    fontSize: 15,
  },
  benefitsCard: {
    marginBottom: 16,
    padding: 20,
  },
  benefitsGrid: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: withAlpha(tokens.colors.yellow.DEFAULT, 0.15),
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.heading6,
    color: tokens.colors.gray[100],
  },
  benefitDescription: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  notesCard: {
    padding: 20,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: tokens.colors.gray[400],
    marginTop: 6,
  },
  noteText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    flex: 1,
  },
  bottomSpacer: {
    height: 12,
  },
});

export default MembershipScreen;
