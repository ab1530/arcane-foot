import { api } from './api';
import type {
  MarketplaceListing,
  SearchListingsFilters,
  MarketplaceOffer,
  MarketplaceReview,
  MarketplaceFavorite,
  CreateOfferPayload,
  CreateReviewPayload,
  MatchingScore,
} from '../types/marketplace';
import type { PaginatedResponse } from '../types';

const normalizeListing = (listing: any): MarketplaceListing => {
  if (!listing || typeof listing !== 'object') return listing as MarketplaceListing;

  const users = listing.users ?? listing.scout?.user ?? null;
  const firstName = users?.firstName ?? '';
  const lastName = users?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  const pricing =
    listing.pricing ??
    ({
      hourlyRate: listing.hourlyRate ?? undefined,
      matchRate: listing.matchRate ?? undefined,
      reportRate: listing.reportRate ?? undefined,
      currency: listing.currency ?? 'EUR',
    } as any);

  const scout =
    listing.scout ??
    (users
      ? {
          id: listing.userId ?? users?.id ?? '',
          userId: listing.userId ?? users?.id ?? '',
          user: {
            firstName: users?.firstName ?? '',
            lastName: users?.lastName ?? '',
            avatar: users?.avatar ?? undefined,
            country: users?.country ?? undefined,
          },
          isVerified: Boolean(listing.isVerified),
          fullName: fullName || undefined,
        }
      : undefined);

  return {
    ...(listing as any),
    users: listing.users ?? undefined,
    pricing,
    scout,
  } as MarketplaceListing;
};

const normalizeListingsResponse = (payload: any): PaginatedResponse<MarketplaceListing> => {
  const items: any[] = payload?.data ?? payload?.items ?? [];
  const normalizedItems = Array.isArray(items) ? items.map(normalizeListing) : [];

  const meta =
    payload?.meta ??
    payload?.pagination ??
    {
      total: normalizedItems.length,
      page: payload?.page ?? 1,
      limit: payload?.limit ?? normalizedItems.length,
      totalPages: 1,
    };

  return {
    ...(payload ?? {}),
    data: normalizedItems,
    items: normalizedItems,
    meta,
  };
};

const normalizeReviewsResponse = (payload: any): MarketplaceReview[] => {
  const reviews = Array.isArray(payload) ? payload : payload?.reviews ?? [];
  if (!Array.isArray(reviews)) return [];

  return reviews.map((r: any) => {
    const club = r.club ?? r.clubs ?? undefined;
    return {
      ...(r ?? {}),
      club,
    } as MarketplaceReview;
  });
};

