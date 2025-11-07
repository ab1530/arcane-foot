"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  FileText,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  Brain,
  Crown,
  ArrowRight,
  Activity,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useSubscription } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";
import { LineChart, BarChart, PieChart, AreaChart } from "@/components/charts";

interface DashboardStats {
  totalPlayers: number;
  totalReports: number;
  totalCamps: number;
  activeCamps: number;
  upcomingMatches: number;
  pendingReports: number;
}

interface RecentActivity {
  id: string;
  type: "player" | "report" | "camp" | "match";
  title: string;
  description: string;
  timestamp: string;
  icon: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const { subscription, getTierName, hasMinimumTier } = useSubscription();
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalReports: 0,
    totalCamps: 0,
    activeCamps: 0,
    upcomingMatches: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats from various endpoints
      const [playersRes, reportsRes, campsRes] = await Promise.all([
        apiClient.getPlayers().catch(() => []),
        apiClient.getReports().catch(() => []),
        apiClient.getCamps().catch(() => []),
      ]);

      const normalize = (payload: any) =>
        Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? [];

      const players = normalize(playersRes);
      const reports = normalize(reportsRes);
      const camps = normalize(campsRes);

      setStats({
        totalPlayers: players.length,
        totalReports: reports.length,
        totalCamps: camps.length,
        activeCamps: camps.filter((c: any) => c.status === "ACTIVE").length,
        upcomingMatches: 0, // Would come from matches API
        pendingReports: reports.filter((r: any) => r.status === "DRAFT").length,
      });

      // Generate recent activity from latest items
      const activities: RecentActivity[] = [];

      if (reports.length > 0) {
        activities.push({
          id: "1",
          type: "report",
          title: "Nouveau rapport créé",
          description: reports[0].title || "Rapport de scouting",
          timestamp: reports[0].createdAt,
          icon: FileText,
        });
      }

      if (camps.length > 0) {
        activities.push({
          id: "2",
          type: "camp",
          title: "Camp disponible",
          description: camps[0].name || "Camp de formation",
          timestamp: camps[0].createdAt,
          icon: Trophy,
        });
      }

      if (players.length > 0) {
        activities.push({
          id: "3",
          type: "player",
          title: "Nouveau joueur ajouté",
          description: `${players[0].firstName ?? players[0].user?.firstName ?? ""} ${players[0].lastName ?? players[0].user?.lastName ?? ""}`.trim() || "Nouveau joueur",
          timestamp: players[0].createdAt ?? new Date().toISOString(),
          icon: Users,
        });
      }

