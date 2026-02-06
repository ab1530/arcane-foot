import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PlayerValidationService } from './player-validation.service';
import { BulkImportService, ImportResult } from './bulk-import.service';
import { ValidatePlayerDto, RejectPlayerDto, ConvertToAgencyDto } from './dto/validate-player.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { VerificationStatus } from '@prisma/client';

@ApiTags('Player Validation')
@Controller('admin/players')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PlayerValidationController {
  constructor(
    private readonly validationService: PlayerValidationService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  @Get('pending-validation')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @ApiOperation({
    summary: 'Get pending PUBLIC players',
    description: 'Retrieve a paginated list of PUBLIC players awaiting validation',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending players retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getPendingPlayers(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.validationService.getPendingPlayers(pageNum, limitNum);
  }

  @Get('by-status/:status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @ApiOperation({
    summary: 'Get players by verification status',
    description: 'Retrieve players filtered by verification status',
  })
  @ApiParam({
    name: 'status',
    enum: VerificationStatus,
    description: 'Verification status',
    example: 'VERIFIED',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of players retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status provided',
  })
  async getPlayersByStatus(
    @Param('status') status: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Validate status enum
    if (!Object.values(VerificationStatus).includes(status as VerificationStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.validationService.getPlayersByStatus(
      status as VerificationStatus,
      pageNum,
      limitNum,
    );
  }

  @Post(':id/validate')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate a player',
    description: 'Mark a PUBLIC player profile as VERIFIED',
  })
  @ApiParam({
    name: 'id',
    description: 'Player ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiBody({ type: ValidatePlayerDto })
  @ApiResponse({
    status: 200,
    description: 'Player validated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Player already verified or not PUBLIC type',
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async validatePlayer(@Param('id') id: string, @Body() dto: ValidatePlayerDto, @Req() req: any) {
    const userId = req.user.id;
    return this.validationService.validatePlayer(id, userId, dto);
  }

  @Post(':id/reject')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a player',
    description: 'Mark a PUBLIC player profile as REJECTED with a reason',
  })
  @ApiParam({
    name: 'id',
    description: 'Player ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiBody({ type: RejectPlayerDto })
  @ApiResponse({
    status: 200,
    description: 'Player rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Not a PUBLIC player',
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async rejectPlayer(@Param('id') id: string, @Body() dto: RejectPlayerDto, @Req() req: any) {
    const userId = req.user.id;
    return this.validationService.rejectPlayer(id, userId, dto);
  }

  @Post(':id/mark-suspicious')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark player as suspicious',
    description: 'Flag a player profile as potentially fraudulent or suspicious',
  })
  @ApiParam({
    name: 'id',
    description: 'Player ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for marking as suspicious',
          example: 'Duplicate profile detected with different email',
        },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Player marked as suspicious successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async markAsSuspicious(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }

    const userId = req.user.id;
    return this.validationService.markAsSuspicious(id, userId, reason);
  }

  @Post(':id/convert-to-agency')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert PUBLIC player to AGENCY',
    description: 'Convert a verified PUBLIC player to AGENCY type (premium upgrade)',
  })
  @ApiParam({
    name: 'id',
    description: 'Player ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiBody({ type: ConvertToAgencyDto })
  @ApiResponse({
    status: 200,
    description: 'Player converted to AGENCY successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Player must be verified first or not PUBLIC type',
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async convertToAgency(@Param('id') id: string, @Body() dto: ConvertToAgencyDto, @Req() req: any) {
    const userId = req.user.id;
    return this.validationService.convertToAgency(id, userId, dto);
  }

  @Get('verification-stats')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @ApiOperation({
    summary: 'Get verification statistics',
    description: 'Retrieve dashboard statistics about player verification',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPublicPlayers: { type: 'number', example: 150 },
        statusBreakdown: {
          type: 'object',
          properties: {
            pending: { type: 'number', example: 45 },
            verified: { type: 'number', example: 80 },
            rejected: { type: 'number', example: 20 },
            suspicious: { type: 'number', example: 5 },
          },
        },
        percentages: {
          type: 'object',
          properties: {
            pending: { type: 'number', example: 30 },
            verified: { type: 'number', example: 53.33 },
            rejected: { type: 'number', example: 13.33 },
            suspicious: { type: 'number', example: 3.33 },
          },
        },
        recentActivity: {
          type: 'object',
          properties: {
            validationsLast30Days: { type: 'number', example: 15 },
            rejectionsLast30Days: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getVerificationStats() {
    return this.validationService.getVerificationStats();
  }

  @Get(':id/validation-history')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SCOUT')
  @ApiOperation({
    summary: 'Get player validation history',
    description: 'Retrieve the full validation history for a player including all status changes',
  })
  @ApiParam({
    name: 'id',
    description: 'Player ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Player not found',
  })
  async getValidationHistory(@Param('id') id: string) {
    return this.validationService.getValidationHistory(id);
  }

  @Post('bulk-import')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk import players',
    description: 'Import multiple players at once from JSON data',
  })
  @ApiBody({ type: BulkImportDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk import completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        imported: { type: 'number', example: 45 },
        failed: { type: 'number', example: 5 },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number', example: 3 },
              field: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Email already exists' },
            },
          },
        },
        players: { type: 'array' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation errors in bulk data',
  })
  async bulkImport(@Body() dto: BulkImportDto, @Req() req: any): Promise<ImportResult> {
    const userId = req.user.id;
    return this.bulkImportService.importPlayers(dto, userId);
  }

  @Post('bulk-import-csv')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk import players from CSV',
    description: 'Import multiple players from CSV file content',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        csvContent: {
          type: 'string',
          description: 'CSV file content as string',
          example:
            'firstName,lastName,email,position,dateOfBirth,nationality\nJohn,Doe,john@example.com,Forward,1998-01-15,US',
        },
        autoVerify: {
          type: 'boolean',
          description: 'Automatically verify imported players',
          example: false,
        },
      },
      required: ['csvContent'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'CSV import completed',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid CSV format or validation errors',
  })
  async bulkImportCsv(
    @Body('csvContent') csvContent: string,
    @Body('autoVerify') autoVerify: boolean = false,
    @Req() req: any,
  ): Promise<ImportResult> {
    if (!csvContent) {
      throw new BadRequestException('CSV content is required');
    }

    const userId = req.user.id;

    // Parse CSV
    const players = this.bulkImportService.parseCsvFile(csvContent);

    // Import players
    return this.bulkImportService.importPlayers({ players, autoVerify }, userId);
  }

  @Get('export-csv')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="players-export.csv"')
  @ApiOperation({
    summary: 'Export players to CSV',
    description: 'Export PUBLIC players to CSV format',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: VerificationStatus,
    description: 'Filter by verification status',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async exportCsv(@Query('status') status?: string) {
    let verificationStatus: VerificationStatus | undefined;

    if (status) {
      if (!Object.values(VerificationStatus).includes(status as VerificationStatus)) {
        throw new BadRequestException(`Invalid status: ${status}`);
      }
      verificationStatus = status as VerificationStatus;
    }

    return this.bulkImportService.exportPlayersToCSV(verificationStatus);
  }
}
