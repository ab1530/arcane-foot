"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, User, CheckCircle2 } from "lucide-react";

interface Scout {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
}

interface AssignScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  matchTitle: string;
  currentScoutId?: string | null;
  onSuccess: () => void;
}

export function AssignScoutModal({
  isOpen,
  onClose,
  matchId,
  matchTitle,
  currentScoutId,
  onSuccess,
}: AssignScoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingScouts, setLoadingScouts] = useState(false);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [selectedScoutId, setSelectedScoutId] = useState<string>(currentScoutId || "");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch scouts
  useEffect(() => {
    if (isOpen) {
      fetchScouts();
      setSelectedScoutId(currentScoutId || "");
    }
  }, [isOpen, currentScoutId]);

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

  const filteredScouts = scouts.filter(
    (scout) =>
      scout.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scout.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scout.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedScoutId) {
      toast.error("Veuillez sélectionner un scout");
      return;
    }

    try {
      setLoading(true);

      await apiClient.assignScoutToMatch(matchId, selectedScoutId);

      const selectedScout = scouts.find((s) => s.id === selectedScoutId);
      toast.success("Scout assigné avec succès", {
        description: `${selectedScout?.firstName} ${selectedScout?.lastName} est maintenant assigné à ce match`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error assigning scout:", error);
      toast.error("Erreur lors de l'assignation du scout", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveScout = async () => {
    try {
      setLoading(true);

      // Assign empty string to remove scout
      await apiClient.assignScoutToMatch(matchId, "");

      toast.success("Scout retiré avec succès", {
        description: "Aucun scout n'est assigné à ce match",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error removing scout:", error);
      toast.error("Erreur lors du retrait du scout", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assigner un Scout" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Info */}
        <div className="p-4 rounded-lg bg-arcane-accent/10 border border-arcane-accent/30">
          <p className="text-sm font-bold text-arcane-grey uppercase tracking-wider mb-1">
            Match
          </p>
          <p className="text-white font-bold">{matchTitle}</p>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
            Rechercher un Scout
          </label>
          <input
            type="text"
            placeholder="Nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
          />
        </div>

        {/* Scouts List */}
        <div>
          <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">
            Sélectionner un Scout
          </label>

          {loadingScouts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-arcane-accent animate-spin" />
            </div>
          ) : filteredScouts.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-arcane-grey mx-auto mb-3" />
              <p className="text-arcane-grey">
                {searchQuery ? "Aucun scout trouvé" : "Aucun scout disponible"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredScouts.map((scout) => {
                const isSelected = selectedScoutId === scout.id;
                const isCurrent = currentScoutId === scout.id;

                return (
                  <button
                    key={scout.id}
                    type="button"
                    onClick={() => setSelectedScoutId(scout.id)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "bg-arcane-accent/20 border-arcane-accent"
                        : "bg-arcane-darkBorder/30 border-arcane-darkBorder hover:border-arcane-accent/50 hover:bg-arcane-darkBorder/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-arcane-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-arcane-dark font-bold text-lg">
                          {scout.firstName[0]}
                          {scout.lastName[0]}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">
                            {scout.firstName} {scout.lastName}
                          </p>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-arcane-accent/20 text-arcane-accent">
                              Actuel
                            </span>
                          )}
                        </div>
                        {scout.email && (
                          <p className="text-sm text-arcane-grey truncate">{scout.email}</p>
                        )}
                      </div>

                      {/* Check Icon */}
                      {isSelected && (
                        <CheckCircle2 className="h-6 w-6 text-arcane-accent flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-arcane-darkBorder/50">
          <div className="flex gap-3 flex-1">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            {currentScoutId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveScout}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrait...
                  </>
                ) : (
                  "Retirer le Scout"
                )}
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !selectedScoutId}
            className="flex-1 sm:flex-initial"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assignation...
              </>
            ) : (
              "Assigner"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
