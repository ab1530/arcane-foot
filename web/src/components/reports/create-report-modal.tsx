"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, Star, Zap, Shield, Brain, Target } from "lucide-react";

interface Player {
  id: string;
  position?: string;
  user: {
    firstName: string;
    lastName: string;
  };
  club?: {
    name: string;
  };
}

interface Match {
  id: string;
  scheduledAt: string;
  homeClub: {
    name: string;
    shortName?: string;
  };
  awayClub: {
    name: string;
    shortName?: string;
  };
  status: string;
}

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateReportModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Form state
  const [matchId, setMatchId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [overallRating, setOverallRating] = useState(50);
  const [technicalRating, setTechnicalRating] = useState(50);
  const [physicalRating, setPhysicalRating] = useState(50);
  const [mentalRating, setMentalRating] = useState(50);
  const [tacticalRating, setTacticalRating] = useState(50);
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [recommendationNotes, setRecommendationNotes] = useState("");
  const [tags, setTags] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");
  const [playerMinutesPlayed, setPlayerMinutesPlayed] = useState("");

  // Data
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchSearch, setMatchSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");

  const normalizeList = (payload: any): any[] => {
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

  // Fetch matches and players
  useEffect(() => {
    if (isOpen) {
      fetchMatches();
      fetchPlayers();
    }
  }, [isOpen]);

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      const response = await apiClient.getMatches({ limit: 100 });
      const list = normalizeList(response);
      setMatches(list);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("Erreur lors du chargement des matchs");
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const response = await apiClient.getPlayers({ limit: 100 });
      const list = normalizeList(response);
      setPlayers(list);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error("Erreur lors du chargement des joueurs");
    } finally {
      setLoadingPlayers(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    const searchLower = matchSearch.toLowerCase();
    return (
      match.homeClub.name.toLowerCase().includes(searchLower) ||
      match.awayClub.name.toLowerCase().includes(searchLower)
    );
  });

  const filteredPlayers = players.filter((player) => {
    const searchLower = playerSearch.toLowerCase();
    const fullName = `${player.user.firstName} ${player.user.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      player.position?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matchId || !playerId) {
      toast.error("Veuillez sélectionner un match et un joueur");
      return;
    }

    try {
      setLoading(true);

      const data = {
        matchId,
        playerId,
        overallRating: overallRating || undefined,
        technicalRating: technicalRating || undefined,
        physicalRating: physicalRating || undefined,
        mentalRating: mentalRating || undefined,
        tacticalRating: tacticalRating || undefined,
        summary: summary || undefined,
        strengths: strengths || undefined,
        weaknesses: weaknesses || undefined,
        recommendation: recommendation || undefined,
        recommendationNotes: recommendationNotes || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
        playerPosition: playerPosition || undefined,
        playerMinutesPlayed: playerMinutesPlayed
          ? parseInt(playerMinutesPlayed)
          : undefined,
        status: "DRAFT",
      };

      await apiClient.createScoutingReport(data);

      toast.success("Rapport créé avec succès", {
        description: "Le rapport a été enregistré en tant que brouillon",
      });

      // Reset form
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast.error("Erreur lors de la création du rapport", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMatchId("");
    setPlayerId("");
    setOverallRating(50);
    setTechnicalRating(50);
    setPhysicalRating(50);
    setMentalRating(50);
    setTacticalRating(50);
    setSummary("");
    setStrengths("");
    setWeaknesses("");
    setRecommendation("");
    setRecommendationNotes("");
    setTags("");
    setPlayerPosition("");
    setPlayerMinutesPlayed("");
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return "text-green-500";
    if (rating >= 60) return "text-yellow-500";
    if (rating >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Rapport" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match & Player Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Match *
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Rechercher un match..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none transition-all text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey" />
            </div>
            <select
              required
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              disabled={loadingMatches}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all disabled:opacity-50"
            >
              <option value="">Sélectionner un match</option>
              {filteredMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.homeClub.name} vs {match.awayClub.name} -{" "}
                  {new Date(match.scheduledAt).toLocaleDateString("fr-FR")}
                </option>
              ))}
            </select>
          </div>

          {/* Player */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Joueur *
            </label>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none transition-all text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey" />
            </div>
            <select
              required
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              disabled={loadingPlayers}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all disabled:opacity-50"
            >
              <option value="">Sélectionner un joueur</option>
              {filteredPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.user.firstName} {player.user.lastName}
                  {player.position && ` - ${player.position}`}
                  {player.club && ` (${player.club.name})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="p-6 rounded-xl bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Star className="h-4 w-4 text-arcane-accent" />
              Note Globale
            </label>
            <span className={`text-3xl font-black ${getRatingColor(overallRating)}`}>
              {overallRating}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={overallRating}
            onChange={(e) => setOverallRating(parseInt(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, ${
                overallRating >= 80
                  ? "#22c55e"
                  : overallRating >= 60
                  ? "#eab308"
                  : overallRating >= 40
                  ? "#f97316"
                  : "#ef4444"
              } 0%, ${
                overallRating >= 80
                  ? "#22c55e"
                  : overallRating >= 60
                  ? "#eab308"
                  : overallRating >= 40
                  ? "#f97316"
                  : "#ef4444"
              } ${overallRating}%, #1f2937 ${overallRating}%, #1f2937 100%)`,
            }}
          />
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Technical */}
          <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                Technique
              </label>
              <span className={`text-xl font-black ${getRatingColor(technicalRating)}`}>
                {technicalRating}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={technicalRating}
              onChange={(e) => setTechnicalRating(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${technicalRating}%, #1f2937 ${technicalRating}%, #1f2937 100%)`,
              }}
            />
          </div>

          {/* Physical */}
          <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                Physique
              </label>
              <span className={`text-xl font-black ${getRatingColor(physicalRating)}`}>
                {physicalRating}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={physicalRating}
              onChange={(e) => setPhysicalRating(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${physicalRating}%, #1f2937 ${physicalRating}%, #1f2937 100%)`,
              }}
            />
          </div>

          {/* Mental */}
          <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                Mental
              </label>
              <span className={`text-xl font-black ${getRatingColor(mentalRating)}`}>
                {mentalRating}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={mentalRating}
              onChange={(e) => setMentalRating(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${mentalRating}%, #1f2937 ${mentalRating}%, #1f2937 100%)`,
              }}
            />
          </div>

          {/* Tactical */}
          <div className="p-4 rounded-lg bg-arcane-darkBorder/30 border border-arcane-darkBorder/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                Tactique
              </label>
              <span className={`text-xl font-black ${getRatingColor(tacticalRating)}`}>
                {tacticalRating}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tacticalRating}
              onChange={(e) => setTacticalRating(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #22c55e 0%, #22c55e ${tacticalRating}%, #1f2937 ${tacticalRating}%, #1f2937 100%)`,
              }}
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
            Résumé
          </label>
          <textarea
            rows={3}
            placeholder="Résumé général du joueur..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
          />
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Points Forts
            </label>
            <textarea
              rows={4}
              placeholder="Qualités du joueur..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-green-500/30 text-white placeholder-arcane-grey focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Points Faibles
            </label>
            <textarea
              rows={4}
              placeholder="Points à améliorer..."
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-red-500/30 text-white placeholder-arcane-grey focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Recommandation
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            >
              <option value="">Sélectionner...</option>
              <option value="BUY_NOW">Acheter Maintenant</option>
              <option value="MONITOR">Suivre</option>
              <option value="FOLLOW_UP">Revoir Plus Tard</option>
              <option value="NOT_INTERESTED">Pas Intéressé</option>
              <option value="NEEDS_MORE_DATA">Plus de Données</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Position Jouée
            </label>
            <input
              type="text"
              placeholder="Ex: Attaquant, Milieu..."
              value={playerPosition}
              onChange={(e) => setPlayerPosition(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Recommendation Notes */}
        {recommendation && (
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Notes sur la Recommandation
            </label>
            <textarea
              rows={2}
              placeholder="Détails de la recommandation..."
              value={recommendationNotes}
              onChange={(e) => setRecommendationNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
            />
          </div>
        )}

        {/* Tags & Minutes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              placeholder="Ex: Rapide, Technique, Leader..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Minutes Jouées
            </label>
            <input
              type="number"
              min="0"
              max="120"
              placeholder="Ex: 90"
              value={playerMinutesPlayed}
              onChange={(e) => setPlayerMinutesPlayed(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-arcane-darkBorder/50">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              "Créer le Rapport"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
