"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  MapPin,
  List,
  CalendarDays,
  Map,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Circle,
  Download,
  Settings,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { CreateMatchModal } from "@/components/calendar/create-match-modal";
import { AssignScoutModal } from "@/components/calendar/assign-scout-modal";
import { MonthView } from "@/components/calendar/month-view";

type ViewMode = "list" | "week" | "month" | "map";
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

interface ApiMatch {
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

export default function CalendarPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [scouts, setScouts] = useState<Scout[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [competitionFilter, setCompetitionFilter] = useState("");
  const [scoutFilter, setScoutFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignScoutModal, setShowAssignScoutModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ApiMatch | null>(null);

  // Fetch matches from API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const params: any = {};

        if (statusFilter) params.status = statusFilter;
        if (competitionFilter) params.competition = competitionFilter;
        if (scoutFilter) params.scoutId = scoutFilter;
        if (dateFilter) params.from = dateFilter;

        const response = await apiClient.getMatches(params);
        setMatches(response.data || []);
      } catch (error) {
        console.error("Error fetching matches:", error);
        toast.error("Erreur lors du chargement des matchs", {
          description: "Impossible de récupérer les données du serveur",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [statusFilter, competitionFilter, scoutFilter, dateFilter]);

  // Extract scouts from matches (since /api/users endpoint doesn't exist yet)
  useEffect(() => {
    if (matches.length > 0) {
      const uniqueScouts = matches
        .filter((match) => match.scout)
        .reduce((acc, match) => {
          const scout = match.scout!;
          if (!acc.find((s) => s.id === scout.id)) {
            acc.push(scout);
          }
          return acc;
        }, [] as Scout[]);
      setScouts(uniqueScouts);
    }
  }, [matches]);

  // Filter matches by search query (client-side)
  const filteredMatches = matches.filter((match) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      match.homeClub.name.toLowerCase().includes(query) ||
      match.awayClub.name.toLowerCase().includes(query) ||
      match.competitionOld?.toLowerCase().includes(query) ||
      match.venueOld?.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "SCHEDULED":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "LIVE":
        return <Circle className="h-4 w-4 text-red-500 animate-pulse" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-arcane-accent" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
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

  // Refresh matches after modal actions
  const refreshMatches = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (competitionFilter) params.competition = competitionFilter;
      if (scoutFilter) params.scoutId = scoutFilter;
      if (dateFilter) params.from = dateFilter;

      const response = await apiClient.getMatches(params);
      setMatches(response.data || []);
    } catch (error) {
      console.error("Error refreshing matches:", error);
    }
  };

  const handleCreateMatch = () => {
    setShowCreateModal(true);
  };

  const handleSyncCalendar = () => {
    toast.success("Synchronisation lancée", {
      description: "Vos calendriers Google et Outlook seront mis à jour",
    });
  };

  const handleAssignScout = (match: ApiMatch) => {
    setSelectedMatch(match);
    setShowAssignScoutModal(true);
  };

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
                  <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                      <CalendarIcon className="h-6 w-6 text-arcane-accent" />
                      Calendrier Scouting
                    </h1>
                    <p className="text-sm text-arcane-grey">Gérez vos matchs et affectations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSyncCalendar}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Sync
                    </Button>
                    <Button size="sm" onClick={handleCreateMatch}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau Match
                    </Button>
                  </div>
                </div>
                <Breadcrumb items={[{ label: "Calendrier" }]} />
              </div>
            </div>

            <div className="p-6">
            {/* Header Actions */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un match, équipe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-80 pl-10 pr-4 py-2.5 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    variant={showFilters ? "default" : "secondary"}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                  </Button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-arcane-darkBorder/50 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "list"
                        ? "bg-arcane-accent text-arcane-dark font-bold"
                        : "text-arcane-grey hover:text-white"
                    }`}
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Liste</span>
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "week"
                        ? "bg-arcane-accent text-arcane-dark font-bold"
                        : "text-arcane-grey hover:text-white"
                    }`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Semaine</span>
                  </button>
                  <button
                    onClick={() => setViewMode("month")}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "month"
                        ? "bg-arcane-accent text-arcane-dark font-bold"
                        : "text-arcane-grey hover:text-white"
                    }`}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Mois</span>
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "map"
                        ? "bg-arcane-accent text-arcane-dark font-bold"
                        : "text-arcane-grey hover:text-white"
                    }`}
                  >
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Carte</span>
                  </button>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <GlassCard className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          Statut
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none"
                        >
                          <option value="">Tous</option>
                          <option value="SCHEDULED">Prévu</option>
                          <option value="CONFIRMED">Confirmé</option>
                          <option value="LIVE">En Direct</option>
                          <option value="COMPLETED">Terminé</option>
                          <option value="CANCELLED">Annulé</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          Compétition
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Ligue 1"
                          value={competitionFilter}
                          onChange={(e) => setCompetitionFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          Scout
                        </label>
                        <select
                          value={scoutFilter}
                          onChange={(e) => setScoutFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none"
                        >
                          <option value="">Tous</option>
                          {scouts.map((scout) => (
                            <option key={scout.id} value={scout.id}>
                              {scout.firstName} {scout.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          Date
                        </label>
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </motion.div>

            {/* Content Area */}
            <div className="space-y-4">
              {/* Loading State */}
              {loading && (
                <GlassCard variant="elevated" className="p-12 text-center">
                  <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Chargement des matchs...
                  </h3>
                  <p className="text-arcane-grey">
                    Récupération des données depuis le serveur
                  </p>
                </GlassCard>
              )}

              {/* List View */}
              {!loading && viewMode === "list" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {filteredMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard
                        variant="elevated"
                        className="p-6 cursor-pointer transition-all hover:border-arcane-accent/50"
                        onClick={() => router.push(`/calendar/${match.id}`)}
                      >
                        <div className="flex flex-col lg:flex-row gap-6 items-start">
                            {/* Left - Match Info */}
                            <div className="flex-1 space-y-3">
                              {/* Status Badge */}
                              <div className="flex items-center gap-2">
                                {getStatusIcon(match.status)}
                                <span className="text-sm font-bold text-arcane-grey uppercase tracking-wider">
                                  {getStatusLabel(match.status)}
                                </span>
                                {match.competitionOld && (
                                  <span className="text-sm text-arcane-grey">
                                    • {match.competitionOld}
                                  </span>
                                )}
                              </div>

                              {/* Teams */}
                              <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                  {match.homeClub.name}{" "}
                                  <span className="text-arcane-accent">VS</span>{" "}
                                  {match.awayClub.name}
                                </h3>
                                {/* Show score if match is completed or live */}
                                {(match.status === "COMPLETED" || match.status === "LIVE") &&
                                 match.homeScore !== null && match.awayScore !== null && (
                                  <div className="mt-2 text-xl font-bold text-arcane-accent">
                                    {match.homeScore} - {match.awayScore}
                                  </div>
                                )}
                              </div>

                              {/* Date, Time, Venue */}
                              <div className="flex flex-wrap gap-4 text-sm text-arcane-grey">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  {new Date(match.scheduledAt).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    }
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {new Date(match.scheduledAt).toLocaleTimeString(
                                    "fr-FR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                                {match.venueOld && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {match.venueOld}
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {match.notes && (
                                <div>
                                  <span className="text-xs font-bold text-arcane-accent uppercase tracking-wider">
                                    Notes :{" "}
                                  </span>
                                  <span className="text-sm text-white">
                                    {match.notes}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right - Scouts & Actions */}
                            <div className="space-y-4 lg:min-w-[250px]">
                              {/* Assigned Scout */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-arcane-grey uppercase tracking-wider">
                                    Scout Assigné
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAssignScout(match)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                {match.scout ? (
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-arcane-darkBorder/30">
                                    <div className="w-8 h-8 rounded-full bg-arcane-accent flex items-center justify-center">
                                      <span className="text-arcane-dark font-bold text-sm">
                                        {match.scout.firstName[0]}{match.scout.lastName[0]}
                                      </span>
                                    </div>
                                    <span className="text-sm text-white font-medium">
                                      {match.scout.firstName} {match.scout.lastName}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm text-arcane-grey italic">
                                    Aucun scout assigné
                                  </p>
                                )}
                              </div>

                              {/* Scouting Reports Count */}
                              {match._count && match._count.scoutingReports > 0 && (
                                <div className="p-3 rounded-lg bg-arcane-accent/10 border border-arcane-accent/30">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-arcane-accent" />
                                    <span className="text-sm text-white font-medium">
                                      {match._count.scoutingReports} rapport{match._count.scoutingReports > 1 ? 's' : ''} de scouting
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              {match.venueOld && (
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(
                                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venueOld || '')}`,
                                        "_blank"
                                      );
                                    }}
                                  >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Itinéraire
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                    </motion.div>
                  ))}

                  {filteredMatches.length === 0 && (
                    <GlassCard variant="elevated" className="p-12 text-center">
                      <CalendarIcon className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        {matches.length === 0 ? "Aucun match planifié" : "Aucun résultat"}
                      </h3>
                      <p className="text-arcane-grey mb-6">
                        {matches.length === 0
                          ? "Commencez par ajouter un match à votre calendrier"
                          : "Aucun match ne correspond à vos critères de recherche"}
                      </p>
                      {matches.length === 0 && (
                        <Button onClick={handleCreateMatch}>
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un match
                        </Button>
                      )}
                    </GlassCard>
                  )}
                </motion.div>
              )}

              {/* Week View */}
              {viewMode === "week" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <GlassCard variant="elevated" className="p-8 text-center">
                    <CalendarDays className="h-16 w-16 text-arcane-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      <NeonText>Vue Semaine</NeonText>
                    </h3>
                    <p className="text-arcane-grey">
                      Fonctionnalité en cours de développement
                    </p>
                  </GlassCard>
                </motion.div>
              )}

              {/* Month View */}
              {!loading && viewMode === "month" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <MonthView matches={filteredMatches} onRefresh={refreshMatches} />
                </motion.div>
              )}

              {/* Map View */}
              {viewMode === "map" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <GlassCard variant="elevated" className="p-8 text-center">
                    <Map className="h-16 w-16 text-arcane-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      <NeonText>Vue Carte</NeonText>
                    </h3>
                    <p className="text-arcane-grey mb-4">
                      Visualisation géographique des matchs avec Google Maps
                    </p>
                    <p className="text-sm text-arcane-grey">
                      Intégration Google Maps API en cours
                    </p>
                  </GlassCard>
                </motion.div>
              )}
            </div>
          </div>
          </div>
        </main>

        {/* Modals */}
        <CreateMatchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refreshMatches}
        />

        {selectedMatch && (
          <AssignScoutModal
            isOpen={showAssignScoutModal}
            onClose={() => {
              setShowAssignScoutModal(false);
              setSelectedMatch(null);
            }}
            matchId={selectedMatch.id}
            matchTitle={`${selectedMatch.homeClub.name} vs ${selectedMatch.awayClub.name}`}
            currentScoutId={selectedMatch.scoutId}
            onSuccess={refreshMatches}
          />
        )}
      </MainLayout>
    </ProtectedPage>
  );
}
