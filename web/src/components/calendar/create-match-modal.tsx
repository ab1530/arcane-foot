"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
}

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMatchModal({ isOpen, onClose, onSuccess }: CreateMatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingScouts, setLoadingScouts] = useState(false);

  // Form state
  const [homeClubId, setHomeClubId] = useState("");
  const [awayClubId, setAwayClubId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [venueOld, setVenueOld] = useState("");
  const [competitionOld, setCompetitionOld] = useState("");
  const [season, setSeason] = useState("2025-2026");
  const [scoutId, setScoutId] = useState("");
  const [notes, setNotes] = useState("");

  // Data
  const [clubs, setClubs] = useState<Club[]>([]);
  const [scouts, setScouts] = useState<Scout[]>([]);

  // Fetch clubs
  useEffect(() => {
    if (isOpen) {
      fetchClubs();
      fetchScouts();
    }
  }, [isOpen]);

  const fetchClubs = async () => {
    try {
      setLoadingClubs(true);
      const response = await apiClient.getClubs({ limit: 100 });
      setClubs(response.data || []);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast.error("Erreur lors du chargement des clubs");
    } finally {
      setLoadingClubs(false);
    }
  };

  const fetchScouts = async () => {
    try {
      setLoadingScouts(true);
      const response = await apiClient.getUsers({ role: "SCOUT", limit: 100 });
      setScouts(response.data || []);
    } catch (error) {
      console.error("Error fetching scouts:", error);
      toast.error("Erreur lors du chargement des scouts");
    } finally {
      setLoadingScouts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!homeClubId || !awayClubId || !scheduledAt || !scheduledTime || !season) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (homeClubId === awayClubId) {
      toast.error("Les équipes à domicile et à l'extérieur doivent être différentes");
      return;
    }

    try {
      setLoading(true);

      // Combine date and time
      const dateTime = `${scheduledAt}T${scheduledTime}:00Z`;

      const data = {
        homeClubId,
        awayClubId,
        scheduledAt: dateTime,
        venueOld: venueOld || undefined,
        competitionOld: competitionOld || undefined,
        season,
        scoutId: scoutId || undefined,
        notes: notes || undefined,
      };

      await apiClient.createMatch(data);

      toast.success("Match créé avec succès", {
        description: "Le match a été ajouté au calendrier",
      });

      // Reset form
      setHomeClubId("");
      setAwayClubId("");
      setScheduledAt("");
      setScheduledTime("");
      setVenueOld("");
      setCompetitionOld("");
      setSeason("2025-2026");
      setScoutId("");
      setNotes("");

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast.error("Erreur lors de la création du match", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Match" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clubs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Club */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Équipe à Domicile *
            </label>
            <select
              required
              value={homeClubId}
              onChange={(e) => setHomeClubId(e.target.value)}
              disabled={loadingClubs}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all disabled:opacity-50"
            >
              <option value="">Sélectionner un club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} {club.shortName && `(${club.shortName})`}
                </option>
              ))}
            </select>
          </div>

          {/* Away Club */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Équipe à l'Extérieur *
            </label>
            <select
              required
              value={awayClubId}
              onChange={(e) => setAwayClubId(e.target.value)}
              disabled={loadingClubs}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all disabled:opacity-50"
            >
              <option value="">Sélectionner un club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} {club.shortName && `(${club.shortName})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Date *
            </label>
            <input
              type="date"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Heure *
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Competition & Venue Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Competition */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Compétition
            </label>
            <input
              type="text"
              placeholder="Ex: Ligue 1, Champions League..."
              value={competitionOld}
              onChange={(e) => setCompetitionOld(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Stade
            </label>
            <input
              type="text"
              placeholder="Ex: Parc des Princes..."
              value={venueOld}
              onChange={(e) => setVenueOld(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Season & Scout Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Season */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Saison *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 2025-2026"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
            />
          </div>

          {/* Scout */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
              Scout Assigné
            </label>
            <select
              value={scoutId}
              onChange={(e) => setScoutId(e.target.value)}
              disabled={loadingScouts}
              className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all disabled:opacity-50"
            >
              <option value="">Aucun scout</option>
              {scouts.map((scout) => (
                <option key={scout.id} value={scout.id}>
                  {scout.firstName} {scout.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
            Notes
          </label>
          <textarea
            rows={3}
            placeholder="Notes ou informations supplémentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
          />
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
              "Créer le Match"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
