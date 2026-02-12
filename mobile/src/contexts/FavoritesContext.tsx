import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { showSuccess } from '../services/toast';

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

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const ids = JSON.parse(stored);
        setFavoritePlayerIds(Array.isArray(ids) ? ids : []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Ajouté aux favoris');
    }
  };

  const removeFavorite = (playerId: string) => {
    const newFavorites = favoritePlayerIds.filter(id => id !== playerId);
    setFavoritePlayerIds(newFavorites);
    saveFavorites(newFavorites);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    AsyncStorage.removeItem(FAVORITES_KEY);
  };

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