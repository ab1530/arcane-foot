"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface FavoritesContextType {
  favoritePlayerIds: string[];
  isFavorite: (playerId: string) => boolean;
  toggleFavorite: (playerId: string) => void;
  addFavorite: (playerId: string) => void;
  removeFavorite: (playerId: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_KEY = '@arcane_favorite_players';

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (stored) {
          const ids = JSON.parse(stored);
          setFavoritePlayerIds(Array.isArray(ids) ? ids : []);
        }
        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setIsLoaded(true);
    }
  };

  const saveFavorites = (ids: string[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const isFavorite = (playerId: string): boolean => {
    return favoritePlayerIds.includes(playerId);
  };

  const addFavorite = (playerId: string) => {
    if (!isFavorite(playerId)) {
      const newFavorites = [...favoritePlayerIds, playerId];
      setFavoritePlayerIds(newFavorites);
      saveFavorites(newFavorites);
      toast.success('Joueur ajouté aux favoris');
    }
  };

  const removeFavorite = (playerId: string) => {
    const newFavorites = favoritePlayerIds.filter(id => id !== playerId);
    setFavoritePlayerIds(newFavorites);
    saveFavorites(newFavorites);
    toast.success('Joueur retiré des favoris');
  };

  const toggleFavorite = (playerId: string) => {
    if (isFavorite(playerId)) {
      removeFavorite(playerId);
    } else {
      addFavorite(playerId);
    }
  };

  const clearFavorites = () => {
    setFavoritePlayerIds([]);
    saveFavorites([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FAVORITES_KEY);
    }
    toast.success('Tous les favoris ont été supprimés');
  };

  // Don't render children until favorites are loaded to prevent hydration issues
  if (!isLoaded) {
    return null;
  }

  return (
    <FavoritesContext.Provider
      value={{
        favoritePlayerIds,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
