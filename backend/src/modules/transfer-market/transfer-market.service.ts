import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TaskPriority,
  TransferRequestKind,
  TransferRequestStatus,
  TransferRequestVisibility,
  TransferSuggestionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PassportSharesService } from '../passport-shares/passport-shares.service';
import { randomUUID } from 'crypto';
import { ListTransferRequestsDto } from './dto/list-transfer-requests.dto';
import { CreateTransferRequestDto } from './dto/create-transfer-request.dto';
import { UpdateTransferRequestDto } from './dto/update-transfer-request.dto';
import { CreateTransferSuggestionDto } from './dto/create-transfer-suggestion.dto';
import { UpdateTransferSuggestionStatusDto } from './dto/update-transfer-suggestion-status.dto';
import { CreateTransferShortlistDto } from './dto/create-transfer-shortlist.dto';

const DEFAULT_TRANSFER_MARKET_LEAGUES: Record<string, string[]> = {
  FR: ['Ligue 1', 'Ligue 2', 'National'],
  DE: ['Bundesliga', '2. Bundesliga', '3. Liga'],
  GB: ['Premier League', 'Championship', 'League One', 'League Two'],
  ES: ['La Liga', 'LaLiga 2', 'Primera RFEF'],
};

const DEFAULT_MARKET_ORDER = ['FR', 'DE', 'GB', 'ES'];

