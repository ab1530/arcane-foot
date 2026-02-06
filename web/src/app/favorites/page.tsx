"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import MainLayout from "@/components/layout/MainLayout";
import { Breadcrumb } from "@/components/breadcrumb";
import Link from "next/link";
import {
  Users, Trophy, MapPin, Calendar, Heart, X, Star, AlertCircle
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

export default function FavoritesPage() {
  const { favoritePlayerIds, removeFavorite, clearFavorites } = useFavorites();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoritePlayers = useCallback(async () => {
    if (favoritePlayerIds.length === 0) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch all players and filter by favorites
      const response = await apiClient.getPlayers({});
      const allPlayers = Array.isArray(response) ? response : (response as any)?.items || response?.data || [];

      // Filter to only include favorite players
      const favPlayers = allPlayers.filter((p: Player) => favoritePlayerIds.includes(p.id));
      setPlayers(favPlayers);
    } catch (error) {
      console.error("Error fetching favorite players:", error);
      toast.error("Erreur lors du chargement des joueurs favoris");
    } finally {
      setLoading(false);
    }
  }, [favoritePlayerIds]);

  useEffect(() => {
    fetchFavoritePlayers();
  }, [fetchFavoritePlayers]);

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

  const handleRemoveFavorite = (playerId: string, playerName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(playerId);
  };

  const handleClearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?')) {
      clearFavorites();
    }
  };

  return (
    <ProtectedPage>
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
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                      <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                      Mes Favoris
                    </h1>
                    <p className="text-sm text-arcane-grey">
                      {favoritePlayerIds.length} {favoritePlayerIds.length === 1 ? 'joueur favori' : 'joueurs favoris'}
                    </p>
                  </div>
                  {favoritePlayerIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearAll}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Tout supprimer
                    </Button>
                  )}
                </div>
                <Breadcrumb items={[{ label: "Favoris" }]} />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-arcane-accent"></div>
                  <p className="text-arcane-grey mt-4">Chargement des favoris...</p>
                </div>
              ) : favoritePlayerIds.length === 0 ? (
                <Card3D>
                  <GlassCard variant="elevated" className="p-12 text-center">
                    <Heart className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Aucun joueur favori</h3>
                    <p className="text-arcane-grey mb-6">
                      Commencez à ajouter des joueurs à vos favoris pour les retrouver facilement
                    </p>
                    <Link href="/players">
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        Parcourir les joueurs
                      </Button>
                    </Link>
                  </GlassCard>
                </Card3D>
              ) : players.length === 0 ? (
                <Card3D>
                  <GlassCard variant="elevated" className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Joueurs non trouvés</h3>
                    <p className="text-arcane-grey mb-6">
                      Certains joueurs favoris n'ont pas pu être chargés
                    </p>
                    <Link href="/players">
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        Parcourir les joueurs
                      </Button>
                    </Link>
                  </GlassCard>
                </Card3D>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {players.map((player) => {
                    const avgRating = getAverageRating(player);
                    const age = getAge(player.dateOfBirth);

                    return (
                      <motion.div key={player.id} variants={staggerItem}>
                        <Link href={`/players/${player.id}`}>
                          <Card3D>
                            <GlassCard variant="elevated" glowOnHover className="group cursor-pointer h-full relative">
                              {/* Remove Favorite Button */}
                              <button
                                onClick={(e) => handleRemoveFavorite(player.id, `${player.firstName} ${player.lastName}`, e)}
                                className="absolute top-4 left-4 z-10 p-2 rounded-full bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-all group/btn"
                                aria-label="Retirer des favoris"
                              >
                                <Heart className="h-5 w-5 text-red-500 fill-red-500 group-hover/btn:scale-110 transition-transform" />
                              </button>

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
                                    <span className="text-arcane-grey">{age} ans</span>
                                  </div>
                                </div>
                              </div>

                              {/* View Profile hint */}
                              <div className="mt-6 pt-4 border-t border-arcane-darkBorder/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-arcane-accent text-sm font-bold">
                                  Cliquer pour voir le profil complet →
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
        </main>
      </MainLayout>
    </ProtectedPage>
  );
}
