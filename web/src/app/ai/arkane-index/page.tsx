"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { RequireTier } from "@/components/auth/RequireTier";
import { apiClient } from "@/lib/api-client";
import { logError } from "@/lib/logger";
import { useLanguage } from "@/contexts/language-context";

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

const AI_CATEGORY_ICON_MAP = {
  Technique: Zap,
  Physique: Activity,
  Mental: Brain,
  Tactique: Target,
  Performance: TrendingUp,
  Potentiel: Star,
} as const;

const HOW_IT_WORKS_ICONS = [Activity, Brain, TrendingUp] as const;

export default function ArkaneIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dictionary, language } = useLanguage();
  const indexCopy = dictionary.aiTools.index;
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const categoryTestIds: Record<string, string> = {
    [indexCopy.categories.physical]: "arkane-index-score-physical",
    [indexCopy.categories.technique]: "arkane-index-score-technical",
    [indexCopy.categories.mental]: "arkane-index-score-mental",
    [indexCopy.categories.tactical]: "arkane-index-score-tactical",
  };

  const mockPlayerIndex: PlayerIndex = {
    playerId: "1",
    playerName: indexCopy.hero.defaultPlayerName,
    position: indexCopy.hero.defaultPosition,
    overallScore: 94.5,
    trend: "up",
    lastUpdated: new Date().toISOString(),
    categories: [
      {
        name: indexCopy.categories.technique,
        score: 96,
        max: 100,
        icon: AI_CATEGORY_ICON_MAP.Technique,
        color: "#E4FF3B",
        description: indexCopy.categories.descriptions.technique,
      },
      {
        name: indexCopy.categories.physical,
        score: 92,
        max: 100,
        icon: AI_CATEGORY_ICON_MAP.Physique,
        color: "#3B82F6",
        description: indexCopy.categories.descriptions.physical,
      },
      {
        name: indexCopy.categories.mental,
        score: 88,
        max: 100,
        icon: AI_CATEGORY_ICON_MAP.Mental,
        color: "#8B5CF6",
        description: indexCopy.categories.descriptions.mental,
      },
      {
        name: indexCopy.categories.tactical,
        score: 90,
        max: 100,
        icon: AI_CATEGORY_ICON_MAP.Tactique,
        color: "#10B981",
        description: indexCopy.categories.descriptions.tactical,
      },
      {
        name: indexCopy.categories.performance,
        score: 95,
        max: 100,
        icon: AI_CATEGORY_ICON_MAP.Performance,
        color: "#F59E0B",
        description: indexCopy.categories.descriptions.performance,
      },
      {
        name: indexCopy.categories.potential,
        score: 98,
        max: 100,
        icon: AI_CATEGORY_ICON_MAP.Potentiel,
        color: "#EF4444",
        description: indexCopy.categories.descriptions.potential,
      },
    ],
  };

  const [playerData, setPlayerData] = useState<PlayerIndex>(mockPlayerIndex);

  useEffect(() => {
    const param = searchParams.get("playerId");
    if (param) {
      setActivePlayerId(param);
      setPlayerLoading(false);
      return;
    }

    let cancelled = false;
    const resolvePlayer = async () => {
      try {
        const players = await apiClient.getPlayers({ limit: 1 }).catch(() => null);
        if (cancelled) return;

        const first = players?.data?.[0];
        const resolvedId =
          first?.id ||
          first?.playerId ||
          first?.player?.id ||
          first?.userId ||
          "demo-player";

        setActivePlayerId(resolvedId);
      } catch {
        if (!cancelled) {
          setActivePlayerId("demo-player");
        }
      } finally {
        if (!cancelled) {
          setPlayerLoading(false);
        }
      }
    };

    resolvePlayer();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!activePlayerId) return;
    let cancelled = false;

    const loadIndex = async () => {
      try {
        setPlayerLoading(true);
        const result: any = await apiClient.getAiPlayerIndex(activePlayerId);

        if (cancelled) return;

        setPlayerData((prev) => {
          const updatedCategories = prev.categories.map((category) => {
            const apiCategory = result.breakdown?.find(
              (item: any) => item.name?.toLowerCase() === category.name.toLowerCase()
            );

            return apiCategory
              ? {
                  ...category,
                  score: Math.round(apiCategory.score),
                  weight: apiCategory.weight,
                }
              : category;
          });

          return {
            ...prev,
            playerId: result.playerId ?? prev.playerId,
            playerName: result.playerName ?? prev.playerName,
            position: result.position ?? prev.position,
            overallScore: Math.round(result.overallScore ?? prev.overallScore),
            categories: updatedCategories,
            lastUpdated: result.updatedAt ?? new Date().toISOString(),
            dataSource: result.source ?? "ai-service",
          };
        });
      } catch (error) {
        logError("Failed to load AI player index", error as Error, {
          playerId: activePlayerId,
          fallbackToMock: true,
        });
      } finally {
        if (!cancelled) {
          setPlayerLoading(false);
        }
      }
    };

    loadIndex();
    return () => {
      cancelled = true;
    };
  }, [activePlayerId]);

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
      <ProtectedPage>
        <RequireTier minTier="BASIC">
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
              <h1
                className="text-5xl font-black text-white uppercase tracking-tight"
                data-test="arkane-index-hero-title"
              >
                {indexCopy.hero.title}
              </h1>
              <p className="text-arcane-grey text-lg" data-test="arkane-index-hero-subtitle">
                {indexCopy.hero.subtitle}
              </p>
            </div>
          </div>

          <GlassCard className="p-6 bg-gradient-to-r from-arcane-accent/10 to-transparent border-arcane-accent/30">
              <div className="flex items-start gap-3" data-test="arkane-index-hero-badge">
                <Sparkles className="h-5 w-5 text-arcane-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold mb-1" data-test="arkane-index-hero-badge-title">
                    {indexCopy.hero.badgeTitle}
                  </h3>
                  <p className="text-arcane-grey text-sm" data-test="arkane-index-hero-badge-description">
                    {indexCopy.hero.badgeDescription}
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
                <h3
                  className="text-lg text-arcane-grey mb-2"
                  data-test="arkane-index-score-title"
                >
                  {indexCopy.scoreCard.globalScore}
                </h3>
                <div className="flex items-center justify-center gap-2">
                  {playerLoading ? (
                    <Loader2 className="h-10 w-10 text-arcane-accent animate-spin" />
                  ) : (
                    <>
                      <span
                        className={`text-6xl font-black ${getScoreColor(
                          playerData.overallScore
                        )}`}
                      >
                        {playerData.overallScore}
                      </span>
                      <span className="text-3xl text-arcane-grey">/100</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {playerData.trend === "up" && (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-green-400 font-bold">{indexCopy.scoreCard.trend.up}</span>
                    </>
                  )}
                  {playerData.trend === "down" && (
                    <>
                      <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
                      <span className="text-red-400 font-bold">{indexCopy.scoreCard.trend.down}</span>
                    </>
                  )}
                  {playerData.trend === "stable" && (
                    <>
                      <Activity className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400 font-bold">{indexCopy.scoreCard.trend.stable}</span>
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
                    {indexCopy.scoreCard.lastUpdated}{" "}
                    {new Date(playerData.lastUpdated).toLocaleString(locale)}
                  </p>
                  {playerData.dataSource && (
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        playerData.dataSource === "ai-service"
                          ? "bg-green-400 animate-pulse"
                          : "bg-yellow-400"
                      }`} />
                      <p className="text-xs text-arcane-grey">
                        {playerData.dataSource === "ai-service"
                          ? indexCopy.scoreCard.source.realtime
                          : indexCopy.scoreCard.source.fallback}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                data-test="arkane-index-cta-secondary"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {indexCopy.scoreCard.historyCta}
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
                            <h3
                              className="text-white font-bold"
                              data-test={categoryTestIds[category.name]}
                            >
                              {category.name}
                            </h3>
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
          <h2
            className="text-3xl font-black text-white mb-6 uppercase tracking-tight"
            data-test="arkane-index-features-title"
          >
            {indexCopy.howItWorks.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {indexCopy.howItWorks.steps.map((step, idx) => {
              const Icon = HOW_IT_WORKS_ICONS[idx] ?? Sparkles;
              return (
                <GlassCard key={idx} className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-arcane-accent/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-white font-bold mb-2">{step.title}</h3>
                  <p className="text-arcane-grey text-sm">{step.description}</p>
                </GlassCard>
              );
            })}
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
                  <h3 className="text-white font-bold text-xl mb-2" data-test="arkane-index-cta-title">
                    {indexCopy.cta.title}
                  </h3>
                  <p className="text-arcane-grey" data-test="arkane-index-cta-description">
                    {indexCopy.cta.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80 whitespace-nowrap"
                data-test="arkane-index-cta-primary"
              >
                {indexCopy.cta.button}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </GlassCard>
        </motion.div>
        </div>
      </div>
        </RequireTier>
      </ProtectedPage>
    </MainLayout>
  );
}
