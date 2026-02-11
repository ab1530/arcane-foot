/**
 * Passport Types
 * Types for player passport functionality including creation, verification, and viewing
 */

export type PassportStatus = "PENDING" | "VERIFIED" | "EXPIRED" | "REVOKED";

export interface PassportData {
  firstName: string;
  lastName: string;
  position: string;
  nationality: string;
  dateOfBirth: string;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  club?: {
    name: string;
    logo?: string;
  };
  avatar?: string;
  averageRating?: number;
  totalReports?: number;
}

export interface Passport {
  id: string;
  playerId: string;
  status: PassportStatus;
  publicToken: string;
  verifiedAt?: string;
  expiresAt?: string;
  passportData: PassportData;
  qrCodeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePassportDto {
  playerId: string;
  additionalData?: {
    notes?: string;
    customFields?: Record<string, any>;
  };
}

export interface VerifyPassportDto {
  verified: boolean;
  adminNotes?: string;
}

export interface PassportResponse {
  passport: Passport;
  message?: string;
}

export interface PassportListResponse {
  passports: Passport[];
  total: number;
  page?: number;
  limit?: number;
}

export interface PassportValidationError {
  field: string;
  message: string;
}

export interface PassportValidationResult {
  valid: boolean;
  errors?: PassportValidationError[];
}
