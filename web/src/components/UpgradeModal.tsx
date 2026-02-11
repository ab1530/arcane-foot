"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Lock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { analytics } from "@/lib/analytics";

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedFeature: string;
  requiredTier: 'GOLD' | 'PRO' | 'ENTERPRISE';
}

interface TierComparison {
  tier: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  color: string;
  icon: any;
}

const TIER_COMPARISONS: Record<'GOLD' | 'PRO' | 'ENTERPRISE', TierComparison[]> = {
  GOLD: [
    {
      tier: 'FREE',
      name: 'Free',
      price: '0€/mois',
      color: 'text-arcane-grey',
      icon: Lock,
      features: [
        '1 rapport/mois',
        'Statistiques basiques',
        'Passeport public',
        'Support email',
      ],
    },
    {
      tier: 'GOLD',
      name: 'Gold',
      price: '29.99€/mois',
      color: 'text-arcane-accent',
      icon: Crown,
      highlighted: true,
      features: [
        'Rapports illimités',
        'Analyses IA avancées',
        'Passeport premium',
        'Support VIP 24/7',
        'Coach IA personnel',
        'Vidéos & highlights (10 Go)',
        'Détections prioritaires',
      ],
    },
  ],
  PRO: [
    {
      tier: 'GOLD',
      name: 'Gold',
      price: '29.99€/mois',
      color: 'text-arcane-accent',
      icon: Crown,
      features: [
        'Rapports illimités',
        'Analyses IA avancées',
        'Support VIP',
      ],
    },
    {
      tier: 'PRO',
      name: 'Pro',
      price: '99.99€/mois',
      color: 'text-purple-400',
      icon: Sparkles,
      highlighted: true,
      features: [
        'Profils multiples (10)',
        'Export PDF avancé',
        'Analytics dashboard',
        'API Access',
        'Vidéos illimitées',
        'Support dédié',
        'Marque blanche',
      ],
    },
  ],
  ENTERPRISE: [
    {
      tier: 'PRO',
      name: 'Pro',
      price: '99.99€/mois',
      color: 'text-purple-400',
      icon: Sparkles,
      features: [
        'Profils multiples',
        'API Access',
        'Support dédié',
      ],
    },
    {
      tier: 'ENTERPRISE',
      name: 'Enterprise',
      price: 'Sur devis',
      color: 'text-green-400',
      icon: TrendingUp,
      highlighted: true,
      features: [
        'Profils illimités',
        'Infrastructure dédiée',
        'Intégration custom',
        'Formation sur site',
        'SLA garanti',
        'Account manager',
        'Développement sur mesure',
      ],
    },
  ],
};

