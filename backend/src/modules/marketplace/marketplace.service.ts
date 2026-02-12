import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoutListingStatus, OfferStatus } from '@prisma/client';
import { CreateScoutListingDto } from './dto/create-scout-listing.dto';
import { UpdateScoutListingDto } from './dto/update-scout-listing.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CalculateMatchingDto } from './dto/calculate-matching.dto';
import {
  calculateMatchingScore,
  getMatchingTier,
  getMatchingRecommendations,
  ClubNeeds,
  ScoutExpertise,
  ScoutAvailability,
  ScoutStats,
} from './matching.algorithm';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private toStringArray(value?: unknown): string[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter((item) => item.length > 0);
    }
    const stringValue = String(value);
    return stringValue ? [stringValue] : [];
  }

  // ==========================================
  // SCOUT LISTINGS
  // ==========================================

  /**
   * Create a scout listing
   */
  async createListing(userId: string, dto: CreateScoutListingDto) {
    // Check if user is a scout
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'SCOUT') {
      throw new BadRequestException('Only scouts can create listings');
    }

    // Check if listing already exists
    const existing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('You already have a listing. Use update instead.');
    }

    // Create listing
    const listing = await this.prisma.scout_listings.create({
      data: {
        id: randomUUID(),
        userId,
        headline: dto.headline,
        bio: dto.bio,
        expertise: dto.expertise as any,
        languages: dto.languages,
        availability: dto.availability as any,
        hourlyRate: dto.hourlyRate,
        matchRate: dto.matchRate,
        reportRate: dto.reportRate,
        currency: dto.currency || 'EUR',
        portfolio: dto.portfolio as any,
        stats: null,
        status: ScoutListingStatus.DRAFT,
        isVerified: false,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return listing;
  }

  /**
   * Get my scout listing
   */
  async getMyListing(userId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        marketplace_reviews: {
          take: 10,
          orderBy: { reviewedAt: 'desc' },
          include: {
            clubs: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('You do not have a listing yet');
    }

    return listing;
  }

  /**
   * Update scout listing
   */
  async updateListing(userId: string, dto: UpdateScoutListingDto) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.prisma.scout_listings.update({
      where: { id: listing.id },
      data: {
        ...dto,
        expertise: dto.expertise as any,
        availability: dto.availability as any,
        portfolio: dto.portfolio as any,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Activate listing (make it visible on marketplace)
   */
  async activateListing(userId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Check if listing is complete
    if (!listing.headline || !listing.expertise || !listing.availability) {
      throw new BadRequestException('Listing must be complete before activation');
    }

    const updated = await this.prisma.scout_listings.update({
      where: { id: listing.id },
      data: {
        status: ScoutListingStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Pause listing
   */
  async pauseListing(userId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.prisma.scout_listings.update({
      where: { id: listing.id },
      data: {
        status: ScoutListingStatus.PAUSED,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete (archive) listing
   */
  async deleteListing(userId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.prisma.scout_listings.update({
      where: { id: listing.id },
      data: {
        status: ScoutListingStatus.ARCHIVED,
        updatedAt: new Date(),
      },
    });

    return { message: 'Listing archived successfully' };
  }

  // ==========================================
  // SEARCH & MATCHING
  // ==========================================

  /**
   * Search scout listings with filters
   */
  async searchListings(dto: SearchListingsDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: ScoutListingStatus.ACTIVE,
    };

    if (dto.verifiedOnly) {
      where.isVerified = true;
    }

    // Get all active listings
    const listings = await this.prisma.scout_listings.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        marketplace_reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Filter in memory (Prisma doesn't support JSON filtering well)
    let filtered = listings;

    if (dto.leagues && dto.leagues.length > 0) {
      filtered = filtered.filter((listing) => {
        const expertise = listing.expertise as any;
        return dto.leagues.some((league) => expertise?.leagues?.includes(league));
      });
    }

    if (dto.positions && dto.positions.length > 0) {
      filtered = filtered.filter((listing) => {
        const expertise = listing.expertise as any;
        return dto.positions.some((pos) => expertise?.positions?.includes(pos));
      });
    }

    if (dto.country) {
      filtered = filtered.filter((listing) => {
        const availability = listing.availability as any;
        return availability?.countries?.includes(dto.country);
      });
    }

    if (dto.languages && dto.languages.length > 0) {
      filtered = filtered.filter((listing) => {
        return dto.languages.some((lang) => listing.languages.includes(lang));
      });
    }

    if (dto.maxBudget) {
      filtered = filtered.filter((listing) => {
        return !listing.hourlyRate || listing.hourlyRate <= dto.maxBudget;
      });
    }

    if (dto.minRating) {
      filtered = filtered.filter((listing) => {
        const reviews = listing.marketplace_reviews;
        if (reviews.length === 0) return false;
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        return avgRating >= dto.minRating;
      });
    }

    // Calculate stats and add to listings
    const enriched = filtered.map((listing) => {
      const reviews = listing.marketplace_reviews;
      const avgRating =
        reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

      return {
        ...listing,
        stats: {
          avgRating,
          totalReviews: reviews.length,
        },
      };
    });

    // Sort by rating
    enriched.sort((a, b) => b.stats.avgRating - a.stats.avgRating);

    // Paginate
    const paginated = enriched.slice(skip, skip + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total: enriched.length,
        totalPages: Math.ceil(enriched.length / limit),
      },
    };
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { id: listingId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        marketplace_reviews: {
          orderBy: { reviewedAt: 'desc' },
          include: {
            clubs: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!listing || listing.status !== ScoutListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }

    // Calculate stats
    const reviews = listing.marketplace_reviews;
    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return {
      ...listing,
      stats: {
        avgRating,
        totalReviews: reviews.length,
      },
    };
  }

  /**
   * Calculate matching scores for club needs
   */
  async calculateMatching(userId: string, dto: CalculateMatchingDto) {
    // Get user's club
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: { clubs: true },
    });

    if (!user || !user.clubs) {
      throw new BadRequestException('You must be a club contact to use matching');
    }

    // Get all active listings
    const listings = await this.prisma.scout_listings.findMany({
      where: {
        status: ScoutListingStatus.ACTIVE,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        marketplace_reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate matching score for each listing
    const clubNeeds: ClubNeeds = {
      leagues: dto.leagues,
      positions: dto.positions,
      ageGroup: dto.ageGroup,
      budget: dto.budget,
      location: dto.location,
      minRating: dto.minRating,
    };

    const results = listings.map((listing) => {
      const expertise = listing.expertise as any as ScoutExpertise;
      const availability = listing.availability as any as ScoutAvailability;
      const reviews = listing.marketplace_reviews;

      const scoutStats: ScoutStats = {
        avgRating:
          reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        totalReviews: reviews.length,
      };

      const matchingScore = calculateMatchingScore(
        clubNeeds,
        expertise,
        availability,
        listing.hourlyRate,
        scoutStats,
        listing.isVerified,
      );

      return {
        listing,
        matchingScore: matchingScore.total,
        matchingBreakdown: matchingScore.breakdown,
        matchingTier: getMatchingTier(matchingScore.total),
        recommendations: getMatchingRecommendations(matchingScore),
        stats: scoutStats,
      };
    });

    // Sort by matching score
    results.sort((a, b) => b.matchingScore - a.matchingScore);

    // Filter by minimum rating if specified
    const filtered = dto.minRating
      ? results.filter((r) => !r.stats.avgRating || r.stats.avgRating >= dto.minRating)
      : results;

    return {
      clubNeeds,
      results: filtered.slice(0, 50), // Top 50 matches
      totalMatches: filtered.length,
    };
  }

  // ==========================================
  // OFFERS
  // ==========================================

  /**
   * Create an offer (club sends to scout)
   */
  async createOffer(clubId: string, dto: CreateOfferDto) {
    // Verify scout listing exists and is active
    const listing = await this.prisma.scout_listings.findUnique({
      where: { id: dto.scoutListingId },
      include: {
        marketplace_reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!listing || listing.status !== ScoutListingStatus.ACTIVE) {
      throw new NotFoundException('Scout listing not found or not active');
    }

    // Calculate matching score if requirements provided
    let matchingScore: number | null = null;
    if (dto.requirements) {
      const club = await this.prisma.clubs.findUnique({
        where: { id: clubId },
        select: {
          name: true,
          country: true,
          city: true,
        },
      });

      const criteria = (dto.requirements.criteria ?? {}) as Record<string, unknown>;
      const clubNeeds: ClubNeeds = {
        leagues: this.toStringArray(criteria.leagues ?? criteria.league),
        positions: this.toStringArray(criteria.positions ?? criteria.position),
        ageGroup: String(criteria.ageGroup ?? criteria.age ?? 'any'),
        budget: dto.budget,
        location: dto.location ?? club?.country ?? club?.city ?? 'Unknown',
        minRating: typeof criteria.minRating === 'number' ? criteria.minRating : undefined,
      };

      const expertiseRaw = (listing.expertise ?? {}) as Partial<ScoutExpertise>;
      const availabilityRaw = (listing.availability ?? {}) as Partial<ScoutAvailability>;

      const expertise: ScoutExpertise = {
        leagues: this.toStringArray(expertiseRaw.leagues),
        positions: this.toStringArray(expertiseRaw.positions),
        ageGroups: this.toStringArray(expertiseRaw.ageGroups),
      };

      const availability: ScoutAvailability = {
        countries: this.toStringArray(availabilityRaw.countries),
        travelRadius:
          typeof availabilityRaw.travelRadius === 'number'
            ? availabilityRaw.travelRadius
            : undefined,
      };

      const reviews = listing.marketplace_reviews ?? [];
      const avgRating =
        reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

      const scoutStats: ScoutStats = {
        avgRating,
        totalReviews: reviews.length,
      };

      const score = calculateMatchingScore(
        clubNeeds,
        expertise,
        availability,
        listing.hourlyRate ?? null,
        scoutStats,
        Boolean(listing.isVerified),
      );

      matchingScore = score.total;
    }

    const offer = await this.prisma.marketplace_offers.create({
      data: {
        id: randomUUID(),
        scoutListingId: dto.scoutListingId,
        clubId,
        offerType: dto.offerType,
        title: dto.title,
        description: dto.description,
        budget: dto.budget,
        currency: dto.currency || 'EUR',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        location: dto.location,
        requirements: dto.requirements as any,
        status: OfferStatus.PENDING,
        matchingScore,
        sentAt: new Date(),
      },
      include: {
        scout_listings: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    try {
      await this.notificationsService.sendToUser({
        userId: listing.userId,
        title: `New offer from ${offer.clubs.name}`,
        body: offer.title,
        type: 'MARKETPLACE_OFFER',
        data: {
          offerId: offer.id,
          clubId,
          scoutListingId: dto.scoutListingId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to notify scout about offer ${offer.id}: ${error?.message ?? error}`,
      );
    }

    return offer;
  }

  /**
   * Get offers sent by club
   */
  async getSentOffers(clubId: string, status?: OfferStatus) {
    const where: any = { clubId };
    if (status) {
      where.status = status;
    }

    const offers = await this.prisma.marketplace_offers.findMany({
      where,
      include: {
        scout_listings: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    return offers;
  }

  /**
   * Get offers received by scout
   */
  async getReceivedOffers(userId: string, status?: OfferStatus) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new NotFoundException('You do not have a listing');
    }

    const where: any = { scoutListingId: listing.id };
    if (status) {
      where.status = status;
    }

    const offers = await this.prisma.marketplace_offers.findMany({
      where,
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
            country: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    return offers;
  }

  /**
   * Accept offer (scout)
   */
  async acceptOffer(userId: string, offerId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new ForbiddenException('Not authorized');
    }

    const offer = await this.prisma.marketplace_offers.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.scoutListingId !== listing.id) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Offer is not in pending status');
    }

    const updated = await this.prisma.marketplace_offers.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.ACCEPTED,
        respondedAt: new Date(),
        acceptedAt: new Date(),
      },
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    try {
      const club = await this.prisma.clubs.findUnique({
        where: { id: updated.clubs.id },
        select: {
          contactUserId: true,
          name: true,
        },
      });

      if (club?.contactUserId) {
        await this.notificationsService.sendToUser({
          userId: club.contactUserId,
          title: `Offer accepted by scout`,
          body: `Your offer "${updated.title}" was accepted.`,
          type: 'MARKETPLACE_OFFER_ACCEPTED',
          data: {
            offerId: updated.id,
            scoutUserId: userId,
            clubId: updated.clubs.id,
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to notify club about accepted offer ${updated.id}: ${error?.message ?? error}`,
      );
    }

    return updated;
  }

  /**
   * Reject offer (scout)
   */
  async rejectOffer(userId: string, offerId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new ForbiddenException('Not authorized');
    }

    const offer = await this.prisma.marketplace_offers.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.scoutListingId !== listing.id) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Offer is not in pending status');
    }

    const updated = await this.prisma.marketplace_offers.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.REJECTED,
        respondedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Mark offer as completed
   */
  async completeOffer(userId: string, offerId: string) {
    const listing = await this.prisma.scout_listings.findUnique({
      where: { userId },
    });

    if (!listing) {
      throw new ForbiddenException('Not authorized');
    }

    const offer = await this.prisma.marketplace_offers.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.scoutListingId !== listing.id) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.ACCEPTED && offer.status !== OfferStatus.IN_PROGRESS) {
      throw new BadRequestException('Offer must be accepted or in progress');
    }

    const updated = await this.prisma.marketplace_offers.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Cancel offer (club)
   */
  async cancelOffer(clubId: string, offerId: string, reason?: string) {
    const offer = await this.prisma.marketplace_offers.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.clubId !== clubId) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status === OfferStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed offer');
    }

    const updated = await this.prisma.marketplace_offers.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    return updated;
  }

  // ==========================================
  // REVIEWS
  // ==========================================

  /**
   * Create review (club reviews scout after completed mission)
   */
  async createReview(clubId: string, dto: CreateReviewDto) {
    // Verify offer exists and is completed
    const offer = await this.prisma.marketplace_offers.findUnique({
      where: { id: dto.offerId },
      include: { scout_listings: true },
    });

    if (!offer || offer.clubId !== clubId) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed offers');
    }

    // Check if review already exists
    const existing = await this.prisma.marketplace_reviews.findUnique({
      where: {
        offerId_clubId: {
          offerId: dto.offerId,
          clubId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this offer');
    }

    const review = await this.prisma.marketplace_reviews.create({
      data: {
        id: randomUUID(),
        offerId: dto.offerId,
        scoutListingId: offer.scoutListingId,
        clubId,
        rating: dto.rating,
        comment: dto.comment,
        tags: dto.tags || [],
        reviewedAt: new Date(),
        isVerified: true, // Verified because linked to completed offer
      },
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    // Update scout listing stats
    await this.updateListingStats(offer.scoutListingId);

    return review;
  }

  /**
   * Get reviews for a scout listing
   */
  async getListingReviews(listingId: string) {
    const reviews = await this.prisma.marketplace_reviews.findMany({
      where: { scoutListingId: listingId },
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });

    // Calculate stats
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      reviews,
      stats: {
        totalReviews,
        avgRating,
        ratingDistribution,
      },
    };
  }

  /**
   * Update listing stats (internal)
   */
  private async updateListingStats(listingId: string) {
    const reviews = await this.prisma.marketplace_reviews.findMany({
      where: { scoutListingId: listingId },
      select: { rating: true },
    });

    const offers = await this.prisma.marketplace_offers.findMany({
      where: { scoutListingId: listingId },
      select: { status: true },
    });

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
    const completedOffers = offers.filter((o) => o.status === OfferStatus.COMPLETED).length;
    const totalOffers = offers.length;
    const completionRate = totalOffers > 0 ? completedOffers / totalOffers : 0;

    await this.prisma.scout_listings.update({
      where: { id: listingId },
      data: {
        stats: {
          avgRating,
          totalReviews,
          completionRate,
          totalOffers,
        } as any,
        updatedAt: new Date(),
      },
    });
  }

  // ==========================================
  // FAVORITES
  // ==========================================

  /**
   * Add scout to favorites
   */
  async addFavorite(clubId: string, dto: CreateFavoriteDto) {
    // Check if already favorited
    const existing = await this.prisma.scout_favorites.findUnique({
      where: {
        clubId_scoutListingId: {
          clubId,
          scoutListingId: dto.scoutListingId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already in favorites');
    }

    const favorite = await this.prisma.scout_favorites.create({
      data: {
        id: randomUUID(),
        clubId,
        scoutListingId: dto.scoutListingId,
        notes: dto.notes,
        tags: dto.tags || [],
        addedAt: new Date(),
      },
      include: {
        scout_listings: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return favorite;
  }

  /**
   * Get club's favorites
   */
  async getFavorites(clubId: string) {
    const favorites = await this.prisma.scout_favorites.findMany({
      where: { clubId },
      include: {
        scout_listings: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            marketplace_reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    // Add stats
    const enriched = favorites.map((fav) => {
      const reviews = fav.scout_listings.marketplace_reviews;
      const avgRating =
        reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

      return {
        ...fav,
        scout_listings: {
          ...fav.scout_listings,
          stats: {
            avgRating,
            totalReviews: reviews.length,
          },
        },
      };
    });

    return enriched;
  }

  /**
   * Remove from favorites
   */
  async removeFavorite(clubId: string, favoriteId: string) {
    const favorite = await this.prisma.scout_favorites.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite || favorite.clubId !== clubId) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.scout_favorites.delete({
      where: { id: favoriteId },
    });

    return { message: 'Removed from favorites' };
  }

  /**
   * Update favorite notes/tags
   */
  async updateFavorite(clubId: string, favoriteId: string, notes?: string, tags?: string[]) {
    const favorite = await this.prisma.scout_favorites.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite || favorite.clubId !== clubId) {
      throw new NotFoundException('Favorite not found');
    }

    const updated = await this.prisma.scout_favorites.update({
      where: { id: favoriteId },
      data: {
        notes: notes !== undefined ? notes : favorite.notes,
        tags: tags !== undefined ? tags : favorite.tags,
      },
    });

    return updated;
  }
}
