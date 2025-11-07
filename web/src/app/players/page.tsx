"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ProtectedRoute } from "@/components/auth/protected-route";
import MainLayout from "@/components/layout/MainLayout";
import { StatCard } from "@/components/stats";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  Users, Trophy, MapPin, Calendar, Star, Search, Filter, Plus, SortAsc, Activity, X, Sliders
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useFavorites } from "@/contexts/favorites-context";
import { useComparison } from "@/contexts/comparison-context";
import { Heart, GitCompare } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function PlayersPage() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { comparisonPlayerIds, isInComparison, toggleComparison, comparisonCount } = useComparison();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [nationalityFilter, setNationalityFilter] = useState("ALL");
  const [ageRangeFilter, setAgeRangeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const normalizeList = (payload: any): Player[] => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object") {
      if (Array.isArray((payload as any).items)) {
        return (payload as any).items;
      }
      if (Array.isArray((payload as any).data)) {
        return (payload as any).data;
      }
    }
    return [];
  };

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPlayers({});
      const list = normalizeList(response);
      setPlayers(list);
      setFilteredPlayers(list);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Erreur lors du chargement des joueurs");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAndSortPlayers = useCallback(() => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((player) =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.currentClub?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (positionFilter !== "ALL") {
      filtered = filtered.filter((player) => player.position === positionFilter);
    }

    // Nationality filter
    if (nationalityFilter !== "ALL") {
      filtered = filtered.filter((player) => player.nationality === nationalityFilter);
    }

    // Age range filter
    if (ageRangeFilter !== "ALL") {
      filtered = filtered.filter((player) => {
        const age = getAge(player.dateOfBirth);
        switch (ageRangeFilter) {
          case "U18":
            return age < 18;
          case "18-21":
            return age >= 18 && age <= 21;
          case "22-25":
            return age >= 22 && age <= 25;
          case "26+":
            return age >= 26;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "age":
          return new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime();
        case "reports":
          return (b.scoutingReports?.length || 0) - (a.scoutingReports?.length || 0);
        case "rating":
          return getAverageRating(b) - getAverageRating(a);
        default:
          return 0;
      }
    });

    setFilteredPlayers(filtered);
  }, [players, searchTerm, positionFilter, nationalityFilter, ageRangeFilter, sortBy]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    filterAndSortPlayers();
  }, [filterAndSortPlayers]);

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

  const handleToggleFavorite = (playerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(playerId);
  };

  const handleToggleComparison = (playerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleComparison(playerId);
  };

  const positions = ["ALL", "FORWARD", "MIDFIELDER", "DEFENDER", "GOALKEEPER"];

  // Get unique nationalities from players
  const nationalities = ["ALL", ...Array.from(new Set(players.map(p => p.nationality).filter(Boolean)))].sort();

  const ageRanges = ["ALL", "U18", "18-21", "22-25", "26+"];

  const hasActiveFilters = positionFilter !== "ALL" || nationalityFilter !== "ALL" || ageRangeFilter !== "ALL";

  const stats = {
    totalPlayers: players.length,
    averageRating: players.length > 0
      ? Math.round(players.reduce((sum, p) => sum + getAverageRating(p), 0) / players.length)
      : 0,
    totalReports: players.reduce((sum, p) => sum + (p.scoutingReports?.length || 0), 0),
    avgAge: players.length > 0
      ? Math.round(players.reduce((sum, p) => sum + getAge(p.dateOfBirth), 0) / players.length)
      : 0,
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          {/* Main Content */}
          <div className="relative z-10">
            {/* Top Bar */}
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-black text-white">Players</h1>
                    <p className="text-sm text-arcane-grey">Manage and view player profiles</p>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </div>
                <Breadcrumb items={[{ label: "Players" }]} />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Players"
                value={stats.totalPlayers}
                icon={Users}
                color="text-arcane-accent"
                bgColor="bg-arcane-accent/20"
                loading={loading}
                index={0}
              />
              <StatCard
                label="Average Rating"
                value={stats.averageRating}
                icon={Star}
                color="text-yellow-400"
                bgColor="bg-yellow-400/20"
                loading={loading}
                index={1}
              />
              <StatCard
                label="Scouting Reports"
                value={stats.totalReports}
                icon={Trophy}
                color="text-purple-400"
                bgColor="bg-purple-400/20"
                loading={loading}
                index={2}
              />
              <StatCard
                label="Average Age"
                value={stats.avgAge}
                icon={Activity}
                color="text-blue-400"
                bgColor="bg-blue-400/20"
                loading={loading}
                index={3}
              />
            </div>

            {/* Filters and Search */}
            <Card3D>
              <GlassCard variant="elevated" className="p-6">
                <div className="space-y-4">
                  {/* Main Filters Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey" />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white placeholder-arcane-grey focus:outline-none focus:border-arcane-accent/50 transition-colors"
                      />
                    </div>

                    {/* Position Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey pointer-events-none" />
                      <select
                        value={positionFilter}
                        onChange={(e) => setPositionFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white focus:outline-none focus:border-arcane-accent/50 transition-colors appearance-none cursor-pointer"
                      >
                        {positions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos === "ALL" ? "All Positions" : pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                      <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey pointer-events-none" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white focus:outline-none focus:border-arcane-accent/50 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="age">Sort by Age</option>
                        <option value="reports">Sort by Reports</option>
                        <option value="rating">Sort by Rating</option>
                      </select>
                    </div>
                  </div>

                  {/* Advanced Filters Toggle & Active Filters */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-arcane-grey hover:text-arcane-accent"
                    >
                      <Sliders className="h-4 w-4 mr-2" />
                      {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
                    </Button>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPositionFilter("ALL");
                          setNationalityFilter("ALL");
                          setAgeRangeFilter("ALL");
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>

                  {/* Advanced Filters Panel */}
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-arcane-darkBorder/50"
                    >
                      {/* Nationality Filter */}
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey pointer-events-none" />
                        <select
                          value={nationalityFilter}
                          onChange={(e) => setNationalityFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white focus:outline-none focus:border-arcane-accent/50 transition-colors appearance-none cursor-pointer"
                        >
                          {nationalities.map((nat) => (
                            <option key={nat} value={nat}>
                              {nat === "ALL" ? "All Nationalities" : nat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Age Range Filter */}
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey pointer-events-none" />
                        <select
                          value={ageRangeFilter}
                          onChange={(e) => setAgeRangeFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white focus:outline-none focus:border-arcane-accent/50 transition-colors appearance-none cursor-pointer"
                        >
                          {ageRanges.map((range) => (
                            <option key={range} value={range}>
                              {range === "ALL" ? "All Ages" : `${range} years`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {/* Active Filter Badges */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {positionFilter !== "ALL" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-arcane-accent/20 border border-arcane-accent/30 rounded-full text-xs text-arcane-accent">
                          Position: {positionFilter}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-white"
                            onClick={() => setPositionFilter("ALL")}
                          />
                        </span>
                      )}
                      {nationalityFilter !== "ALL" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                          Nationality: {nationalityFilter}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-white"
                            onClick={() => setNationalityFilter("ALL")}
                          />
                        </span>
                      )}
                      {ageRangeFilter !== "ALL" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-400">
                          Age: {ageRangeFilter}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-white"
                            onClick={() => setAgeRangeFilter("ALL")}
                          />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            </Card3D>

            {/* Players Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-arcane-accent"></div>
                <p className="text-arcane-grey mt-4">Loading players...</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <Card3D>
                <GlassCard variant="elevated" className="p-12 text-center">
                  <Users className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
                  <p className="text-arcane-grey">Try adjusting your search or filters</p>
                </GlassCard>
              </Card3D>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredPlayers.map((player) => {
                  const avgRating = getAverageRating(player);
                  const age = getAge(player.dateOfBirth);

                  return (
                    <motion.div key={player.id} variants={staggerItem}>
                      <Link href={`/players/${player.id}`}>
                        <Card3D>
                          <GlassCard variant="elevated" glowOnHover className="group cursor-pointer h-full relative">
                            {/* Action Buttons */}
                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                              <button
                                onClick={(e) => handleToggleFavorite(player.id, e)}
                                className="p-2 rounded-full bg-arcane-dark/80 backdrop-blur-sm border border-arcane-darkBorder/50 hover:border-arcane-accent/50 transition-all group/btn"
                                aria-label={isFavorite(player.id) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Heart
                                  className={`h-5 w-5 transition-all group-hover/btn:scale-110 ${
                                    isFavorite(player.id)
                                      ? "text-red-500 fill-red-500"
                                      : "text-arcane-grey"
                                  }`}
                                />
                              </button>
                              <button
                                onClick={(e) => handleToggleComparison(player.id, e)}
                                className="p-2 rounded-full bg-arcane-dark/80 backdrop-blur-sm border border-arcane-darkBorder/50 hover:border-arcane-accent/50 transition-all group/btn"
                                aria-label={isInComparison(player.id) ? "Remove from comparison" : "Add to comparison"}
                              >
                                <GitCompare
                                  className={`h-5 w-5 transition-all group-hover/btn:scale-110 ${
                                    isInComparison(player.id)
                                      ? "text-arcane-accent fill-arcane-accent"
                                      : "text-arcane-grey"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Player Image Placeholder */}
                            <div className="aspect-[3/4] bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder rounded-xl mb-6 relative overflow-hidden">
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-arcane-accent/10 via-transparent to-arcane-accent/5"
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                              />

                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-40 h-40 rounded-full bg-arcane-accent/10 flex items-center justify-center backdrop-blur-sm border border-arcane-accent/20">
                                  <Users className="w-20 h-20 text-arcane-accent/50" />
                                </div>
                              </div>

                              {/* Rating Badge */}
                              {avgRating > 0 && (
                                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-arcane-accent backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-[0_0_20px_rgba(228,255,59,0.5)]">
                                  <span className="text-arcane-dark font-black text-xl">{avgRating}</span>
                                </div>
                              )}

                              {/* Stats overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-arcane-dark via-arcane-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-arcane-grey">Reports</span>
                                    <span className="text-white font-bold">{player.scoutingReports?.length || 0}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-arcane-grey">Height</span>
                                    <span className="text-white font-bold">{player.height} cm</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-arcane-grey">Foot</span>
                                    <span className="text-white font-bold">{player.preferredFoot}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Player Info */}
                            <div className="space-y-3">
                              <h3 className="text-2xl font-black text-white group-hover:text-arcane-accent transition-colors uppercase">
                                {player.firstName} {player.lastName}
                              </h3>
                              <p className="text-arcane-accent uppercase text-xs tracking-widest font-bold">
                                {player.position}
                              </p>

                              <div className="space-y-2 pt-2">
                                {player.currentClub && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Trophy className="h-4 w-4 text-arcane-accent" />
                                    <span className="text-arcane-grey">{player.currentClub.name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-arcane-accent" />
                                  <span className="text-arcane-grey">{player.nationality}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-arcane-accent" />
                                  <span className="text-arcane-grey">{age} years</span>
                                </div>
                              </div>
                            </div>

                            {/* View Profile hint */}
                            <div className="mt-6 pt-4 border-t border-arcane-darkBorder/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-arcane-accent text-sm font-bold">
                                Click to view full profile →
                              </span>
                            </div>
                          </GlassCard>
                        </Card3D>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
            </div>
          </div>

          {/* Floating Comparison Badge */}
          {comparisonCount > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 right-8 z-50"
            >
              <Card3D>
                <GlassCard variant="elevated" className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-arcane-accent/20 flex items-center justify-center">
                        <GitCompare className="h-5 w-5 text-arcane-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {comparisonCount} Player{comparisonCount > 1 ? "s" : ""} Selected
                        </p>
                        <p className="text-xs text-arcane-grey">
                          {comparisonCount < 3 ? `Add ${3 - comparisonCount} more` : "Max reached"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/players/compare")}
                      size="sm"
                      className="bg-arcane-accent hover:bg-arcane-accent/80 text-arcane-dark font-bold"
                    >
                      Compare
                    </Button>
                  </div>
                </GlassCard>
              </Card3D>
            </motion.div>
          )}
        </main>
      </MainLayout>
    </ProtectedRoute>
  );
}
