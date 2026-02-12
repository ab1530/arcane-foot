/**
 * Passport Type Definitions
 * Types for the Player Passport feature - digital identity cards for players
 */

import { Player } from './index';

/**
 * Passport verification status
 */
export enum PassportVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * Base Passport interface
 */
export interface Passport {
  id: string;
  playerId: string;
  player?: Player;
  token: string;
  verified: boolean;
  verificationStatus: PassportVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  qrCodeUrl?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating a new passport
 */
export interface CreatePassportDto {
  playerId: string;
  additionalData?: {
    emergencyContact?: string;
    medicalInfo?: string;
    notes?: string;
  };
}

/**
 * DTO for verifying a passport (Admin only)
 */
export interface VerifyPassportDto {
  verified: boolean;
  verificationStatus: PassportVerificationStatus;
  adminNotes?: string;
}

/**
 * Response from passport creation/retrieval
 */
export interface PassportResponse {
  passport: Passport;
  qrCodeUrl?: string;
  publicUrl?: string;
}

/**
 * Public passport view data (accessible via QR code token)
 */
export interface PublicPassportData {
  token: string;
  player: {
    id: string;
    name: string;
    position?: string;
    nationality?: string;
    age?: number;
    club?: {
      id: string;
      name: string;
      logo?: string;
    };
  };
  verified: boolean;
  verificationStatus: PassportVerificationStatus;
  createdAt: string;
}

/**
 * Passport validation result
 */
export interface PassportValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Passport share options
 */
export interface PassportShareOptions {
  includeQRCode: boolean;
  format: 'image' | 'pdf' | 'link';
  customMessage?: string;
}

/**
 * Passport statistics (for admin)
 */
export interface PassportStatistics {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  recentCreations: Passport[];
}
