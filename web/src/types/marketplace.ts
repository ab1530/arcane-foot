/**
 * Marketplace Types
 * Types for scout listings, reviews, and marketplace features
 */

export interface ScoutListing {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  expertise: {
    leagues: string[];
    positions: string[];
    ageGroups: string[];
  };
  languages: string[];
  availability: {
    countries: string[];
    travelRadius: number;
  };
  hourlyRate?: number;
  matchRate?: number;
  reportRate?: number;
  currency: string;
  status: string;
  isVerified: boolean;
  stats: {
    avgRating?: number;
    totalReviews: number;
    completionRate: number;
    totalAssignments: number;
  };
  portfolio?: {
    topReports?: any[];
    playersDiscovered?: any[];
  };
  users: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    email: string;
  };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  tags: string[];
  reviewedAt: Date;
  isVerified: boolean;
  clubs: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  ratingDistribution: Record<string, number>;
}

export interface Favorite {
  id: string;
  clubId: string;
  scoutListingId: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  scoutListings?: ScoutListing;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchScoutListingsParams {
  leagues?: string[];
  positions?: string[];
  country?: string;
  languages?: string[];
  maxBudget?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchScoutListingsResponse {
  data: ScoutListing[];
  pagination: Pagination;
}

export interface ListingReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}
