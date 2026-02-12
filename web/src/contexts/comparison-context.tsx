"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

interface ComparisonContextType {
  comparisonPlayerIds: string[];
  isInComparison: (playerId: string) => boolean;
  addToComparison: (playerId: string) => void;
  removeFromComparison: (playerId: string) => void;
  toggleComparison: (playerId: string) => void;
  clearComparison: () => void;
  canAddMore: boolean;
  comparisonCount: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON_PLAYERS = 3;

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState<string[]>([]);

  const isInComparison = (playerId: string): boolean => {
    return comparisonPlayerIds.includes(playerId);
  };

  const canAddMore = comparisonPlayerIds.length < MAX_COMPARISON_PLAYERS;

  const addToComparison = (playerId: string) => {
    if (isInComparison(playerId)) {
      toast.error("This player is already in the comparison");
      return;
    }

    if (!canAddMore) {
      toast.error(`Maximum ${MAX_COMPARISON_PLAYERS} players for comparison`);
      return;
    }

    const newComparison = [...comparisonPlayerIds, playerId];
    setComparisonPlayerIds(newComparison);
    toast.success(`Added to comparison (${newComparison.length}/${MAX_COMPARISON_PLAYERS})`);
  };

  const removeFromComparison = (playerId: string) => {
    const newComparison = comparisonPlayerIds.filter((id) => id !== playerId);
    setComparisonPlayerIds(newComparison);
    toast.info("Player removed from comparison");
  };

  const toggleComparison = (playerId: string) => {
    if (isInComparison(playerId)) {
      removeFromComparison(playerId);
    } else {
      addToComparison(playerId);
    }
  };

  const clearComparison = () => {
    setComparisonPlayerIds([]);
    toast.info("Comparison cleared");
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparisonPlayerIds,
        isInComparison,
        addToComparison,
        removeFromComparison,
        toggleComparison,
        clearComparison,
        canAddMore,
        comparisonCount: comparisonPlayerIds.length,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison(): ComparisonContextType {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }
  return context;
}
