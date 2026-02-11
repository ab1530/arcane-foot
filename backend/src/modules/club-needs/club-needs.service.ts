import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { parseClubNeedsRawText } from './parser';
import { buildPlayersWhereFromNeedLine } from './matcher';
import type { ClubNeedMatchResult, ParsedNeedLine } from './types';

@Injectable()
export class ClubNeedsService {
  constructor(private prisma: PrismaService) {}

  async createRequest(createdById: string, rawText: string, topN: number) {
    const parsed = parseClubNeedsRawText(rawText);

    const request = await this.prisma.club_need_requests.create({
      data: {
        id: randomUUID(),
        createdById,
        rawText,
        parsed: parsed as any,
      },
    });

    const matches = await this.computeMatches(parsed, topN);
    return { request, matches };
  }

  async listRequests(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.club_need_requests.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdById: true,
          rawText: true,
          parsed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.club_need_requests.count(),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Club need request not found');
    }

    return request;
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
          club: (p as any).clubs ? { id: (p as any).clubs.id, name: (p as any).clubs.name, logo: (p as any).clubs.logo } : null,
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

