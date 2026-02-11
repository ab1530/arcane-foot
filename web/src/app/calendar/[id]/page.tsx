"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Circle,
  Trophy,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { CreateReportModal } from "@/components/reports/create-report-modal";

type MatchStatus = "SCHEDULED" | "CONFIRMED" | "LIVE" | "COMPLETED" | "CANCELLED";

interface Club {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
}

interface Scout {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  scheduledAt: string;
  venueOld?: string;
  competitionOld?: string;
  season: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  scoutId?: string | null;
  notes?: string | null;
  homeClub: Club;
  awayClub: Club;
  scout?: Scout | null;
  _count?: {
    scoutingReports: number;
  };
}

export default function MatchDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getMatch(matchId);
        setMatch(data);
      } catch (error) {
        console.error("Error fetching match:", error);
        toast.error("Erreur lors du chargement du match");
        router.push("/calendar");
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatch();
    }
  }, [matchId, router]);

  const getStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "SCHEDULED":
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case "LIVE":
        return <Circle className="h-6 w-6 text-red-500 animate-pulse" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-6 w-6 text-arcane-accent" />;
      case "CANCELLED":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusLabel = (status: MatchStatus) => {
    const labels: Record<MatchStatus, string> = {
      SCHEDULED: "Prévu",
      CONFIRMED: "Confirmé",
      LIVE: "En Direct",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return labels[status];
  };

  if (loading) {
    return (
      <ProtectedPage>
        <MainLayout>
          <main className="min-h-screen overflow-hidden relative">
            <AnimatedBackground />
            <div className="relative z-10 p-6">
              <GlassCard variant="elevated" className="p-12 text-center max-w-2xl mx-auto">
                <div className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin">
                  <Circle className="h-full w-full" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Chargement du match...
                </h3>
              </GlassCard>
            </div>
          </main>
        </MainLayout>
      </ProtectedPage>
    );
  }

  if (!match) {
    return null;
  }

  return (
    <ProtectedPage>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />
          <div className="relative z-10">
            {/* Header */}
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center gap-4 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/calendar")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <div className="flex-1">
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-arcane-accent" />
                      Détails du Match
                    </h1>
                    <p className="text-sm text-arcane-grey">
                      Informations complètes et rapports de scouting
                    </p>
                  </div>
                </div>
                <Breadcrumb
                  items={[
                    { label: "Calendrier", href: "/calendar" },
                    { label: "Détails du Match" },
                  ]}
                />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Match Header Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard variant="elevated" className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-6">
                    {getStatusIcon(match.status)}
                    <span className="text-lg font-bold text-arcane-grey uppercase tracking-wider">
                      {getStatusLabel(match.status)}
                    </span>
                    {match.status === "LIVE" && (
                      <span className="ml-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-bold animate-pulse">
                        EN DIRECT
                      </span>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="text-center mb-8">
                    <div className="grid grid-cols-3 gap-8 items-center mb-4">
                      {/* Home Team */}
                      <div>
                        <h2 className="text-4xl font-black text-white uppercase">
                          {match.homeClub.name}
                        </h2>
                      </div>

                      {/* VS */}
                      <div>
                        <div className="text-3xl font-black text-arcane-accent">VS</div>
                        {(match.status === "COMPLETED" || match.status === "LIVE") &&
                          match.homeScore !== null &&
                          match.awayScore !== null && (
                            <div className="text-5xl font-black text-white mt-2">
                              {match.homeScore} - {match.awayScore}
                            </div>
                          )}
                      </div>

                      {/* Away Team */}
                      <div>
                        <h2 className="text-4xl font-black text-white uppercase">
                          {match.awayClub.name}
                        </h2>
                      </div>
                    </div>

                    {/* Competition */}
                    {match.competitionOld && (
                      <div className="flex items-center justify-center gap-2 text-arcane-accent">
                        <Trophy className="h-5 w-5" />
                        <span className="text-xl font-bold">{match.competitionOld}</span>
                      </div>
                    )}
                  </div>

                  {/* Match Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date & Time */}
                    <div className="text-center p-4 rounded-lg bg-arcane-darkBorder/30">
                      <Calendar className="h-6 w-6 text-arcane-accent mx-auto mb-2" />
                      <div className="text-sm font-bold text-arcane-grey uppercase mb-1">
                        Date
                      </div>
                      <div className="text-white font-bold">
                        {new Date(match.scheduledAt).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-arcane-accent font-bold text-lg mt-1">
                        {new Date(match.scheduledAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Venue */}
                    {match.venueOld && (
                      <div className="text-center p-4 rounded-lg bg-arcane-darkBorder/30">
                        <MapPin className="h-6 w-6 text-arcane-accent mx-auto mb-2" />
                        <div className="text-sm font-bold text-arcane-grey uppercase mb-1">
                          Stade
                        </div>
                        <div className="text-white font-bold">{match.venueOld}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                match.venueOld || ""
                              )}`,
                              "_blank"
                            )
                          }
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Itinéraire
                        </Button>
                      </div>
                    )}

                    {/* Scout */}
                    <div className="text-center p-4 rounded-lg bg-arcane-darkBorder/30">
                      <Users className="h-6 w-6 text-arcane-accent mx-auto mb-2" />
                      <div className="text-sm font-bold text-arcane-grey uppercase mb-1">
                        Scout Assigné
                      </div>
                      {match.scout ? (
                        <div>
                          <div className="text-white font-bold">
                            {match.scout.firstName} {match.scout.lastName}
                          </div>
                          {match.scout.email && (
                            <div className="text-sm text-arcane-grey mt-1">
                              {match.scout.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-arcane-grey italic">Aucun scout assigné</div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Notes Section */}
              {match.notes && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <GlassCard variant="elevated" className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-arcane-accent" />
                      <h3 className="text-lg font-bold text-white uppercase">Notes</h3>
                    </div>
                    <p className="text-white">{match.notes}</p>
                  </GlassCard>
                </motion.div>
              )}

              {/* Scouting Reports Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard variant="elevated" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-arcane-accent" />
                      <h3 className="text-lg font-bold text-white uppercase">
                        Rapports de Scouting
                      </h3>
                    </div>
                    {match._count && match._count.scoutingReports > 0 && (
                      <span className="px-3 py-1 rounded-full bg-arcane-accent/20 text-arcane-accent font-bold">
                        {match._count.scoutingReports} rapport
                        {match._count.scoutingReports > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {match._count && match._count.scoutingReports > 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-arcane-accent mx-auto mb-3" />
                      <p className="text-arcane-grey mb-4">
                        {match._count.scoutingReports} rapport
                        {match._count.scoutingReports > 1 ? "s" : ""} disponible
                        {match._count.scoutingReports > 1 ? "s" : ""}
                      </p>
                      <Button onClick={() => router.push("/reports")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Voir les rapports
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-arcane-grey mx-auto mb-3 opacity-50" />
                      <p className="text-arcane-grey mb-4">
                        Aucun rapport de scouting pour ce match
                      </p>
                      {match.status === "SCHEDULED" || match.status === "LIVE" ? (
                        <Button onClick={() => setShowCreateReportModal(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Créer un rapport
                        </Button>
                      ) : null}
                    </div>
                  )}
                </GlassCard>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex gap-4 justify-center">
                  <Button variant="secondary" onClick={() => router.push("/calendar")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au Calendrier
                  </Button>
                  {match.venueOld && (
                    <Button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            match.venueOld || ""
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Voir sur la carte
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Create Report Modal */}
        <CreateReportModal
          isOpen={showCreateReportModal}
          onClose={() => setShowCreateReportModal(false)}
          onSuccess={() => {
            setShowCreateReportModal(false);
            toast.success("Rapport créé avec succès !");
            // Optionally refresh match data to update report count
            if (matchId) {
              fetchMatch();
            }
          }}
          preselectedMatchId={matchId}
        />
      </MainLayout>
    </ProtectedPage>
  );

  async function fetchMatch() {
    try {
      setLoading(true);
      const data = await apiClient.getMatch(matchId);
      setMatch(data);
    } catch (error) {
      console.error("Error fetching match:", error);
      toast.error("Erreur lors du chargement du match");
      router.push("/calendar");
    } finally {
      setLoading(false);
    }
  }
}