      setRecentActivity(activities);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      // Set mock data for demo
      setStats({
        totalPlayers: 42,
        totalReports: 18,
        totalCamps: 5,
        activeCamps: 3,
        upcomingMatches: 7,
        pendingReports: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    {
      label: "Joueurs",
      value: stats.totalPlayers,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      href: "/players",
      trend: "+12%",
    },
    {
      label: "Rapports",
      value: stats.totalReports,
      icon: FileText,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      href: "/reports",
      trend: "+8%",
    },
    {
      label: "Camps Actifs",
      value: stats.activeCamps,
      icon: Trophy,
      color: "text-arcane-accent",
      bgColor: "bg-arcane-accent/20",
      href: "/camps",
      trend: "+3",
    },
    {
      label: "Matches à venir",
      value: stats.upcomingMatches,
      icon: Calendar,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      href: "/calendar",
      trend: "Cette semaine",
    },
  ];

  const aiFeatures = [
    {
      name: "ArkaneIndex",
      description: "Système de notation IA",
      icon: Brain,
      gradient: "from-yellow-500 to-orange-500",
      href: "/ai/arkane-index",
      minTier: "GOLD",
    },
    {
      name: "ArkaneGPT",
      description: "Assistant IA Football",
      icon: Zap,
      gradient: "from-green-500 to-emerald-500",
      href: "/ai/arkane-gpt",
      minTier: "BASIC",
    },
    {
      name: "Scout AI",
      description: "Rapports automatisés",
      icon: Target,
      gradient: "from-blue-500 to-cyan-500",
      href: "/reports",
      minTier: "PRO",
    },
  ];

  const quickActions = [
    {
      label: "Nouveau Rapport",
      icon: Plus,
      href: "/reports/new",
      variant: "default" as const,
    },
    {
      label: "Ajouter Joueur",
      icon: Users,
      href: "/players/new",
      variant: "secondary" as const,
    },
    {
      label: "Voir Camps",
      icon: Trophy,
      href: "/camps",
      variant: "secondary" as const,
    },
    {
      label: "Marché",
      icon: TrendingUp,
      href: "/market",
      variant: "secondary" as const,
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                  Dashboard
                </h1>
                <p className="text-arcane-grey">
                  Bienvenue sur votre tableau de bord Arcane Football
                </p>
              </div>

              {subscription && (
                <Link href="/pricing">
                  <GlassCard className="px-4 py-2 hover:border-arcane-accent/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-arcane-accent" />
                      <span className="text-sm font-bold text-arcane-accent">
                        {getTierName(subscription.tier)}
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link href={stat.href}>
                    <GlassCard
                      variant="elevated"
                      className="p-6 hover:border-arcane-accent/30 transition-all cursor-pointer h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <span className="text-xs text-arcane-accent font-bold px-2 py-1 rounded-full bg-arcane-accent/10">
                          {stat.trend}
                        </span>
                      </div>
                      <div className="text-3xl font-black text-white mb-1">
                        {loading ? (
                          <div className="h-9 w-16 bg-arcane-darkBorder/50 rounded animate-pulse" />
                        ) : (
                          <AnimatedCounter to={stat.value} duration={1.5} />
                        )}
                      </div>
                      <div className="text-sm text-arcane-grey">{stat.label}</div>
                    </GlassCard>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* AI Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <GlassCard variant="elevated" className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Brain className="h-6 w-6 text-arcane-accent" />
                    Arkane AI
                  </h2>
                  <Link href="/ai">
                    <Button variant="outline" size="sm">
                      Voir tout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiFeatures.map((feature) => {
                    const Icon = feature.icon;
                    const hasAccess = hasMinimumTier(feature.minTier as any);

                    return (
                      <div
                        key={feature.name}
                        onClick={() =>
                          hasAccess
                            ? router.push(feature.href)
                            : toast.error(
                                `Nécessite un abonnement ${feature.minTier}+`
                              )
                        }
                        className="cursor-pointer"
                      >
                        <GlassCard
                          className={`p-4 h-full transition-all ${
                            hasAccess
                              ? "hover:border-arcane-accent/50"
                              : "opacity-75"
                          }`}
                        >
                          <div
                            className={`h-12 w-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-white font-bold mb-1">
                            {feature.name}
                          </h3>
                          <p className="text-xs text-arcane-grey mb-2">
                            {feature.description}
                          </p>
                          {!hasAccess && (
                            <span className="inline-flex items-center gap-1 text-xs text-arcane-accent">
                              <Crown className="h-3 w-3" />
                              {feature.minTier}+
                            </span>
                          )}
                        </GlassCard>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard variant="elevated" className="p-6 h-full">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-arcane-accent" />
                  Actions Rapides
                </h2>
                <div className="space-y-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} href={action.href}>
                        <Button
                          variant={action.variant}
                          className="w-full justify-start"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {action.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Trend - Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <LineChart
                title="Activité sur 7 jours"
                data={[
                  { name: "Lun", rapports: 4, joueurs: 2, camps: 1 },
                  { name: "Mar", rapports: 6, joueurs: 3, camps: 0 },
                  { name: "Mer", rapports: 5, joueurs: 4, camps: 2 },
                  { name: "Jeu", rapports: 8, joueurs: 1, camps: 1 },
                  { name: "Ven", rapports: 7, joueurs: 5, camps: 0 },
                  { name: "Sam", rapports: 3, joueurs: 2, camps: 3 },
                  { name: "Dim", rapports: 4, joueurs: 3, camps: 1 },
                ]}
                lines={[
                  { dataKey: "rapports", color: "#A78BFA", name: "Rapports" },
                  { dataKey: "joueurs", color: "#60A5FA", name: "Joueurs" },
                  { dataKey: "camps", color: "#E4FF3B", name: "Camps" },
                ]}
                height={300}
              />
            </motion.div>

            {/* Reports by Status - Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PieChart
                title="Rapports par Statut"
                data={[
                  { name: "Approuvés", value: stats.totalReports - stats.pendingReports },
                  { name: "En brouillon", value: stats.pendingReports },
                  { name: "En révision", value: Math.floor(stats.totalReports * 0.15) },
                ]}
                colors={["#10B981", "#F59E0B", "#3B82F6"]}
                height={300}
                innerRadius={60}
              />
            </motion.div>

            {/* Monthly Growth - Area Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <AreaChart
                title="Croissance Mensuelle"
                data={[
                  { name: "Jan", joueurs: 10, rapports: 15 },
                  { name: "Fév", joueurs: 15, rapports: 22 },
                  { name: "Mar", joueurs: 22, rapports: 28 },
                  { name: "Avr", joueurs: 28, rapports: 35 },
                  { name: "Mai", joueurs: 35, rapports: 42 },
                  { name: "Juin", joueurs: 42, rapports: 48 },
                ]}
                areas={[
                  { dataKey: "joueurs", color: "#60A5FA", name: "Joueurs" },
                  { dataKey: "rapports", color: "#A78BFA", name: "Rapports" },
                ]}
                height={300}
              />
            </motion.div>

            {/* Players by Position - Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <BarChart
                title="Joueurs par Position"
                data={[
                  { name: "Attaquants", count: Math.floor(stats.totalPlayers * 0.3) },
                  { name: "Milieux", count: Math.floor(stats.totalPlayers * 0.35) },
                  { name: "Défenseurs", count: Math.floor(stats.totalPlayers * 0.25) },
                  { name: "Gardiens", count: Math.floor(stats.totalPlayers * 0.1) },
                ]}
                bars={[
                  { dataKey: "count", color: "#E4FF3B", name: "Joueurs" },
                ]}
                height={300}
              />
            </motion.div>
          </div>

          {/* Recent Activity & Pending Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard variant="elevated" className="p-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-arcane-accent" />
                  Activité Récente
                </h2>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-arcane-darkBorder/50 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-arcane-darkBorder/30 hover:bg-arcane-darkBorder/50 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-lg bg-arcane-accent/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-arcane-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm">
                              {activity.title}
                            </p>
                            <p className="text-arcane-grey text-xs truncate">
                              {activity.description}
                            </p>
                            <p className="text-arcane-grey text-xs mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(activity.timestamp).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-arcane-grey">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Pending Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard variant="elevated" className="p-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-arcane-accent" />
                  Tâches en Attente
                </h2>

                <div className="space-y-3">
                  {stats.pendingReports > 0 && (
                    <Link href="/reports">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                          <div>
                            <p className="text-white font-bold text-sm">
                              Rapports en brouillon
                            </p>
                            <p className="text-arcane-grey text-xs">
                              {stats.pendingReports} rapport(s) à finaliser
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-yellow-400" />
                      </div>
                    </Link>
                  )}

                  {stats.upcomingMatches > 0 && (
                    <Link href="/calendar">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-white font-bold text-sm">
                              Matches à venir
                            </p>
                            <p className="text-arcane-grey text-xs">
                              {stats.upcomingMatches} match(es) planifiés
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-blue-400" />
                      </div>
                    </Link>
                  )}

                  {!subscription || subscription.tier === "FREE" && (
                    <Link href="/pricing">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-arcane-accent/10 border border-arcane-accent/30 hover:bg-arcane-accent/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Crown className="h-5 w-5 text-arcane-accent" />
                          <div>
                            <p className="text-white font-bold text-sm">
                              Débloquer les fonctionnalités IA
                            </p>
                            <p className="text-arcane-grey text-xs">
                              Passez à GOLD pour ArkaneIndex
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-arcane-accent" />
                      </div>
                    </Link>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
