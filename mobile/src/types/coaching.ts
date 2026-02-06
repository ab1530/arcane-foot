/**
 * COACHING MODULE - TYPE DEFINITIONS
 * Complete TypeScript types for the Coaching Hub feature
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

// ============================================================================
// COACH TYPES
// ============================================================================

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  bio: string;
  rating: number;
  reviewCount: number;
  expertise: string[];
  hourlyRate: number;
  location: string;
  languages: string[];
  yearsExperience: number;
  totalSessions: number;
  responseTime: string;
  satisfactionRate: number;
  available?: boolean;
  featured?: boolean;
  certifications?: string[];
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CoachProfile extends Coach {
  availability: AvailabilitySlot[];
  upcomingSlots: AvailabilitySlot[];
  sessionTypes: SessionType[];
  stats: CoachStats;
  reviews: Review[];
}

export interface CoachStats {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageRating: number;
  responseTime: string;
  satisfactionRate: number;
  repeatClients: number;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface Session {
  id: string;
  coachId: string;
  userId: string;
  coach?: Coach;
  dateTime: string;
  duration: number;
  type: string;
  status: SessionStatus;
  price: number;
  notes?: string;
  location?: string;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export enum SessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

export interface SessionType {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
}

export interface BookSessionRequest {
  coachId: string;
  dateTime: string;
  duration: number;
  type: string;
  notes?: string;
  paymentMethodId?: string;
}

export interface UpdateSessionRequest {
  dateTime?: string;
  duration?: number;
  notes?: string;
  status?: SessionStatus;
}

// ============================================================================
// AVAILABILITY TYPES
// ============================================================================

export interface AvailabilitySlot {
  id: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  booked?: boolean;
}

export interface AvailabilityQuery {
  coachId: string;
  startDate: string;
  endDate: string;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface Review {
  id: string;
  sessionId: string;
  coachId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  sessionId: string;
  coachId: string;
  rating: number;
  comment: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface CoachFilters {
  expertise?: string[];
  minRating?: number;
  maxRating?: number;
  minPrice?: number;
  maxPrice?: number;
  languages?: string[];
  available?: boolean;
  location?: string;
  search?: string;
  sortBy?: CoachSortOption;
  page?: number;
  limit?: number;
}

export enum CoachSortOption {
  RATING_DESC = 'rating_desc',
  RATING_ASC = 'rating_asc',
  PRICE_DESC = 'price_desc',
  PRICE_ASC = 'price_asc',
  EXPERIENCE_DESC = 'experience_desc',
  SESSIONS_DESC = 'sessions_desc',
  NEWEST = 'newest',
}

// ============================================================================
// BECOME A COACH TYPES
// ============================================================================

export interface BecomeCoachRequest {
  title: string;
  bio: string;
  expertise: string[];
  yearsExperience: number;
  hourlyRate: number;
  location: string;
  languages: string[];
  certifications?: string[];
  availability?: AvailabilitySlot[];
}

// ============================================================================
// EXPERTISE CATEGORIES
// ============================================================================

export enum ExpertiseCategory {
  TECHNICAL_SKILLS = 'Technical Skills',
  TACTICAL_AWARENESS = 'Tactical Awareness',
  PHYSICAL_FITNESS = 'Physical Fitness',
  MENTAL_COACHING = 'Mental Coaching',
  GOALKEEPING = 'Goalkeeping',
  POSITIONING = 'Positioning',
  SHOOTING = 'Shooting',
  PASSING = 'Passing',
  DRIBBLING = 'Dribbling',
  DEFENDING = 'Defending',
  SET_PIECES = 'Set Pieces',
  GAME_ANALYSIS = 'Game Analysis',
  CAREER_GUIDANCE = 'Career Guidance',
  NUTRITION = 'Nutrition',
  INJURY_PREVENTION = 'Injury Prevention',
}

// ============================================================================
// PAGINATED RESPONSES
// ============================================================================

export interface PaginatedCoaches {
  data: Coach[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedSessions {
  data: Session[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedReviews {
  data: Review[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export type CoachingStackParamList = {
  CoachingHub: undefined;
  CoachProfile: { coachId: string };
  MyBookings: { tab?: 'upcoming' | 'past' | 'cancelled' };
  BookSession: { coachId: string; sessionType?: string };
  FilterModal: { currentFilters?: CoachFilters };
  ReviewModal: { sessionId: string; coachId: string };
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const EXPERTISE_OPTIONS = [
  'Technical Skills',
  'Tactical Awareness',
  'Physical Fitness',
  'Mental Coaching',
  'Goalkeeping',
  'Positioning',
  'Shooting',
  'Passing',
  'Dribbling',
  'Defending',
  'Set Pieces',
  'Game Analysis',
  'Career Guidance',
  'Nutrition',
  'Injury Prevention',
] as const;

export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Arabic',
  'Mandarin',
  'Japanese',
] as const;

export const SESSION_DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
] as const;
