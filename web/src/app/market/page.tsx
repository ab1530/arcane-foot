"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  Trash2,
  Loader2,
  User,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Trophy,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import Image from "next/image";

interface Player {
  id: string;
  fullName: string;
  position?: string;
  age?: number;
  nationality?: string;
  currentClub?: string;
  avatar?: string;
}

interface KanbanCard {
  id: string;
  columnId: string;
  playerId: string;
  player: Player;
  position: number;
  notes?: string;
  priority: string;
  tags: string[];
  dueDate?: string;
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  boardId: string;
  name: string;
  type: string;
  color?: string;
  position: number;
  cardLimit?: number;
  cards: KanbanCard[];
}

interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  columns: KanbanColumn[];
}

const priorityColors = {
  LOW: "bg-green-500/20 text-green-400 border-green-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  URGENT: "bg-red-500/20 text-red-400 border-red-500/30",
};

const priorityIcons = {
  LOW: TrendingUp,
  MEDIUM: Clock,
  HIGH: AlertCircle,
  URGENT: Target,
};

export default function MarketPage() {
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBoards();
      if (data.length > 0 && !selectedBoard) {
        await fetchBoardDetails(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
      toast.error("Erreur lors du chargement des tableaux");
    } finally {
      setLoading(false);
    }
  }, [selectedBoard]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const fetchBoardDetails = async (boardId: string) => {
    try {
      const data = await apiClient.getBoard(boardId);
      setSelectedBoard(data);
    } catch (error) {
      console.error("Error fetching board details:", error);
      toast.error("Erreur lors du chargement du tableau");
    }
  };

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumnId: string) => {
    if (!draggedCard || draggedCard.columnId === targetColumnId) {
      setDraggedCard(null);
      return;
    }

    try {
      await apiClient.moveCard(draggedCard.id, {
        targetColumnId,
        position: 0,
      });

      toast.success("Carte déplacée avec succès");

      // Refresh board
      if (selectedBoard) {
        await fetchBoardDetails(selectedBoard.id);
      }
    } catch (error: any) {
      console.error("Error moving card:", error);
      toast.error(error.message || "Erreur lors du déplacement");
    } finally {
      setDraggedCard(null);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce joueur du marché ?")) {
      return;
    }

    try {
      await apiClient.deleteCard(cardId);
      toast.success("Carte supprimée");
      if (selectedBoard) {
        await fetchBoardDetails(selectedBoard.id);
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case "PROSPECT":
        return Target;
      case "IN_PROGRESS":
        return Clock;
      case "INTERESTED":
        return Trophy;
      default:
        return User;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen overflow-hidden relative flex items-center justify-center">
          <AnimatedBackground />
          <div className="text-center relative z-10">
            <Loader2 className="h-16 w-16 text-arcane-accent mx-auto mb-4 animate-spin" />
            <p className="text-arcane-grey">Chargement du marché...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-arcane-darkBorder bg-arcane-dark/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                  Marché des Joueurs
                </h1>
                <p className="text-arcane-grey text-sm mt-1">
                  Gérez vos prospects et suivez les transferts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-arcane-accent/30 text-arcane-accent hover:bg-arcane-accent/10"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                <Button className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau joueur
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcane-grey" />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20"
              />
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="container mx-auto px-4 py-6 h-full">
            {!selectedBoard || selectedBoard.columns.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <GlassCard className="p-12 text-center max-w-md">
                  <Trophy className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Aucun tableau disponible
                  </h3>
                  <p className="text-arcane-grey mb-6">
                    Créez votre premier tableau pour commencer à suivre les joueurs
                  </p>
                  <Button className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un tableau
                  </Button>
                </GlassCard>
              </div>
            ) : (
              <div className="flex gap-4 h-full pb-4">
                {selectedBoard.columns
                  .sort((a, b) => a.position - b.position)
                  .map((column) => {
                    const Icon = getColumnIcon(column.type);
                    const filteredCards = column.cards.filter((card) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return card.player.fullName.toLowerCase().includes(query);
                    });

                    return (
                      <div key={column.id} className="flex-shrink-0 w-80">
                        <div className="h-full flex flex-col">
                          {/* Column Header */}
                          <div
                            className="mb-3 p-3 rounded-lg border"
                            style={{
                              backgroundColor: column.color
                                ? `${column.color}20`
                                : "rgba(228, 255, 59, 0.1)",
                              borderColor: column.color
                                ? `${column.color}50`
                                : "rgba(228, 255, 59, 0.3)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-arcane-accent" />
                                <h3 className="font-bold text-white">{column.name}</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-arcane-grey">
                                  {filteredCards.length}
                                  {column.cardLimit && ` / ${column.cardLimit}`}
                                </span>
                                <button className="text-arcane-grey hover:text-white transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Cards Container */}
                          <div
                            className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(column.id)}
                          >
                            <AnimatePresence>
                              {filteredCards
                                .sort((a, b) => a.position - b.position)
                                .map((card) => {
                                  const PriorityIcon = priorityIcons[card.priority as keyof typeof priorityIcons] || Clock;

                                  return (
                                    <motion.div
                                      key={card.id}
                                      layout
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      draggable
                                      onDragStart={() => handleDragStart(card)}
                                      className="cursor-move"
                                    >
                                      <GlassCard className="p-4 hover:border-arcane-accent/50 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center gap-3 flex-1">
                                            {card.player.avatar ? (
                                              <Image
                                                src={card.player.avatar}
                                                alt={card.player.fullName}
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 rounded-full object-cover"
                                              />
                                            ) : (
                                              <div className="h-10 w-10 rounded-full bg-arcane-accent/20 flex items-center justify-center">
                                                <User className="h-5 w-5 text-arcane-accent" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-white text-sm truncate">
                                                {card.player.fullName}
                                              </h4>
                                              <p className="text-xs text-arcane-grey">
                                                {card.player.position || "N/A"} •{" "}
                                                {card.player.age || "N/A"} ans
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteCard(card.id)}
                                            className="text-arcane-grey hover:text-red-400 transition-colors"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>

                                        {card.notes && (
                                          <p className="text-xs text-arcane-grey mb-3 line-clamp-2">
                                            {card.notes}
                                          </p>
                                        )}

                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span
                                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                              priorityColors[card.priority as keyof typeof priorityColors] ||
                                              priorityColors.MEDIUM
                                            } flex items-center gap-1`}
                                          >
                                            <PriorityIcon className="h-2.5 w-2.5" />
                                            {card.priority}
                                          </span>
                                          {card.tags.map((tag, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-0.5 rounded text-xs bg-arcane-darkBorder/50 text-arcane-grey border border-arcane-darkBorder"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>

                                        {card.dueDate && (
                                          <div className="mt-3 flex items-center gap-1 text-xs text-arcane-grey">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(card.dueDate).toLocaleDateString("fr-FR")}
                                          </div>
                                        )}
                                      </GlassCard>
                                    </motion.div>
                                  );
                                })}
                            </AnimatePresence>

                            {filteredCards.length === 0 && (
                              <div className="text-center py-8 text-arcane-grey text-sm">
                                Aucune carte
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Add Column Button */}
                <div className="flex-shrink-0 w-80">
                  <button className="w-full h-32 rounded-lg border-2 border-dashed border-arcane-darkBorder hover:border-arcane-accent/50 text-arcane-grey hover:text-arcane-accent transition-all flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="font-bold">Ajouter une colonne</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(228, 255, 59, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(228, 255, 59, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(228, 255, 59, 0.3);
        }
      `}</style>
      </div>
    </MainLayout>
  );
}
