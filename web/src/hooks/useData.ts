/**
 * React Query Hooks for Data Management
 *
 * Clean hooks for Players, Clubs, Reports, and Matches with NO mocks.
 * All data comes from real API endpoints via apiClient.
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const DATA_KEYS = {
  all: ['data'] as const,
  dashboard: () => [...DATA_KEYS.all, 'dashboard'] as const,
  platformOverview: () => [...DATA_KEYS.all, 'platform-overview'] as const,

  // Players
  players: () => [...DATA_KEYS.all, 'players'] as const,
  player: (id: string) => [...DATA_KEYS.players(), id] as const,

  // Clubs
  clubs: () => [...DATA_KEYS.all, 'clubs'] as const,
  club: (id: string) => [...DATA_KEYS.clubs(), id] as const,

  // Reports
  reports: () => [...DATA_KEYS.all, 'reports'] as const,
  report: (id: string) => [...DATA_KEYS.reports(), id] as const,

  // Matches
  matches: () => [...DATA_KEYS.all, 'matches'] as const,
  match: (id: string) => [...DATA_KEYS.matches(), id] as const,
};

// ============================================================================
// PLAYERS HOOKS
// ============================================================================

/**
 * Get all players with optional filtering
 */
export const usePlayers = (
  params?: { page?: number; limit?: number; search?: string },
  options?: Omit<UseQueryOptions<{ data: any[]; meta?: any }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...DATA_KEYS.players(), params],
    queryFn: () => apiClient.getPlayers(params),
    staleTime: 60000, // 1 minute
    ...options,
  });
};

/**
 * Get a single player by ID
 */
export const usePlayer = (
  id: string,
  options?: Omit<UseQueryOptions<{ player: any }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: DATA_KEYS.player(id),
    queryFn: () => apiClient.getPlayer(id),
    staleTime: 300000, // 5 minutes
    enabled: !!id,
    ...options,
  });
};

/**
 * Create a new player
 */
