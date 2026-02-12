/**
 * Camp Types
 * Types for training camps, detection days, and showcases
 */

export interface Camp {
  id: string;
  name: string;
  description: string;
  type: CampType;
  status: CampStatus;
  location: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  capacity: number;
  availableSpots: number;
  ageMin?: number;
  ageMax?: number;
  price: number;
  currency: string;
  requiresPayment: boolean;
  requiredTier?: string;
  coverImage?: string;
  includedBenefits: string[];
  hasShowcaseGame: boolean;
  club?: {
    id: string;
    name: string;
    logo?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  participants?: CampParticipant[];
}

export type CampType = 'CAMP' | 'DETECTION' | 'SHOWCASE' | 'TRAINING';

export type CampStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface CampParticipant {
  id: string;
  campId: string;
  playerId: string;
  status: ParticipantStatus;
  registeredAt: string;
  parentalConsentGiven?: boolean;
  parentalConsentUrl?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  medicalWaiverSigned?: boolean;
  medicalWaiverUrl?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  player?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    position: string;
    nationality: string;
    dateOfBirth: string;
  };
}

export type ParticipantStatus = 'REGISTERED' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';

export interface CampRegistrationData {
  playerId: string;
  parentalConsentGiven?: boolean;
  parentalConsentUrl?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  medicalWaiverSigned?: boolean;
  medicalWaiverUrl?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
}

// Helper types for UI
export interface CampFilters {
  type?: CampType;
  status?: CampStatus;
  upcoming?: boolean;
  isPublic?: boolean;
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export const campTypeLabels: Record<CampType, string> = {
  'CAMP': 'Camp',
  'DETECTION': 'Détection',
  'SHOWCASE': 'Showcase',
  'TRAINING': 'Stage',
};

export const campTypeColors: Record<CampType, string> = {
  'CAMP': '#3B82F6', // Blue
  'DETECTION': '#A855F7', // Purple
  'SHOWCASE': '#F97316', // Orange
  'TRAINING': '#10B981', // Green
};