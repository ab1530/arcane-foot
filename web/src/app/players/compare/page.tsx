"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { GradientText } from "@/components/ui/gradient-text";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  Users,
  Trophy,
  ArrowLeft,
  X,
  Plus,
  TrendingUp,
  Target,
  Activity,
  Zap,
  AlertCircle,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useComparison } from "@/contexts/comparison-context";

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
  scoutingReports: Array<{
    overallRating: number;
    technicalSkills: number;
    physicalAttributes: number;
    mentalAttributes: number;
    tacticalAwareness: number;
  }>;
}

interface PlayerStats {
  goals: number;
  assists: number;
  rating: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
}

export default function PlayerComparePage() {
  const router = useRouter();
  const { comparisonPlayerIds, removeFromComparison, clearComparison } = useComparison();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const playerPromises = comparisonPlayerIds.map((id) =>
        apiClient.getPlayer(id)
      );
      const fetchedPlayers = await Promise.all(playerPromises);
      const players = fetchedPlayers.map((res: any) => res?.player || res);
      setPlayers(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Error loading players for comparison");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (comparisonPlayerIds.length === 0) {
      router.push("/players");
      return;
    }
    fetchPlayers();
  }, [comparisonPlayerIds]);

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

  const getAverageRating = (player: Player) => {
    const reports = player.scoutingReports || [];
    if (reports.length === 0) return 0;
    const sum = reports.reduce((acc, report) => acc + (report.overallRating || 0), 0);
    return Math.round(sum / reports.length);
  };

  const getAverageSkill = (player: Player, skill: keyof Player["scoutingReports"][0]) => {
    const reports = player.scoutingReports || [];
    if (reports.length === 0) return 0;
    const sum = reports.reduce((acc, report) => acc + (report[skill] || 0), 0);
    return Math.round(sum / reports.length);
  };

  const getStatComparison = (statKey: string) => {
    const values = players.map((player) => {
      switch (statKey) {
        case "age":
          return getAge(player.dateOfBirth);
        case "height":
          return player.height;
        case "weight":
          return player.weight;
        case "rating":
          return getAverageRating(player);
        case "reports":
          return player.scoutingReports?.length || 0;
        case "technical":
          return getAverageSkill(player, "technicalSkills");
        case "physical":
          return getAverageSkill(player, "physicalAttributes");
        case "mental":
          return getAverageSkill(player, "mentalAttributes");
        case "tactical":
          return getAverageSkill(player, "tacticalAwareness");
        default:
          return 0;
      }
    });
    const maxValue = Math.max(...values);
    return { values, maxValue };
  };

  const formatValue = (value: number, type: string) => {
    if (type === "height") return `${value} cm`;
    if (type === "weight") return `${value} kg`;
    if (type === "rating" || type === "technical" || type === "physical" || type === "mental" || type === "tactical") {
      return value.toFixed(0);
    }
    return value.toString();
  };

  const StatRow = ({
    label,
    statKey,
    icon: Icon,
  }: {
    label: string;
    statKey: string;
    icon: any;
  }) => {
    const { values, maxValue } = getStatComparison(statKey);

    return (
      <div className="grid grid-cols-[150px_1fr] gap-4 py-4 border-b border-arcane-darkBorder/30 last:border-0">
        <div className="flex items-center gap-2 text-arcane-grey">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
          {values.map((value, index) => {
            const isMax = maxValue > 0 && value === maxValue;
            return (
              <div
                key={index}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isMax
                    ? "bg-arcane-accent/20 border border-arcane-accent/50"
                    : "bg-arcane-darkBorder/20"
                }`}
              >
                <AnimatedCounter
                  to={value}
                  className={`text-lg font-bold ${
                    isMax ? "text-arcane-accent" : "text-white"
                  }`}
                />
                <span className={`text-xs ${isMax ? "text-arcane-accent" : "text-arcane-grey"}`}>
                  {statKey === "height" ? "cm" : statKey === "weight" ? "kg" : ""}
                </span>
                {isMax && <Trophy className="h-4 w-4 text-arcane-accent" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleRemovePlayer = (playerId: string) => {
    removeFromComparison(playerId);
    if (comparisonPlayerIds.length === 1) {
      router.push("/players");
    }
  };

  const handleClearAll = () => {
    clearComparison();
    router.push("/players");
  };

  if (loading) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10 flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
                <p className="text-arcane-grey">Loading comparison...</p>
              </div>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  if (players.length === 0) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10 flex items-center justify-center h-screen">
              <Card3D>
                <GlassCard variant="elevated" className="p-12 text-center max-w-md">
                  <AlertCircle className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">No Players to Compare</h2>
                  <p className="text-arcane-grey mb-6">
                    Add players from the players list to start comparing
                  </p>
                  <Button onClick={() => router.push("/players")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Players
                  </Button>
                </GlassCard>
              </Card3D>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          <div className="relative z-10">
            {/* Top Bar */}
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/players")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <GradientText className="text-2xl font-black">
                        Player Comparison
                      </GradientText>
                      <p className="text-sm text-arcane-grey">
                        Compare up to 3 players side-by-side
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
                <Breadcrumb
                  items={[
                    { label: "Players", href: "/players" },
                    { label: "Compare" },
                  ]}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Player Cards */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(players.length + (comparisonPlayerIds.length < 3 ? 1 : 0), 3)}, 1fr)`,
                }}
              >
                {players.map((player, index) => (
                  <motion.div key={player.id} variants={staggerItem}>
                    <Card3D>
                      <GlassCard variant="elevated" className="relative">
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="absolute top-4 right-4 z-10 p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full transition-all"
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </button>

                        {/* Player Avatar */}
                        <div className="mb-6">
                          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-arcane-accent/20 to-arcane-accent/5 flex items-center justify-center border-2 border-arcane-accent/30">
                            <span className="text-3xl font-black text-arcane-accent">
                              {player.firstName?.[0]}
                              {player.lastName?.[0]}
                            </span>
                          </div>
                        </div>

                        {/* Player Info */}
                        <div className="text-center space-y-2">
                          <h3 className="text-xl font-black text-white">
                            {player.firstName} {player.lastName}
                          </h3>
                          <p className="text-arcane-accent text-sm font-bold uppercase tracking-wider">
                            {player.position}
                          </p>
                          {player.currentClub && (
                            <div className="inline-block px-3 py-1 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-full">
                              <p className="text-xs text-arcane-grey">
                                {player.currentClub.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    </Card3D>
                  </motion.div>
                ))}

                {/* Add Player Card */}
                {comparisonPlayerIds.length < 3 && (
                  <motion.div variants={staggerItem}>
                    <button
                      onClick={() => router.push("/players")}
                      className="w-full h-full min-h-[280px] border-2 border-dashed border-arcane-accent/30 bg-arcane-accent/5 rounded-lg hover:bg-arcane-accent/10 hover:border-arcane-accent/50 transition-all flex flex-col items-center justify-center gap-4 group"
                    >
                      <Plus className="h-12 w-12 text-arcane-accent group-hover:scale-110 transition-transform" />
                      <span className="text-arcane-accent font-bold">Add Player</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>

              {/* Statistics Comparison */}
              <Card3D>
                <GlassCard variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="h-6 w-6 text-arcane-accent" />
                    <h2 className="text-2xl font-black text-white">Statistics</h2>
                  </div>

                  <div className="space-y-2">
                    <StatRow label="Overall Rating" statKey="rating" icon={Trophy} />
                    <StatRow label="Scouting Reports" statKey="reports" icon={Target} />
                    <StatRow label="Age" statKey="age" icon={Users} />
                    <StatRow label="Height" statKey="height" icon={TrendingUp} />
                    <StatRow label="Weight" statKey="weight" icon={Activity} />
                  </div>
                </GlassCard>
              </Card3D>

              {/* Skills Comparison */}
              <Card3D>
                <GlassCard variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <Zap className="h-6 w-6 text-arcane-accent" />
                    <h2 className="text-2xl font-black text-white">Skills Profile</h2>
                  </div>

                  <div className="space-y-2">
                    <StatRow label="Technical Skills" statKey="technical" icon={Trophy} />
                    <StatRow label="Physical Attributes" statKey="physical" icon={Activity} />
                    <StatRow label="Mental Attributes" statKey="mental" icon={Target} />
                    <StatRow label="Tactical Awareness" statKey="tactical" icon={TrendingUp} />
                  </div>
                </GlassCard>
              </Card3D>

              {/* Physical Profile */}
              <Card3D>
                <GlassCard variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="h-6 w-6 text-arcane-accent" />
                    <h2 className="text-2xl font-black text-white">Physical Profile</h2>
                  </div>

                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${players.length}, 1fr)` }}>
                    {players.map((player) => (
                      <div key={player.id} className="space-y-3">
                        <div className="p-4 bg-arcane-darkBorder/20 rounded-lg">
                          <p className="text-xs text-arcane-grey mb-1">Nationality</p>
                          <p className="text-white font-bold">{player.nationality}</p>
                        </div>
                        <div className="p-4 bg-arcane-darkBorder/20 rounded-lg">
                          <p className="text-xs text-arcane-grey mb-1">Preferred Foot</p>
                          <p className="text-white font-bold capitalize">{player.preferredFoot}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Card3D>
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedPage>
  );
}
