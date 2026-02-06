export interface MarketplaceListing {
  id: string;
  scoutId: string;
  scout: {
    id: string;
    userId: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
      country?: string;
    };
    isVerified: boolean;
  };
  headline: string;
  bio?: string;
  expertise: {
    leagues: string[];
    positions: string[];
    ageGroups: string[];
  };
  languages: string[];
  availability: {
    countries: string[];
    travelRadius?: number;
  };
  pricing: {
    hourlyRate?: number;
    matchRate?: number;
    reportRate?: number;
    currency: string;
  };
  portfolio?: {
    topReports?: string[];
    playersDiscovered?: string[];
  };
  stats: {
    avgRating: number;
    totalReviews: number;
    totalReports: number;
    completedOffers: number;
  };
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchListingsFilters {
  leagues?: string[];
  positions?: string[];
  ageGroup?: string;
  country?: string;
  languages?: string[];
  maxBudget?: number;
  minRating?: number;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
  ids?: string[];
}

export interface MarketplaceOffer {
  id: string;
  clubId: string;
  club: {
    id: string;
    name: string;
    logo?: string;
    country: string;
  };
  listingId: string;
  listing?: MarketplaceListing;
  projectDescription: string;
  budget: number;
  deadline?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceReview {
  id: string;
  listingId: string;
  offerId: string;
  clubId: string;
  club: {
    name: string;
    logo?: string;
  };
  rating: number;
  comment?: string;
  professionalism: number;
  communication: number;
  qualityOfWork: number;
  timeliness: number;
  createdAt: string;
}

export interface MarketplaceFavorite {
  id: string;
  clubId: string;
  listingId: string;
  listing: MarketplaceListing;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferPayload {
  listingId: string;
  projectDescription: string;
  budget: number;
  deadline?: string;
}

export interface CreateReviewPayload {
  offerId: string;
  rating: number;
  comment?: string;
  professionalism: number;
  communication: number;
  qualityOfWork: number;
  timeliness: number;
}

export interface MatchingScore {
  listingId: string;
  score: number;
  matchDetails: {
    leagueMatch: boolean;
    positionMatch: boolean;
    budgetMatch: boolean;
    availabilityMatch: boolean;
  };
}
