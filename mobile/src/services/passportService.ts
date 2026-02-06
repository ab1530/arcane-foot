/**
 * Passport Service
 * Service layer for passport operations with caching, validation, and helpers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { logger, logError } from '../utils/logger';
import { isAdminRole } from '../lib/roles';
import {
  Passport,
  PassportResponse,
  CreatePassportDto,
  VerifyPassportDto,
  PassportValidation,
  PublicPassportData,
  PassportVerificationStatus,
} from '../types/passport';

// Cache keys
const CACHE_KEYS = {
  MY_PASSPORT: 'passport_my',
  PLAYER_PASSPORT_PREFIX: 'passport_player_',
  PUBLIC_PASSPORT_PREFIX: 'passport_public_',
};

// Cache expiry (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Passport Service Class
 */
class PassportService {
  /**
   * Create a new passport for a player
   */
  async createPassport(dto: CreatePassportDto): Promise<PassportResponse> {
    try {
      logger.info('Creating passport', { playerId: dto.playerId });
      const response = await api.createPassport(dto);

      // Clear cache for this player
      await this.clearPlayerCache(dto.playerId);

      logger.info('Passport created successfully', { passportId: response.id });
      return response;
    } catch (error) {
      logError('Failed to create passport', error);
      throw error;
    }
  }

  /**
   * Get passport by player ID with caching
   */
  async getPassportByPlayer(playerId: string, useCache: boolean = true): Promise<Passport> {
    try {
      // Try cache first if enabled
      if (useCache) {
        const cached = await this.getCachedPassport(CACHE_KEYS.PLAYER_PASSPORT_PREFIX + playerId);
        if (cached) {
          logger.info('Passport loaded from cache', { playerId });
          return cached;
        }
      }

      logger.info('Fetching passport by player', { playerId });
      const passport = await api.getPassportByPlayer(playerId);

      // Cache the result
      await this.cachePassport(CACHE_KEYS.PLAYER_PASSPORT_PREFIX + playerId, passport);

      return passport;
    } catch (error) {
      logError('Failed to get passport by player', error);
      throw error;
    }
  }

  /**
   * Get current user's passport with caching
   */
  async getMyPassport(useCache: boolean = true): Promise<Passport> {
    try {
      // Try cache first if enabled
      if (useCache) {
        const cached = await this.getCachedPassport(CACHE_KEYS.MY_PASSPORT);
        if (cached) {
          logger.info('My passport loaded from cache');
          return cached;
        }
      }

      logger.info('Fetching my passport');
      const passport = await api.getMyPassport();

      // Cache the result
      await this.cachePassport(CACHE_KEYS.MY_PASSPORT, passport);

      return passport;
    } catch (error) {
      logError('Failed to get my passport', error);
      throw error;
    }
  }

  /**
   * Get passport by public token (for QR code scanning)
   */
  async getPassportByToken(token: string): Promise<PublicPassportData> {
    try {
      logger.info('Fetching passport by token', { token: token.substring(0, 8) + '...' });
      const passport = await api.getPassportByToken(token);
      return passport;
    } catch (error) {
      logError('Failed to get passport by token', error);
      throw error;
    }
  }

  /**
   * Verify a passport (Admin only)
   */
  async verifyPassport(playerId: string, dto: VerifyPassportDto): Promise<Passport> {
    try {
      logger.info('Verifying passport', { playerId, verified: dto.verified });
      const passport = await api.verifyPassport(playerId, dto);

      // Clear cache for this player
      await this.clearPlayerCache(playerId);

      logger.info('Passport verified successfully', { passportId: passport.id });
      return passport;
    } catch (error) {
      logError('Failed to verify passport', error);
      throw error;
    }
  }

  /**
   * Delete a passport
   */
  async deletePassport(playerId: string): Promise<void> {
    try {
      logger.info('Deleting passport', { playerId });
      await api.deletePassport(playerId);

      // Clear cache for this player
      await this.clearPlayerCache(playerId);

      logger.info('Passport deleted successfully', { playerId });
    } catch (error) {
      logError('Failed to delete passport', error);
      throw error;
    }
  }

  /**
   * Validate passport data before creation
   */
  validatePassportData(dto: CreatePassportDto): PassportValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!dto.playerId || dto.playerId.trim() === '') {
      errors.push('Player ID is required');
    }

    if (dto.playerId && dto.playerId.length < 10) {
      warnings.push('Player ID seems too short');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate public passport URL for sharing
   */
  generatePublicUrl(token: string, baseUrl: string = 'https://arcane-football.com'): string {
    return `${baseUrl}/passport/${token}`;
  }

  /**
   * Check if user has admin rights to verify passports
   */
  canVerifyPassport(userRole?: string): boolean {
    return isAdminRole(userRole as any);
  }

  /**
   * Get verification status display info
   */
  getVerificationStatusInfo(status: PassportVerificationStatus) {
    switch (status) {
      case PassportVerificationStatus.VERIFIED:
        return {
          label: 'Verified',
          color: '#22C55E',
          icon: 'checkmark-circle' as const,
        };
      case PassportVerificationStatus.PENDING:
        return {
          label: 'Pending',
          color: '#F59E0B',
          icon: 'time' as const,
        };
      case PassportVerificationStatus.REJECTED:
        return {
          label: 'Rejected',
          color: '#EF4444',
          icon: 'close-circle' as const,
        };
      default:
        return {
          label: 'Unknown',
          color: '#9CA3AF',
          icon: 'help-circle' as const,
        };
    }
  }

  /**
   * Cache passport data
   */
  private async cachePassport(key: string, passport: Passport): Promise<void> {
    try {
      const cached: CachedData<Passport> = {
        data: passport,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      logError('Failed to cache passport', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Get cached passport
   */
  private async getCachedPassport(key: string): Promise<Passport | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const parsed: CachedData<Passport> = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      logError('Failed to get cached passport', error);
      return null;
    }
  }

  /**
   * Clear player passport cache
   */
  private async clearPlayerCache(playerId: string): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.MY_PASSPORT,
        CACHE_KEYS.PLAYER_PASSPORT_PREFIX + playerId,
      ]);
    } catch (error) {
      logError('Failed to clear passport cache', error);
    }
  }

  /**
   * Clear all passport cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const passportKeys = keys.filter(key =>
        key.startsWith('passport_')
      );
      await AsyncStorage.multiRemove(passportKeys);
      logger.info('All passport cache cleared');
    } catch (error) {
      logError('Failed to clear all passport cache', error);
    }
  }

  /**
   * Format passport for QR code display
   */
  formatPassportForQR(passport: Passport): string {
    return JSON.stringify({
      id: passport.id,
      playerId: passport.playerId,
      token: passport.token,
      verified: passport.verified,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate QR code value for passport
   */
  generateQRCodeValue(token: string): string {
    return this.generatePublicUrl(token);
  }
}

// Export singleton instance
export const passportService = new PassportService();
export default passportService;
