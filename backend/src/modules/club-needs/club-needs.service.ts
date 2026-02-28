import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { parseClubNeedsRawText } from './parser';
import { buildPlayersWhereFromNeedLine } from './matcher';
import type {
  ClubNeedLineState,
  ClubNeedMatchResult,
  ClubNeedRequestProgress,
  ParsedNeedLine,
  PreferredFoot,
} from './types';

type ClubNeedRequestRow = {
  id: string;
  createdById: string;
  rawText: string;
  parsed: unknown;
  matchesSnapshot: unknown;
  lineStates: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type ClubNeedLeagueFilter = 'LIGUE_1' | 'BUNDESLIGA' | 'SERIE_A' | 'LALIGA';
type ClubNeedProgressFilter = 'ACTIVE' | 'PARTIAL' | 'COMPLETED';

const LEAGUE_KEYWORDS: Record<ClubNeedLeagueFilter, string[]> = {
  LIGUE_1: ['ligue 1', 'france'],
  BUNDESLIGA: ['bundesliga', 'allemagne', 'germany'],
  SERIE_A: ['serie a', 'italie', 'italy'],
  LALIGA: ['laliga', 'la liga', 'espagne', 'spain'],
};

@Injectable()
export class ClubNeedsService {
  constructor(private prisma: PrismaService) {}

  private normalizeParsedLines(parsed: unknown): ParsedNeedLine[] {
    if (!Array.isArray(parsed)) return [];

    return parsed.map((raw: any, index: number) => {
      const lineNumber =
        Number.isInteger(raw?.lineNumber) && Number(raw.lineNumber) > 0
          ? Number(raw.lineNumber)
          : index + 1;

      const preferredFoot =
        raw?.preferredFoot === 'Left' ||
        raw?.preferredFoot === 'Right' ||
        raw?.preferredFoot === 'Both'
          ? (raw.preferredFoot as PreferredFoot)
          : undefined;

      return {
        lineNumber,
        clubName: String(raw?.clubName ?? `Ligne ${lineNumber}`).trim() || `Ligne ${lineNumber}`,
        positions: Array.isArray(raw?.positions)
          ? raw.positions.map((value: unknown) => String(value)).filter(Boolean)
          : [],
        age:
          raw?.age && typeof raw.age === 'object'
            ? {
                min: typeof raw.age.min === 'number' ? raw.age.min : undefined,
                max: typeof raw.age.max === 'number' ? raw.age.max : undefined,
              }
            : undefined,
        preferredFoot,
        warnings: Array.isArray(raw?.warnings)
          ? raw.warnings.map((value: unknown) => String(value))
          : [],
        errors: Array.isArray(raw?.errors) ? raw.errors.map((value: unknown) => String(value)) : [],
      };
    });
  }

  private normalizeLineStates(parsed: ParsedNeedLine[], rawStates: unknown): ClubNeedLineState[] {
    const rawMap = new Map<number, any>();

    if (Array.isArray(rawStates)) {
      rawStates.forEach((item: any) => {
        const lineNumber = Number(item?.lineNumber);
        if (!Number.isInteger(lineNumber) || lineNumber < 1) return;
        rawMap.set(lineNumber, item ?? {});
      });
    }

    const fromParsed = parsed.map((line, index) => {
      const lineNumber =
        Number.isInteger(line.lineNumber) && line.lineNumber > 0 ? line.lineNumber : index + 1;
      const source = rawMap.get(lineNumber) ?? {};

      return {
        lineNumber,
        clubName:
          String(source?.clubName ?? line.clubName ?? `Ligne ${lineNumber}`).trim() ||
          `Ligne ${lineNumber}`,
        isCompleted: Boolean(source?.isCompleted),
        completedAt: source?.completedAt ? String(source.completedAt) : null,
        completedById: source?.completedById ? String(source.completedById) : null,
        reopenedAt: source?.reopenedAt ? String(source.reopenedAt) : null,
        reopenedById: source?.reopenedById ? String(source.reopenedById) : null,
      } as ClubNeedLineState;
    });

    if (fromParsed.length > 0) {
      return fromParsed;
    }

    return Array.from(rawMap.values()).map((source: any) => ({
      lineNumber: Number(source.lineNumber),
      clubName:
        String(source?.clubName ?? `Ligne ${source?.lineNumber ?? 0}`).trim() ||
        `Ligne ${source?.lineNumber ?? 0}`,
      isCompleted: Boolean(source?.isCompleted),
      completedAt: source?.completedAt ? String(source.completedAt) : null,
      completedById: source?.completedById ? String(source.completedById) : null,
      reopenedAt: source?.reopenedAt ? String(source.reopenedAt) : null,
      reopenedById: source?.reopenedById ? String(source.reopenedById) : null,
    }));
  }

  private computeProgress(lineStates: ClubNeedLineState[]): {
    linesTotal: number;
    linesCompleted: number;
    requestProgress: ClubNeedRequestProgress;
  } {
    const linesTotal = lineStates.length;
    const linesCompleted = lineStates.filter((line) => line.isCompleted).length;

    let requestProgress: ClubNeedRequestProgress = 'ACTIVE';
    if (linesTotal > 0 && linesCompleted === linesTotal) {
      requestProgress = 'COMPLETED';
    } else if (linesCompleted > 0) {
      requestProgress = 'PARTIAL';
    }

    return { linesTotal, linesCompleted, requestProgress };
  }

  private enrichRequestRow(row: ClubNeedRequestRow) {
    const parsed = this.normalizeParsedLines(row.parsed);
    const lineStates = this.normalizeLineStates(parsed, row.lineStates);
    const progress = this.computeProgress(lineStates);

    return {
      ...row,
      parsed,
      lineStates,
      ...progress,
    };
  }

  private buildMonthWhere(month?: string) {
    if (!month) return undefined;

    const [yearRaw, monthRaw] = month.split('-');
    const year = Number(yearRaw);
    const monthValue = Number(monthRaw);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(monthValue) ||
      monthValue < 1 ||
      monthValue > 12
    ) {
      return undefined;
    }

    const start = new Date(Date.UTC(year, monthValue - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthValue, 1, 0, 0, 0, 0));

    return { gte: start, lt: end };
  }

  private inferLeagueFromCountry(country?: string | null): ClubNeedLeagueFilter | null {
    const normalized = String(country ?? '')
      .trim()
      .toLowerCase();
    if (!normalized) return null;

    if (normalized.includes('france')) return 'LIGUE_1';
    if (normalized.includes('germany') || normalized.includes('allemagne')) return 'BUNDESLIGA';
    if (normalized.includes('italy') || normalized.includes('italie')) return 'SERIE_A';
    if (normalized.includes('spain') || normalized.includes('espagne')) return 'LALIGA';
    return null;
  }

  private inferLeagueFromText(value: string): ClubNeedLeagueFilter | null {
    const source = value.trim().toLowerCase();
    if (!source) return null;

    const matched = (
      Object.entries(LEAGUE_KEYWORDS) as Array<[ClubNeedLeagueFilter, string[]]>
    ).find(([, keywords]) => keywords.some((keyword) => source.includes(keyword)));
    return matched ? matched[0] : null;
  }

  private buildCoverageSummary(requests: any[], sharesCount: number) {
    const clubsTotal = requests.reduce((acc, request) => acc + Number(request.linesTotal ?? 0), 0);
    const clubsCovered = requests.reduce(
      (acc, request) => acc + Number(request.linesCompleted ?? 0),
      0,
    );
    const completedCount = requests.filter(
      (request) => request.requestProgress === 'COMPLETED',
    ).length;

    return {
      clubsCovered,
      clubsTotal,
      sharesCount,
      completedCount,
    };
  }

  private async countSharesForRequests(requestIds: string[]): Promise<number> {
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return 0;
    }

    try {
      const total = await this.prisma.passport_share_sets.count({
        where: {
          sourceRequestId: {
            in: requestIds,
          },
          revokedAt: null,
        },
      });
      return Number(total ?? 0);
    } catch {
      return 0;
    }
  }

  private async buildRequestLeagueHints(
    requests: ClubNeedRequestRow[],
  ): Promise<Map<string, ClubNeedLeagueFilter | null>> {
    const hints = new Map<string, ClubNeedLeagueFilter | null>();
    if (!Array.isArray(requests) || requests.length === 0) {
      return hints;
    }

    const clubNames = new Set<string>();

    for (const request of requests) {
      const parsed = this.normalizeParsedLines(request.parsed);
      for (const line of parsed) {
        const clubName = String(line.clubName ?? '').trim();
        if (clubName) {
          clubNames.add(clubName);
        }
      }
    }

    let countryByClubName = new Map<string, string | null>();
    if (clubNames.size > 0) {
      try {
        const clubs = await this.prisma.clubs.findMany({
          where: {
            name: {
              in: Array.from(clubNames),
            },
          },
          select: {
            name: true,
            country: true,
          },
        });
        countryByClubName = new Map(
          clubs.map((club) => [String(club.name).trim().toLowerCase(), club.country ?? null]),
        );
      } catch {
        countryByClubName = new Map<string, string | null>();
      }
    }

    for (const request of requests) {
      const parsed = this.normalizeParsedLines(request.parsed);
      const leagues = new Set<ClubNeedLeagueFilter>();

      const rawLeague = this.inferLeagueFromText(request.rawText ?? '');
      if (rawLeague) {
        leagues.add(rawLeague);
      }

      for (const line of parsed) {
        const leagueFromClubName = this.inferLeagueFromText(line.clubName ?? '');
        if (leagueFromClubName) {
          leagues.add(leagueFromClubName);
        }

        const country = countryByClubName.get(
          String(line.clubName ?? '')
            .trim()
            .toLowerCase(),
        );
        const leagueFromCountry = this.inferLeagueFromCountry(country);
        if (leagueFromCountry) {
          leagues.add(leagueFromCountry);
        }
      }

      hints.set(request.id, leagues.values().next().value ?? null);
    }

    return hints;
  }

  async createRequest(createdById: string, rawText: string, topN: number) {
    const parsed = parseClubNeedsRawText(rawText);
    const matches = await this.computeMatches(parsed, topN);
    const lineStates = this.normalizeLineStates(parsed, null);

    const request = await this.prisma.club_need_requests.create({
      data: {
        id: randomUUID(),
        createdById,
        rawText,
        parsed: parsed as any,
        matchesSnapshot: matches as any,
        lineStates: lineStates as any,
      },
      select: {
        id: true,
        createdById: true,
        rawText: true,
        parsed: true,
        matchesSnapshot: true,
        lineStates: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { request: this.enrichRequestRow(request as ClubNeedRequestRow), matches };
  }

  async listRequests(params: {
    page: number;
    limit: number;
    month?: string;
    league?: ClubNeedLeagueFilter;
    status?: ClubNeedProgressFilter;
  }) {
    const { page, limit, month, league, status } = params;
    const skip = (page - 1) * limit;
    const createdAt = this.buildMonthWhere(month);
    const where = createdAt ? { createdAt } : undefined;
    const hasUiFilters = Boolean(league || status);

    if (!hasUiFilters) {
      const [items, total] = await Promise.all([
        this.prisma.club_need_requests.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdById: true,
            rawText: true,
            parsed: true,
            lineStates: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.club_need_requests.count({ where }),
      ]);

      const normalized = items.map((item) =>
        this.enrichRequestRow({ ...(item as any), matchesSnapshot: null }),
      );
      const sharesCount = await this.countSharesForRequests(normalized.map((item) => item.id));

      return {
        data: normalized,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        coverage: this.buildCoverageSummary(normalized, sharesCount),
      };
    }

    const allItems = await this.prisma.club_need_requests.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdById: true,
        rawText: true,
        parsed: true,
        lineStates: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const requestRows = allItems.map(
      (item) => ({ ...(item as any), matchesSnapshot: null }) as ClubNeedRequestRow,
    );
    const leagueHints = await this.buildRequestLeagueHints(requestRows);

    const normalized = requestRows.map((row) => this.enrichRequestRow(row));
    const filtered = normalized.filter((request) => {
      if (status && request.requestProgress !== status) {
        return false;
      }

      if (league) {
        const requestLeague = leagueHints.get(request.id) ?? null;
        if (requestLeague !== league) {
          return false;
        }
      }

      return true;
    });

    const paginated = filtered.slice(skip, skip + limit);
    const sharesCount = await this.countSharesForRequests(paginated.map((item) => item.id));

    return {
      data: paginated,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
      coverage: this.buildCoverageSummary(paginated, sharesCount),
    };
  }

  async getRequest(id: string) {
    const request = await this.prisma.club_need_requests.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        rawText: true,
        parsed: true,
        matchesSnapshot: true,
        lineStates: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Club need request not found');
    }

    return this.enrichRequestRow(request as ClubNeedRequestRow);
  }

  async getRequestWithMatches(id: string, topN: number) {
    const request = await this.getRequest(id);

    const matchesSnapshot = Array.isArray(request.matchesSnapshot)
      ? (request.matchesSnapshot as ClubNeedMatchResult[])
      : null;

    const matches =
      matchesSnapshot ?? (await this.computeMatches(request.parsed as ParsedNeedLine[], topN));

    return { request, matches };
  }

  async updateLineStatus(params: {
    id: string;
    lineNumber: number;
    isCompleted: boolean;
    userId: string;
  }) {
    if (!Number.isInteger(params.lineNumber) || params.lineNumber < 1) {
      throw new BadRequestException('lineNumber must be greater than or equal to 1');
    }

    const request = await this.prisma.club_need_requests.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        rawText: true,
        parsed: true,
        matchesSnapshot: true,
        lineStates: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Club need request not found');
    }

    const parsed = this.normalizeParsedLines(request.parsed);
    const nextLineStates = this.normalizeLineStates(parsed, request.lineStates);
    const lineIndex = nextLineStates.findIndex((line) => line.lineNumber === params.lineNumber);

    if (lineIndex < 0) {
      throw new NotFoundException('Club need line not found');
    }

    const nowIso = new Date().toISOString();
    const current = nextLineStates[lineIndex];

    if (params.isCompleted) {
      nextLineStates[lineIndex] = {
        ...current,
        isCompleted: true,
        completedAt: nowIso,
        completedById: params.userId,
      };
    } else {
      nextLineStates[lineIndex] = {
        ...current,
        isCompleted: false,
        reopenedAt: nowIso,
        reopenedById: params.userId,
      };
    }

    const updated = await this.prisma.club_need_requests.update({
      where: { id: params.id },
      data: {
        lineStates: nextLineStates as any,
      },
      select: {
        id: true,
        createdById: true,
        rawText: true,
        parsed: true,
        matchesSnapshot: true,
        lineStates: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.enrichRequestRow(updated as ClubNeedRequestRow);
  }

  async preview(rawText: string, topN: number) {
    const parsed = parseClubNeedsRawText(rawText);
    const matches = await this.computeMatches(parsed, topN);
    return { parsed, matches };
  }

  async computeMatches(parsed: ParsedNeedLine[], topN: number): Promise<ClubNeedMatchResult[]> {
    const results: ClubNeedMatchResult[] = [];

    for (const line of parsed) {
      if (line.errors?.length) {
        results.push({
          lineNumber: line.lineNumber,
          clubName: line.clubName,
          criteria: { positions: line.positions, age: line.age, preferredFoot: line.preferredFoot },
          players: [],
          warnings: line.warnings,
          errors: line.errors,
        });
        continue;
      }

      const where = buildPlayersWhereFromNeedLine(line);

      const players = await this.prisma.players.findMany({
        where,
        take: topN,
        include: {
          users: { select: { firstName: true, lastName: true } },
          clubs: { select: { id: true, name: true, logo: true } },
        },
        orderBy: [
          { marketValue: { sort: 'desc', nulls: 'last' } as any },
          { verifiedAt: { sort: 'desc', nulls: 'last' } as any },
          { createdAt: 'desc' },
        ],
      });

      results.push({
        lineNumber: line.lineNumber,
        clubName: line.clubName,
        criteria: { positions: line.positions, age: line.age, preferredFoot: line.preferredFoot },
        players: players.map((p) => ({
          playerId: p.id,
          firstName: (p as any).users?.firstName ?? p.firstName ?? null,
          lastName: (p as any).users?.lastName ?? p.lastName ?? null,
          position: p.position,
          nationality: p.nationality,
          club: (p as any).clubs
            ? { id: (p as any).clubs.id, name: (p as any).clubs.name, logo: (p as any).clubs.logo }
            : null,
          marketValue: p.marketValue ?? null,
          contractUntil: p.contractUntil ?? null,
          preferredFoot: p.preferredFoot ?? null,
          photoUrl: p.photoUrl ?? null,
        })),
        warnings: line.warnings,
        errors: [],
      });
    }

    return results;
  }
}
