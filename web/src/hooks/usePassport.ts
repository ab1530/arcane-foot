/**
 * Passport Hooks
 * React Query hooks for passport operations including creation, verification, and fetching
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { passportService } from '@/services/passportService';
import { isAdminRole, type UserRole } from '@/lib/roles';
import {
  Passport,
  CreatePassportDto,
  VerifyPassportDto,
  PassportResponse,
} from '@/types/passport';

/**
 * Query keys for passport-related queries
 */
export const passportKeys = {
  all: ['passports'] as const,
  myPassport: () => [...passportKeys.all, 'me'] as const,
  byPlayer: (playerId: string) => [...passportKeys.all, 'player', playerId] as const,
  byToken: (token: string) => [...passportKeys.all, 'token', token] as const,
};

/**
 * Hook to fetch the current user's passport
 * @param playerId - The player ID of the current user
 */
export function useMyPassport(playerId?: string) {
  return useQuery<Passport, Error>({
    queryKey: passportKeys.myPassport(),
    queryFn: () => {
      if (!playerId) {
        throw new Error('Player ID is required');
      }
      return passportService.getMyPassport(playerId);
    },
    enabled: !!playerId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a passport by player ID (requires authentication)
 */
export function usePassportByPlayer(playerId: string, enabled = true) {
  return useQuery<Passport, Error>({
    queryKey: passportKeys.byPlayer(playerId),
    queryFn: () => passportService.getPassportByPlayer(playerId),
    enabled: enabled && !!playerId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a passport by public token (no authentication required)
 */
export function usePassportByToken(token: string, enabled = true) {
  return useQuery<Passport, Error>({
    queryKey: passportKeys.byToken(token),
    queryFn: () => passportService.getPassportByToken(token),
    enabled: enabled && !!token,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new passport
 */
export function useCreatePassport() {
  const queryClient = useQueryClient();

  return useMutation<PassportResponse, Error, CreatePassportDto>({
    mutationFn: (data: CreatePassportDto) => passportService.createPassport(data),
    onSuccess: (data, variables) => {
      toast.success('Passport created successfully');

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: passportKeys.all });
      queryClient.invalidateQueries({ queryKey: passportKeys.byPlayer(variables.playerId) });
      queryClient.invalidateQueries({ queryKey: passportKeys.myPassport() });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create passport');
    },
  });
}

/**
 * Hook to verify a passport (admin only)
 */
export function useVerifyPassport() {
  const queryClient = useQueryClient();

  return useMutation<
    PassportResponse,
    Error,
    { playerId: string; data: VerifyPassportDto }
  >({
    mutationFn: ({ playerId, data }) => passportService.verifyPassport(playerId, data),
    onSuccess: (data, variables) => {
      const status = variables.data.verified ? 'verified' : 'rejected';
      toast.success(`Passport ${status} successfully`);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: passportKeys.all });
      queryClient.invalidateQueries({ queryKey: passportKeys.byPlayer(variables.playerId) });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify passport');
    },
  });
}

/**
 * Hook to delete a passport
 */
export function useDeletePassport() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (playerId: string) => passportService.deletePassport(playerId),
    onSuccess: (_, playerId) => {
      toast.success('Passport deleted successfully');

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: passportKeys.all });
      queryClient.invalidateQueries({ queryKey: passportKeys.byPlayer(playerId) });
      queryClient.invalidateQueries({ queryKey: passportKeys.myPassport() });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete passport');
    },
  });
}

/**
 * Hook to generate QR code client-side
 */
export function useGenerateQRCode() {
  return useMutation<string, Error, { token: string; baseUrl?: string }>({
    mutationFn: ({ token, baseUrl }) =>
      passportService.generateQRCodeDataURL(token, baseUrl),
    onError: (error) => {
      toast.error(error.message || 'Failed to generate QR code');
    },
  });
}

/**
 * Hook to download QR code
 */
export function useDownloadQRCode() {
  return useMutation<void, Error, { token: string; filename?: string }>({
    mutationFn: ({ token, filename }) =>
      passportService.downloadQRCode(token, filename),
    onSuccess: () => {
      toast.success('QR code downloaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to download QR code');
    },
  });
}

/**
 * Hook to copy passport URL to clipboard
 */
export function useCopyPassportURL() {
  return useMutation<void, Error, { token: string; baseUrl?: string }>({
    mutationFn: ({ token, baseUrl }) =>
      passportService.copyPassportURLToClipboard(token, baseUrl),
    onSuccess: () => {
      toast.success('Passport URL copied to clipboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to copy URL');
    },
  });
}

/**
 * Utility hook to check if user can manage passport (admin or owner)
 */
export function useCanManagePassport(playerId?: string) {
  // Get current user from local storage or context
  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem('arcane_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch {
      return null;
    }
    return null;
  };

  const user = getCurrentUser();
  const userRole = (user?.role ?? null) as UserRole | null;
  const isAdmin = isAdminRole(userRole ?? undefined);
  const isOwner = user?.id && playerId && user.id === playerId;

  return {
    canManage: isAdmin || isOwner,
    canVerify: isAdmin,
    canDelete: isAdmin,
    canCreate: isAdmin || userRole === 'SCOUT' || userRole === 'AGENT',
    isAdmin,
    isOwner,
  };
}

/**
 * Composite hook for passport management
 * Provides all passport operations in one hook
 */
export function usePassportManagement(playerId?: string) {
  const passportQuery = usePassportByPlayer(playerId || '', !!playerId);
  const createMutation = useCreatePassport();
  const verifyMutation = useVerifyPassport();
  const deleteMutation = useDeletePassport();
  const permissions = useCanManagePassport(playerId);

  return {
    passport: passportQuery.data,
    isLoading: passportQuery.isLoading,
    isError: passportQuery.isError,
    error: passportQuery.error,
    refetch: passportQuery.refetch,

    createPassport: createMutation.mutate,
    isCreating: createMutation.isPending,

    verifyPassport: (data: VerifyPassportDto) =>
      playerId && verifyMutation.mutate({ playerId, data }),
    isVerifying: verifyMutation.isPending,

    deletePassport: () => playerId && deleteMutation.mutate(playerId),
    isDeleting: deleteMutation.isPending,

    ...permissions,
  };
}

/**
 * Hook for passport status information
 */
export function usePassportStatus(passport?: Passport | null) {
  if (!passport) {
    return {
      statusInfo: null,
      isExpired: false,
      isVerified: false,
      isPending: false,
      isRevoked: false,
    };
  }

  const statusInfo = passportService.getPassportStatusInfo(passport.status);
  const isExpired = passportService.isPassportExpired(passport);
  const isVerified = passportService.isPassportVerified(passport);
  const isPending = passport.status === 'PENDING';
  const isRevoked = passport.status === 'REVOKED';

  return {
    statusInfo,
    isExpired,
    isVerified,
    isPending,
    isRevoked,
  };
}
