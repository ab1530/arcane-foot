"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Check,
  X,
  Loader2,
  Zap,
  Star,
  Crown,
  Briefcase,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";

interface TierConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: {
    name: string;
    included: boolean;
  }[];
  popular?: boolean;
}

const tiers: TierConfig[] = [
  {
    id: "FREE",
    name: "Free",
    icon: Zap,
    color: "text-arcane-grey",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Parfait pour débuter votre parcours footballistique",
    features: [
      { name: "Profil joueur basique", included: true },
      { name: "Passeport joueur public", included: true },
      { name: "1 rapport de scouting par mois", included: true },
      { name: "Accès aux camps gratuits", included: true },
      { name: "Statistiques basiques", included: true },
      { name: "Support email", included: true },
      { name: "Rapports de scouting illimités", included: false },
      { name: "Camps premium", included: false },
      { name: "Analyses IA avancées", included: false },
      { name: "Vidéos & highlights", included: false },
    ],
  },
  {
    id: "BASIC",
    name: "Basic",
    icon: Star,
    color: "text-blue-400",
    price: {
      monthly: 9.99,
      yearly: 99,
    },
    description: "Pour les joueurs sérieux qui veulent progresser",
    features: [
      { name: "Profil joueur basique", included: true },
      { name: "Passeport joueur public", included: true },
      { name: "5 rapports de scouting par mois", included: true },
      { name: "Accès aux camps gratuits", included: true },
      { name: "Statistiques avancées", included: true },
      { name: "Support prioritaire", included: true },
      { name: "Analyses IA basiques", included: true },
      { name: "Rapports de scouting illimités", included: false },
      { name: "Camps premium", included: false },
      { name: "Vidéos & highlights", included: false },
    ],
  },
  {
    id: "GOLD",
    name: "Gold",
    icon: Crown,
    color: "text-arcane-accent",
    price: {
      monthly: 29.99,
      yearly: 299,
    },
    description: "Le choix des champions pour maximiser leur potentiel",
    popular: true,
    features: [
      { name: "Profil joueur avancé", included: true },
      { name: "Passeport joueur premium", included: true },
      { name: "Rapports de scouting illimités", included: true },
      { name: "Accès à tous les camps", included: true },
      { name: "Statistiques complètes", included: true },
      { name: "Support VIP 24/7", included: true },
      { name: "Analyses IA avancées", included: true },
      { name: "Vidéos & highlights (10 Go)", included: true },
      { name: "Détections prioritaires", included: true },
      { name: "Coach personnel IA", included: true },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    icon: Briefcase,
    color: "text-purple-400",
    price: {
      monthly: 99.99,
      yearly: 999,
    },
    description: "Pour les professionnels et académies",
    features: [
      { name: "Profils multiples (jusqu'à 10)", included: true },
      { name: "Passeports illimités", included: true },
      { name: "Rapports illimités + export PDF", included: true },
      { name: "Camps & showcases premium", included: true },
      { name: "Analytics tableau de bord", included: true },
      { name: "Support dédié", included: true },
      { name: "IA ArkaneScout complète", included: true },
      { name: "Vidéos illimitées", included: true },
      { name: "API Access", included: true },
      { name: "Marque blanche (white label)", included: true },
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    icon: Sparkles,
    color: "text-green-400",
    price: {
      monthly: 0,
      yearly: 0,
    },
    description: "Solutions sur mesure pour clubs et organisations",
    features: [
      { name: "Tout de Pro +", included: true },
      { name: "Profils illimités", included: true },
      { name: "Infrastructure dédiée", included: true },
      { name: "Intégration personnalisée", included: true },
      { name: "Formation sur site", included: true },
      { name: "SLA garanti", included: true },
      { name: "Solutions custom", included: true },
      { name: "Account manager dédié", included: true },
      { name: "Conformité & sécurité avancée", included: true },
      { name: "Développement sur mesure", included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMySubscription();
      setCurrentSubscription(data);
    } catch {
      // User might not have a subscription yet, or not logged in
      // console.log("No subscription found or not logged in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    try {
      // Check if user is logged in
      try {
        await apiClient.getCurrentUser();
      } catch {
        toast.error("Vous devez être connecté pour souscrire");
        router.push("/login");
        return;
      }

      if (tierId === "FREE") {
        toast.info("Vous êtes déjà sur le plan gratuit");
        return;
      }

      if (tierId === "ENTERPRISE") {
        toast.info("Contactez-nous pour une offre Enterprise personnalisée");
        router.push("/contact");
        return;
      }

      setSubscribing(tierId);

      // Create or update subscription
      const result = await apiClient.createOrUpdateSubscription(
        tierId,
        billingPeriod === "yearly" ? "YEARLY" : "MONTHLY"
      );

      // If payment is required, redirect to Stripe Checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.success("Abonnement mis à jour avec succès!");
        fetchCurrentSubscription();
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast.error(error.message || "Erreur lors de la souscription");
    } finally {
      setSubscribing(null);
    }
  };

  const getButtonText = (tierId: string) => {
    if (subscribing === tierId) {
      return "Traitement...";
    }

    if (currentSubscription?.tier === tierId) {
      return "Plan actuel";
    }

    if (tierId === "FREE") {
      return "Gratuit";
    }

    if (tierId === "ENTERPRISE") {
      return "Nous contacter";
    }

    const tierIndex = tiers.findIndex((t) => t.id === tierId);
    const currentIndex = tiers.findIndex((t) => t.id === currentSubscription?.tier);

    if (currentIndex !== -1 && tierIndex > currentIndex) {
      return "Upgrade";
    } else if (currentIndex !== -1 && tierIndex < currentIndex) {
      return "Downgrade";
    }

    return "Commencer";
  };

  const isCurrentPlan = (tierId: string) => {
    return currentSubscription?.tier === tierId;
  };

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
          <p className="text-arcane-grey">Chargement des offres...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden relative">
      <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-arcane-accent flex items-center justify-center">
              <Crown className="h-6 w-6 text-arcane-dark" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tight">
            Tarifs & Abonnements
          </h1>
          <p className="text-arcane-grey text-lg max-w-2xl mx-auto mb-8">
            Choisissez le plan qui correspond à vos ambitions footballistiques
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                billingPeriod === "monthly"
                  ? "bg-arcane-accent text-arcane-dark"
                  : "bg-arcane-darkBorder/50 text-arcane-grey hover:bg-arcane-darkBorder"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-lg font-bold transition-all relative ${
                billingPeriod === "yearly"
                  ? "bg-arcane-accent text-arcane-dark"
                  : "bg-arcane-darkBorder/50 text-arcane-grey hover:bg-arcane-darkBorder"
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-arcane-dark text-xs font-black rounded-full">
                -17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-arcane-accent/20 flex items-center justify-center">
                    <Check className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-arcane-grey">Abonnement actuel</p>
                    <p className="text-xl font-black text-white">
                      {currentSubscription.tier} - {currentSubscription.status}
                    </p>
                  </div>
                </div>
                {currentSubscription.tier !== "FREE" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/account/subscription");
                    }}
                  >
                    Gérer mon abonnement
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const price = billingPeriod === "yearly" ? tier.price.yearly : tier.price.monthly;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard
                  variant={tier.popular ? "elevated" : "default"}
                  className={`h-full relative ${
                    tier.popular ? "border-arcane-accent/50" : ""
                  } ${isCurrentPlan(tier.id) ? "ring-2 ring-arcane-accent" : ""}`}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 rounded-full bg-arcane-accent text-arcane-dark text-xs font-black uppercase">
                        Plus populaire
                      </div>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan(tier.id) && (
                    <div className="absolute -top-3 right-4">
                      <div className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-black uppercase">
                        Actuel
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon & Name */}
                    <div className="mb-4">
                      <div
                        className={`h-12 w-12 rounded-lg ${
                          tier.popular ? "bg-arcane-accent/20" : "bg-arcane-darkBorder/50"
                        } flex items-center justify-center mb-3`}
                      >
                        <Icon className={`h-6 w-6 ${tier.color}`} />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-1">{tier.name}</h3>
                      <p className="text-sm text-arcane-grey">{tier.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      {tier.id === "ENTERPRISE" ? (
                        <div className="text-2xl font-black text-white">Sur devis</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white">
                            {price === 0 ? "0" : price}
                          </span>
                          {price > 0 && (
                            <>
                              <span className="text-lg text-arcane-grey">€</span>
                              <span className="text-sm text-arcane-grey">
                                /{billingPeriod === "yearly" ? "an" : "mois"}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {billingPeriod === "yearly" && price > 0 && tier.id !== "ENTERPRISE" && (
                        <p className="text-xs text-arcane-grey mt-1">
                          soit {(price / 12).toFixed(2)}€/mois
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={`w-full mb-6 ${
                        tier.popular
                          ? "bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                          : isCurrentPlan(tier.id)
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-arcane-darkBorder/50 text-white hover:bg-arcane-darkBorder"
                      }`}
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={subscribing !== null || isCurrentPlan(tier.id)}
                    >
                      {subscribing === tier.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      {getButtonText(tier.id)}
                    </Button>

                    {/* Features List */}
                    <div className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-arcane-accent flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-arcane-grey/30 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm ${
                              feature.included ? "text-white" : "text-arcane-grey/50"
                            }`}
                          >
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ / Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <GlassCard className="p-8">
            <h2 className="text-2xl font-black text-white mb-4">Questions fréquentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Puis-je changer de plan à tout moment ?
                </h3>
                <p className="text-arcane-grey text-sm">
                  Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. Les
                  changements prennent effet immédiatement.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Comment annuler mon abonnement ?
                </h3>
                <p className="text-arcane-grey text-sm">
                  Vous pouvez annuler votre abonnement depuis votre page de gestion. Vous
                  conserverez l'accès jusqu'à la fin de la période payée.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Les paiements sont-ils sécurisés ?
                </h3>
                <p className="text-arcane-grey text-sm">
                  Tous les paiements sont traités de manière sécurisée via Stripe. Nous ne
                  stockons jamais vos informations bancaires.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Offrez-vous des réductions pour les équipes ?
                </h3>
                <p className="text-arcane-grey text-sm">
                  Oui! Contactez-nous pour obtenir une offre Enterprise personnalisée pour votre
                  club ou académie.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}
