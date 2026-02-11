import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import api from './api';

export interface RecentPlayer {
  id: string;
  fullName: string;
  position?: string;
  clubName?: string;
  photoUrl?: string;
  lastViewedAt: string;
}

const MAX_RECENT_PLAYERS = 12;

const parseRecentPlayers = (raw: string | null): RecentPlayer[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.id && item?.fullName);
  } catch {
    return [];
  }
};

const saveRecentPlayers = async (players: RecentPlayer[]) => {
  await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PLAYERS, JSON.stringify(players));
};

export const loadRecentPlayers = async (): Promise<RecentPlayer[]> => {
  try {
    const remote = await api.getRecentPlayerViews(MAX_RECENT_PLAYERS);
    if (Array.isArray(remote)) {
      await saveRecentPlayers(remote as RecentPlayer[]);
      return remote as RecentPlayer[];
    }
  } catch {
    // fallback to local cache
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_PLAYERS);
    return parseRecentPlayers(raw);
  } catch {
    return [];
  }
};

export const trackRecentPlayer = async (
  player: RecentPlayer,
  options?: { source?: string },
): Promise<RecentPlayer[]> => {
  try {
    await api.recordPlayerView(player.id, { source: options?.source ?? 'mobile' });
  } catch {
    // ignore remote errors for offline usage
  }

  try {
    const current = await loadRecentPlayers();
    const normalized: RecentPlayer = {
      ...player,
      fullName: player.fullName?.trim() || 'Unknown Player',
      lastViewedAt: new Date().toISOString(),
    };

    const updated = [normalized, ...current.filter((item) => item.id !== player.id)].slice(
      0,
      MAX_RECENT_PLAYERS,
    );
    await saveRecentPlayers(updated);
    return updated;
  } catch {
    return [];
  }
};

export const removeRecentPlayer = async (playerId: string): Promise<RecentPlayer[]> => {
  try {
    const current = await loadRecentPlayers();
    const updated = current.filter((item) => item.id !== playerId);
    await saveRecentPlayers(updated);
    return updated;
  } catch {
    return [];
  }
};

export const clearRecentPlayers = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_PLAYERS);
  } catch {
    // ignore storage cleanup errors
  }
};
