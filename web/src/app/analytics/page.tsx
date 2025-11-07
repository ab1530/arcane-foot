"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ProtectedRoute } from "@/components/auth/protected-route";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Activity,
  Eye,
  Star,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Trophy,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { logError } from "@/lib/logger";

interface AnalyticsStats {
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
  totalPlayers: number;
  averageRating: number;
  topScout: {
    name: string;
    reportsCount: number;
  } | null;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    totalPlayers: 0,
    averageRating: 0,
    topScout: null,
  });
  const [timeRange, setTimeRange] = useState("30d");
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch analytics data from dedicated endpoint
      const [analyticsData, reportsData] = await Promise.all([
        apiClient.getAnalyticsScoutingReports(),
        apiClient.getScoutingReports({}),
      ]);

      const allReports = reportsData.data || [];

      // Extract data from analytics API
      const approvedCount = analyticsData.byStatus.find(s => s.status === "APPROVED")?.count || 0;
      const pendingCount = analyticsData.byStatus.find(s => s.status === "SUBMITTED")?.count || 0;
      const totalReports = analyticsData.byStatus.reduce((sum, s) => sum + s.count, 0);

      // Get average rating from analytics
      const avgRating = Math.round(analyticsData.ratingStats.average || 0);

      // Get top scout from analytics
      const topScout = analyticsData.mostActiveScouts[0];

      // Get overview data for player count
      const overviewData = await apiClient.getAnalyticsOverview();

      setStats({
        totalReports,
        approvedReports: approvedCount,
        pendingReports: pendingCount,
        totalPlayers: overviewData.overview.totalPlayers,
        averageRating: avgRating,
        topScout: topScout ? {
          name: `${topScout.firstName} ${topScout.lastName}`,
          reportsCount: topScout._count.scoutingReports,
        } : null,
      });

      setReports(allReports);
    } catch (error) {
      logError("Error fetching analytics", error as Error, {
        timeRange,
      });
      toast.error("Erreur lors du chargement des analytics");
    } finally {
      setLoading(false);
    }
  };

  const getTopPlayers = () => {
    return reports
      .filter((r) => r.overallRating && r.status === "APPROVED")
      .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
      .slice(0, 5);
  };

  const getRecentReports = () => {
    return reports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getRatingDistribution = () => {
    const ranges = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "60-69": 0,
      "0-59": 0,
    };

    reports.forEach((report) => {
      const rating = report.overallRating;
      if (!rating) return;

      if (rating >= 90) ranges["90-100"]++;
      else if (rating >= 80) ranges["80-89"]++;
      else if (rating >= 70) ranges["70-79"]++;
      else if (rating >= 60) ranges["60-69"]++;
      else ranges["0-59"]++;
    });

    return ranges;
  };

  const ratingDistribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(ratingDistribution));

  return (
    <ProtectedRoute>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          {/* Main Content */}
          <div className="relative z-10 container mx-auto px-4 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-black text-white uppercase tracking-tight mb-2">
                    Analytics
                  </h1>
                  <p className="text-arcane-grey text-lg">
                    Statistiques détaillées et indicateurs de performance
                  </p>
                </div>

                <div className="flex gap-3">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white text-sm focus:border-arcane-accent focus:outline-none"
                  >
                    <option value="7d">7 derniers jours</option>
                    <option value="30d">30 derniers jours</option>
                    <option value="90d">90 derniers jours</option>
                    <option value="all">Toutes les données</option>
                  </select>
                </div>
              </div>
            </motion.div>

            <div>
            {loading ? (
              <GlassCard variant="elevated" className="p-12 text-center">
                <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Chargement des analytics...
                </h3>
              </GlassCard>
            ) : (
              <>
                {/* Stats Overview */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                >
                  {/* Total Reports */}
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-400" />
                        </div>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {stats.totalReports}
                      </div>
                      <div className="text-sm text-arcane-grey uppercase tracking-wider">
                        Rapports Totaux
                      </div>
                    </GlassCard>
                  </Card3D>

                  {/* Approved Reports */}
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="text-sm font-bold text-green-400">
                          {stats.totalReports > 0
                            ? Math.round((stats.approvedReports / stats.totalReports) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {stats.approvedReports}
                      </div>
                      <div className="text-sm text-arcane-grey uppercase tracking-wider">
                        Rapports Approuvés
                      </div>
                    </GlassCard>
                  </Card3D>

                  {/* Pending Reports */}
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-yellow-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {stats.pendingReports}
                      </div>
                      <div className="text-sm text-arcane-grey uppercase tracking-wider">
                        En Revue
                      </div>
                    </GlassCard>
                  </Card3D>

                  {/* Total Players */}
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Users className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <div className="text-4xl font-black text-white mb-2">
                        {stats.totalPlayers}
                      </div>
                      <div className="text-sm text-arcane-grey uppercase tracking-wider">
                        Joueurs Scoutés
                      </div>
                    </GlassCard>
                  </Card3D>

                  {/* Average Rating */}
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-arcane-accent/20 flex items-center justify-center">
                          <Star className="h-6 w-6 text-arcane-accent" />
                        </div>
                      </div>
                      <div className="text-4xl font-black text-arcane-accent mb-2">
                        {stats.averageRating}
                      </div>
                      <div className="text-sm text-arcane-grey uppercase tracking-wider">
                        Note Moyenne
                      </div>
                    </GlassCard>
                  </Card3D>

                  {/* Top Scout */}
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <Award className="h-6 w-6 text-orange-400" />
                        </div>
                      </div>
                      {stats.topScout ? (
                        <>
                          <div className="text-2xl font-black text-white mb-2 truncate">
                            {stats.topScout.name}
                          </div>
                          <div className="text-sm text-arcane-grey uppercase tracking-wider">
                            Top Scout • {stats.topScout.reportsCount} rapports
                          </div>
                        </>
                      ) : (
                        <div className="text-lg text-arcane-grey">Aucune donnée</div>
                      )}
                    </GlassCard>
                  </Card3D>
                </motion.div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Rating Distribution */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card3D>
                      <GlassCard variant="elevated" className="p-6">
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-arcane-accent" />
                          Distribution des Notes
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(ratingDistribution).map(([range, count]) => (
                            <div key={range}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-white">{range}</span>
                                <span className="text-sm text-arcane-grey">{count} rapports</span>
                              </div>
                              <div className="h-3 bg-arcane-darkBorder rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                                  transition={{ duration: 0.5, delay: 0.2 }}
                                  className="h-full bg-gradient-to-r from-arcane-accent to-blue-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </Card3D>
                  </motion.div>

                  {/* Top Players */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card3D>
                      <GlassCard variant="elevated" className="p-6">
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-arcane-accent" />
                          Top 5 Joueurs
                        </h3>
                        <div className="space-y-4">
                          {getTopPlayers().map((report, index) => (
                            <div
                              key={report.id}
                              className="flex items-center gap-4 p-3 rounded-lg bg-arcane-darkBorder/30 hover:bg-arcane-darkBorder/50 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-arcane-accent flex items-center justify-center flex-shrink-0">
                                <span className="text-arcane-dark font-bold text-sm">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold truncate">
                                  {report.player.user.firstName} {report.player.user.lastName}
                                </p>
                                <p className="text-xs text-arcane-grey">
                                  {report.player.position || "Position non définie"}
                                </p>
                              </div>
                              <div className="text-2xl font-black text-arcane-accent">
                                {report.overallRating}
                              </div>
                            </div>
                          ))}
                          {getTopPlayers().length === 0 && (
                            <p className="text-arcane-grey text-center py-8">
                              Aucun rapport approuvé disponible
                            </p>
                          )}
                        </div>
                      </GlassCard>
                    </Card3D>
                  </motion.div>
                </div>

                {/* Recent Reports */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card3D>
                    <GlassCard variant="elevated" className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Activity className="h-5 w-5 text-arcane-accent" />
                          Rapports Récents
                        </h3>
                        <Link href="/reports">
                          <Button variant="secondary" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir Tous
                          </Button>
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {getRecentReports().map((report) => (
                          <Link key={report.id} href={`/reports/${report.id}`}>
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-arcane-darkBorder/30 hover:bg-arcane-darkBorder/50 transition-all cursor-pointer group">
                              <div className="w-12 h-12 rounded-full bg-arcane-accent flex items-center justify-center flex-shrink-0">
                                <span className="text-arcane-dark font-bold">
                                  {report.player.user.firstName[0]}
                                  {report.player.user.lastName[0]}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold group-hover:text-arcane-accent transition-colors">
                                  {report.player.user.firstName} {report.player.user.lastName}
                                </p>
                                <p className="text-sm text-arcane-grey">
                                  {report.scout.firstName} {report.scout.lastName} •{" "}
                                  {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              {report.overallRating && (
                                <div className="text-2xl font-black text-arcane-accent">
                                  {report.overallRating}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                        {getRecentReports().length === 0 && (
                          <p className="text-arcane-grey text-center py-8">
                            Aucun rapport disponible
                          </p>
                        )}
                      </div>
                    </GlassCard>
                  </Card3D>
                </motion.div>
              </>
            )}
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedRoute>
  );
}
