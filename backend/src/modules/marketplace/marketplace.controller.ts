import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateScoutListingDto } from './dto/create-scout-listing.dto';
import { UpdateScoutListingDto } from './dto/update-scout-listing.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CalculateMatchingDto } from './dto/calculate-matching.dto';

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ==================== SCOUT LISTING MANAGEMENT ====================

  @Post('listings')
  @ApiOperation({ summary: 'Create scout listing (scouts only)' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  @ApiResponse({ status: 400, description: 'Only scouts can create listings' })
  async createListing(@Request() req, @Body() dto: CreateScoutListingDto) {
    return this.marketplaceService.createListing(req.user.userId, dto);
  }

  @Get('listings/my')
  @ApiOperation({ summary: 'Get my scout listing (scouts only)' })
  @ApiResponse({ status: 200, description: 'Listing retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No listing found' })
  async getMyListing(@Request() req) {
    return this.marketplaceService.getMyListing(req.user.userId);
  }

  @Patch('listings')
  @ApiOperation({ summary: 'Update scout listing (scouts only)' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to update this listing' })
  async updateListing(
    @Request() req,
    @Body() dto: UpdateScoutListingDto,
  ) {
    return this.marketplaceService.updateListing(req.user.userId, dto);
  }

  @Patch('listings/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate scout listing (make it visible)' })
  @ApiResponse({ status: 200, description: 'Listing activated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async activateListing(@Request() req) {
    return this.marketplaceService.activateListing(req.user.userId);
  }

  @Patch('listings/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause scout listing (temporarily hide)' })
  @ApiResponse({ status: 200, description: 'Listing paused' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async pauseListing(@Request() req) {
    return this.marketplaceService.pauseListing(req.user.userId);
  }

  @Delete('listings')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete scout listing (archives it)' })
  @ApiResponse({ status: 204, description: 'Listing deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async deleteListing(@Request() req) {
    return this.marketplaceService.deleteListing(req.user.userId);
  }

  // ==================== SEARCH & DISCOVERY ====================

  @Get('listings')
  @ApiOperation({ summary: 'Search scout listings with filters' })
  @ApiResponse({ status: 200, description: 'Listings retrieved successfully' })
  @ApiQuery({ name: 'leagues', required: false, type: [String] })
  @ApiQuery({ name: 'positions', required: false, type: [String] })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'maxBudget', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  async searchListings(@Query() query: SearchListingsDto) {
    return this.marketplaceService.searchListings(query);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get scout listing details by ID' })
  @ApiResponse({ status: 200, description: 'Listing details retrieved' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingById(@Param('id') id: string) {
    return this.marketplaceService.getListingById(id);
  }

  @Post('listings/match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate matching scores for club needs (clubs only)',
  })
  @ApiResponse({ status: 200, description: 'Matching scores calculated' })
  async calculateMatching(@Request() req, @Body() dto: CalculateMatchingDto) {
    return this.marketplaceService.calculateMatching(req.user.userId, dto);
  }

  // ==================== OFFER MANAGEMENT ====================

  @Post('offers')
  @ApiOperation({ summary: 'Send offer to scout (clubs only)' })
  @ApiResponse({ status: 201, description: 'Offer sent successfully' })
  @ApiResponse({ status: 400, description: 'Only clubs can send offers' })
  async createOffer(@Request() req, @Body() dto: CreateOfferDto) {
    return this.marketplaceService.createOffer(req.user.clubId, dto);
  }

  @Get('offers/sent')
  @ApiOperation({ summary: 'Get offers sent by my club' })
  @ApiResponse({ status: 200, description: 'Sent offers retrieved' })
  async getSentOffers(@Request() req) {
    return this.marketplaceService.getSentOffers(req.user.clubId);
  }

  @Get('offers/received')
  @ApiOperation({ summary: 'Get offers received by me (scouts only)' })
  @ApiResponse({ status: 200, description: 'Received offers retrieved' })
  async getReceivedOffers(@Request() req) {
    return this.marketplaceService.getReceivedOffers(req.user.userId);
  }

  @Patch('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept offer (scouts only)' })
  @ApiResponse({ status: 200, description: 'Offer accepted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async acceptOffer(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.acceptOffer(req.user.userId, id);
  }

  @Patch('offers/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject offer (scouts only)' })
  @ApiResponse({ status: 200, description: 'Offer rejected' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async rejectOffer(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.marketplaceService.rejectOffer(req.user.userId, id);
  }

  @Patch('offers/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark offer as completed (scouts only)' })
  @ApiResponse({ status: 200, description: 'Offer marked as completed' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async completeOffer(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.completeOffer(req.user.userId, id);
  }

  @Patch('offers/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel offer' })
  @ApiResponse({ status: 200, description: 'Offer cancelled' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async cancelOffer(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.marketplaceService.cancelOffer(req.user.clubId, id, reason);
  }

  // ==================== REVIEWS ====================

  @Post('reviews')
  @ApiOperation({ summary: 'Create review for completed offer (clubs only)' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Can only review completed offers' })
  async createReview(@Request() req, @Body() dto: CreateReviewDto) {
    return this.marketplaceService.createReview(req.user.clubId, dto);
  }

  @Get('reviews/listing/:listingId')
  @ApiOperation({ summary: 'Get all reviews for a scout listing' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved' })
  async getListingReviews(@Param('listingId') listingId: string) {
    return this.marketplaceService.getListingReviews(listingId);
  }

  // ==================== FAVORITES ====================

  @Post('favorites')
  @ApiOperation({ summary: 'Add scout listing to favorites (clubs only)' })
  @ApiResponse({ status: 201, description: 'Favorite added' })
  async addFavorite(@Request() req, @Body() dto: CreateFavoriteDto) {
    return this.marketplaceService.addFavorite(req.user.clubId, dto);
  }

  @Get('favorites/my')
  @ApiOperation({ summary: 'Get my favorite scout listings' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved' })
  async getFavorites(@Request() req) {
    return this.marketplaceService.getFavorites(req.user.clubId);
  }

  @Delete('favorites/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove favorite' })
  @ApiResponse({ status: 204, description: 'Favorite removed' })
  async removeFavorite(@Request() req, @Param('id') id: string) {
    return this.marketplaceService.removeFavorite(req.user.clubId, id);
  }

  @Patch('favorites/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update favorite notes/tags' })
  @ApiResponse({ status: 200, description: 'Favorite updated' })
  async updateFavorite(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: Partial<CreateFavoriteDto>,
  ) {
    return this.marketplaceService.updateFavorite(req.user.clubId, id, dto.notes, dto.tags);
  }
}