@Injectable()
export class TransferMarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passportSharesService: PassportSharesService,
  ) {}

  private normalizeRole(role?: string | null): string {
    return String(role ?? '')
      .trim()
      .toUpperCase();
  }

  private isAdminRole(role?: string | null): boolean {
    const normalized = this.normalizeRole(role);
    return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
  }

  private isAgentRole(role?: string | null): boolean {
    return this.normalizeRole(role) === 'AGENT';
  }

  private isScoutRole(role?: string | null): boolean {
    return this.normalizeRole(role) === 'SCOUT';
  }

  private assertHubRole(role?: string | null): void {
    if (!this.isAdminRole(role) && !this.isAgentRole(role) && !this.isScoutRole(role)) {
      throw new ForbiddenException('Role is not authorized for transfer market hub');
    }
  }

  private assertCreatorRole(role?: string | null): void {
    if (!this.isAdminRole(role) && !this.isAgentRole(role)) {
      throw new ForbiddenException('Only admin/agent can create transfer requests');
    }
  }

  private assertScout(role?: string | null): void {
    if (!this.isScoutRole(role)) {
      throw new ForbiddenException('Only scouts can create suggestions');
    }
  }

  private requestInclude() {
    return {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      clubs: {
        select: {
          id: true,
          name: true,
          logo: true,
          country: true,
        },
      },
      _count: {
        select: {
          club_need_request_suggestions: true,
          club_need_request_activities: true,
        },
      },
    } as const;
  }

  private suggestionInclude() {
    return {
      players: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          nationality: true,
          marketValue: true,
          photoUrl: true,
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      club_need_requests: {
        select: {
          id: true,
          createdById: true,
          requestKind: true,
          visibility: true,
          status: true,
          clubName: true,
        },
      },
    } as const;
  }

  private mapRequest(row: any) {
    return {
      id: row.id,
      requestKind: row.requestKind,
      title: row.rawText,
      clubId: row.clubId,
      clubName: row.clubName,
      country: row.country,
      league: row.league,
      status: row.status,
      priority: row.priority,
      visibility: row.visibility,
      requirements: row.requirementsJson ?? null,
      deadlineAt: row.deadlineAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.users
        ? {
            id: row.users.id,
            firstName: row.users.firstName,
            lastName: row.users.lastName,
            role: row.users.role,
          }
        : null,
      club: row.clubs
        ? {
            id: row.clubs.id,
            name: row.clubs.name,
            logo: row.clubs.logo,
            country: row.clubs.country,
          }
        : null,
      counts: {
        suggestions: row._count?.club_need_request_suggestions ?? 0,
        activities: row._count?.club_need_request_activities ?? 0,
      },
    };
  }

  private mapSuggestion(row: any) {
    const playerFullName = `${row.players?.users?.firstName ?? row.players?.firstName ?? ''} ${
      row.players?.users?.lastName ?? row.players?.lastName ?? ''
    }`.trim();

    return {
      id: row.id,
      requestId: row.requestId,
      playerId: row.playerId,
      scoutId: row.scoutId,
      comment: row.comment ?? null,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      player: row.players
        ? {
            id: row.players.id,
            firstName: row.players.users?.firstName ?? row.players.firstName ?? null,
            lastName: row.players.users?.lastName ?? row.players.lastName ?? null,
            fullName: playerFullName || 'Unnamed player',
            position: row.players.position,
            nationality: row.players.nationality,
            marketValue: row.players.marketValue ?? null,
            photoUrl: row.players.photoUrl ?? null,
          }
        : null,
      scout: row.users
        ? {
            id: row.users.id,
            firstName: row.users.firstName,
            lastName: row.users.lastName,
            role: row.users.role,
          }
        : null,
    };
  }

  private mapActivity(row: any) {
    return {
      id: row.id,
      requestId: row.requestId,
      actorId: row.actorId,
      actionType: row.actionType,
      payload: row.payloadJson ?? null,
      createdAt: row.createdAt,
      actor: row.users
        ? {
            id: row.users.id,
            firstName: row.users.firstName,
            lastName: row.users.lastName,
            role: row.users.role,
          }
        : null,
    };
  }

  private canReadRequest(request: any, userId: string, role?: string | null): boolean {
    if (this.isAdminRole(role)) {
      return true;
    }

    if (this.isAgentRole(role)) {
      return (
        request.createdById === userId || request.visibility === TransferRequestVisibility.SHARED
      );
    }

    if (this.isScoutRole(role)) {
      return request.visibility === TransferRequestVisibility.SHARED;
    }

    return false;
  }

  private canManageRequest(request: any, userId: string, role?: string | null): boolean {
    if (this.isAdminRole(role)) {
      return true;
    }

    if (this.isAgentRole(role)) {
      return request.createdById === userId;
    }

    return false;
  }

  private parseCreatedByMeFlag(value?: string): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  private normalizeMarketCountry(value?: string | null): string | null {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const upper = raw.toUpperCase();
    const byCode: Record<string, string> = {
      FR: 'FR',
      FRA: 'FR',
      DE: 'DE',
      DEU: 'DE',
      GER: 'DE',
      ES: 'ES',
      ESP: 'ES',
      GB: 'GB',
      UK: 'GB',
      ENG: 'GB',
      EN: 'GB',
      GBR: 'GB',
    };

    if (byCode[upper]) {
      return byCode[upper];
    }

    const lower = raw.toLowerCase();
    const byName: Record<string, string> = {
      france: 'FR',
      allemagne: 'DE',
      germany: 'DE',
      espagne: 'ES',
      spain: 'ES',
      angleterre: 'GB',
      england: 'GB',
      'royaume-uni': 'GB',
      'united kingdom': 'GB',
      'great britain': 'GB',
    };

    return byName[lower] ?? raw;
  }

  private countryFilterVariants(country?: string | null): string[] {
    const normalized = this.normalizeMarketCountry(country);
    if (!normalized) return [];

    if (normalized === 'FR') {
      return ['FR', 'FRA', 'France'];
    }
    if (normalized === 'DE') {
      return ['DE', 'DEU', 'GER', 'Germany', 'Allemagne'];
    }
    if (normalized === 'GB') {
      return [
        'GB',
        'UK',
        'ENG',
        'EN',
        'GBR',
        'England',
        'Angleterre',
        'Royaume-Uni',
        'United Kingdom',
      ];
    }
    if (normalized === 'ES') {
      return ['ES', 'ESP', 'Spain', 'Espagne'];
    }

    return [normalized];
  }

  private sanitizeRequirements(requirements: any) {
    if (!requirements || typeof requirements !== 'object') {
      return null;
    }

    const clean: Record<string, Prisma.InputJsonValue> = {};

    Object.entries(requirements).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      clean[key] = value as Prisma.InputJsonValue;
    });

    return Object.keys(clean).length > 0 ? (clean as Prisma.InputJsonObject) : null;
  }

  private async appendActivity(
    requestId: string,
    actorId: string,
    actionType: string,
    payload?: Record<string, unknown> | null,
  ) {
    const payloadJson = payload ? (payload as Prisma.InputJsonObject) : undefined;

    await this.prisma.club_need_request_activities.create({
      data: {
        id: randomUUID(),
        requestId,
        actorId,
        actionType,
        ...(payloadJson ? { payloadJson } : {}),
      },
    });
  }

  private async getTransferRequestById(id: string) {
    const request = await this.prisma.club_need_requests.findUnique({
      where: { id },
      include: this.requestInclude(),
    });

    if (!request || request.requestKind !== TransferRequestKind.TRANSFER_REQUEST) {
      throw new NotFoundException(`Transfer request with id ${id} not found`);
    }

    return request;
  }

  private buildVisibilityWhere(
    role: string | null | undefined,
    userId: string,
  ): Prisma.club_need_requestsWhereInput {
    if (this.isAdminRole(role)) {
      return {};
    }

    if (this.isAgentRole(role)) {
      return {
        OR: [{ createdById: userId }, { visibility: TransferRequestVisibility.SHARED }],
      };
    }

    return {
      visibility: TransferRequestVisibility.SHARED,
    };
  }

  async listCountries(userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertHubRole(role);

    const grouped = await this.prisma.club_need_requests.groupBy({
      by: ['country'],
      where: {
        requestKind: TransferRequestKind.TRANSFER_REQUEST,
        country: {
          not: null,
        },
        ...this.buildVisibilityWhere(role, userId),
      },
      _count: {
        _all: true,
      },
      orderBy: {
        country: 'asc',
      },
    });

    const countsByCountry = new Map<string, number>();

    grouped
      .filter((entry) => entry.country)
      .forEach((entry) => {
        const key = this.normalizeMarketCountry(entry.country) ?? String(entry.country).trim();
        if (!key) return;
        countsByCountry.set(key, (countsByCountry.get(key) ?? 0) + entry._count._all);
      });

    Object.keys(DEFAULT_TRANSFER_MARKET_LEAGUES).forEach((country) => {
      if (!countsByCountry.has(country)) {
        countsByCountry.set(country, 0);
      }
    });

    const data = Array.from(countsByCountry.entries())
      .map(([country, requestsCount]) => ({
        country,
        requestsCount,
      }))
      .sort((a, b) => {
        const orderA = DEFAULT_MARKET_ORDER.indexOf(a.country);
        const orderB = DEFAULT_MARKET_ORDER.indexOf(b.country);
        if (orderA !== orderB) {
          if (orderA === -1) return 1;
          if (orderB === -1) return -1;
          return orderA - orderB;
        }
        return a.country.localeCompare(b.country, undefined, { sensitivity: 'base' });
      });

    return { data };
  }

  async listLeagues(userId: string, role?: string | null, country?: string) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertHubRole(role);

    const trimmedCountry = country?.trim();
    const countryVariants = this.countryFilterVariants(trimmedCountry);
    const normalizedCountry = this.normalizeMarketCountry(trimmedCountry);

    const grouped = await this.prisma.club_need_requests.groupBy({
      by: ['league'],
      where: {
        requestKind: TransferRequestKind.TRANSFER_REQUEST,
        league: {
          not: null,
        },
        ...(countryVariants.length > 0
          ? {
              OR: countryVariants.map((variant) => ({
                country: {
                  equals: variant,
                  mode: 'insensitive',
                },
              })),
            }
          : {}),
        ...this.buildVisibilityWhere(role, userId),
      },
      _count: {
        _all: true,
      },
      orderBy: {
        league: 'asc',
      },
    });

    const countsByLeague = new Map<string, number>();
    grouped
      .filter((entry) => entry.league)
      .forEach((entry) => {
        countsByLeague.set(
          entry.league,
          (countsByLeague.get(entry.league) ?? 0) + entry._count._all,
        );
      });

    const defaultLeagues =
      normalizedCountry && DEFAULT_TRANSFER_MARKET_LEAGUES[normalizedCountry]
        ? DEFAULT_TRANSFER_MARKET_LEAGUES[normalizedCountry]
        : [];
    defaultLeagues.forEach((league) => {
      if (!countsByLeague.has(league)) {
        countsByLeague.set(league, 0);
      }
    });

    const data = Array.from(countsByLeague.entries())
      .map(([league, requestsCount]) => ({
        league,
        requestsCount,
      }))
      .sort((a, b) => {
        const defaultIndexA = defaultLeagues.indexOf(a.league);
        const defaultIndexB = defaultLeagues.indexOf(b.league);
        if (defaultIndexA !== defaultIndexB) {
          if (defaultIndexA === -1) return 1;
          if (defaultIndexB === -1) return -1;
          return defaultIndexA - defaultIndexB;
        }
        return a.league.localeCompare(b.league, undefined, { sensitivity: 'base' });
      });

    return { data };
  }

  async listRequests(query: ListTransferRequestsDto, userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertHubRole(role);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const createdByMe = this.parseCreatedByMeFlag(query.createdByMe);
    const skip = (page - 1) * limit;

    const where: Prisma.club_need_requestsWhereInput = {
      requestKind: TransferRequestKind.TRANSFER_REQUEST,
      ...this.buildVisibilityWhere(role, userId),
      ...(query.country
        ? {
            country: {
              equals: query.country.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.league
        ? {
            league: {
              equals: query.league.trim(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.status ? { status: query.status as TransferRequestStatus } : {}),
      ...(query.priority ? { priority: query.priority as TaskPriority } : {}),
      ...(query.visibility ? { visibility: query.visibility as TransferRequestVisibility } : {}),
      ...(createdByMe ? { createdById: userId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.club_need_requests.findMany({
        where,
        include: this.requestInclude(),
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.club_need_requests.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapRequest(row)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async createRequest(payload: CreateTransferRequestDto, userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertCreatorRole(role);

    const clubId = payload.clubId?.trim();
    const clubNameFallback = payload.clubName?.trim();

    if (!clubId && !clubNameFallback) {
      throw new BadRequestException('clubId or clubName is required');
    }

    let club: { id: string; name: string; country: string | null } | null = null;

    if (clubId) {
      club = await this.prisma.clubs.findUnique({
        where: { id: clubId },
        select: {
          id: true,
          name: true,
          country: true,
        },
      });

      if (!club) {
        throw new NotFoundException(`Club with id ${clubId} not found`);
      }
    }

    const league = payload.league?.trim();
    if (!league) {
      throw new BadRequestException('league is required');
    }

    const clubName = club?.name ?? clubNameFallback ?? null;
    if (!clubName) {
      throw new BadRequestException('Unable to resolve club name');
    }

    const country = payload.country?.trim() || club?.country || null;
    const requirements = this.sanitizeRequirements(payload.requirements);
    const title =
      payload.title?.trim() ||
      `${clubName} - ${String((requirements as any)?.position ?? 'Transfer request')}`;

    const created = await this.prisma.club_need_requests.create({
      data: {
        id: randomUUID(),
        createdById: userId,
        requestKind: TransferRequestKind.TRANSFER_REQUEST,
        rawText: title,
        parsed: [],
        lineStates: [],
        clubId: club?.id ?? null,
        clubName,
        country,
        league,
        status: TransferRequestStatus.OPEN,
        priority: (payload.priority ?? 'MEDIUM') as TaskPriority,
        visibility: (payload.visibility ?? 'PRIVATE') as TransferRequestVisibility,
        requirementsJson: requirements,
        deadlineAt: payload.deadlineAt ? new Date(payload.deadlineAt) : null,
      },
      include: this.requestInclude(),
    });

    await this.appendActivity(created.id, userId, 'REQUEST_CREATED', {
      title,
      visibility: created.visibility,
      priority: created.priority,
      status: created.status,
    });

    return this.mapRequest(created);
  }

  async getRequest(id: string, userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertHubRole(role);

    const request = await this.getTransferRequestById(id);
    if (!this.canReadRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to view this request');
    }

    return this.mapRequest(request);
  }

  async updateRequest(
    id: string,
    payload: UpdateTransferRequestDto,
    userId: string,
    role?: string | null,
  ) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertCreatorRole(role);

    const request = await this.getTransferRequestById(id);
    if (!this.canManageRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to update this request');
    }

    const data: Prisma.club_need_requestsUpdateInput = {};

    if (payload.status) {
      data.status = payload.status as TransferRequestStatus;
    }
    if (payload.priority) {
      data.priority = payload.priority as TaskPriority;
    }
    if (payload.visibility) {
      data.visibility = payload.visibility as TransferRequestVisibility;
    }
    if (payload.requirements) {
      data.requirementsJson = this.sanitizeRequirements(payload.requirements);
    }
    if (payload.deadlineAt !== undefined) {
      data.deadlineAt = payload.deadlineAt ? new Date(payload.deadlineAt) : null;
    }
    if (payload.title !== undefined) {
      data.rawText = payload.title?.trim() || request.rawText;
    }

    if (Object.keys(data).length === 0) {
      return this.mapRequest(request);
    }

    const updated = await this.prisma.club_need_requests.update({
      where: { id },
      data,
      include: this.requestInclude(),
    });

    await this.appendActivity(id, userId, 'REQUEST_UPDATED', {
      changes: payload,
    });

    return this.mapRequest(updated);
  }

  async createSuggestion(
    requestId: string,
    payload: CreateTransferSuggestionDto,
    userId: string,
    role?: string | null,
  ) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertScout(role);

    const request = await this.getTransferRequestById(requestId);
    if (!this.canReadRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to suggest on this request');
    }
    if (request.visibility !== TransferRequestVisibility.SHARED) {
      throw new ForbiddenException('Scouts can only suggest on shared requests');
    }
    if (request.status === TransferRequestStatus.CLOSED) {
      throw new BadRequestException('Request is closed');
    }

    const player = await this.prisma.players.findUnique({
      where: { id: payload.playerId },
      select: { id: true },
    });

    if (!player) {
      throw new NotFoundException(`Player with id ${payload.playerId} not found`);
    }

    try {
      const created = await this.prisma.club_need_request_suggestions.create({
        data: {
          id: randomUUID(),
          requestId,
          playerId: payload.playerId,
          scoutId: userId,
          comment: payload.comment?.trim() || null,
          status: TransferSuggestionStatus.PROPOSED,
        },
        include: this.suggestionInclude(),
      });

      await this.appendActivity(requestId, userId, 'SUGGESTION_CREATED', {
        suggestionId: created.id,
        playerId: created.playerId,
        status: created.status,
      });

      return this.mapSuggestion(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('This scout already suggested this player for the request');
      }
      throw error;
    }
  }

  async listSuggestions(requestId: string, userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertHubRole(role);

    const request = await this.getTransferRequestById(requestId);
    if (!this.canReadRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to view suggestions for this request');
    }

    const rows = await this.prisma.club_need_request_suggestions.findMany({
      where: { requestId },
      include: this.suggestionInclude(),
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      data: rows.map((row) => this.mapSuggestion(row)),
      meta: {
        total: rows.length,
      },
    };
  }

  async updateSuggestionStatus(
    suggestionId: string,
    payload: UpdateTransferSuggestionStatusDto,
    userId: string,
    role?: string | null,
  ) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    if (!this.isAdminRole(role) && !this.isAgentRole(role)) {
      throw new ForbiddenException('Only admin/agent can update suggestion status');
    }

    const suggestion = await this.prisma.club_need_request_suggestions.findUnique({
      where: { id: suggestionId },
      include: this.suggestionInclude(),
    });

    if (
      !suggestion ||
      suggestion.club_need_requests.requestKind !== TransferRequestKind.TRANSFER_REQUEST
    ) {
      throw new NotFoundException(`Suggestion with id ${suggestionId} not found`);
    }

    if (!this.isAdminRole(role) && suggestion.club_need_requests.createdById !== userId) {
      throw new ForbiddenException('Agent can update suggestion only on own requests');
    }

    const updated = await this.prisma.club_need_request_suggestions.update({
      where: { id: suggestionId },
      data: {
        status: payload.status as TransferSuggestionStatus,
      },
      include: this.suggestionInclude(),
    });

    await this.appendActivity(suggestion.requestId, userId, 'SUGGESTION_STATUS_UPDATED', {
      suggestionId,
      status: payload.status,
    });

    return this.mapSuggestion(updated);
  }

  async listActivity(requestId: string, userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertHubRole(role);

    const request = await this.getTransferRequestById(requestId);
    if (!this.canReadRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to view activity for this request');
    }

    const rows = await this.prisma.club_need_request_activities.findMany({
      where: { requestId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      data: rows.map((row) => this.mapActivity(row)),
      meta: {
        total: rows.length,
      },
    };
  }

  async createShortlist(
    requestId: string,
    payload: CreateTransferShortlistDto,
    userId: string,
    role?: string | null,
  ) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    if (!this.isAdminRole(role) && !this.isAgentRole(role)) {
      throw new ForbiddenException('Only admin/agent can create shortlists');
    }

    const request = await this.getTransferRequestById(requestId);
    if (!this.canManageRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to create shortlist for this request');
    }

    let playerIds = Array.from(new Set(payload.playerIds ?? []));

    if (playerIds.length === 0) {
      const suggestions = await this.prisma.club_need_request_suggestions.findMany({
        where: {
          requestId,
          status: {
            in: [TransferSuggestionStatus.SHORTLISTED, TransferSuggestionStatus.PROPOSED],
          },
        },
        select: {
          playerId: true,
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      playerIds = Array.from(new Set(suggestions.map((row) => row.playerId)));
    }

    if (playerIds.length === 0) {
      throw new BadRequestException('No players available to build shortlist');
    }

    const result = await this.passportSharesService.createShareSet({
      createdById: userId,
      playerIds,
      title: `${request.clubName ?? 'Club'} shortlist`,
      clubName: request.clubName ?? undefined,
      sourceFeature: 'TRANSFER_MARKET_REQUEST',
      sourceRequestId: request.id,
    });

    await this.appendActivity(requestId, userId, 'SHORTLIST_CREATED', {
      shareUrl: result.shareUrl,
      playersCount: playerIds.length,
    });

    return {
      ...result,
      requestId,
      playersCount: playerIds.length,
    };
  }

  private escapeCsv(value: unknown): string {
    if (value === null || value === undefined) return '';
    const input = String(value);
    if (input.includes(',') || input.includes('"') || input.includes('\n')) {
      return `"${input.replace(/"/g, '""')}"`;
    }
    return input;
  }

  async exportShortlistCsv(requestId: string, userId: string, role?: string | null) {
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }
    if (!this.isAdminRole(role) && !this.isAgentRole(role)) {
      throw new ForbiddenException('Only admin/agent can export shortlist CSV');
    }

    const request = await this.getTransferRequestById(requestId);
    if (!this.canManageRequest(request, userId, role)) {
      throw new ForbiddenException('Not authorized to export shortlist for this request');
    }

    const suggestions = await this.prisma.club_need_request_suggestions.findMany({
      where: {
        requestId,
        status: {
          in: [TransferSuggestionStatus.SHORTLISTED, TransferSuggestionStatus.PROPOSED],
        },
      },
      include: this.suggestionInclude(),
      orderBy: [{ createdAt: 'desc' }],
    });

    const header = [
      'requestId',
      'requestStatus',
      'requestClub',
      'suggestionId',
      'suggestionStatus',
      'comment',
      'playerId',
      'playerName',
      'playerPosition',
      'playerNationality',
      'playerMarketValue',
      'suggestedByScoutId',
      'suggestedByScoutName',
      'suggestedAt',
    ];

    const lines = suggestions.map((row) => {
      const playerName = `${row.players?.users?.firstName ?? row.players?.firstName ?? ''} ${
        row.players?.users?.lastName ?? row.players?.lastName ?? ''
      }`.trim();
      const scoutName = `${row.users?.firstName ?? ''} ${row.users?.lastName ?? ''}`.trim();

      const columns = [
        request.id,
        request.status,
        request.clubName,
        row.id,
        row.status,
        row.comment,
        row.playerId,
        playerName || 'Unnamed player',
        row.players?.position ?? null,
        row.players?.nationality ?? null,
        row.players?.marketValue ?? null,
        row.scoutId,
        scoutName || 'Unknown scout',
        row.createdAt?.toISOString?.() ?? row.createdAt,
      ];

      return columns.map((column) => this.escapeCsv(column)).join(',');
    });

    const csv = [header.join(','), ...lines].join('\n');
    const safeClub = String(request.clubName ?? 'club').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `transfer-shortlist-${safeClub}-${request.id}.csv`;

    return { filename, csv };
  }
}
