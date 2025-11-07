import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { ScoutListingStatus, OfferStatus } from '@prisma/client';

describe('MarketplaceController', () => {
  let controller: MarketplaceController;
  let service: MarketplaceService;

  const mockMarketplaceService = {
    createListing: jest.fn(),
    getMyListing: jest.fn(),
    updateListing: jest.fn(),
    activateListing: jest.fn(),
    pauseListing: jest.fn(),
    deleteListing: jest.fn(),
    searchListings: jest.fn(),
    getListingById: jest.fn(),
    calculateMatching: jest.fn(),
    createOffer: jest.fn(),
    getSentOffers: jest.fn(),
    getReceivedOffers: jest.fn(),
    acceptOffer: jest.fn(),
    rejectOffer: jest.fn(),
    completeOffer: jest.fn(),
    cancelOffer: jest.fn(),
    createReview: jest.fn(),
    getListingReviews: jest.fn(),
    addFavorite: jest.fn(),
    getFavorites: jest.fn(),
    removeFavorite: jest.fn(),
    updateFavorite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketplaceController],
      providers: [
        {
          provide: MarketplaceService,
          useValue: mockMarketplaceService,
        },
      ],
    }).compile();

    controller = module.get<MarketplaceController>(MarketplaceController);
    service = module.get<MarketplaceService>(MarketplaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==================== SCOUT LISTING MANAGEMENT ====================

  describe('createListing', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const createDto = {
      headline: 'Test Scout',
      bio: 'Bio text',
      expertise: {
        leagues: ['Premier League'],
        positions: ['Striker'],
        ageGroups: ['Senior'],
      },
      languages: ['English'],
      availability: {
        countries: ['UK'],
      },
      hourlyRate: 100,
      matchRate: 200,
      reportRate: 150,
      currency: 'EUR',
      portfolio: { topReports: [], playersDiscovered: [] },
    };

    const mockListing = {
      id: 'listing-123',
      userId: 'scout-user-123',
      ...createDto,
      status: ScoutListingStatus.DRAFT,
    };

    it('should create a scout listing', async () => {
      mockMarketplaceService.createListing.mockResolvedValue(mockListing);

      const result = await controller.createListing(mockRequest, createDto);

      expect(service.createListing).toHaveBeenCalledWith('scout-user-123', createDto);
      expect(result).toEqual(mockListing);
    });
  });

  describe('getMyListing', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const mockListing = {
      id: 'listing-123',
      userId: 'scout-user-123',
      headline: 'Test Scout',
    };

    it('should get my listing', async () => {
      mockMarketplaceService.getMyListing.mockResolvedValue(mockListing);

      const result = await controller.getMyListing(mockRequest);

      expect(service.getMyListing).toHaveBeenCalledWith('scout-user-123');
      expect(result).toEqual(mockListing);
    });
  });

  describe('updateListing', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const updateDto = {
      headline: 'Updated Headline',
      hourlyRate: 150,
    };

    const mockUpdatedListing = {
      id: 'listing-123',
      userId: 'scout-user-123',
      ...updateDto,
    };

    it('should update listing', async () => {
      mockMarketplaceService.updateListing.mockResolvedValue(mockUpdatedListing);

      const result = await controller.updateListing(mockRequest, updateDto);

      expect(service.updateListing).toHaveBeenCalledWith('scout-user-123', updateDto);
      expect(result).toEqual(mockUpdatedListing);
    });
  });

  describe('activateListing', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const mockActiveListing = {
      id: 'listing-123',
      userId: 'scout-user-123',
      status: ScoutListingStatus.ACTIVE,
    };

    it('should activate listing', async () => {
      mockMarketplaceService.activateListing.mockResolvedValue(mockActiveListing);

      const result = await controller.activateListing(mockRequest);

      expect(service.activateListing).toHaveBeenCalledWith('scout-user-123');
      expect(result).toEqual(mockActiveListing);
    });
  });

  describe('pauseListing', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const mockPausedListing = {
      id: 'listing-123',
      userId: 'scout-user-123',
      status: ScoutListingStatus.PAUSED,
    };

    it('should pause listing', async () => {
      mockMarketplaceService.pauseListing.mockResolvedValue(mockPausedListing);

      const result = await controller.pauseListing(mockRequest);

      expect(service.pauseListing).toHaveBeenCalledWith('scout-user-123');
      expect(result).toEqual(mockPausedListing);
    });
  });

  describe('deleteListing', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const mockResponse = {
      message: 'Listing archived successfully',
    };

    it('should delete listing', async () => {
      mockMarketplaceService.deleteListing.mockResolvedValue(mockResponse);

      const result = await controller.deleteListing(mockRequest);

      expect(service.deleteListing).toHaveBeenCalledWith('scout-user-123');
      expect(result).toEqual(mockResponse);
    });
  });

  // ==================== SEARCH & DISCOVERY ====================

  describe('searchListings', () => {
    const searchDto = {
      leagues: ['Premier League'],
      positions: ['Striker'],
      maxBudget: 150,
      minRating: 4,
      page: 1,
      limit: 20,
    };

    const mockSearchResult = {
      data: [
        {
          id: 'listing-1',
          headline: 'Premier League Scout',
          stats: {
            avgRating: 4.5,
            totalReviews: 10,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };

    it('should search listings', async () => {
      mockMarketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await controller.searchListings(searchDto);

      expect(service.searchListings).toHaveBeenCalledWith(searchDto);
      expect(result).toEqual(mockSearchResult);
    });
  });

  describe('getListingById', () => {
    const listingId = 'listing-123';
    const mockListing = {
      id: listingId,
      headline: 'Test Scout',
      stats: {
        avgRating: 4.5,
        totalReviews: 10,
      },
    };

    it('should get listing by ID', async () => {
      mockMarketplaceService.getListingById.mockResolvedValue(mockListing);

      const result = await controller.getListingById(listingId);

      expect(service.getListingById).toHaveBeenCalledWith(listingId);
      expect(result).toEqual(mockListing);
    });
  });

  describe('calculateMatching', () => {
    const mockRequest = {
      user: {
        userId: 'club-user-123',
      },
    };

    const calculateDto = {
      leagues: ['Premier League'],
      positions: ['Striker'],
      ageGroup: 'Senior',
      budget: 120,
      location: 'UK',
      minRating: 4,
    };

    const mockMatchingResult = {
      clubNeeds: calculateDto,
      results: [
        {
          listing: {
            id: 'listing-1',
            headline: 'Test Scout',
          },
          matchingScore: 85,
          matchingBreakdown: [],
          matchingTier: 'EXCELLENT',
          recommendations: [],
          stats: {
            avgRating: 4.5,
            totalReviews: 10,
          },
        },
      ],
      totalMatches: 1,
    };

    it('should calculate matching scores', async () => {
      mockMarketplaceService.calculateMatching.mockResolvedValue(mockMatchingResult);

      const result = await controller.calculateMatching(mockRequest, calculateDto);

      expect(service.calculateMatching).toHaveBeenCalledWith('club-user-123', calculateDto);
      expect(result).toEqual(mockMatchingResult);
    });
  });

  // ==================== OFFER MANAGEMENT ====================

  describe('createOffer', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const createOfferDto = {
      scoutListingId: 'listing-123',
      offerType: 'SCOUTING' as any,
      title: 'Scout for U21 Players',
      description: 'We need scouts',
      budget: 5000,
      currency: 'EUR',
    };

    const mockOffer = {
      id: 'offer-123',
      ...createOfferDto,
      clubId: 'club-123',
      status: OfferStatus.PENDING,
    };

    it('should create offer', async () => {
      mockMarketplaceService.createOffer.mockResolvedValue(mockOffer);

      const result = await controller.createOffer(mockRequest, createOfferDto);

      expect(service.createOffer).toHaveBeenCalledWith('club-123', createOfferDto);
      expect(result).toEqual(mockOffer);
    });
  });

  describe('getSentOffers', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const mockOffers = [
      {
        id: 'offer-1',
        clubId: 'club-123',
        status: OfferStatus.PENDING,
      },
    ];

    it('should get sent offers', async () => {
      mockMarketplaceService.getSentOffers.mockResolvedValue(mockOffers);

      const result = await controller.getSentOffers(mockRequest);

      expect(service.getSentOffers).toHaveBeenCalledWith('club-123');
      expect(result).toEqual(mockOffers);
    });
  });

  describe('getReceivedOffers', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const mockOffers = [
      {
        id: 'offer-1',
        scoutListingId: 'listing-123',
        status: OfferStatus.PENDING,
      },
    ];

    it('should get received offers', async () => {
      mockMarketplaceService.getReceivedOffers.mockResolvedValue(mockOffers);

      const result = await controller.getReceivedOffers(mockRequest);

      expect(service.getReceivedOffers).toHaveBeenCalledWith('scout-user-123');
      expect(result).toEqual(mockOffers);
    });
  });

  describe('acceptOffer', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const offerId = 'offer-123';
    const mockAcceptedOffer = {
      id: offerId,
      status: OfferStatus.ACCEPTED,
    };

    it('should accept offer', async () => {
      mockMarketplaceService.acceptOffer.mockResolvedValue(mockAcceptedOffer);

      const result = await controller.acceptOffer(mockRequest, offerId);

      expect(service.acceptOffer).toHaveBeenCalledWith('scout-user-123', offerId);
      expect(result).toEqual(mockAcceptedOffer);
    });
  });

  describe('rejectOffer', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const offerId = 'offer-123';
    const mockRejectedOffer = {
      id: offerId,
      status: OfferStatus.REJECTED,
    };

    it('should reject offer', async () => {
      mockMarketplaceService.rejectOffer.mockResolvedValue(mockRejectedOffer);

      const result = await controller.rejectOffer(mockRequest, offerId);

      expect(service.rejectOffer).toHaveBeenCalledWith('scout-user-123', offerId);
      expect(result).toEqual(mockRejectedOffer);
    });
  });

  describe('completeOffer', () => {
    const mockRequest = {
      user: {
        userId: 'scout-user-123',
      },
    };

    const offerId = 'offer-123';
    const mockCompletedOffer = {
      id: offerId,
      status: OfferStatus.COMPLETED,
    };

    it('should complete offer', async () => {
      mockMarketplaceService.completeOffer.mockResolvedValue(mockCompletedOffer);

      const result = await controller.completeOffer(mockRequest, offerId);

      expect(service.completeOffer).toHaveBeenCalledWith('scout-user-123', offerId);
      expect(result).toEqual(mockCompletedOffer);
    });
  });

  describe('cancelOffer', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const offerId = 'offer-123';
    const reason = 'No longer needed';
    const mockCancelledOffer = {
      id: offerId,
      status: OfferStatus.CANCELLED,
      cancellationReason: reason,
    };

    it('should cancel offer with reason', async () => {
      mockMarketplaceService.cancelOffer.mockResolvedValue(mockCancelledOffer);

      const result = await controller.cancelOffer(mockRequest, offerId, reason);

      expect(service.cancelOffer).toHaveBeenCalledWith('club-123', offerId, reason);
      expect(result).toEqual(mockCancelledOffer);
    });

    it('should cancel offer without reason', async () => {
      const offerNoReason = {
        ...mockCancelledOffer,
        cancellationReason: undefined,
      };
      mockMarketplaceService.cancelOffer.mockResolvedValue(offerNoReason);

      const result = await controller.cancelOffer(mockRequest, offerId, undefined);

      expect(service.cancelOffer).toHaveBeenCalledWith('club-123', offerId, undefined);
      expect(result).toEqual(offerNoReason);
    });
  });

  // ==================== REVIEWS ====================

  describe('createReview', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const createReviewDto = {
      offerId: 'offer-123',
      rating: 5,
      comment: 'Excellent scout!',
      tags: ['professional'],
    };

    const mockReview = {
      id: 'review-123',
      ...createReviewDto,
      clubId: 'club-123',
      reviewedAt: new Date(),
    };

    it('should create review', async () => {
      mockMarketplaceService.createReview.mockResolvedValue(mockReview);

      const result = await controller.createReview(mockRequest, createReviewDto);

      expect(service.createReview).toHaveBeenCalledWith('club-123', createReviewDto);
      expect(result).toEqual(mockReview);
    });
  });

  describe('getListingReviews', () => {
    const listingId = 'listing-123';
    const mockReviewsResponse = {
      reviews: [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Great!',
        },
      ],
      stats: {
        totalReviews: 1,
        avgRating: 5,
        ratingDistribution: {
          5: 1,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      },
    };

    it('should get listing reviews', async () => {
      mockMarketplaceService.getListingReviews.mockResolvedValue(mockReviewsResponse);

      const result = await controller.getListingReviews(listingId);

      expect(service.getListingReviews).toHaveBeenCalledWith(listingId);
      expect(result).toEqual(mockReviewsResponse);
    });
  });

  // ==================== FAVORITES ====================

  describe('addFavorite', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const createFavoriteDto = {
      scoutListingId: 'listing-123',
      notes: 'Great scout',
      tags: ['premier-league'],
    };

    const mockFavorite = {
      id: 'favorite-123',
      clubId: 'club-123',
      ...createFavoriteDto,
      addedAt: new Date(),
    };

    it('should add favorite', async () => {
      mockMarketplaceService.addFavorite.mockResolvedValue(mockFavorite);

      const result = await controller.addFavorite(mockRequest, createFavoriteDto);

      expect(service.addFavorite).toHaveBeenCalledWith('club-123', createFavoriteDto);
      expect(result).toEqual(mockFavorite);
    });
  });

  describe('getFavorites', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const mockFavorites = [
      {
        id: 'favorite-1',
        clubId: 'club-123',
        scout_listings: {
          id: 'listing-1',
          headline: 'Test Scout',
          stats: {
            avgRating: 4.5,
            totalReviews: 10,
          },
        },
      },
    ];

    it('should get favorites', async () => {
      mockMarketplaceService.getFavorites.mockResolvedValue(mockFavorites);

      const result = await controller.getFavorites(mockRequest);

      expect(service.getFavorites).toHaveBeenCalledWith('club-123');
      expect(result).toEqual(mockFavorites);
    });
  });

  describe('removeFavorite', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const favoriteId = 'favorite-123';
    const mockResponse = {
      message: 'Removed from favorites',
    };

    it('should remove favorite', async () => {
      mockMarketplaceService.removeFavorite.mockResolvedValue(mockResponse);

      const result = await controller.removeFavorite(mockRequest, favoriteId);

      expect(service.removeFavorite).toHaveBeenCalledWith('club-123', favoriteId);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateFavorite', () => {
    const mockRequest = {
      user: {
        clubId: 'club-123',
      },
    };

    const favoriteId = 'favorite-123';
    const updateDto = {
      notes: 'Updated notes',
      tags: ['new-tag'],
    };

    const mockUpdatedFavorite = {
      id: favoriteId,
      clubId: 'club-123',
      ...updateDto,
    };

    it('should update favorite', async () => {
      mockMarketplaceService.updateFavorite.mockResolvedValue(mockUpdatedFavorite);

      const result = await controller.updateFavorite(mockRequest, favoriteId, updateDto);

      expect(service.updateFavorite).toHaveBeenCalledWith('club-123', favoriteId, 'Updated notes', ['new-tag']);
      expect(result).toEqual(mockUpdatedFavorite);
    });

    it('should update favorite with partial data', async () => {
      const partialDto = {
        notes: 'Updated notes',
      };

      mockMarketplaceService.updateFavorite.mockResolvedValue(mockUpdatedFavorite);

      const result = await controller.updateFavorite(mockRequest, favoriteId, partialDto);

      expect(service.updateFavorite).toHaveBeenCalledWith('club-123', favoriteId, 'Updated notes', undefined);
      expect(result).toEqual(mockUpdatedFavorite);
    });
  });
});