export const marketplaceApi = {
  // ==================== SEARCH & DISCOVERY ====================

  /**
   * Search scout listings with filters
   */
  async searchListings(
    filters: SearchListingsFilters = {}
  ): Promise<PaginatedResponse<MarketplaceListing>> {
    const payload = await api.getRaw<any>('/marketplace/listings', {
      params: filters,
    });
    return normalizeListingsResponse(payload);
  },

  /**
   * Get scout listing details by ID
   */
  async getListingById(id: string): Promise<MarketplaceListing> {
    const payload = await api.getRaw<any>(`/marketplace/listings/${id}`);
    return normalizeListing(payload);
  },

  /**
   * Calculate matching scores for club needs
   */
  async calculateMatching(payload: {
    leagues?: string[];
    positions?: string[];
    budget?: number;
  }): Promise<MatchingScore[]> {
    return api.postRaw<MatchingScore[]>('/marketplace/listings/match', payload);
  },

  // ==================== SCOUT LISTING MANAGEMENT ====================

  /**
   * Get my scout listing (scouts only)
   */
  async getMyListing(): Promise<MarketplaceListing> {
    const payload = await api.getRaw<any>('/marketplace/listings/my');
    return normalizeListing(payload);
  },

  /**
   * Create scout listing (scouts only)
   */
  async createListing(payload: {
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
    hourlyRate?: number;
    matchRate?: number;
    reportRate?: number;
    currency?: string;
    portfolio?: {
      topReports?: string[];
      playersDiscovered?: string[];
    };
  }): Promise<MarketplaceListing> {
    const result = await api.postRaw<any>('/marketplace/listings', payload);
    return normalizeListing(result);
  },

  /**
   * Update scout listing (scouts only)
   */
  async updateListing(payload: Partial<{
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
    hourlyRate?: number;
    matchRate?: number;
    reportRate?: number;
    currency?: string;
    portfolio?: {
      topReports?: string[];
      playersDiscovered?: string[];
    };
  }>): Promise<MarketplaceListing> {
    const result = await api.patchRaw<any>('/marketplace/listings', payload);
    return normalizeListing(result);
  },

  /**
   * Activate scout listing (make it visible)
   */
  async activateListing(): Promise<MarketplaceListing> {
    const result = await api.patchRaw<any>('/marketplace/listings/activate', {});
    return normalizeListing(result);
  },

  /**
   * Pause scout listing (temporarily hide)
   */
  async pauseListing(): Promise<MarketplaceListing> {
    const result = await api.patchRaw<any>('/marketplace/listings/pause', {});
    return normalizeListing(result);
  },

  /**
   * Delete scout listing (archives it)
   */
  async deleteListing(): Promise<void> {
    return api.deleteRaw<void>('/marketplace/listings');
  },

  // ==================== OFFER MANAGEMENT ====================

  /**
   * Send offer to scout (clubs only)
   */
  async createOffer(payload: CreateOfferPayload): Promise<MarketplaceOffer> {
    return api.postRaw<MarketplaceOffer>('/marketplace/offers', payload);
  },

  /**
   * Get offers sent by my club
   */
  async getSentOffers(): Promise<MarketplaceOffer[]> {
    return api.getRaw<MarketplaceOffer[]>('/marketplace/offers/sent');
  },

  /**
   * Get offers received by me (scouts only)
   */
  async getReceivedOffers(): Promise<MarketplaceOffer[]> {
    return api.getRaw<MarketplaceOffer[]>('/marketplace/offers/received');
  },

  /**
   * Accept offer (scouts only)
   */
  async acceptOffer(offerId: string): Promise<MarketplaceOffer> {
    return api.patchRaw<MarketplaceOffer>(
      `/marketplace/offers/${offerId}/accept`,
      {}
    );
  },

  /**
   * Reject offer (scouts only)
   */
  async rejectOffer(offerId: string): Promise<MarketplaceOffer> {
    return api.patchRaw<MarketplaceOffer>(
      `/marketplace/offers/${offerId}/reject`,
      {}
    );
  },

  /**
   * Mark offer as completed (scouts only)
   */
  async completeOffer(offerId: string): Promise<MarketplaceOffer> {
    return api.patchRaw<MarketplaceOffer>(
      `/marketplace/offers/${offerId}/complete`,
      {}
    );
  },

  /**
   * Cancel offer
   */
  async cancelOffer(offerId: string, reason?: string): Promise<MarketplaceOffer> {
    return api.patchRaw<MarketplaceOffer>(
      `/marketplace/offers/${offerId}/cancel`,
      { reason }
    );
  },

  // ==================== REVIEWS ====================

  /**
   * Create review for completed offer (clubs only)
   */
  async createReview(payload: CreateReviewPayload): Promise<MarketplaceReview> {
    return api.postRaw<MarketplaceReview>('/marketplace/reviews', payload);
  },

  /**
   * Get all reviews for a scout listing
   */
  async getListingReviews(listingId: string): Promise<MarketplaceReview[]> {
    const payload = await api.getRaw<any>(`/marketplace/reviews/listing/${listingId}`);
    return normalizeReviewsResponse(payload);
  },

  // ==================== FAVORITES ====================

  /**
   * Add scout listing to favorites (clubs only)
   */
  async addFavorite(
    listingId: string,
    notes?: string,
    tags?: string[]
  ): Promise<MarketplaceFavorite> {
    return api.postRaw<MarketplaceFavorite>('/marketplace/favorites', {
      listingId,
      notes,
      tags,
    });
  },

  /**
   * Get my favorite scout listings
   */
  async getFavorites(): Promise<MarketplaceFavorite[]> {
    return api.getRaw<MarketplaceFavorite[]>('/marketplace/favorites/my');
  },

  /**
   * Remove favorite
   */
  async removeFavorite(favoriteId: string): Promise<void> {
    return api.deleteRaw<void>(`/marketplace/favorites/${favoriteId}`);
  },

  /**
   * Update favorite notes/tags
   */
  async updateFavorite(
    favoriteId: string,
    notes?: string,
    tags?: string[]
  ): Promise<MarketplaceFavorite> {
    return api.patchRaw<MarketplaceFavorite>(
      `/marketplace/favorites/${favoriteId}`,
      { notes, tags }
    );
  },

  /**
   * Toggle favorite (add or remove)
   */
  async toggleFavorite(listingId: string): Promise<{
    isFavorite: boolean;
    favorite?: MarketplaceFavorite;
  }> {
    try {
      const favorites = await this.getFavorites();
      const existingFavorite = favorites.find((f) => f.listingId === listingId);

      if (existingFavorite) {
        await this.removeFavorite(existingFavorite.id);
        return { isFavorite: false };
      } else {
        const favorite = await this.addFavorite(listingId);
        return { isFavorite: true, favorite };
      }
    } catch (error) {
      throw error;
    }
  },
};

export default marketplaceApi;