export const useCreatePlayer = (options?: UseMutationOptions<{ player: any }, Error, any>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.createPlayer(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.players() });
      toast.success('Player created successfully', {
        description: `${data.player.firstName} ${data.player.lastName}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create player', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Update a player
 */
export const useUpdatePlayer = (options?: UseMutationOptions<{ player: any }, Error, { id: string; data: any }>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePlayer(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.player(id) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.players() });
      toast.success('Player updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update player', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Delete a player
 */
export const useDeletePlayer = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deletePlayer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.players() });
      toast.success('Player deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete player', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

// ============================================================================
// CLUBS HOOKS
// ============================================================================

/**
 * Get all clubs with optional filtering
 */
export const useClubs = (
  params?: { page?: number; limit?: number; search?: string },
  options?: Omit<UseQueryOptions<{ data: any[]; meta: any }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...DATA_KEYS.clubs(), params],
    queryFn: () => apiClient.getClubs(params),
    staleTime: 300000, // 5 minutes (clubs change rarely)
    ...options,
  });
};

/**
 * Get a single club by ID
 */
export const useClub = (
  id: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: DATA_KEYS.club(id),
    queryFn: () => apiClient.getClub(id),
    staleTime: 300000, // 5 minutes
    enabled: !!id,
    ...options,
  });
};

// ============================================================================
// REPORTS HOOKS
// ============================================================================

/**
 * Get all scouting reports with optional filtering
 */
export const useReports = (
  params?: {
    status?: string;
    playerId?: string;
    scoutId?: string;
    matchId?: string;
    page?: number;
    limit?: number;
  },
  options?: Omit<UseQueryOptions<{ data: any[]; meta: any }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...DATA_KEYS.reports(), params],
    queryFn: () => apiClient.getScoutingReports(params),
    staleTime: 60000, // 1 minute
    ...options,
  });
};

/**
 * Get a single scouting report by ID
 */
export const useReport = (
  id: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: DATA_KEYS.report(id),
    queryFn: () => apiClient.getScoutingReport(id),
    staleTime: 300000, // 5 minutes
    enabled: !!id,
    ...options,
  });
};

/**
 * Create a scouting report
 */
export const useCreateReport = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.createScoutingReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.reports() });
      toast.success('Scouting report created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create report', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Update a scouting report
 */
export const useUpdateReport = (
  options?: UseMutationOptions<any, Error, { id: string; data: any }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateScoutingReport(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.report(id) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.reports() });
      toast.success('Report updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update report', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Delete a scouting report
 */
export const useDeleteReport = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteScoutingReport(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.reports() });
      toast.success('Report deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete report', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Submit a scouting report
 */
export const useSubmitReport = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.submitScoutingReport(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.report(id) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.reports() });
      toast.success('Report submitted for review');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit report', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Review a scouting report (approve/reject)
 */
export const useReviewReport = (
  options?: UseMutationOptions<any, Error, { id: string; approved: boolean }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      apiClient.reviewScoutingReport(id, approved),
    onSuccess: (response, { id, approved }) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.report(id) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.reports() });
      toast.success(approved ? 'Report approved' : 'Report rejected');
    },
    onError: (error: Error) => {
      toast.error('Failed to review report', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

// ============================================================================
// MATCHES HOOKS
// ============================================================================

/**
 * Get all matches with optional filtering
 */
export const useMatches = (
  params?: {
    status?: string;
    clubId?: string;
    scoutId?: string;
    competition?: string;
    season?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  },
  options?: Omit<UseQueryOptions<{ data: any[]; meta: any }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...DATA_KEYS.matches(), params],
    queryFn: () => apiClient.getMatches(params),
    staleTime: 60000, // 1 minute
    ...options,
  });
};

/**
 * Get a single match by ID
 */
export const useMatch = (
  id: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: DATA_KEYS.match(id),
    queryFn: () => apiClient.getMatch(id),
    staleTime: 60000, // 1 minute
    enabled: !!id,
    ...options,
  });
};

/**
 * Create a match
 */
export const useCreateMatch = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => apiClient.createMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.matches() });
      toast.success('Match created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create match', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Update a match
 */
export const useUpdateMatch = (
  options?: UseMutationOptions<any, Error, { id: string; data: any }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateMatch(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.match(id) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.matches() });
      toast.success('Match updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update match', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Delete a match
 */
export const useDeleteMatch = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteMatch(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.matches() });
      toast.success('Match deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete match', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Assign a scout to a match
 */
export const useAssignScout = (
  options?: UseMutationOptions<any, Error, { matchId: string; scoutId: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, scoutId }: { matchId: string; scoutId: string }) =>
      apiClient.assignScoutToMatch(matchId, scoutId),
    onSuccess: (response, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.match(matchId) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.matches() });
      toast.success('Scout assigned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign scout', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

/**
 * Update match score
 */
export const useUpdateMatchScore = (
  options?: UseMutationOptions<any, Error, { matchId: string; homeScore: number; awayScore: number }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }: { matchId: string; homeScore: number; awayScore: number }) =>
      apiClient.updateMatchScore(matchId, homeScore, awayScore),
    onSuccess: (response, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.match(matchId) });
      queryClient.invalidateQueries({ queryKey: DATA_KEYS.matches() });
      toast.success('Match score updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update score', {
        description: error.message || 'Please try again later',
      });
    },
    ...options,
  });
};

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Get dashboard stats (players, reports, matches)
 */
export const useDashboardStats = (
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: DATA_KEYS.dashboard(),
    queryFn: () => apiClient.getDashboardAnalytics(),
    staleTime: 60000,
    ...options,
  });
};

export const usePlatformOverview = (
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: DATA_KEYS.platformOverview(),
    queryFn: () => apiClient.getPlatformOverviewAnalytics(),
    staleTime: 60000,
    ...options,
  });
};

/**
 * Prefetch data for better performance
 */
export const usePrefetchData = () => {
  const queryClient = useQueryClient();

  const prefetchPlayers = () => {
    queryClient.prefetchQuery({
      queryKey: DATA_KEYS.players(),
      queryFn: () => apiClient.getPlayers(),
      staleTime: 60000,
    });
  };

  const prefetchClubs = () => {
    queryClient.prefetchQuery({
      queryKey: DATA_KEYS.clubs(),
      queryFn: () => apiClient.getClubs(),
      staleTime: 300000,
    });
  };

  const prefetchReports = () => {
    queryClient.prefetchQuery({
      queryKey: DATA_KEYS.reports(),
      queryFn: () => apiClient.getReports(),
      staleTime: 60000,
    });
  };

  const prefetchMatches = () => {
    queryClient.prefetchQuery({
      queryKey: DATA_KEYS.matches(),
      queryFn: () => apiClient.getMatches(),
      staleTime: 60000,
    });
  };

  return {
    prefetchPlayers,
    prefetchClubs,
    prefetchReports,
    prefetchMatches,
    prefetchAll: () => {
      prefetchPlayers();
      prefetchClubs();
      prefetchReports();
      prefetchMatches();
    },
  };
};

/**
 * Invalidate all data queries
 */
export const useInvalidateData = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: DATA_KEYS.all });
  };
};
