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

export type ProfileStatValue = string | number | boolean | null;

export interface ProfileStatItem {
  key: string;
  value: ProfileStatValue;
}

export interface ProfileMediaHighlight {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  filename: string | null;
  duration: number | null;
  uploadedAt: string | null;
}

export interface PublicProfileView {
  identity: {
    playerId: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    position: string | null;
    nationality: string | null;
    club: { name: string; logo?: string | null } | null;
    avatarUrl: string | null;
  };
  market: {
    marketValue: number | null;
    contractUntil: string | null;
    externalMarketUrl: string | null;
  };
  physical: {
    age: number | null;
    height: number | null;
    weight: number | null;
    preferredFoot: string | null;
  };
  scouting: {
    averageRating: number | null;
    totalReports: number;
    lastReportAt: string | null;
    recommendation: string | null;
    strengthsTop: string[];
    weaknessesTop: string[];
  };
  stats: {
    snapshot: Record<string, ProfileStatValue>;
    keyStats: ProfileStatItem[];
  };
  mediaHighlights: ProfileMediaHighlight[];
  lastUpdatedAt: string;
}

export interface Passport {
  id: string;
  playerId: string;
  status: PassportStatus;
  publicToken: string;
  verifiedAt?: string;
  expiresAt?: string;
  passportData: PassportData;
  profileView?: PublicProfileView;
  publicProfile?: PublicProfileView;
  qrCodeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPassportTokenResponse extends Passport {
  publicProfile: PublicProfileView;
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
