"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  Crown,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";

const aiFeatures = [
  {
    id: "arkane-index",
    name: "ArkaneIndex",
    tagline: "Le système de notation IA le plus précis",
    description:
      "Analyse 200+ paramètres en temps réel pour évaluer chaque joueur avec une précision scientifique. Technique, physique, mental, tactique - tout est mesuré.",
    icon: Brain,
    gradient: "from-yellow-500 to-orange-500",
    href: "/ai/arkane-index",
    features: [
      "Notation sur 100 avec 6 catégories",
      "Analyse de 200+ paramètres",
      "Mise à jour en temps réel",
      "Historique et tendances",
      "Comparaisons de joueurs",
    ],
    minTier: "GOLD",
    stats: {
      accuracy: "98.5%",
      players: "500K+",
      updates: "Temps réel",
    },
  },
  {
    id: "arkane-gpt",
    name: "ArkaneGPT",
    tagline: "Votre expert football personnel",
    description:
      "Posez n'importe quelle question sur le football. ArkaneGPT analyse des milliers de données pour vous fournir des réponses expertes sur les joueurs, tactiques et tendances.",
    icon: MessageSquare,
    gradient: "from-green-500 to-emerald-500",
    href: "/ai/arkane-gpt",
    features: [
      "Conversations intelligentes",
      "Analyses tactiques détaillées",
      "Comparaisons de joueurs",
      "Conseils de recrutement",
      "Tendances du marché",
    ],
    minTier: "BASIC",
    stats: {
      accuracy: "96.2%",
      questions: "1M+",
      languages: "5",
    },
  },
  {
    id: "arkane-scout",
    name: "ArkaneScoutAI",
    tagline: "Rapports de scouting automatisés",
    description:
      "Générez des rapports de scouting professionnels en quelques secondes. L'IA analyse les performances, identifie les points forts/faibles et fournit des recommandations.",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-500",
    href: "/reports",
    features: [
      "Génération automatique de rapports",
      "Analyse vidéo IA",
      "Recommandations personnalisées",
      "Export PDF professionnel",
      "Détection de talents",
    ],
    minTier: "PRO",
    stats: {
      reports: "250K+",
      time: "< 30s",
      accuracy: "94.8%",
    },
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Rapidité",
    description: "Analyses instantanées qui prendraient des heures manuellement",
  },
  {
    icon: Target,
    title: "Précision",
    description: "Algorithmes entraînés sur des millions de données historiques",
  },
  {
    icon: TrendingUp,
    title: "Évolution",
    description: "IA qui s'améliore continuellement avec chaque nouvelle donnée",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Partagez insights et rapports avec votre équipe",
  },
];

export default function AIHubPage() {
  const router = useRouter();
  const { hasMinimumTier, getTierName, subscription } = useSubscription();

  const canAccessFeature = (minTier: string) => {
    return hasMinimumTier(minTier as any);
  };

  return (
    <MainLayout>
      <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arcane-accent/20 border border-arcane-accent/30 mb-6">
            <Sparkles className="h-4 w-4 text-arcane-accent" />
            <span className="text-arcane-accent font-bold text-sm">
              Intelligence Artificielle
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight">
            Arkane <span className="text-arcane-accent">AI</span>
          </h1>

          <p className="text-xl text-arcane-grey max-w-3xl mx-auto mb-8">
            La suite d'intelligence artificielle la plus avancée du football.
            Analyses ultra-précises, prédictions fiables, insights instantanés.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => router.push("/ai/arkane-gpt")}
              className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
              size="lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Essayer ArkaneGPT
            </Button>
            <Button variant="outline" size="lg">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </div>
        </motion.div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {aiFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const hasAccess = canAccessFeature(feature.minTier);

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard
                  variant="elevated"
                  className={`h-full overflow-hidden ${
                    !hasAccess ? "opacity-75" : ""
                  }`}
                >
                  {/* Header with gradient */}
                  <div
                    className={`h-32 bg-gradient-to-br ${feature.gradient} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 p-6 flex items-center justify-between h-full">
                      <Icon className="h-16 w-16 text-white" />
                      {!hasAccess && (
                        <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center gap-2">
                          <Lock className="h-3 w-3 text-white" />
                          <span className="text-xs text-white font-bold">
                            {getTierName(feature.minTier as any)}+
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-black text-white mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-arcane-accent text-sm font-bold mb-3">
                      {feature.tagline}
                    </p>
                    <p className="text-arcane-grey text-sm mb-6">
                      {feature.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-arcane-darkBorder">
                      {Object.entries(feature.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-white font-black text-lg">{value}</p>
                          <p className="text-arcane-grey text-xs capitalize">{key}</p>
                        </div>
                      ))}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      {feature.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-arcane-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-arcane-grey">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {hasAccess ? (
                      <Button
                        onClick={() => router.push(feature.href)}
                        className="w-full bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                      >
                        Accéder
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.push("/pricing")}
                        variant="outline"
                        className="w-full border-arcane-accent/30 text-arcane-accent hover:bg-arcane-accent/10"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade vers {getTierName(feature.minTier as any)}
                      </Button>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tight">
            Pourquoi choisir Arkane AI ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <GlassCard className="p-6 text-center h-full">
                    <div className="h-12 w-12 rounded-full bg-arcane-accent/20 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-arcane-accent" />
                    </div>
                    <h3 className="text-white font-bold mb-2">{benefit.title}</h3>
                    <p className="text-arcane-grey text-sm">{benefit.description}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-12 text-center bg-gradient-to-r from-arcane-accent/10 via-transparent to-arcane-accent/5 border-arcane-accent/30">
            <Sparkles className="h-12 w-12 text-arcane-accent mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-4">
              Prêt à révolutionner votre scouting ?
            </h2>
            <p className="text-arcane-grey mb-8 max-w-2xl mx-auto">
              Rejoignez les milliers de recruteurs, coachs et clubs qui utilisent déjà
              Arkane AI pour découvrir les talents de demain.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => router.push("/ai/arkane-gpt")}
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                size="lg"
              >
                Commencer gratuitement
              </Button>
              <Button
                onClick={() => router.push("/pricing")}
                variant="outline"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Voir les tarifs
              </Button>
            </div>

            {subscription && (
              <p className="text-xs text-arcane-grey mt-6">
                Votre plan actuel : {getTierName(subscription.tier)}
              </p>
            )}
          </GlassCard>
        </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
