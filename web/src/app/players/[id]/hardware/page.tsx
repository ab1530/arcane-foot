"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  Gauge,
  Navigation,
  Radar,
  Timer,
  Zap,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { Breadcrumb } from "@/components/breadcrumb";
import { PlayerTabs } from "@/components/players/PlayerTabs";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/charts/BarChart";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { NeonText } from "@/components/ui/gradient-text";
import { apiClient } from "@/lib/api-client";
import type { HardwareSession } from "@/types/hardware";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatType = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

const getDurationMinutes = (session: HardwareSession) => {
  if (session.metrics?.totalTimeMin !== undefined && session.metrics?.totalTimeMin !== null) {
    return session.metrics.totalTimeMin;
  }
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.endedAt).getTime();
  return Math.round(((end - start) / 1000 / 60) * 10) / 10;
};

export default function PlayerHardwarePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params?.id as string;

  const [sessions, setSessions] = useState<HardwareSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSessions = useCallback(async () => {
    if (!playerId) return;
    try {
      setLoading(true);
      const data = await apiClient.getHardwareSessions(playerId);
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading hardware sessions", error);
      toast.error("Impossible de charger les séances GPS");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      ),
    [sessions],
  );

  const chartData = useMemo(
    () =>
      [...sortedSessions]
        .reverse()
        .map((session) => ({
          name: new Date(session.startedAt).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
          distanceKm: Number(((session.metrics?.movementDistanceM ?? 0) / 1000).toFixed(2)),
          sprintKm: Number(((session.metrics?.sprintDistanceM ?? 0) / 1000).toFixed(2)),
        })),
    [sortedSessions],
  );

  const summary = useMemo(() => {
    if (sortedSessions.length === 0) {
      return {
        sessionsCount: 0,
        distanceKm: 0,
        sprintKm: 0,
        maxSpeed: 0,
        avgDuration: 0,
      };
    }

    const distance = sortedSessions.reduce(
      (total, session) => total + (session.metrics?.movementDistanceM ?? 0),
      0,
    );
    const sprint = sortedSessions.reduce(
      (total, session) => total + (session.metrics?.sprintDistanceM ?? 0),
      0,
    );
    const maxSpeed = Math.max(...sortedSessions.map((s) => s.metrics?.maxSpeedKmh ?? 0));
    const avgDuration =
      sortedSessions.reduce((total, session) => total + getDurationMinutes(session), 0) /
      sortedSessions.length;

    return {
      sessionsCount: sortedSessions.length,
      distanceKm: Number((distance / 1000).toFixed(2)),
      sprintKm: Number((sprint / 1000).toFixed(2)),
      maxSpeed: Math.round(maxSpeed * 10) / 10,
      avgDuration: Math.round(avgDuration * 10) / 10,
    };
  }, [sortedSessions]);

  const renderSessionCard = (session: HardwareSession) => {
    const duration = getDurationMinutes(session);
    const normalizedLoad = session.metrics?.normalizedMetrics?.loadScore;
    const intensityScore = session.metrics?.normalizedMetrics?.intensityScore;

    return (
      <Card3D key={session.id}>
        <GlassCard variant="elevated" glowOnHover className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-arcane-darkBorder/60 border border-arcane-darkBorder/80 text-arcane-grey">
                  {formatType(session.type)}
                </span>
                <span className="text-arcane-grey text-xs">
                  {formatDate(session.startedAt)} • {session.deviceId}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2">
                {formatDate(session.startedAt)} — {formatDate(session.endedAt)}
              </h3>
              {session.player?.clubName && (
                <p className="text-sm text-arcane-grey">
                  {session.player.firstName} {session.player.lastName} · {session.player.clubName}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Distance", value: (session.metrics?.movementDistanceM ?? 0) / 1000, unit: "km" },
                { label: "Sprint", value: (session.metrics?.sprintDistanceM ?? 0) / 1000, unit: "km" },
                { label: "Vitesse max", value: session.metrics?.maxSpeedKmh ?? 0, unit: "km/h" },
                { label: "Durée", value: duration, unit: "min" },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-3 rounded-lg bg-arcane-darkBorder/40 border border-arcane-darkBorder/70 text-right"
                >
                  <p className="text-xs uppercase text-arcane-grey tracking-wide">{metric.label}</p>
                  <div className="text-xl font-black text-white">
                    <NeonText>
                      <AnimatedCounter to={Number(metric.value.toFixed(2))} decimals={2} />
                    </NeonText>
                    <span className="text-sm text-arcane-grey ml-1">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-arcane-grey">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-arcane-accent" />
              <span>{session.metrics?.offenseDefenseRatio ? `Off/Def ${session.metrics.offenseDefenseRatio}` : "Off/Def —"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-arcane-accent" />
              <span>Sprints {session.metrics?.sprintCount ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-arcane-accent" />
              <span>Accélérations {session.metrics?.accelerationCount ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-arcane-accent" />
              <span>Cal {session.metrics?.caloriesBurned ? `${Math.round(session.metrics.caloriesBurned)} kcal` : "—"}</span>
            </div>
          </div>

          {(normalizedLoad || intensityScore) && (
            <div className="mt-4 p-3 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/60 text-sm">
              <p className="text-arcane-grey mb-1">Charge normalisée</p>
              <div className="flex items-center gap-4">
                {normalizedLoad && (
                  <span className="px-3 py-1 rounded-lg bg-arcane-accent/20 border border-arcane-accent/30 text-white text-sm">
                    Load {normalizedLoad}
                  </span>
                )}
                {intensityScore && (
                  <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-100 text-sm">
                    Intensité {intensityScore}
                  </span>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </Card3D>
    );
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
                  <Breadcrumb
                    items={[
                      { label: "Players", href: "/players" },
                      { label: "Performance GPS" },
                    ]}
                  />
                </div>
              </div>
              <div className="p-6 flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-arcane-accent mb-4"></div>
                  <p className="text-arcane-grey">Chargement des séances GPS...</p>
                </div>
              </div>
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
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/players/${playerId}`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au profil
                  </Button>
                  <Link href="/players" className="text-sm text-arcane-grey hover:text-white transition">
                    Voir tous les joueurs
                  </Link>
                </div>
                <Breadcrumb
                  items={[
                    { label: "Players", href: "/players" },
                    { label: "Performance GPS" },
                  ]}
                />
                <div className="mt-3">
                  <PlayerTabs playerId={playerId} active="hardware" />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Séances", value: summary.sessionsCount, icon: Radar, suffix: "" },
                  { label: "Distance cumulée", value: summary.distanceKm, icon: Navigation, suffix: "km" },
                  { label: "Sprint cumulé", value: summary.sprintKm, icon: Zap, suffix: "km" },
                  { label: "Vitesse max", value: summary.maxSpeed, icon: Gauge, suffix: "km/h" },
                ].map((stat) => (
                  <Card3D key={stat.label}>
                    <GlassCard variant="elevated" className="p-4 h-full">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase text-arcane-grey">{stat.label}</p>
                        <stat.icon className="h-4 w-4 text-arcane-accent" />
                      </div>
                      <div className="text-2xl font-black text-white">
                        <NeonText>
                          <AnimatedCounter to={stat.value} decimals={stat.suffix ? 2 : 0} />
                        </NeonText>
                        <span className="text-sm text-arcane-grey ml-1">{stat.suffix}</span>
                      </div>
                    </GlassCard>
                  </Card3D>
                ))}
                <Card3D>
                  <GlassCard variant="elevated" className="p-4 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase text-arcane-grey">Durée moyenne</p>
                      <Timer className="h-4 w-4 text-arcane-accent" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      <NeonText>
                        <AnimatedCounter to={summary.avgDuration} decimals={1} />
                      </NeonText>
                      <span className="text-sm text-arcane-grey ml-1">min</span>
                    </div>
                  </GlassCard>
                </Card3D>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  {chartData.length > 0 ? (
                    <BarChart
                      title="Charge GPS (distance & sprints)"
                      data={chartData}
                      bars={[
                        { dataKey: "distanceKm", color: "#e6ff3c", name: "Distance (km)" },
                        { dataKey: "sprintKm", color: "#38bdf8", name: "Sprint (km)" },
                      ]}
                    />
                  ) : (
                    <GlassCard variant="elevated" className="p-6">
                      <p className="text-arcane-grey">Aucune donnée GPS à afficher pour le moment.</p>
                    </GlassCard>
                  )}
                </div>
                <Card3D>
                  <GlassCard variant="elevated" className="p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="h-5 w-5 text-arcane-accent" />
                      <div>
                        <h3 className="text-lg font-bold text-white">Dernière séance</h3>
                        <p className="text-xs text-arcane-grey">Synthèse rapide de la dernière session simulée</p>
                      </div>
                    </div>
                    {sortedSessions[0] ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-arcane-grey">Date</span>
                          <span className="text-white">{formatDate(sortedSessions[0].startedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-arcane-grey">Type</span>
                          <span className="text-white">{formatType(sortedSessions[0].type)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-arcane-grey">Distance</span>
                          <span className="text-white">
                            {((sortedSessions[0].metrics?.movementDistanceM ?? 0) / 1000).toFixed(2)} km
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-arcane-grey">Sprint</span>
                          <span className="text-white">
                            {((sortedSessions[0].metrics?.sprintDistanceM ?? 0) / 1000).toFixed(2)} km
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-arcane-grey">Vitesse max</span>
                          <span className="text-white">{sortedSessions[0].metrics?.maxSpeedKmh ?? "—"} km/h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-arcane-grey">Durée</span>
                          <span className="text-white">{getDurationMinutes(sortedSessions[0])} min</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-arcane-grey">Aucune séance enregistrée.</p>
                    )}
                  </GlassCard>
                </Card3D>
              </div>

              <div className="space-y-4">
                {sortedSessions.length === 0 ? (
                  <GlassCard variant="elevated" className="p-6 text-center">
                    <p className="text-arcane-grey">Aucune séance GPS simulée pour l’instant.</p>
                    <p className="text-arcane-grey">Utilisez le mobile pour déclencher une simulation.</p>
                  </GlassCard>
                ) : (
                  sortedSessions.map((session) => renderSessionCard(session))
                )}
              </div>
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedPage>
  );
}