export function UpgradeModal({
  isOpen,
  onClose,
  blockedFeature,
  requiredTier,
}: UpgradeModalProps) {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [showTime, setShowTime] = useState<number>(0);

  const comparisons = TIER_COMPARISONS[requiredTier] || TIER_COMPARISONS.GOLD;
  const highlightedTier = comparisons.find(c => c.highlighted);

  useEffect(() => {
    if (isOpen) {
      const startTime = Date.now();
      setShowTime(startTime);

      // Track modal shown
      analytics.track({
        type: 'subscription',
        action: 'view_pricing',
        tier: requiredTier,
      });

      // Custom analytics event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('arcane:upgrade-modal-shown', {
          detail: {
            feature: blockedFeature,
            requiredTier,
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      }
    }
  }, [isOpen, blockedFeature, requiredTier]);

  const handleClose = () => {
    // Track dismissal time
    if (showTime > 0) {
      const timeShown = Date.now() - showTime;

      // Custom analytics event
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('arcane:upgrade-modal-dismissed', {
          detail: {
            feature: blockedFeature,
            requiredTier,
            timeShown,
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      }

      analytics.track({
        type: 'feature_usage',
        feature: 'upgrade_modal',
        action: 'dismissed',
      });
    }

    onClose();
  };

  const handleUpgradeClick = (tier: SubscriptionTier) => {
    // Track CTA click
    analytics.track({
      type: 'subscription',
      action: 'click_upgrade',
      tier,
    });

    // Custom analytics event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('arcane:upgrade-modal-cta-clicked', {
        detail: {
          feature: blockedFeature,
          targetTier: tier,
          requiredTier,
          timestamp: new Date().toISOString(),
        },
      });
      window.dispatchEvent(event);
    }

    // Navigate to pricing page with context
    router.push(`/pricing?highlight=${tier}&source=${encodeURIComponent(blockedFeature)}`);
    onClose();
  };

  const handleViewAllPlans = () => {
    analytics.track({
      type: 'subscription',
      action: 'view_pricing',
    });

    router.push('/pricing');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-arcane-dark/95 backdrop-blur-xl border border-arcane-darkBorder shadow-2xl transition-all">
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-arcane-accent/5 via-transparent to-purple-500/5 pointer-events-none" />

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-arcane-darkBorder/50 hover:bg-arcane-darkBorder transition-colors"
                >
                  <X className="h-5 w-5 text-arcane-grey hover:text-white" />
                </button>

                <div className="relative p-8">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-arcane-accent/20 mb-4">
                      <Lock className="h-8 w-8 text-arcane-accent" />
                    </div>

                    <Dialog.Title
                      as="h3"
                      className="text-3xl font-black text-white mb-3 uppercase tracking-tight"
                    >
                      Fonctionnalité Premium
                    </Dialog.Title>

                    <p className="text-arcane-grey text-lg max-w-2xl mx-auto">
                      <span className="text-arcane-accent font-bold">{blockedFeature}</span>{' '}
                      nécessite un abonnement{' '}
                      <span className="text-white font-bold">{requiredTier}</span> ou supérieur
                    </p>

                    {subscription && (
                      <p className="text-sm text-arcane-grey mt-2">
                        Votre plan actuel: <span className="text-white">{subscription.tier}</span>
                      </p>
                    )}
                  </motion.div>

                  {/* Tier Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {comparisons.map((tier, index) => {
                      const Icon = tier.icon;
                      return (
                        <motion.div
                          key={tier.tier}
                          initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          className={`relative rounded-xl p-6 ${
                            tier.highlighted
                              ? 'bg-gradient-to-br from-arcane-accent/10 to-purple-500/10 border-2 border-arcane-accent/50'
                              : 'bg-arcane-darkBorder/30 border border-arcane-darkBorder'
                          }`}
                        >
                          {/* Popular badge for highlighted tier */}
                          {tier.highlighted && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <div className="px-4 py-1 rounded-full bg-arcane-accent text-arcane-dark text-xs font-black uppercase">
                                Recommandé
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className={`h-10 w-10 rounded-lg ${
                                tier.highlighted ? 'bg-arcane-accent/20' : 'bg-arcane-darkBorder/50'
                              } flex items-center justify-center`}
                            >
                              <Icon className={`h-5 w-5 ${tier.color}`} />
                            </div>
                            <div className="text-left">
                              <h4 className="text-xl font-black text-white">{tier.name}</h4>
                              <p className={`text-sm font-bold ${tier.color}`}>{tier.price}</p>
                            </div>
                          </div>

                          <ul className="space-y-2">
                            {tier.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check
                                  className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                                    tier.highlighted ? 'text-arcane-accent' : 'text-arcane-grey'
                                  }`}
                                />
                                <span className="text-sm text-white">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {tier.highlighted && (
                            <Button
                              onClick={() => handleUpgradeClick(tier.tier)}
                              className="w-full mt-6 bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80 font-black"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Passer à {tier.name} - {tier.price}
                            </Button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Benefits Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-arcane-accent/10 to-purple-500/10 rounded-xl p-6 mb-6"
                  >
                    <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-arcane-accent" />
                      Pourquoi upgrader vers {requiredTier}?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-left">
                        <Zap className="h-6 w-6 text-arcane-accent mb-2" />
                        <p className="text-sm font-bold text-white mb-1">Analyses IA illimitées</p>
                        <p className="text-xs text-arcane-grey">
                          Générez autant de rapports que vous voulez
                        </p>
                      </div>
                      <div className="text-left">
                        <Crown className="h-6 w-6 text-arcane-accent mb-2" />
                        <p className="text-sm font-bold text-white mb-1">Accès prioritaire</p>
                        <p className="text-xs text-arcane-grey">
                          Soyez détecté en premier par les clubs
                        </p>
                      </div>
                      <div className="text-left">
                        <TrendingUp className="h-6 w-6 text-arcane-accent mb-2" />
                        <p className="text-sm font-bold text-white mb-1">Progression accélérée</p>
                        <p className="text-xs text-arcane-grey">
                          Outils pros pour performances d'élite
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Footer Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    {highlightedTier && (
                      <Button
                        onClick={() => handleUpgradeClick(highlightedTier.tier)}
                        size="lg"
                        className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80 font-black text-lg px-8"
                      >
                        <Crown className="h-5 w-5 mr-2" />
                        Upgrader vers {highlightedTier.name}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    )}
                    <Button
                      onClick={handleViewAllPlans}
                      size="lg"
                      variant="outline"
                      className="border-arcane-darkBorder text-white hover:bg-arcane-darkBorder font-bold"
                    >
                      Voir tous les plans
                    </Button>
                  </motion.div>

                  {/* Trust Signals */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 text-center"
                  >
                    <p className="text-xs text-arcane-grey">
                      ✓ Annulation à tout moment · ✓ Paiement sécurisé via Stripe · ✓ Satisfaction
                      garantie
                    </p>
                  </motion.div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
