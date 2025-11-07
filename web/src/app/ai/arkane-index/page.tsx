"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  Activity,
  BarChart3,
  Sparkles,
  ChevronRight,
  Trophy,
  Star,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { apiClient } from "@/lib/api-client";
import { logError } from "@/lib/logger";

interface IndexCategory {
  name: string;
  score: number;
  max: number;
  icon: any;
  color: string;
  description: string;
  weight?: number;
}

interface PlayerIndex {
  playerId: string;
  playerName: string;
  position: string;
  overallScore: number;
  categories: IndexCategory[];
  trend: "up" | "down" | "stable";
  lastUpdated: string;
  dataSource?: string;
}

export default function ArkaneIndexPage() {
  const router = useRouter();

  // Mock data - en production, cela viendrait de l'API
  const mockPlayerIndex: PlayerIndex = {
    playerId: "1",
    playerName: "Kylian Mbappé",
    position: "Attaquant",
    overallScore: 94.5,
    trend: "up",
    lastUpdated: new Date().toISOString(),
    categories: [
      {
        name: "Technique",
        score: 96,
        max: 100,
        icon: Zap,
        color: "#E4FF3B",
        description: "Contrôle de balle, dribble, finition",
      },
      {
        name: "Physique",
        score: 92,
        max: 100,
        icon: Activity,
        color: "#3B82F6",
        description: "Vitesse, endurance, force",
      },
      {
        name: "Mental",
        score: 88,
        max: 100,
        icon: Brain,
        color: "#8B5CF6",
        description: "Vision du jeu, intelligence tactique",
      },
      {
        name: "Tactique",
        score: 90,
        max: 100,
        icon: Target,
        color: "#10B981",
        description: "Positionnement, pressing, défense",
      },
      {
        name: "Performance",
        score: 95,
        max: 100,
        icon: TrendingUp,
        color: "#F59E0B",
        description: "Statistiques récentes, forme",
      },
      {
        name: "Potentiel",
        score: 98,
        max: 100,
        icon: Star,
        color: "#EF4444",
        description: "Marge de progression estimée",
      },
    ],
  };

  const [playerData, setPlayerData] = useState<PlayerIndex>(mockPlayerIndex);

  useEffect(() => {
    const loadIndex = async () => {
      try {
        const result = await apiClient.getAiPlayerIndex("demo-player");

        // Map API breakdown to UI categories with proper merging
        const updatedCategories = playerData.categories.map((category) => {
          const apiCategory = result.breakdown?.find(
            (item: any) => item.name.toLowerCase() === category.name.toLowerCase()
          );

          return apiCategory
            ? {
                ...category,
                score: Math.round(apiCategory.score),
                weight: apiCategory.weight
              }
            : category;
        });

        setPlayerData({
          ...playerData,
          playerId: result.playerId ?? playerData.playerId,
          overallScore: Math.round(result.overallScore ?? playerData.overallScore),
          categories: updatedCategories,
          lastUpdated: result.updatedAt ?? new Date().toISOString(),
          dataSource: result.source ?? "ai-fallback",
        });
      } catch (error) {
        // Keep mock data on error, but log it properly
        logError("Failed to load AI player index", error as Error, {
          playerId: "demo-player",
          fallbackToMock: true
        });
      }
    };

    loadIndex();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-500/20 to-green-500/5";
    if (score >= 75) return "from-blue-500/20 to-blue-500/5";
    if (score >= 60) return "from-yellow-500/20 to-yellow-500/5";
    return "from-orange-500/20 to-orange-500/5";
  };

  return (
    <MainLayout>
      <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-arcane-accent to-yellow-600 flex items-center justify-center">
              <Brain className="h-8 w-8 text-arcane-dark" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tight">
                ArkaneIndex
              </h1>
              <p className="text-arcane-grey text-lg">
                Système de notation IA ultra-précis
              </p>
            </div>
          </div>

          <GlassCard className="p-6 bg-gradient-to-r from-arcane-accent/10 to-transparent border-arcane-accent/30">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-arcane-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-bold mb-1">
                  L'algorithme le plus avancé du football
                </h3>
                <p className="text-arcane-grey text-sm">
                  ArkaneIndex analyse plus de 200 paramètres en temps réel pour évaluer
                  chaque joueur avec une précision scientifique. Notre IA prend en compte les
                  performances, le potentiel, les statistiques avancées et bien plus encore.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <GlassCard variant="elevated" className="p-8 text-center h-full">
              <div className="mb-6">
                <div className="inline-block p-4 rounded-full bg-arcane-accent/20 mb-4">
                  <Trophy className="h-12 w-12 text-arcane-accent" />
                </div>
                <h3 className="text-lg text-arcane-grey mb-2">Score Global</h3>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`text-6xl font-black ${getScoreColor(
                      playerData.overallScore
                    )}`}
                  >
                    {playerData.overallScore}
                  </span>
                  <span className="text-3xl text-arcane-grey">/100</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {playerData.trend === "up" && (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-bold">En hausse</span>
                    </>
                  )}
                  {playerData.trend === "down" && (
                    <>
                      <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
                      <span className="text-red-400 font-bold">En baisse</span>
                    </>
                  )}
                  {playerData.trend === "stable" && (
                    <>
                      <Activity className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400 font-bold">Stable</span>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-arcane-darkBorder pt-6">
                <div className="mb-4">
                  <h4 className="text-white font-bold text-xl mb-1">
                    {playerData.playerName}
                  </h4>
                  <p className="text-arcane-grey">{playerData.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-arcane-grey">
                    Dernière mise à jour :{" "}
                    {new Date(playerData.lastUpdated).toLocaleString("fr-FR")}
                  </p>
                  {playerData.dataSource && (
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        playerData.dataSource === "ai-service"
                          ? "bg-green-400 animate-pulse"
                          : "bg-yellow-400"
                      }`} />
                      <p className="text-xs text-arcane-grey">
                        Source : {playerData.dataSource === "ai-service" ? "IA en temps réel" : "Données de référence"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button className="w-full mt-6 bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80">
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir l'historique complet
              </Button>
            </GlassCard>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerData.categories.map((category, index) => {
                const Icon = category.icon;
                const percentage = (category.score / category.max) * 100;

                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <GlassCard
                      className={`p-6 bg-gradient-to-br ${getScoreGradient(
                        category.score
                      )}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${category.color}20`,
                            }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{ color: category.color }}
                            />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{category.name}</h3>
                            <p className="text-xs text-arcane-grey">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <span className={`text-2xl font-black ${getScoreColor(category.score)}`}>
                          {category.score}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-arcane-darkBorder/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">
            Comment ça fonctionne ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6">
              <div className="h-12 w-12 rounded-lg bg-arcane-accent/20 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-arcane-accent" />
              </div>
              <h3 className="text-white font-bold mb-2">Collecte de données</h3>
              <p className="text-arcane-grey text-sm">
                Agrégation automatique de statistiques depuis plus de 50 compétitions
                mondiales en temps réel.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="h-12 w-12 rounded-lg bg-arcane-accent/20 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-arcane-accent" />
              </div>
              <h3 className="text-white font-bold mb-2">Analyse IA</h3>
              <p className="text-arcane-grey text-sm">
                Notre algorithme propriétaire analyse 200+ paramètres avec machine learning
                pour une notation objective.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="h-12 w-12 rounded-lg bg-arcane-accent/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-arcane-accent" />
              </div>
              <h3 className="text-white font-bold mb-2">Prédiction</h3>
              <p className="text-arcane-grey text-sm">
                Estimation du potentiel futur basée sur l'évolution historique et les
                tendances du marché.
              </p>
            </GlassCard>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <GlassCard className="p-8 bg-gradient-to-r from-arcane-accent/10 via-transparent to-arcane-accent/5 border-arcane-accent/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-arcane-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">
                    Accédez à l'index complet
                  </h3>
                  <p className="text-arcane-grey">
                    Débloquez l'accès à l'ArkaneIndex pour tous les joueurs de votre base de
                    données avec un abonnement GOLD ou supérieur.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80 whitespace-nowrap"
              >
                Voir les offres
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </GlassCard>
        </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
