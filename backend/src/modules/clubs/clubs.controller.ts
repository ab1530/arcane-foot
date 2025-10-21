import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new club', description: 'Creates a new club profile' })
  @ApiResponse({ status: 201, description: 'Club successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  create(@Body() createClubDto: CreateClubDto) {
    return this.clubsService.create(createClubDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs', description: 'Retrieve a paginated list of clubs with optional filters' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country (ISO code)' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by club name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'List of clubs retrieved successfully' })
  findAll(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.clubsService.findAll({
      country,
      city,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club by ID', description: 'Retrieve detailed information about a specific club' })
  @ApiParam({ name: 'id', description: 'Club ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Club found' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  findOne(@Param('id') id: string) {
    return this.clubsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update club', description: 'Update club information' })
  @ApiParam({ name: 'id', description: 'Club ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Club successfully updated' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) {
    return this.clubsService.update(id, updateClubDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete club', description: 'Delete a club profile' })
  @ApiParam({ name: 'id', description: 'Club ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Club successfully deleted' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  remove(@Param('id') id: string) {
    return this.clubsService.remove(id);
  }

  @Get(':id/players')
  @ApiOperation({ summary: 'Get club players', description: 'Retrieve all players belonging to a club' })
  @ApiParam({ name: 'id', description: 'Club ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Players retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  getPlayers(@Param('id') id: string) {
    return this.clubsService.getPlayers(id);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Get club matches', description: 'Retrieve all matches for a club' })
  @ApiParam({ name: 'id', description: 'Club ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiQuery({ name: 'upcoming', required: false, description: 'Filter for upcoming matches only', example: 'true' })
  @ApiResponse({ status: 200, description: 'Matches retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  getMatches(@Param('id') id: string, @Query('upcoming') upcoming?: string) {
    return this.clubsService.getMatches(id, {
      upcoming: upcoming === 'true',
    });
  }
}
