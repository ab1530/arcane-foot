import React, { createContext, useState, useContext, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { showSuccess, showError } from '../services/toast';

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

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState<string[]>([]);

  const isInComparison = (playerId: string): boolean => {
    return comparisonPlayerIds.includes(playerId);
  };

  const canAddMore = comparisonPlayerIds.length < MAX_COMPARISON_PLAYERS;

  const addToComparison = (playerId: string) => {
    if (isInComparison(playerId)) {
      showError('Ce joueur est déjà dans la comparaison');
      return;
    }

    if (!canAddMore) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(`Maximum ${MAX_COMPARISON_PLAYERS} joueurs pour la comparaison`);
      return;
    }

    const newComparison = [...comparisonPlayerIds, playerId];
    setComparisonPlayerIds(newComparison);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess(`Ajouté à la comparaison (${newComparison.length}/${MAX_COMPARISON_PLAYERS})`);
  };

  const removeFromComparison = (playerId: string) => {
    const newComparison = comparisonPlayerIds.filter(id => id !== playerId);
    setComparisonPlayerIds(newComparison);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
};

export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
};