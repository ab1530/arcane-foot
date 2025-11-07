import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, ScoutListingStatus, OfferStatus } from '@prisma/client';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // SCOUT LISTINGS TESTS
  // ==========================================

  describe('createListing', () => {
    const userId = 'scout-user-123';
    const createDto = {
      headline: 'Experienced Scout - Premier League',
      bio: 'Over 10 years of scouting experience',
      expertise: {
        leagues: ['Premier League', 'La Liga'],
        positions: ['Striker', 'Winger'],
        ageGroups: ['U21', 'Senior'],
      },
      languages: ['English', 'Spanish'],
      availability: {
        countries: ['UK', 'Spain'],
        travelRadius: 500,
      },
      hourlyRate: 100,
      matchRate: 200,
      reportRate: 150,
      currency: 'EUR',
      portfolio: { topReports: ['report-1'], playersDiscovered: ['player-1'] },
    };

    const mockUser = {
      id: userId,
      role: 'SCOUT',
    };

    const mockListing = {
      id: 'listing-123',
      userId,
      ...createDto,
      stats: null,
      status: ScoutListingStatus.DRAFT,
      isVerified: false,
      updatedAt: new Date(),
      users: {
        id: userId,
        firstName: 'John',
        lastName: 'Scout',
        avatar: null,
      },
    };

    it('should create a scout listing successfully', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findUnique.mockResolvedValue(null);
      prisma.scout_listings.create.mockResolvedValue(mockListing as any);

      const result = await service.createListing(userId, createDto);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { role: true },
      });
      expect(prisma.scout_listings.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.scout_listings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          headline: createDto.headline,
          bio: createDto.bio,
          expertise: createDto.expertise,
          languages: createDto.languages,
          availability: createDto.availability,
          hourlyRate: createDto.hourlyRate,
          matchRate: createDto.matchRate,
          reportRate: createDto.reportRate,
          currency: 'EUR',
          portfolio: createDto.portfolio,
          stats: null,
          status: ScoutListingStatus.DRAFT,
          isVerified: false,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockListing);
    });

    it('should use EUR as default currency if not provided', async () => {
      const dtoNoCurrency = { ...createDto };
      delete dtoNoCurrency.currency;

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findUnique.mockResolvedValue(null);
      prisma.scout_listings.create.mockResolvedValue(mockListing as any);

      await service.createListing(userId, dtoNoCurrency);

      expect(prisma.scout_listings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: 'EUR',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException if user is not a scout', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: userId, role: 'CLUB' } as any);

      await expect(service.createListing(userId, createDto)).rejects.toThrow(
        new BadRequestException('Only scouts can create listings'),
      );
      expect(prisma.scout_listings.findUnique).not.toHaveBeenCalled();
      expect(prisma.scout_listings.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.createListing(userId, createDto)).rejects.toThrow(
        new BadRequestException('Only scouts can create listings'),
      );
    });

    it('should throw BadRequestException if listing already exists', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);

      await expect(service.createListing(userId, createDto)).rejects.toThrow(
        new BadRequestException('You already have a listing. Use update instead.'),
      );
      expect(prisma.scout_listings.create).not.toHaveBeenCalled();
    });
  });

  describe('getMyListing', () => {
    const userId = 'scout-user-123';
    const mockListing = {
      id: 'listing-123',
      userId,
      headline: 'Test Scout',
      users: {
        id: userId,
        firstName: 'John',
        lastName: 'Scout',
        avatar: null,
        email: 'scout@test.com',
      },
      marketplace_reviews: [],
    };

    it('should return scout listing successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);

      const result = await service.getMyListing(userId);

      expect(prisma.scout_listings.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: expect.objectContaining({
          users: expect.any(Object),
          marketplace_reviews: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockListing);
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.getMyListing(userId)).rejects.toThrow(
        new NotFoundException('You do not have a listing yet'),
      );
    });
  });

  describe('updateListing', () => {
    const userId = 'scout-user-123';
    const updateDto = {
      headline: 'Updated Headline',
      hourlyRate: 150,
    };

    const mockListing = {
      id: 'listing-123',
      userId,
    };

    const mockUpdatedListing = {
      ...mockListing,
      ...updateDto,
      users: {
        id: userId,
        firstName: 'John',
        lastName: 'Scout',
        avatar: null,
      },
    };

    it('should update listing successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.scout_listings.update.mockResolvedValue(mockUpdatedListing as any);

      const result = await service.updateListing(userId, updateDto);

      expect(prisma.scout_listings.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.scout_listings.update).toHaveBeenCalledWith({
        where: { id: mockListing.id },
        data: expect.objectContaining(updateDto),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedListing);
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.updateListing(userId, updateDto)).rejects.toThrow(
        new NotFoundException('Listing not found'),
      );
      expect(prisma.scout_listings.update).not.toHaveBeenCalled();
    });
  });

  describe('activateListing', () => {
    const userId = 'scout-user-123';
    const mockCompleteListing = {
      id: 'listing-123',
      userId,
      headline: 'Test Scout',
      expertise: { leagues: ['Premier League'] },
      availability: { countries: ['UK'] },
    };

    const mockIncompleteListing = {
      id: 'listing-123',
      userId,
      headline: null,
      expertise: null,
      availability: null,
    };

    it('should activate listing successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockCompleteListing as any);
      prisma.scout_listings.update.mockResolvedValue({
        ...mockCompleteListing,
        status: ScoutListingStatus.ACTIVE,
      } as any);

      const result = await service.activateListing(userId);

      expect(prisma.scout_listings.update).toHaveBeenCalledWith({
        where: { id: mockCompleteListing.id },
        data: {
          status: ScoutListingStatus.ACTIVE,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(ScoutListingStatus.ACTIVE);
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.activateListing(userId)).rejects.toThrow(
        new NotFoundException('Listing not found'),
      );
    });

    it('should throw BadRequestException if listing is incomplete - no headline', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockIncompleteListing as any);

      await expect(service.activateListing(userId)).rejects.toThrow(
        new BadRequestException('Listing must be complete before activation'),
      );
    });

    it('should throw BadRequestException if listing is incomplete - no expertise', async () => {
      const listingNoExpertise = {
        ...mockCompleteListing,
        expertise: null,
      };
      prisma.scout_listings.findUnique.mockResolvedValue(listingNoExpertise as any);

      await expect(service.activateListing(userId)).rejects.toThrow(
        new BadRequestException('Listing must be complete before activation'),
      );
    });

    it('should throw BadRequestException if listing is incomplete - no availability', async () => {
      const listingNoAvailability = {
        ...mockCompleteListing,
        availability: null,
      };
      prisma.scout_listings.findUnique.mockResolvedValue(listingNoAvailability as any);

      await expect(service.activateListing(userId)).rejects.toThrow(
        new BadRequestException('Listing must be complete before activation'),
      );
    });
  });

  describe('pauseListing', () => {
    const userId = 'scout-user-123';
    const mockListing = {
      id: 'listing-123',
      userId,
    };

    it('should pause listing successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.scout_listings.update.mockResolvedValue({
        ...mockListing,
        status: ScoutListingStatus.PAUSED,
      } as any);

      const result = await service.pauseListing(userId);

      expect(prisma.scout_listings.update).toHaveBeenCalledWith({
        where: { id: mockListing.id },
        data: {
          status: ScoutListingStatus.PAUSED,
          updatedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(ScoutListingStatus.PAUSED);
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.pauseListing(userId)).rejects.toThrow(
        new NotFoundException('Listing not found'),
      );
    });
  });

  describe('deleteListing', () => {
    const userId = 'scout-user-123';
    const mockListing = {
      id: 'listing-123',
      userId,
    };

    it('should archive listing successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.scout_listings.update.mockResolvedValue({
        ...mockListing,
        status: ScoutListingStatus.ARCHIVED,
      } as any);

      const result = await service.deleteListing(userId);

      expect(prisma.scout_listings.update).toHaveBeenCalledWith({
        where: { id: mockListing.id },
        data: {
          status: ScoutListingStatus.ARCHIVED,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ message: 'Listing archived successfully' });
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.deleteListing(userId)).rejects.toThrow(
        new NotFoundException('Listing not found'),
      );
    });
  });

  // ==========================================
  // SEARCH & MATCHING TESTS
  // ==========================================

  describe('searchListings', () => {
    const mockListings = [
      {
        id: 'listing-1',
        userId: 'scout-1',
        headline: 'Premier League Scout',
        expertise: {
          leagues: ['Premier League', 'La Liga'],
          positions: ['Striker', 'Winger'],
        },
        availability: {
          countries: ['UK', 'Spain'],
        },
        languages: ['English', 'Spanish'],
        hourlyRate: 100,
        isVerified: true,
        status: ScoutListingStatus.ACTIVE,
        users: {
          id: 'scout-1',
          firstName: 'John',
          lastName: 'Scout',
          avatar: null,
        },
        marketplace_reviews: [
          { rating: 5 },
          { rating: 4 },
        ],
      },
      {
        id: 'listing-2',
        userId: 'scout-2',
        headline: 'Bundesliga Scout',
        expertise: {
          leagues: ['Bundesliga'],
          positions: ['Midfielder'],
        },
        availability: {
          countries: ['Germany'],
        },
        languages: ['German', 'English'],
        hourlyRate: 120,
        isVerified: false,
        status: ScoutListingStatus.ACTIVE,
        users: {
          id: 'scout-2',
          firstName: 'Jane',
          lastName: 'Scout',
          avatar: null,
        },
        marketplace_reviews: [
          { rating: 3 },
        ],
      },
    ];

    it('should search listings with default pagination', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ page: 1, limit: 20 });

      expect(prisma.scout_listings.findMany).toHaveBeenCalledWith({
        where: {
          status: ScoutListingStatus.ACTIVE,
        },
        include: expect.objectContaining({
          users: expect.any(Object),
          marketplace_reviews: expect.any(Object),
        }),
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by verified only', async () => {
      prisma.scout_listings.findMany.mockResolvedValue([mockListings[0]] as any);

      const result = await service.searchListings({ verifiedOnly: true, page: 1, limit: 20 });

      expect(prisma.scout_listings.findMany).toHaveBeenCalledWith({
        where: {
          status: ScoutListingStatus.ACTIVE,
          isVerified: true,
        },
        include: expect.any(Object),
      });
    });

    it('should filter by leagues', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ leagues: ['Premier League'], page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('listing-1');
    });

    it('should filter by positions', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ positions: ['Striker'], page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('listing-1');
    });

    it('should filter by country', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ country: 'UK', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('listing-1');
    });

    it('should filter by languages', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ languages: ['Spanish'], page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('listing-1');
    });

    it('should filter by maxBudget', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ maxBudget: 110, page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('listing-1');
    });

    it('should filter by minRating', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ minRating: 4, page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('listing-1');
    });

    it('should handle pagination correctly - page 2', async () => {
      const manyListings = Array(25).fill(null).map((_, i) => ({
        ...mockListings[0],
        id: `listing-${i}`,
        marketplace_reviews: [{ rating: 5 }],
      }));
      prisma.scout_listings.findMany.mockResolvedValue(manyListings as any);

      const result = await service.searchListings({ page: 2, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should sort by rating descending', async () => {
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.searchListings({ page: 1, limit: 20 });

      // First listing should have higher rating
      expect(result.data[0].stats.avgRating).toBeGreaterThan(result.data[1].stats.avgRating);
    });

    it('should calculate stats correctly', async () => {
      prisma.scout_listings.findMany.mockResolvedValue([mockListings[0]] as any);

      const result = await service.searchListings({ page: 1, limit: 20 });

      expect(result.data[0].stats).toEqual({
        avgRating: 4.5,
        totalReviews: 2,
      });
    });

    it('should handle listings with no reviews', async () => {
      const listingNoReviews = {
        ...mockListings[0],
        marketplace_reviews: [],
      };
      prisma.scout_listings.findMany.mockResolvedValue([listingNoReviews] as any);

      const result = await service.searchListings({ page: 1, limit: 20 });

      expect(result.data[0].stats).toEqual({
        avgRating: 0,
        totalReviews: 0,
      });
    });

    it('should filter out scouts with no reviews when minRating specified', async () => {
      const listingNoReviews = {
        ...mockListings[0],
        marketplace_reviews: [],
      };
      prisma.scout_listings.findMany.mockResolvedValue([listingNoReviews] as any);

      const result = await service.searchListings({ minRating: 4, page: 1, limit: 20 });

      expect(result.data).toHaveLength(0);
    });

    it('should handle scouts with null hourlyRate when filtering by budget', async () => {
      const listingNullRate = {
        ...mockListings[0],
        hourlyRate: null,
      };
      prisma.scout_listings.findMany.mockResolvedValue([listingNullRate] as any);

      const result = await service.searchListings({ maxBudget: 100, page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getListingById', () => {
    const mockListing = {
      id: 'listing-123',
      userId: 'scout-1',
      headline: 'Test Scout',
      status: ScoutListingStatus.ACTIVE,
      users: {
        id: 'scout-1',
        firstName: 'John',
        lastName: 'Scout',
        avatar: null,
      },
      marketplace_reviews: [
        { rating: 5 },
        { rating: 4 },
      ],
    };

    it('should get listing by ID successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);

      const result = await service.getListingById('listing-123');

      expect(prisma.scout_listings.findUnique).toHaveBeenCalledWith({
        where: { id: 'listing-123' },
        include: expect.objectContaining({
          users: expect.any(Object),
          marketplace_reviews: expect.any(Object),
        }),
      });
      expect(result).toMatchObject({
        ...mockListing,
        stats: {
          avgRating: 4.5,
          totalReviews: 2,
        },
      });
    });

    it('should throw NotFoundException if listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.getListingById('invalid-id')).rejects.toThrow(
        new NotFoundException('Listing not found'),
      );
    });

    it('should throw NotFoundException if listing is not ACTIVE', async () => {
      const inactiveListing = {
        ...mockListing,
        status: ScoutListingStatus.DRAFT,
      };
      prisma.scout_listings.findUnique.mockResolvedValue(inactiveListing as any);

      await expect(service.getListingById('listing-123')).rejects.toThrow(
        new NotFoundException('Listing not found'),
      );
    });

    it('should handle listing with no reviews', async () => {
      const listingNoReviews = {
        ...mockListing,
        marketplace_reviews: [],
      };
      prisma.scout_listings.findUnique.mockResolvedValue(listingNoReviews as any);

      const result = await service.getListingById('listing-123');

      expect(result.stats).toEqual({
        avgRating: 0,
        totalReviews: 0,
      });
    });
  });

  describe('calculateMatching', () => {
    const userId = 'club-user-123';
    const clubId = 'club-123';
    const mockUser = {
      id: userId,
      clubs: {
        id: clubId,
        name: 'Test Club',
      },
    };

    const mockListings = [
      {
        id: 'listing-1',
        userId: 'scout-1',
        expertise: {
          leagues: ['Premier League'],
          positions: ['Striker'],
          ageGroups: ['Senior'],
        },
        availability: {
          countries: ['UK'],
        },
        hourlyRate: 100,
        isVerified: true,
        status: ScoutListingStatus.ACTIVE,
        users: {
          id: 'scout-1',
          firstName: 'John',
          lastName: 'Scout',
          avatar: null,
        },
        marketplace_reviews: [
          { rating: 5 },
          { rating: 4 },
        ],
      },
    ];

    const calculateDto = {
      leagues: ['Premier League'],
      positions: ['Striker'],
      ageGroup: 'Senior',
      budget: 120,
      location: 'UK',
      minRating: 4,
    };

    it('should calculate matching scores successfully', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findMany.mockResolvedValue(mockListings as any);

      const result = await service.calculateMatching(userId, calculateDto);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { clubs: true },
      });
      expect(prisma.scout_listings.findMany).toHaveBeenCalledWith({
        where: { status: ScoutListingStatus.ACTIVE },
        include: expect.any(Object),
      });
      expect(result.clubNeeds).toEqual(calculateDto);
      expect(result.results).toBeDefined();
      expect(result.totalMatches).toBeGreaterThan(0);
    });

    it('should throw BadRequestException if user has no club', async () => {
      prisma.users.findUnique.mockResolvedValue({ id: userId, clubs: null } as any);

      await expect(service.calculateMatching(userId, calculateDto)).rejects.toThrow(
        new BadRequestException('You must be a club contact to use matching'),
      );
    });

    it('should throw BadRequestException if user not found', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.calculateMatching(userId, calculateDto)).rejects.toThrow(
        new BadRequestException('You must be a club contact to use matching'),
      );
    });

    it('should filter by minRating', async () => {
      const lowRatingScout = {
        ...mockListings[0],
        id: 'listing-2',
        marketplace_reviews: [{ rating: 2 }],
      };
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findMany.mockResolvedValue([mockListings[0], lowRatingScout] as any);

      const result = await service.calculateMatching(userId, { ...calculateDto, minRating: 4 });

      // Should filter out low rating scout
      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should return top 50 matches only', async () => {
      const manyListings = Array(60).fill(null).map((_, i) => ({
        ...mockListings[0],
        id: `listing-${i}`,
      }));
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findMany.mockResolvedValue(manyListings as any);

      const result = await service.calculateMatching(userId, calculateDto);

      expect(result.results.length).toBeLessThanOrEqual(50);
    });

    it('should sort results by matching score', async () => {
      const listings = [
        {
          ...mockListings[0],
          id: 'listing-1',
          expertise: { leagues: ['Premier League'], positions: ['Striker'], ageGroups: ['Senior'] },
          availability: { countries: ['UK'] },
          marketplace_reviews: [{ rating: 5 }],
        },
        {
          ...mockListings[0],
          id: 'listing-2',
          expertise: { leagues: ['La Liga'], positions: ['Midfielder'], ageGroups: ['U21'] },
          availability: { countries: ['Spain'] },
          marketplace_reviews: [{ rating: 3 }],
        },
      ];
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.scout_listings.findMany.mockResolvedValue(listings as any);

      const result = await service.calculateMatching(userId, calculateDto);

      // Should have at least one result
      expect(result.results.length).toBeGreaterThan(0);
      // First result should have higher or equal score than second (if exists)
      if (result.results.length > 1) {
        expect(result.results[0].matchingScore).toBeGreaterThanOrEqual(result.results[1].matchingScore);
      }
    });
  });

  // ==========================================
  // OFFERS TESTS
  // ==========================================

  describe('createOffer', () => {
    const clubId = 'club-123';
    const createOfferDto = {
      scoutListingId: 'listing-123',
      offerType: 'SCOUTING' as any,
      title: 'Scout for U21 Players',
      description: 'We need a scout to identify U21 talents',
      budget: 5000,
      currency: 'EUR',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      location: 'UK',
      requirements: { matchId: 'match-123', playerId: 'player-123', criteria: { experience: '5 years' } },
    };

    const mockListing = {
      id: 'listing-123',
      userId: 'scout-1',
      status: ScoutListingStatus.ACTIVE,
    };

    const mockOffer = {
      id: 'offer-123',
      ...createOfferDto,
      clubId,
      status: OfferStatus.PENDING,
      sentAt: new Date(),
      scout_listings: {
        ...mockListing,
        users: {
          id: 'scout-1',
          firstName: 'John',
          lastName: 'Scout',
        },
      },
      clubs: {
        id: clubId,
        name: 'Test Club',
        logo: 'logo.png',
      },
    };

    it('should create offer successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.create.mockResolvedValue(mockOffer as any);

      const result = await service.createOffer(clubId, createOfferDto);

      expect(prisma.scout_listings.findUnique).toHaveBeenCalledWith({
        where: { id: createOfferDto.scoutListingId },
      });
      expect(prisma.marketplace_offers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scoutListingId: createOfferDto.scoutListingId,
          clubId,
          offerType: createOfferDto.offerType,
          title: createOfferDto.title,
          description: createOfferDto.description,
          budget: createOfferDto.budget,
          currency: 'EUR',
          status: OfferStatus.PENDING,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockOffer);
    });

    it('should use EUR as default currency', async () => {
      const dtoNoCurrency = { ...createOfferDto };
      delete dtoNoCurrency.currency;

      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.create.mockResolvedValue(mockOffer as any);

      await service.createOffer(clubId, dtoNoCurrency);

      expect(prisma.marketplace_offers.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: 'EUR',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if scout listing not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.createOffer(clubId, createOfferDto)).rejects.toThrow(
        new NotFoundException('Scout listing not found or not active'),
      );
      expect(prisma.marketplace_offers.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if scout listing is not ACTIVE', async () => {
      const inactiveListing = {
        ...mockListing,
        status: ScoutListingStatus.PAUSED,
      };
      prisma.scout_listings.findUnique.mockResolvedValue(inactiveListing as any);

      await expect(service.createOffer(clubId, createOfferDto)).rejects.toThrow(
        new NotFoundException('Scout listing not found or not active'),
      );
    });
  });

  describe('getSentOffers', () => {
    const clubId = 'club-123';
    const mockOffers = [
      {
        id: 'offer-1',
        clubId,
        status: OfferStatus.PENDING,
        scout_listings: {
          users: {
            id: 'scout-1',
            firstName: 'John',
            lastName: 'Scout',
            avatar: null,
          },
        },
      },
      {
        id: 'offer-2',
        clubId,
        status: OfferStatus.ACCEPTED,
        scout_listings: {
          users: {
            id: 'scout-2',
            firstName: 'Jane',
            lastName: 'Scout',
            avatar: null,
          },
        },
      },
    ];

    it('should get all sent offers', async () => {
      prisma.marketplace_offers.findMany.mockResolvedValue(mockOffers as any);

      const result = await service.getSentOffers(clubId);

      expect(prisma.marketplace_offers.findMany).toHaveBeenCalledWith({
        where: { clubId },
        include: expect.any(Object),
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toEqual(mockOffers);
    });

    it('should filter by status', async () => {
      prisma.marketplace_offers.findMany.mockResolvedValue([mockOffers[0]] as any);

      const result = await service.getSentOffers(clubId, OfferStatus.PENDING);

      expect(prisma.marketplace_offers.findMany).toHaveBeenCalledWith({
        where: {
          clubId,
          status: OfferStatus.PENDING,
        },
        include: expect.any(Object),
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getReceivedOffers', () => {
    const userId = 'scout-user-123';
    const listingId = 'listing-123';
    const mockListing = {
      id: listingId,
      userId,
    };

    const mockOffers = [
      {
        id: 'offer-1',
        scoutListingId: listingId,
        status: OfferStatus.PENDING,
        clubs: {
          id: 'club-1',
          name: 'Test Club',
          logo: 'logo.png',
          country: 'UK',
        },
      },
    ];

    it('should get received offers successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findMany.mockResolvedValue(mockOffers as any);

      const result = await service.getReceivedOffers(userId);

      expect(prisma.scout_listings.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prisma.marketplace_offers.findMany).toHaveBeenCalledWith({
        where: { scoutListingId: listingId },
        include: expect.any(Object),
        orderBy: { sentAt: 'desc' },
      });
      expect(result).toEqual(mockOffers);
    });

    it('should filter by status', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findMany.mockResolvedValue([mockOffers[0]] as any);

      const result = await service.getReceivedOffers(userId, OfferStatus.PENDING);

      expect(prisma.marketplace_offers.findMany).toHaveBeenCalledWith({
        where: {
          scoutListingId: listingId,
          status: OfferStatus.PENDING,
        },
        include: expect.any(Object),
        orderBy: { sentAt: 'desc' },
      });
    });

    it('should throw NotFoundException if no listing found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.getReceivedOffers(userId)).rejects.toThrow(
        new NotFoundException('You do not have a listing'),
      );
    });
  });

  describe('acceptOffer', () => {
    const userId = 'scout-user-123';
    const offerId = 'offer-123';
    const mockListing = {
      id: 'listing-123',
      userId,
    };

    const mockOffer = {
      id: offerId,
      scoutListingId: mockListing.id,
      status: OfferStatus.PENDING,
    };

    const mockUpdatedOffer = {
      ...mockOffer,
      status: OfferStatus.ACCEPTED,
      respondedAt: new Date(),
      acceptedAt: new Date(),
      clubs: {
        id: 'club-123',
        name: 'Test Club',
      },
    };

    it('should accept offer successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_offers.update.mockResolvedValue(mockUpdatedOffer as any);

      const result = await service.acceptOffer(userId, offerId);

      expect(prisma.marketplace_offers.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: OfferStatus.ACCEPTED,
          respondedAt: expect.any(Date),
          acceptedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result.status).toBe(OfferStatus.ACCEPTED);
    });

    it('should throw ForbiddenException if user has no listing', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.acceptOffer(userId, offerId)).rejects.toThrow(
        new ForbiddenException('Not authorized'),
      );
    });

    it('should throw NotFoundException if offer not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(null);

      await expect(service.acceptOffer(userId, offerId)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw NotFoundException if offer belongs to different listing', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      const differentOffer = {
        ...mockOffer,
        scoutListingId: 'different-listing',
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(differentOffer as any);

      await expect(service.acceptOffer(userId, offerId)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw BadRequestException if offer is not PENDING', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      const acceptedOffer = {
        ...mockOffer,
        status: OfferStatus.ACCEPTED,
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(acceptedOffer as any);

      await expect(service.acceptOffer(userId, offerId)).rejects.toThrow(
        new BadRequestException('Offer is not in pending status'),
      );
    });
  });

  describe('rejectOffer', () => {
    const userId = 'scout-user-123';
    const offerId = 'offer-123';
    const mockListing = {
      id: 'listing-123',
      userId,
    };

    const mockOffer = {
      id: offerId,
      scoutListingId: mockListing.id,
      status: OfferStatus.PENDING,
    };

    const mockUpdatedOffer = {
      ...mockOffer,
      status: OfferStatus.REJECTED,
      respondedAt: new Date(),
    };

    it('should reject offer successfully', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_offers.update.mockResolvedValue(mockUpdatedOffer as any);

      const result = await service.rejectOffer(userId, offerId);

      expect(prisma.marketplace_offers.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: OfferStatus.REJECTED,
          respondedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(OfferStatus.REJECTED);
    });

    it('should throw ForbiddenException if user has no listing', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.rejectOffer(userId, offerId)).rejects.toThrow(
        new ForbiddenException('Not authorized'),
      );
    });

    it('should throw NotFoundException if offer not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(null);

      await expect(service.rejectOffer(userId, offerId)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw BadRequestException if offer is not PENDING', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      const rejectedOffer = {
        ...mockOffer,
        status: OfferStatus.REJECTED,
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(rejectedOffer as any);

      await expect(service.rejectOffer(userId, offerId)).rejects.toThrow(
        new BadRequestException('Offer is not in pending status'),
      );
    });
  });

  describe('completeOffer', () => {
    const userId = 'scout-user-123';
    const offerId = 'offer-123';
    const mockListing = {
      id: 'listing-123',
      userId,
    };

    const mockOffer = {
      id: offerId,
      scoutListingId: mockListing.id,
      status: OfferStatus.ACCEPTED,
    };

    const mockUpdatedOffer = {
      ...mockOffer,
      status: OfferStatus.COMPLETED,
      completedAt: new Date(),
    };

    it('should complete offer when ACCEPTED', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_offers.update.mockResolvedValue(mockUpdatedOffer as any);

      const result = await service.completeOffer(userId, offerId);

      expect(prisma.marketplace_offers.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: OfferStatus.COMPLETED,
          completedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe(OfferStatus.COMPLETED);
    });

    it('should complete offer when IN_PROGRESS', async () => {
      const inProgressOffer = {
        ...mockOffer,
        status: OfferStatus.IN_PROGRESS,
      };
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(inProgressOffer as any);
      prisma.marketplace_offers.update.mockResolvedValue(mockUpdatedOffer as any);

      const result = await service.completeOffer(userId, offerId);

      expect(result.status).toBe(OfferStatus.COMPLETED);
    });

    it('should throw ForbiddenException if user has no listing', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(null);

      await expect(service.completeOffer(userId, offerId)).rejects.toThrow(
        new ForbiddenException('Not authorized'),
      );
    });

    it('should throw NotFoundException if offer not found', async () => {
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(null);

      await expect(service.completeOffer(userId, offerId)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw BadRequestException if offer is PENDING', async () => {
      const pendingOffer = {
        ...mockOffer,
        status: OfferStatus.PENDING,
      };
      prisma.scout_listings.findUnique.mockResolvedValue(mockListing as any);
      prisma.marketplace_offers.findUnique.mockResolvedValue(pendingOffer as any);

      await expect(service.completeOffer(userId, offerId)).rejects.toThrow(
        new BadRequestException('Offer must be accepted or in progress'),
      );
    });
  });

  describe('cancelOffer', () => {
    const clubId = 'club-123';
    const offerId = 'offer-123';
    const mockOffer = {
      id: offerId,
      clubId,
      status: OfferStatus.PENDING,
    };

    const mockUpdatedOffer = {
      ...mockOffer,
      status: OfferStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: 'No longer needed',
    };

    it('should cancel offer successfully', async () => {
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_offers.update.mockResolvedValue(mockUpdatedOffer as any);

      const result = await service.cancelOffer(clubId, offerId, 'No longer needed');

      expect(prisma.marketplace_offers.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: OfferStatus.CANCELLED,
          cancelledAt: expect.any(Date),
          cancellationReason: 'No longer needed',
        },
      });
      expect(result.status).toBe(OfferStatus.CANCELLED);
    });

    it('should cancel offer without reason', async () => {
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_offers.update.mockResolvedValue({
        ...mockOffer,
        status: OfferStatus.CANCELLED,
      } as any);

      await service.cancelOffer(clubId, offerId);

      expect(prisma.marketplace_offers.update).toHaveBeenCalledWith({
        where: { id: offerId },
        data: {
          status: OfferStatus.CANCELLED,
          cancelledAt: expect.any(Date),
          cancellationReason: undefined,
        },
      });
    });

    it('should throw NotFoundException if offer not found', async () => {
      prisma.marketplace_offers.findUnique.mockResolvedValue(null);

      await expect(service.cancelOffer(clubId, offerId)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw NotFoundException if offer belongs to different club', async () => {
      const differentOffer = {
        ...mockOffer,
        clubId: 'different-club',
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(differentOffer as any);

      await expect(service.cancelOffer(clubId, offerId)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw BadRequestException if offer is COMPLETED', async () => {
      const completedOffer = {
        ...mockOffer,
        status: OfferStatus.COMPLETED,
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(completedOffer as any);

      await expect(service.cancelOffer(clubId, offerId)).rejects.toThrow(
        new BadRequestException('Cannot cancel completed offer'),
      );
    });
  });

  // ==========================================
  // REVIEWS TESTS
  // ==========================================

  describe('createReview', () => {
    const clubId = 'club-123';
    const createReviewDto = {
      offerId: 'offer-123',
      rating: 5,
      comment: 'Excellent scout!',
      tags: ['professional', 'thorough'],
    };

    const mockOffer = {
      id: createReviewDto.offerId,
      clubId,
      scoutListingId: 'listing-123',
      status: OfferStatus.COMPLETED,
      scout_listings: {
        id: 'listing-123',
      },
    };

    const mockReview = {
      id: 'review-123',
      ...createReviewDto,
      scoutListingId: mockOffer.scoutListingId,
      clubId,
      reviewedAt: new Date(),
      isVerified: true,
      clubs: {
        id: clubId,
        name: 'Test Club',
        logo: 'logo.png',
      },
    };

    it('should create review successfully', async () => {
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_reviews.findUnique.mockResolvedValue(null);
      prisma.marketplace_reviews.create.mockResolvedValue(mockReview as any);
      prisma.marketplace_reviews.findMany.mockResolvedValue([mockReview] as any);
      prisma.marketplace_offers.findMany.mockResolvedValue([mockOffer] as any);
      prisma.scout_listings.update.mockResolvedValue({} as any);

      const result = await service.createReview(clubId, createReviewDto);

      expect(prisma.marketplace_offers.findUnique).toHaveBeenCalledWith({
        where: { id: createReviewDto.offerId },
        include: { scout_listings: true },
      });
      expect(prisma.marketplace_reviews.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          offerId: createReviewDto.offerId,
          scoutListingId: mockOffer.scoutListingId,
          clubId,
          rating: createReviewDto.rating,
          comment: createReviewDto.comment,
          tags: createReviewDto.tags,
          isVerified: true,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockReview);
    });

    it('should create review without tags', async () => {
      const dtoNoTags = {
        offerId: 'offer-123',
        rating: 5,
        comment: 'Great!',
      };

      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_reviews.findUnique.mockResolvedValue(null);
      prisma.marketplace_reviews.create.mockResolvedValue(mockReview as any);
      prisma.marketplace_reviews.findMany.mockResolvedValue([mockReview] as any);
      prisma.marketplace_offers.findMany.mockResolvedValue([mockOffer] as any);
      prisma.scout_listings.update.mockResolvedValue({} as any);

      await service.createReview(clubId, dtoNoTags);

      expect(prisma.marketplace_reviews.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: [],
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if offer not found', async () => {
      prisma.marketplace_offers.findUnique.mockResolvedValue(null);

      await expect(service.createReview(clubId, createReviewDto)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw NotFoundException if offer belongs to different club', async () => {
      const differentOffer = {
        ...mockOffer,
        clubId: 'different-club',
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(differentOffer as any);

      await expect(service.createReview(clubId, createReviewDto)).rejects.toThrow(
        new NotFoundException('Offer not found'),
      );
    });

    it('should throw BadRequestException if offer is not COMPLETED', async () => {
      const pendingOffer = {
        ...mockOffer,
        status: OfferStatus.PENDING,
      };
      prisma.marketplace_offers.findUnique.mockResolvedValue(pendingOffer as any);

      await expect(service.createReview(clubId, createReviewDto)).rejects.toThrow(
        new BadRequestException('Can only review completed offers'),
      );
    });

    it('should throw BadRequestException if review already exists', async () => {
      prisma.marketplace_offers.findUnique.mockResolvedValue(mockOffer as any);
      prisma.marketplace_reviews.findUnique.mockResolvedValue(mockReview as any);

      await expect(service.createReview(clubId, createReviewDto)).rejects.toThrow(
        new BadRequestException('You have already reviewed this offer'),
      );
    });
  });

  describe('getListingReviews', () => {
    const listingId = 'listing-123';
    const mockReviews = [
      {
        id: 'review-1',
        scoutListingId: listingId,
        rating: 5,
        comment: 'Excellent!',
        clubs: {
          id: 'club-1',
          name: 'Test Club 1',
          logo: 'logo1.png',
        },
      },
      {
        id: 'review-2',
        scoutListingId: listingId,
        rating: 4,
        comment: 'Very good!',
        clubs: {
          id: 'club-2',
          name: 'Test Club 2',
          logo: 'logo2.png',
        },
      },
      {
        id: 'review-3',
        scoutListingId: listingId,
        rating: 3,
        comment: 'Good',
        clubs: {
          id: 'club-3',
          name: 'Test Club 3',
          logo: 'logo3.png',
        },
      },
    ];

    it('should get listing reviews with stats', async () => {
      prisma.marketplace_reviews.findMany.mockResolvedValue(mockReviews as any);

      const result = await service.getListingReviews(listingId);

      expect(prisma.marketplace_reviews.findMany).toHaveBeenCalledWith({
        where: { scoutListingId: listingId },
        include: expect.any(Object),
        orderBy: { reviewedAt: 'desc' },
      });
      expect(result.reviews).toEqual(mockReviews);
      expect(result.stats).toEqual({
        totalReviews: 3,
        avgRating: 4,
        ratingDistribution: {
          5: 1,
          4: 1,
          3: 1,
          2: 0,
          1: 0,
        },
      });
    });

    it('should handle no reviews', async () => {
      prisma.marketplace_reviews.findMany.mockResolvedValue([]);

      const result = await service.getListingReviews(listingId);

      expect(result.reviews).toEqual([]);
      expect(result.stats).toEqual({
        totalReviews: 0,
        avgRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      });
    });

    it('should calculate rating distribution correctly', async () => {
      const allFiveStars = [
        { ...mockReviews[0], rating: 5 },
        { ...mockReviews[1], rating: 5 },
        { ...mockReviews[2], rating: 5 },
      ];
      prisma.marketplace_reviews.findMany.mockResolvedValue(allFiveStars as any);

      const result = await service.getListingReviews(listingId);

      expect(result.stats.ratingDistribution).toEqual({
        5: 3,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      });
    });
  });

  // ==========================================
  // FAVORITES TESTS
  // ==========================================

  describe('addFavorite', () => {
    const clubId = 'club-123';
    const createFavoriteDto = {
      scoutListingId: 'listing-123',
      notes: 'Excellent scout for our needs',
      tags: ['premier-league', 'strikers'],
    };

    const mockFavorite = {
      id: 'favorite-123',
      clubId,
      ...createFavoriteDto,
      addedAt: new Date(),
      scout_listings: {
        id: 'listing-123',
        users: {
          id: 'scout-1',
          firstName: 'John',
          lastName: 'Scout',
          avatar: null,
        },
      },
    };

    it('should add favorite successfully', async () => {
      prisma.scout_favorites.findUnique.mockResolvedValue(null);
      prisma.scout_favorites.create.mockResolvedValue(mockFavorite as any);

      const result = await service.addFavorite(clubId, createFavoriteDto);

      expect(prisma.scout_favorites.findUnique).toHaveBeenCalledWith({
        where: {
          clubId_scoutListingId: {
            clubId,
            scoutListingId: createFavoriteDto.scoutListingId,
          },
        },
      });
      expect(prisma.scout_favorites.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          clubId,
          scoutListingId: createFavoriteDto.scoutListingId,
          notes: createFavoriteDto.notes,
          tags: createFavoriteDto.tags,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockFavorite);
    });

    it('should add favorite without tags', async () => {
      const dtoNoTags = {
        scoutListingId: 'listing-123',
        notes: 'Good scout',
      };

      prisma.scout_favorites.findUnique.mockResolvedValue(null);
      prisma.scout_favorites.create.mockResolvedValue(mockFavorite as any);

      await service.addFavorite(clubId, dtoNoTags);

      expect(prisma.scout_favorites.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: [],
        }),
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException if already favorited', async () => {
      prisma.scout_favorites.findUnique.mockResolvedValue(mockFavorite as any);

      await expect(service.addFavorite(clubId, createFavoriteDto)).rejects.toThrow(
        new BadRequestException('Already in favorites'),
      );
      expect(prisma.scout_favorites.create).not.toHaveBeenCalled();
    });
  });

  describe('getFavorites', () => {
    const clubId = 'club-123';
    const mockFavorites = [
      {
        id: 'favorite-1',
        clubId,
        scout_listings: {
          id: 'listing-1',
          users: {
            id: 'scout-1',
            firstName: 'John',
            lastName: 'Scout',
            avatar: null,
          },
          marketplace_reviews: [
            { rating: 5 },
            { rating: 4 },
          ],
        },
      },
      {
        id: 'favorite-2',
        clubId,
        scout_listings: {
          id: 'listing-2',
          users: {
            id: 'scout-2',
            firstName: 'Jane',
            lastName: 'Scout',
            avatar: null,
          },
          marketplace_reviews: [
            { rating: 3 },
          ],
        },
      },
    ];

    it('should get favorites with stats', async () => {
      prisma.scout_favorites.findMany.mockResolvedValue(mockFavorites as any);

      const result = await service.getFavorites(clubId);

      expect(prisma.scout_favorites.findMany).toHaveBeenCalledWith({
        where: { clubId },
        include: expect.objectContaining({
          scout_listings: expect.any(Object),
        }),
        orderBy: { addedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].scout_listings.stats).toEqual({
        avgRating: 4.5,
        totalReviews: 2,
      });
      expect(result[1].scout_listings.stats).toEqual({
        avgRating: 3,
        totalReviews: 1,
      });
    });

    it('should handle favorites with no reviews', async () => {
      const favoriteNoReviews = {
        ...mockFavorites[0],
        scout_listings: {
          ...mockFavorites[0].scout_listings,
          marketplace_reviews: [],
        },
      };
      prisma.scout_favorites.findMany.mockResolvedValue([favoriteNoReviews] as any);

      const result = await service.getFavorites(clubId);

      expect(result[0].scout_listings.stats).toEqual({
        avgRating: 0,
        totalReviews: 0,
      });
    });
  });

  describe('removeFavorite', () => {
    const clubId = 'club-123';
    const favoriteId = 'favorite-123';
    const mockFavorite = {
      id: favoriteId,
      clubId,
    };

    it('should remove favorite successfully', async () => {
      prisma.scout_favorites.findUnique.mockResolvedValue(mockFavorite as any);
      prisma.scout_favorites.delete.mockResolvedValue(mockFavorite as any);

      const result = await service.removeFavorite(clubId, favoriteId);

      expect(prisma.scout_favorites.findUnique).toHaveBeenCalledWith({
        where: { id: favoriteId },
      });
      expect(prisma.scout_favorites.delete).toHaveBeenCalledWith({
        where: { id: favoriteId },
      });
      expect(result).toEqual({ message: 'Removed from favorites' });
    });

    it('should throw NotFoundException if favorite not found', async () => {
      prisma.scout_favorites.findUnique.mockResolvedValue(null);

      await expect(service.removeFavorite(clubId, favoriteId)).rejects.toThrow(
        new NotFoundException('Favorite not found'),
      );
      expect(prisma.scout_favorites.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if favorite belongs to different club', async () => {
      const differentFavorite = {
        ...mockFavorite,
        clubId: 'different-club',
      };
      prisma.scout_favorites.findUnique.mockResolvedValue(differentFavorite as any);

      await expect(service.removeFavorite(clubId, favoriteId)).rejects.toThrow(
        new NotFoundException('Favorite not found'),
      );
    });
  });

  describe('updateFavorite', () => {
    const clubId = 'club-123';
    const favoriteId = 'favorite-123';
    const mockFavorite = {
      id: favoriteId,
      clubId,
      notes: 'Original notes',
      tags: ['tag1'],
    };

    it('should update favorite notes and tags', async () => {
      const updatedFavorite = {
        ...mockFavorite,
        notes: 'Updated notes',
        tags: ['tag1', 'tag2'],
      };

      prisma.scout_favorites.findUnique.mockResolvedValue(mockFavorite as any);
      prisma.scout_favorites.update.mockResolvedValue(updatedFavorite as any);

      const result = await service.updateFavorite(clubId, favoriteId, 'Updated notes', ['tag1', 'tag2']);

      expect(prisma.scout_favorites.update).toHaveBeenCalledWith({
        where: { id: favoriteId },
        data: {
          notes: 'Updated notes',
          tags: ['tag1', 'tag2'],
        },
      });
      expect(result).toEqual(updatedFavorite);
    });

    it('should update only notes', async () => {
      const updatedFavorite = {
        ...mockFavorite,
        notes: 'Updated notes',
      };

      prisma.scout_favorites.findUnique.mockResolvedValue(mockFavorite as any);
      prisma.scout_favorites.update.mockResolvedValue(updatedFavorite as any);

      await service.updateFavorite(clubId, favoriteId, 'Updated notes', undefined);

      expect(prisma.scout_favorites.update).toHaveBeenCalledWith({
        where: { id: favoriteId },
        data: {
          notes: 'Updated notes',
          tags: mockFavorite.tags,
        },
      });
    });

    it('should update only tags', async () => {
      const updatedFavorite = {
        ...mockFavorite,
        tags: ['new-tag'],
      };

      prisma.scout_favorites.findUnique.mockResolvedValue(mockFavorite as any);
      prisma.scout_favorites.update.mockResolvedValue(updatedFavorite as any);

      await service.updateFavorite(clubId, favoriteId, undefined, ['new-tag']);

      expect(prisma.scout_favorites.update).toHaveBeenCalledWith({
        where: { id: favoriteId },
        data: {
          notes: mockFavorite.notes,
          tags: ['new-tag'],
        },
      });
    });

    it('should throw NotFoundException if favorite not found', async () => {
      prisma.scout_favorites.findUnique.mockResolvedValue(null);

      await expect(service.updateFavorite(clubId, favoriteId, 'Updated')).rejects.toThrow(
        new NotFoundException('Favorite not found'),
      );
      expect(prisma.scout_favorites.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if favorite belongs to different club', async () => {
      const differentFavorite = {
        ...mockFavorite,
        clubId: 'different-club',
      };
      prisma.scout_favorites.findUnique.mockResolvedValue(differentFavorite as any);

      await expect(service.updateFavorite(clubId, favoriteId, 'Updated')).rejects.toThrow(
        new NotFoundException('Favorite not found'),
      );
    });
  });
});
