import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TransferMarketService } from './transfer-market.service';
import { ListTransferRequestsDto } from './dto/list-transfer-requests.dto';
import { CreateTransferRequestDto } from './dto/create-transfer-request.dto';
import { UpdateTransferRequestDto } from './dto/update-transfer-request.dto';
import { CreateTransferSuggestionDto } from './dto/create-transfer-suggestion.dto';
import { UpdateTransferSuggestionStatusDto } from './dto/update-transfer-suggestion-status.dto';
import { CreateTransferShortlistDto } from './dto/create-transfer-shortlist.dto';

@ApiTags('Transfer Market')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfer-market')
export class TransferMarketController {
  constructor(private readonly transferMarketService: TransferMarketService) {}

  @Get('countries')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT', 'SCOUT')
  @ApiOperation({ summary: 'List countries with request counts' })
  @ApiResponse({ status: 200, description: 'Countries listed' })
  getCountries(@Req() req: any) {
    return this.transferMarketService.listCountries(req.user?.id, req.user?.role);
  }

  @Get('leagues')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT', 'SCOUT')
  @ApiOperation({ summary: 'List leagues with request counts' })
  @ApiQuery({ name: 'country', required: false })
  @ApiResponse({ status: 200, description: 'Leagues listed' })
  getLeagues(@Req() req: any, @Query('country') country?: string) {
    return this.transferMarketService.listLeagues(req.user?.id, req.user?.role, country);
  }

  @Get('requests')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT', 'SCOUT')
  @ApiOperation({ summary: 'List transfer requests with filters' })
  @ApiResponse({ status: 200, description: 'Transfer requests listed' })
  listRequests(@Req() req: any, @Query() query: ListTransferRequestsDto) {
    return this.transferMarketService.listRequests(query, req.user?.id, req.user?.role);
  }

  @Post('requests')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Create a transfer request' })
  @ApiResponse({ status: 201, description: 'Transfer request created' })
  createRequest(@Req() req: any, @Body() payload: CreateTransferRequestDto) {
    return this.transferMarketService.createRequest(payload, req.user?.id, req.user?.role);
  }

  @Get('requests/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT', 'SCOUT')
  @ApiOperation({ summary: 'Get transfer request detail' })
  @ApiResponse({ status: 200, description: 'Transfer request detail' })
  getRequest(@Req() req: any, @Param('id') id: string) {
    return this.transferMarketService.getRequest(id, req.user?.id, req.user?.role);
  }

  @Patch('requests/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Update transfer request' })
  @ApiResponse({ status: 200, description: 'Transfer request updated' })
  updateRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: UpdateTransferRequestDto,
  ) {
    return this.transferMarketService.updateRequest(id, payload, req.user?.id, req.user?.role);
  }

  @Post('requests/:id/suggestions')
  @Roles('SCOUT')
  @ApiOperation({ summary: 'Create player suggestion for a request (scout)' })
  @ApiResponse({ status: 201, description: 'Suggestion created' })
  createSuggestion(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: CreateTransferSuggestionDto,
  ) {
    return this.transferMarketService.createSuggestion(id, payload, req.user?.id, req.user?.role);
  }

  @Get('requests/:id/suggestions')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT', 'SCOUT')
  @ApiOperation({ summary: 'List suggestions for request' })
  @ApiResponse({ status: 200, description: 'Suggestions listed' })
  listSuggestions(@Req() req: any, @Param('id') id: string) {
    return this.transferMarketService.listSuggestions(id, req.user?.id, req.user?.role);
  }

  @Patch('suggestions/:id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Update suggestion status' })
  @ApiResponse({ status: 200, description: 'Suggestion updated' })
  updateSuggestionStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: UpdateTransferSuggestionStatusDto,
  ) {
    return this.transferMarketService.updateSuggestionStatus(
      id,
      payload,
      req.user?.id,
      req.user?.role,
    );
  }

  @Get('requests/:id/activity')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT', 'SCOUT')
  @ApiOperation({ summary: 'List activity timeline for request' })
  @ApiResponse({ status: 200, description: 'Activity listed' })
  listActivity(@Req() req: any, @Param('id') id: string) {
    return this.transferMarketService.listActivity(id, req.user?.id, req.user?.role);
  }

  @Post('requests/:id/shortlist')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Create/export shortlist share link for request' })
  @ApiResponse({ status: 201, description: 'Shortlist created' })
  createShortlist(
    @Req() req: any,
    @Param('id') id: string,
    @Body() payload: CreateTransferShortlistDto,
  ) {
    return this.transferMarketService.createShortlist(id, payload, req.user?.id, req.user?.role);
  }

  @Get('requests/:id/shortlist.csv')
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Export shortlist CSV for request' })
  @ApiResponse({ status: 200, description: 'CSV exported' })
  async exportShortlistCsv(
    @Req() req: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filename, csv } = await this.transferMarketService.exportShortlistCsv(
      id,
      req.user?.id,
      req.user?.role,
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }
}
