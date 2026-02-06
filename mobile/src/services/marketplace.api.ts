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

export const marketplaceApi = {
  // ==================== SEARCH & DISCOVERY ====================

  /**
   * Search scout listings with filters
   */
  async searchListings(
    filters: SearchListingsFilters = {}
  ): Promise<PaginatedResponse<MarketplaceListing>> {
    return api.getRaw<PaginatedResponse<MarketplaceListing>>('/marketplace/listings', {
      params: filters,
    });
  },

  /**
   * Get scout listing details by ID
   */
  async getListingById(id: string): Promise<MarketplaceListing> {
    return api.getRaw<MarketplaceListing>(`/marketplace/listings/${id}`);
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
    return api.getRaw<MarketplaceListing>('/marketplace/listings/my');
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
    return api.postRaw<MarketplaceListing>('/marketplace/listings', payload);
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
    return api.patchRaw<MarketplaceListing>('/marketplace/listings', payload);
  },

  /**
   * Activate scout listing (make it visible)
   */
  async activateListing(): Promise<MarketplaceListing> {
    return api.patchRaw<MarketplaceListing>('/marketplace/listings/activate', {});
  },

  /**
   * Pause scout listing (temporarily hide)
   */
  async pauseListing(): Promise<MarketplaceListing> {
    return api.patchRaw<MarketplaceListing>('/marketplace/listings/pause', {});
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
    return api.getRaw<MarketplaceReview[]>(
      `/marketplace/reviews/listing/${listingId}`
    );
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
