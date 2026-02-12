/**
 * usePassport Hook
 * Custom React hooks for managing passport CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { logger, logError } from '../utils/logger';
import passportService from '../services/passportService';
import {
  Passport,
  PassportResponse,
  CreatePassportDto,
  VerifyPassportDto,
  PublicPassportData,
  PassportVerificationStatus,
} from '../types/passport';

/**
 * Hook for getting current user's passport
 */
export const useMyPassport = () => {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPassport = useCallback(async (useCache: boolean = true) => {
    try {
      setError(null);
      const data = await passportService.getMyPassport(useCache);
      setPassport(data);
      logger.info('My passport loaded', { passportId: data.id });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load passport';
      setError(errorMessage);
      logError('Failed to fetch my passport', err);
      setPassport(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPassport(false); // Force refresh without cache
  }, [fetchPassport]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  return {
    passport,
    loading,
    error,
    refreshing,
    refresh,
  };
};

/**
 * Hook for getting passport by player ID
 */
export const usePassportByPlayer = (playerId: string | null) => {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = useCallback(async (useCache: boolean = true) => {
    if (!playerId) {
      setPassport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await passportService.getPassportByPlayer(playerId, useCache);
      setPassport(data);
      logger.info('Player passport loaded', { playerId, passportId: data.id });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load passport';
      setError(errorMessage);
      logError('Failed to fetch player passport', err);
      setPassport(null);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const refresh = useCallback(async () => {
    await fetchPassport(false); // Force refresh without cache
  }, [fetchPassport]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  return {
    passport,
    loading,
    error,
    refresh,
  };
};

/**
 * Hook for getting public passport by token (QR code scan)
 */
export const usePublicPassport = (token: string | null) => {
  const [passport, setPassport] = useState<PublicPassportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = useCallback(async () => {
    if (!token) {
      setPassport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await passportService.getPassportByToken(token);
      setPassport(data);
      logger.info('Public passport loaded', { token: token.substring(0, 8) + '...' });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load passport';
      setError(errorMessage);
      logError('Failed to fetch public passport', err);
      setPassport(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  return {
    passport,
    loading,
    error,
    refresh: fetchPassport,
  };
};

/**
 * Hook for creating a new passport
 */
export const useCreatePassport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createPassport = useCallback(async (dto: CreatePassportDto): Promise<PassportResponse | null> => {
    // Validate data
    const validation = passportService.validatePassportData(dto);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await passportService.createPassport(dto);
      setSuccess(true);
      logger.info('Passport created successfully', { passportId: response.passport?.id });
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create passport';
      setError(errorMessage);
      logError('Failed to create passport', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    createPassport,
    loading,
    error,
    success,
    reset,
  };
};

/**
 * Hook for verifying a passport (Admin only)
 */
export const useVerifyPassport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verifyPassport = useCallback(
    async (playerId: string, dto: VerifyPassportDto): Promise<Passport | null> => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const passport = await passportService.verifyPassport(playerId, dto);
        setSuccess(true);
        logger.info('Passport verified successfully', { passportId: passport.id, verified: dto.verified });
        return passport;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to verify passport';
        setError(errorMessage);
        logError('Failed to verify passport', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    verifyPassport,
    loading,
    error,
    success,
    reset,
  };
};

/**
 * Hook for deleting a passport
 */
export const useDeletePassport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deletePassport = useCallback(async (playerId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await passportService.deletePassport(playerId);
      setSuccess(true);
      logger.info('Passport deleted successfully', { playerId });
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete passport';
      setError(errorMessage);
      logError('Failed to delete passport', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    deletePassport,
    loading,
    error,
    success,
    reset,
  };
};

/**
 * Hook for passport operations with optimistic updates
 */
export const usePassportOperations = (playerId: string) => {
  const { passport, loading: fetchLoading, error: fetchError, refresh } = usePassportByPlayer(playerId);
  const { createPassport, loading: createLoading } = useCreatePassport();
  const { verifyPassport, loading: verifyLoading } = useVerifyPassport();
  const { deletePassport, loading: deleteLoading } = useDeletePassport();

  const [optimisticPassport, setOptimisticPassport] = useState<Passport | null>(null);

  useEffect(() => {
    setOptimisticPassport(passport);
  }, [passport]);

  const handleCreate = useCallback(
    async (dto: CreatePassportDto) => {
      const result = await createPassport(dto);
      if (result) {
        await refresh();
      }
      return result;
    },
    [createPassport, refresh]
  );

  const handleVerify = useCallback(
    async (dto: VerifyPassportDto) => {
      // Optimistic update
      if (optimisticPassport) {
        setOptimisticPassport({
          ...optimisticPassport,
          verified: dto.verified,
          verificationStatus: dto.verificationStatus,
          adminNotes: dto.adminNotes,
        });
      }

      const result = await verifyPassport(playerId, dto);
      if (result) {
        await refresh();
      } else {
        // Revert optimistic update on failure
        setOptimisticPassport(passport);
      }
      return result;
    },
    [playerId, optimisticPassport, passport, verifyPassport, refresh]
  );

  const handleDelete = useCallback(async () => {
    // Optimistic update
    setOptimisticPassport(null);

    const result = await deletePassport(playerId);
    if (!result) {
      // Revert optimistic update on failure
      setOptimisticPassport(passport);
    }
    return result;
  }, [playerId, passport, deletePassport]);

  return {
    passport: optimisticPassport,
    loading: fetchLoading || createLoading || verifyLoading || deleteLoading,
    error: fetchError,
    refresh,
    createPassport: handleCreate,
    verifyPassport: handleVerify,
    deletePassport: handleDelete,
  };
};

/**
 * Hook for passport helpers
 */
export const usePassportHelpers = () => {
  const generatePublicUrl = useCallback((token: string) => {
    return passportService.generatePublicUrl(token);
  }, []);

  const generateQRCodeValue = useCallback((token: string) => {
    return passportService.generateQRCodeValue(token);
  }, []);

  const getVerificationStatusInfo = useCallback((status: PassportVerificationStatus) => {
    return passportService.getVerificationStatusInfo(status);
  }, []);

  const canVerifyPassport = useCallback((userRole?: string) => {
    return passportService.canVerifyPassport(userRole);
  }, []);

  const validatePassportData = useCallback((dto: CreatePassportDto) => {
    return passportService.validatePassportData(dto);
  }, []);

  return {
    generatePublicUrl,
    generateQRCodeValue,
    getVerificationStatusInfo,
    canVerifyPassport,
    validatePassportData,
  };
};
