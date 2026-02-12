"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { PlayerTabs } from "@/components/players/PlayerTabs";
import Link from "next/link";
import {
  Users,
  Trophy,
  MapPin,
  Calendar,
  Star,
  Activity,
  Ruler,
  Weight,
  Footprints,
  Edit,
  FileText,
  ArrowLeft,
  BarChart3,
  Target,
  Award,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Heart,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/favorites-context";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  height: number;
  weight: number;
  preferredFoot: string;
  currentClub?: {
    id: string;
    name: string;
  };
  scoutingReports: any[];
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params?.id as string;
  const { isFavorite, toggleFavorite } = useFavorites();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return;
    try {
      setLoading(true);
      const response = await apiClient.getPlayer(playerId);
      // API returns player directly, not wrapped in { player: ... }
      const playerData = response?.player ?? response;

      // Transform the player data to match expected structure
      if (playerData && playerData.users) {
        const transformedPlayer = {
          ...playerData,
          firstName: playerData.users.firstName,
          lastName: playerData.users.lastName,
          currentClub: playerData.clubs ? {
            id: playerData.clubs.id,
            name: playerData.clubs.name,
          } : undefined,
          scoutingReports: playerData.scouting_reports || [],
        };
        setPlayer(transformedPlayer);
      } else {
        setPlayer(null);
      }
    } catch (error) {
      console.error("Error fetching player:", error);
      toast.error("Erreur lors du chargement du joueur");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAverageRating = (reports: any[], field: string = "overallRating") => {
    if (!reports || reports.length === 0) return 0;
    const sum = reports.reduce((acc, report) => acc + (report[field] || 0), 0);
    return Math.round(sum / reports.length);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "SUBMITTED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DRAFT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-arcane-grey/20 text-arcane-grey border-arcane-grey/30";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "BUY_NOW":
        return ThumbsUp;
      case "NOT_INTERESTED":
        return ThumbsDown;
      case "MONITOR":
        return Activity;
      case "FOLLOW_UP":
        return Clock;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10">
              <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
                <div className="px-6 py-4">
                  <Breadcrumb />
                </div>
              </div>
              <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
                  <p className="text-arcane-grey">Loading player...</p>
                </div>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  if (!player) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10">
              <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
                <div className="px-6 py-4">
                  <Breadcrumb />
                </div>
              </div>
              <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
                <Card3D>
                  <GlassCard variant="elevated" className="p-12 text-center">
                    <Users className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Player not found</h3>
                    <p className="text-arcane-grey mb-6">The requested player could not be found</p>
                    <Button onClick={() => router.push("/players")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Players
                    </Button>
                  </GlassCard>
                </Card3D>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  const age = getAge(player.dateOfBirth);
  const reports = player.scoutingReports || [];
  const avgOverallRating = getAverageRating(reports, "overallRating");
  const avgTechnicalRating = getAverageRating(reports, "technicalRating");
  const avgPhysicalRating = getAverageRating(reports, "physicalRating");
  const avgMentalRating = getAverageRating(reports, "mentalRating");
  const avgTacticalRating = getAverageRating(reports, "tacticalRating");

  return (
    <ProtectedPage>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          <div className="relative z-10">
          <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => router.push("/players")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-black text-white">
                      {player.firstName} {player.lastName}
                    </h1>
                    <p className="text-sm text-arcane-grey">
                      {player.position} • {player.nationality}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(player.id)}
                    className={isFavorite(player.id) ? "border-red-500/50 text-red-500 hover:bg-red-500/10" : ""}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${isFavorite(player.id) ? "fill-red-500" : ""}`}
                    />
                    {isFavorite(player.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Link href={`/reports/new?playerId=${player.id}`}>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      New Report
                    </Button>
                  </Link>
                </div>
              </div>
              <Breadcrumb items={[
                { label: "Players", href: "/players" },
                { label: `${player.firstName} ${player.lastName}` }
              ]} />
              <div className="mt-3">
                <PlayerTabs playerId={player.id} active="overview" />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="aspect-square bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder rounded-xl mb-6 relative overflow-hidden">
                    <motion.div className="absolute inset-0 bg-gradient-to-br from-arcane-accent/10 via-transparent to-arcane-accent/5" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full bg-arcane-accent/10 flex items-center justify-center backdrop-blur-sm border border-arcane-accent/20">
                        <Users className="w-20 h-20 text-arcane-accent/50" />
                      </div>
                    </div>
                    {avgOverallRating > 0 && (
                      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-arcane-accent backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-[0_0_20px_rgba(228,255,59,0.5)]">
                        <span className="text-arcane-dark font-black text-xl">{avgOverallRating}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase mb-2">{player.firstName} {player.lastName}</h2>
                      <p className="text-arcane-accent uppercase text-sm tracking-widest font-bold">{player.position}</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-arcane-darkBorder/50">
                      {player.currentClub && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-arcane-accent" />
                            <span className="text-arcane-grey text-sm">Club</span>
                          </div>
                          <span className="text-white font-bold text-sm">{player.currentClub.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Nationality</span>
                        </div>
                        <span className="text-white font-bold text-sm">{player.nationality}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Age</span>
                        </div>
                        <span className="text-white font-bold text-sm">{age} years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Height</span>
                        </div>
                        <span className="text-white font-bold text-sm">{player.height} cm</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Weight</span>
                        </div>
                        <span className="text-white font-bold text-sm">{player.weight} kg</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Footprints className="h-4 w-4 text-arcane-accent" />
                          <span className="text-arcane-grey text-sm">Preferred Foot</span>
                        </div>
                        <span className="text-white font-bold text-sm">{player.preferredFoot}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Card3D>

              <div className="lg:col-span-2 space-y-6">
                <Card3D>
                  <GlassCard variant="elevated" className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6 uppercase flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-arcane-accent" />
                      Average Ratings
                      <span className="text-sm text-arcane-grey font-normal ml-2">({reports.length} {reports.length === 1 ? "report" : "reports"})</span>
                    </h3>

                    {reports.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-arcane-grey mx-auto mb-3" />
                        <p className="text-arcane-grey">No scouting reports available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: "Overall", value: avgOverallRating, icon: Star, color: "text-arcane-accent" },
                          { label: "Technical", value: avgTechnicalRating, icon: Target, color: "text-blue-400" },
                          { label: "Physical", value: avgPhysicalRating, icon: Zap, color: "text-purple-400" },
                          { label: "Mental", value: avgMentalRating, icon: Award, color: "text-yellow-400" },
                          { label: "Tactical", value: avgTacticalRating, icon: Activity, color: "text-green-400" },
                          { label: "Reports", value: reports.length, icon: FileText, color: "text-arcane-accent" },
                        ].map((stat, index) => (
                          <div key={index} className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50">
                            <div className="flex items-center gap-2 mb-2">
                              <stat.icon className={`h-5 w-5 ${stat.color}`} />
                              <span className="text-arcane-grey text-sm">{stat.label}</span>
                            </div>
                            <div className="text-3xl font-black">
                              <NeonText>
                                <AnimatedCounter to={stat.value} duration={1.5} />
                              </NeonText>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </Card3D>

                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Approved Reports", value: reports.filter((r) => r.status === "APPROVED").length, icon: ThumbsUp, color: "text-green-400" },
                    { label: "Pending Review", value: reports.filter((r) => r.status === "SUBMITTED").length, icon: Clock, color: "text-blue-400" },
                  ].map((stat, index) => (
                    <motion.div key={index} variants={staggerItem}>
                      <Card3D>
                        <GlassCard variant="elevated" glowOnHover className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                          <div className="text-2xl font-black mb-1">
                            <NeonText>{stat.value}</NeonText>
                          </div>
                          <div className="text-xs text-arcane-grey">{stat.label}</div>
                        </GlassCard>
                      </Card3D>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <Card3D>
              <GlassCard variant="elevated" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white uppercase flex items-center gap-2">
                    <FileText className="h-6 w-6 text-arcane-accent" />
                    Scouting Reports
                  </h3>
                  <Link href={`/reports/new?playerId=${player.id}`}>
                    <Button size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Create Report
                    </Button>
                  </Link>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">No reports yet</h4>
                    <p className="text-arcane-grey mb-6">Be the first to create a scouting report for this player</p>
                    <Link href={`/reports/new?playerId=${player.id}`}>
                      <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Create First Report
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => {
                      const RecommendationIcon = getRecommendationIcon(report.recommendation);
                      return (
                        <Link key={report.id} href={`/reports/${report.id}`}>
                          <div className="p-4 rounded-lg bg-arcane-darkBorder/20 border border-arcane-darkBorder/50 hover:bg-arcane-darkBorder/30 hover:border-arcane-accent/30 transition-all cursor-pointer group">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(report.status)}`}>
                                    {report.status}
                                  </span>
                                  <div className="flex items-center gap-2 text-sm text-arcane-grey">
                                    <RecommendationIcon className="h-4 w-4" />
                                    <span>{report.recommendation?.replace("_", " ")}</span>
                                  </div>
                                </div>
                                <p className="text-white font-bold mb-2 group-hover:text-arcane-accent transition-colors">
                                  {report.summary || "No summary available"}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-arcane-grey">
                                  <span>Scout: {report.scout?.firstName} {report.scout?.lastName}</span>
                                  <span>•</span>
                                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                  {report.match && (
                                    <>
                                      <span>•</span>
                                      <span>{report.match.homeTeam?.name} vs {report.match.awayTeam?.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="w-12 h-12 rounded-lg bg-arcane-accent/10 flex items-center justify-center border border-arcane-accent/30 mb-2">
                                  <span className="text-arcane-accent font-black text-lg">{report.overallRating}</span>
                                </div>
                                <span className="text-xs text-arcane-grey">Overall</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </Card3D>
          </div>
        </div>
      </main>
      </MainLayout>
    </ProtectedPage>
  );
}
