import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateMissionRequestDto } from './dto/create-mission-request.dto';
import { DecideMissionRequestDto } from './dto/decide-mission-request.dto';
import { MatchStatus, Prisma, TaskPriority, TaskStatus } from '@prisma/client';

type MissionRequestDecision = 'APPROVED' | 'REJECTED' | 'CANCELLED';
type MissionRequestStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type MissionRequestMetadata = {
  kind: 'MATCH_MISSION_REQUEST';
  matchId: string;
  missionType: 'PRIORITY' | 'VOLUNTARY';
  targetScoutId?: string | null;
  note?: string | null;
  requesterRole?: string | null;
  decision?: MissionRequestDecision | null;
  decisionNote?: string | null;
  decidedById?: string | null;
  decidedAt?: string | null;
};

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  private readonly scoutMissionStatuses = new Set([
    'ASSIGNED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]);

  private toMobileStatusFromAssignment(
    assignment?: { status?: string | null; reportSubmitted?: boolean | null } | null,
  ): 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED' {
    if (!assignment) {
      return 'PLANNED';
    }
    if (assignment.reportSubmitted) {
      return 'REPORT_SUBMITTED';
    }

    const source = String(assignment.status ?? '').toUpperCase();
    if (source === 'IN_PROGRESS') return 'EN_ROUTE';
    if (source === 'COMPLETED') return 'REPORT_SUBMITTED';
    return 'PLANNED';
  }

  private toMobileStatusFromMatch(match: any): 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED' {
    const assignments = Array.isArray(match?.match_assignments) ? match.match_assignments : [];

    if (assignments.some((assignment: any) => assignment?.reportSubmitted)) {
      return 'REPORT_SUBMITTED';
    }

    if (
      assignments.some(
        (assignment: any) => this.toMobileStatusFromAssignment(assignment) === 'REPORT_SUBMITTED',
      )
    ) {
      return 'REPORT_SUBMITTED';
    }

    if (
      assignments.some(
        (assignment: any) => this.toMobileStatusFromAssignment(assignment) === 'EN_ROUTE',
      )
    ) {
      return 'EN_ROUTE';
    }

    const source = String(match?.status ?? '').toUpperCase();
    if (source === 'LIVE') return 'EN_ROUTE';
    if (source === 'COMPLETED') return 'REPORT_SUBMITTED';
    return 'PLANNED';
  }

  private deriveCountry(match: any): string | null {
    return (
      match?.venues?.country ??
      match?.homeClub?.country ??
      match?.awayClub?.country ??
      match?.clubs_matches_homeClubIdToclubs?.country ??
      match?.clubs_matches_awayClubIdToclubs?.country ??
      null
    );
  }

  private deriveLeague(match: any): string | null {
    const competitionName =
      typeof match?.competitions?.name === 'string' ? match.competitions.name.trim() : '';
    if (competitionName) {
      return competitionName;
    }
    const legacyCompetition =
      typeof match?.competitionOld === 'string' ? match.competitionOld.trim() : '';
    return legacyCompetition || null;
  }

  private normalizeStatusFilter(status?: string) {
    const source = String(status ?? '')
      .trim()
      .toUpperCase();
    return source || undefined;
  }

  private normalizeRole(role?: string | null) {
    return String(role ?? '')
      .trim()
      .toUpperCase();
  }

  private isMissingColumnError(error: unknown, table?: string) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }
    if (error.code !== 'P2022') {
      return false;
    }
    if (!table) {
      return true;
    }
    const missingColumn = String((error.meta as Record<string, unknown> | undefined)?.column ?? '');
    return missingColumn.toLowerCase().includes(table.toLowerCase());
  }

  private assertScoutRole(role?: string | null) {
    if (this.normalizeRole(role) !== 'SCOUT') {
      throw new ForbiddenException('Only scouts can use this endpoint');
    }
  }

  private isCategoryARole(role?: string | null) {
    const normalized = this.normalizeRole(role);
    return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
  }

  private isAgentRole(role?: string | null) {
    return this.normalizeRole(role) === 'AGENT';
  }

  private assertAgentOrCategoryA(role?: string | null) {
    if (!this.isAgentRole(role) && !this.isCategoryARole(role)) {
      throw new ForbiddenException('Only agents/admin can create mission requests');
    }
  }

  private assertCategoryA(role?: string | null) {
    if (!this.isCategoryARole(role)) {
      throw new ForbiddenException('Only admins can validate mission requests');
    }
  }

  private safeParseMissionRequestMetadata(value?: string | null): MissionRequestMetadata | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed?.kind !== 'MATCH_MISSION_REQUEST' || !parsed?.matchId) {
        return null;
      }
      return parsed as MissionRequestMetadata;
    } catch {
      return null;
    }
  }

  private resolveMissionRequestStatus(
    task: { status?: TaskStatus },
    metadata: MissionRequestMetadata,
  ): MissionRequestStatus {
    if (task.status === 'TODO') return 'SUBMITTED';
    if (metadata.decision === 'APPROVED') return 'APPROVED';
    if (metadata.decision === 'REJECTED') return 'REJECTED';
    if (metadata.decision === 'CANCELLED') return 'CANCELLED';
    if (task.status === 'DONE') return 'APPROVED';
    return 'CANCELLED';
  }

  private mapMissionRequest(task: any, metadata: MissionRequestMetadata, match?: any | null) {
    const status = this.resolveMissionRequestStatus(task, metadata);
    return {
      id: task.id,
      status,
      missionType: metadata.missionType,
      note: metadata.note ?? null,
      decisionNote: metadata.decisionNote ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      decidedAt: metadata.decidedAt ?? null,
      matchId: metadata.matchId,
      match: match
        ? {
            id: match.id,
            scheduledAt: match.scheduledAt,
            homeClub: match.clubs_matches_homeClubIdToclubs
              ? {
                  id: match.clubs_matches_homeClubIdToclubs.id,
                  name: match.clubs_matches_homeClubIdToclubs.name,
                  logo: match.clubs_matches_homeClubIdToclubs.logo,
                }
              : null,
            awayClub: match.clubs_matches_awayClubIdToclubs
              ? {
                  id: match.clubs_matches_awayClubIdToclubs.id,
                  name: match.clubs_matches_awayClubIdToclubs.name,
                  logo: match.clubs_matches_awayClubIdToclubs.logo,
                }
              : null,
          }
        : null,
      requestedBy: task.users_tasks_creatorIdTousers
        ? {
            id: task.users_tasks_creatorIdTousers.id,
            firstName: task.users_tasks_creatorIdTousers.firstName,
            lastName: task.users_tasks_creatorIdTousers.lastName,
            role: task.users_tasks_creatorIdTousers.role,
          }
        : null,
      targetScout: task.users_tasks_assigneeIdTousers
        ? {
            id: task.users_tasks_assigneeIdTousers.id,
            firstName: task.users_tasks_assigneeIdTousers.firstName,
            lastName: task.users_tasks_assigneeIdTousers.lastName,
            role: task.users_tasks_assigneeIdTousers.role,
          }
        : metadata.targetScoutId
          ? { id: metadata.targetScoutId }
          : null,
      decidedById: metadata.decidedById ?? null,
    };
  }

  private mapAssignment(match: any, assignment: any) {
    return {
      assignmentId: assignment.id,
      matchId: match.id,
      missionType: assignment.missionType,
      status: assignment.status,
      mobileStatus: this.toMobileStatusFromAssignment(assignment),
      reportSubmitted: assignment.reportSubmitted,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      country: this.deriveCountry(match),
      league: this.deriveLeague(match),
      match: {
        id: match.id,
        scheduledAt: match.scheduledAt,
        matchDate: match.matchDate,
        matchTime: match.matchTime,
        status: match.status,
        mobileStatus: this.toMobileStatusFromMatch(match),
        competition: match.competitions
          ? {
              id: match.competitions.id,
              name: match.competitions.name,
            }
          : null,
        competitionOld: match.competitionOld,
        venue: match.venues
          ? {
              id: match.venues.id,
              name: match.venues.name,
              city: match.venues.city,
              country: match.venues.country,
              latitude: match.venues.latitude,
              longitude: match.venues.longitude,
              address: match.venues.address,
            }
          : null,
        homeClub: match.homeClub
          ? {
              id: match.homeClub.id,
              name: match.homeClub.name,
              shortName: match.homeClub.shortName,
              logo: match.homeClub.logo,
              country: match.homeClub.country,
              city: match.homeClub.city,
            }
          : match.clubs_matches_homeClubIdToclubs
            ? {
                id: match.clubs_matches_homeClubIdToclubs.id,
                name: match.clubs_matches_homeClubIdToclubs.name,
                shortName: match.clubs_matches_homeClubIdToclubs.shortName,
                logo: match.clubs_matches_homeClubIdToclubs.logo,
                country: match.clubs_matches_homeClubIdToclubs.country,
                city: match.clubs_matches_homeClubIdToclubs.city,
              }
            : null,
        awayClub: match.awayClub
          ? {
              id: match.awayClub.id,
              name: match.awayClub.name,
              shortName: match.awayClub.shortName,
              logo: match.awayClub.logo,
              country: match.awayClub.country,
              city: match.awayClub.city,
            }
          : match.clubs_matches_awayClubIdToclubs
            ? {
                id: match.clubs_matches_awayClubIdToclubs.id,
                name: match.clubs_matches_awayClubIdToclubs.name,
                shortName: match.clubs_matches_awayClubIdToclubs.shortName,
                logo: match.clubs_matches_awayClubIdToclubs.logo,
                country: match.clubs_matches_awayClubIdToclubs.country,
                city: match.clubs_matches_awayClubIdToclubs.city,
              }
            : null,
      },
      scout: assignment.users_match_assignments_scoutIdTousers
        ? {
            id: assignment.users_match_assignments_scoutIdTousers.id,
            firstName: assignment.users_match_assignments_scoutIdTousers.firstName,
            lastName: assignment.users_match_assignments_scoutIdTousers.lastName,
            avatar: assignment.users_match_assignments_scoutIdTousers.avatar,
            role: assignment.users_match_assignments_scoutIdTousers.role,
          }
        : null,
      assignedBy: assignment.users_match_assignments_assignedByIdTousers
        ? {
            id: assignment.users_match_assignments_assignedByIdTousers.id,
            firstName: assignment.users_match_assignments_assignedByIdTousers.firstName,
            lastName: assignment.users_match_assignments_assignedByIdTousers.lastName,
            role: assignment.users_match_assignments_assignedByIdTousers.role,
          }
        : null,
    };
  }

  private buildScoutCalendarWhere(params: {
    country?: string;
    league?: string;
    from?: string;
    to?: string;
    status?: string;
  }) {
    const { country, league, from, to } = params;
    const where: any = {};

    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    if (league) {
      where.OR = [
        { competitions: { is: { name: { equals: league, mode: 'insensitive' } } } },
        { competitionOld: { equals: league, mode: 'insensitive' } },
      ];
    }

    if (country) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { venues: { is: { country: { equals: country, mode: 'insensitive' } } } },
            {
              clubs_matches_homeClubIdToclubs: {
                is: { country: { equals: country, mode: 'insensitive' } },
              },
            },
            {
              clubs_matches_awayClubIdToclubs: {
                is: { country: { equals: country, mode: 'insensitive' } },
              },
            },
          ],
        },
      ];
    }

    return where;
  }

  async getScoutCalendar(
    userId: string,
    role: string | null | undefined,
    params: {
      country?: string;
      league?: string;
      from?: string;
      to?: string;
      status?: string;
    },
  ) {
    this.assertScoutRole(role);
    if (!userId) {
      throw new BadRequestException('Scout userId is required');
    }
    const normalizedStatus = this.normalizeStatusFilter(params.status);
    const where = this.buildScoutCalendarWhere(params);
    try {
      const matches = await this.prisma.matches.findMany({
        where,
        include: {
          clubs_matches_homeClubIdToclubs: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              country: true,
              city: true,
            },
          },
          clubs_matches_awayClubIdToclubs: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              country: true,
              city: true,
            },
          },
          competitions: {
            select: {
              id: true,
              name: true,
            },
          },
          venues: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
              latitude: true,
              longitude: true,
              address: true,
            },
          },
          match_assignments: {
            include: {
              users_match_assignments_scoutIdTousers: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true,
                },
              },
              users_match_assignments_assignedByIdTousers: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      const allCountries = new Set<string>();
      const allLeagues = new Set<string>();
      const myCalendar: any[] = [];
      const sharedCalendar: any[] = [];
      const discover: any[] = [];

      for (const match of matches as any[]) {
        const country = this.deriveCountry(match);
        const league = this.deriveLeague(match);
        if (country) allCountries.add(country);
        if (league) allLeagues.add(league);

        const assignments = Array.isArray(match.match_assignments) ? match.match_assignments : [];
        const myAssignments = assignments.filter(
          (assignment: any) => assignment.scoutId === userId,
        );
        const sharedAssignments = assignments.filter(
          (assignment: any) => assignment.scoutId !== userId,
        );

        const addIfStatusMatches = (target: any[], item: any) => {
          if (!normalizedStatus) {
            target.push(item);
            return;
          }
          const assignmentStatus = String(item.status ?? '').toUpperCase();
          const mobileStatus = String(item.mobileStatus ?? '').toUpperCase();
          if (assignmentStatus === normalizedStatus || mobileStatus === normalizedStatus) {
            target.push(item);
          }
        };

        for (const assignment of myAssignments) {
          addIfStatusMatches(myCalendar, this.mapAssignment(match, assignment));
        }

        for (const assignment of sharedAssignments) {
          addIfStatusMatches(sharedCalendar, this.mapAssignment(match, assignment));
        }

        if (myAssignments.length === 0) {
          const discoverStatus = this.toMobileStatusFromMatch(match);
          if (
            !normalizedStatus ||
            String(discoverStatus).toUpperCase() === normalizedStatus ||
            String(match.status ?? '')
              .toUpperCase()
              .trim() === normalizedStatus
          ) {
            discover.push({
              matchId: match.id,
              country,
              league,
              match: {
                id: match.id,
                scheduledAt: match.scheduledAt,
                matchDate: match.matchDate,
                matchTime: match.matchTime,
                status: match.status,
                mobileStatus: discoverStatus,
                competition: match.competitions
                  ? {
                      id: match.competitions.id,
                      name: match.competitions.name,
                    }
                  : null,
                competitionOld: match.competitionOld,
                venue: match.venues
                  ? {
                      id: match.venues.id,
                      name: match.venues.name,
                      city: match.venues.city,
                      country: match.venues.country,
                      latitude: match.venues.latitude,
                      longitude: match.venues.longitude,
                      address: match.venues.address,
                    }
                  : null,
                homeClub: match.clubs_matches_homeClubIdToclubs
                  ? {
                      id: match.clubs_matches_homeClubIdToclubs.id,
                      name: match.clubs_matches_homeClubIdToclubs.name,
                      shortName: match.clubs_matches_homeClubIdToclubs.shortName,
                      logo: match.clubs_matches_homeClubIdToclubs.logo,
                      country: match.clubs_matches_homeClubIdToclubs.country,
                      city: match.clubs_matches_homeClubIdToclubs.city,
                    }
                  : null,
                awayClub: match.clubs_matches_awayClubIdToclubs
                  ? {
                      id: match.clubs_matches_awayClubIdToclubs.id,
                      name: match.clubs_matches_awayClubIdToclubs.name,
                      shortName: match.clubs_matches_awayClubIdToclubs.shortName,
                      logo: match.clubs_matches_awayClubIdToclubs.logo,
                      country: match.clubs_matches_awayClubIdToclubs.country,
                      city: match.clubs_matches_awayClubIdToclubs.city,
                    }
                  : null,
              },
              sharedScouts: sharedAssignments.map((assignment: any) => ({
                id: assignment.scoutId,
                firstName: assignment.users_match_assignments_scoutIdTousers?.firstName,
                lastName: assignment.users_match_assignments_scoutIdTousers?.lastName,
                role: assignment.users_match_assignments_scoutIdTousers?.role,
              })),
            });
          }
        }
      }

      return {
        filters: {
          countries: Array.from(allCountries).sort((a, b) => a.localeCompare(b)),
          leagues: Array.from(allLeagues).sort((a, b) => a.localeCompare(b)),
        },
        myCalendar,
        sharedCalendar,
        discover,
        meta: {
          totalMy: myCalendar.length,
          totalShared: sharedCalendar.length,
          totalDiscover: discover.length,
        },
      };
    } catch (error) {
      if (!this.isMissingColumnError(error, 'match_assignments')) {
        throw error;
      }
      return this.getScoutCalendarLegacy(userId, params);
    }
  }

  private mapLegacyMatchItem(match: any, scoutId?: string | null) {
    return {
      assignmentId: scoutId ? `legacy-${match.id}-${scoutId}` : null,
      matchId: match.id,
      missionType: scoutId ? 'PRIORITY' : 'VOLUNTARY',
      status: 'ASSIGNED',
      mobileStatus: this.toMobileStatusFromMatch(match),
      reportSubmitted: String(match?.status ?? '').toUpperCase() === 'COMPLETED',
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      country: this.deriveCountry(match),
      league: this.deriveLeague(match),
      match: {
        id: match.id,
        scheduledAt: match.scheduledAt,
        matchDate: match.matchDate,
        matchTime: match.matchTime,
        status: match.status,
        mobileStatus: this.toMobileStatusFromMatch(match),
        competition: match.competitions
          ? {
              id: match.competitions.id,
              name: match.competitions.name,
            }
          : null,
        competitionOld: match.competitionOld,
        venue: match.venues
          ? {
              id: match.venues.id,
              name: match.venues.name,
              city: match.venues.city,
              country: match.venues.country,
              latitude: match.venues.latitude,
              longitude: match.venues.longitude,
              address: match.venues.address,
            }
          : null,
        homeClub: match.clubs_matches_homeClubIdToclubs
          ? {
              id: match.clubs_matches_homeClubIdToclubs.id,
              name: match.clubs_matches_homeClubIdToclubs.name,
              shortName: match.clubs_matches_homeClubIdToclubs.shortName,
              logo: match.clubs_matches_homeClubIdToclubs.logo,
              country: match.clubs_matches_homeClubIdToclubs.country,
              city: match.clubs_matches_homeClubIdToclubs.city,
            }
          : null,
        awayClub: match.clubs_matches_awayClubIdToclubs
          ? {
              id: match.clubs_matches_awayClubIdToclubs.id,
              name: match.clubs_matches_awayClubIdToclubs.name,
              shortName: match.clubs_matches_awayClubIdToclubs.shortName,
              logo: match.clubs_matches_awayClubIdToclubs.logo,
              country: match.clubs_matches_awayClubIdToclubs.country,
              city: match.clubs_matches_awayClubIdToclubs.city,
            }
          : null,
      },
      scout: match.users_matches_scoutIdTousers
        ? {
            id: match.users_matches_scoutIdTousers.id,
            firstName: match.users_matches_scoutIdTousers.firstName,
            lastName: match.users_matches_scoutIdTousers.lastName,
            avatar: match.users_matches_scoutIdTousers.avatar,
            role: match.users_matches_scoutIdTousers.role,
          }
        : scoutId
          ? { id: scoutId }
          : null,
      assignedBy: null,
    };
  }

  private async getScoutCalendarLegacy(
    userId: string,
    params: {
      country?: string;
      league?: string;
      from?: string;
      to?: string;
      status?: string;
    },
  ) {
    const normalizedStatus = this.normalizeStatusFilter(params.status);
    const where = this.buildScoutCalendarWhere(params);
    const matches = await this.prisma.matches.findMany({
      where,
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            country: true,
            city: true,
          },
        },
        clubs_matches_awayClubIdToclubs: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            country: true,
            city: true,
          },
        },
        competitions: {
          select: {
            id: true,
            name: true,
          },
        },
        venues: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            address: true,
          },
        },
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const allCountries = new Set<string>();
    const allLeagues = new Set<string>();
    const myCalendar: any[] = [];
    const sharedCalendar: any[] = [];
    const discover: any[] = [];

    for (const match of matches as any[]) {
      const country = this.deriveCountry(match);
      const league = this.deriveLeague(match);
      if (country) allCountries.add(country);
      if (league) allLeagues.add(league);

      const item = this.mapLegacyMatchItem(match, match.scoutId);
      const itemStatus = String(item.mobileStatus ?? '').toUpperCase();
      if (
        normalizedStatus &&
        itemStatus !== normalizedStatus &&
        String(match.status ?? '').toUpperCase() !== normalizedStatus
      ) {
        continue;
      }

      if (match.scoutId === userId) {
        myCalendar.push(item);
      } else if (match.scoutId) {
        sharedCalendar.push(item);
      } else {
        discover.push({
          matchId: match.id,
          country,
          league,
          match: item.match,
          sharedScouts: [],
        });
      }
    }

    return {
      filters: {
        countries: Array.from(allCountries).sort((a, b) => a.localeCompare(b)),
        leagues: Array.from(allLeagues).sort((a, b) => a.localeCompare(b)),
      },
      myCalendar,
      sharedCalendar,
      discover,
      meta: {
        totalMy: myCalendar.length,
        totalShared: sharedCalendar.length,
        totalDiscover: discover.length,
        legacy: true,
      },
    };
  }

  async addMatchToMyCalendar(matchId: string, userId: string, role?: string | null) {
    this.assertScoutRole(role);

    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      select: { id: true },
    });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    let assignment: any;
    try {
      assignment = await this.prisma.match_assignments.upsert({
        where: {
          matchId_scoutId: {
            matchId,
            scoutId: userId,
          },
        },
        update: {
          missionType: 'VOLUNTARY',
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          matchId,
          scoutId: userId,
          missionType: 'VOLUNTARY',
          status: 'ASSIGNED',
          reportSubmitted: false,
          targetPlayerNames: [],
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (!this.isMissingColumnError(error, 'match_assignments')) {
        throw error;
      }
      throw new BadRequestException(
        'Mission assignments require pending database migration. Apply migrations and retry.',
      );
    }

    return {
      assignmentId: assignment.id,
      matchId: assignment.matchId,
      scoutId: assignment.scoutId,
      missionType: assignment.missionType,
      status: assignment.status,
      mobileStatus: this.toMobileStatusFromAssignment(assignment),
      reportSubmitted: assignment.reportSubmitted,
    };
  }

  async startAssignmentMission(assignmentId: string, userId: string, role?: string | null) {
    this.assertScoutRole(role);
    if (assignmentId.startsWith('legacy-')) {
      throw new BadRequestException(
        'Mission start is unavailable on legacy assignments. Run pending database migrations first.',
      );
    }

    const assignment = await this.prisma.match_assignments.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }
    if (assignment.scoutId !== userId) {
      throw new ForbiddenException('You cannot start another scout mission');
    }
    if (!this.scoutMissionStatuses.has(String(assignment.status ?? '').toUpperCase())) {
      throw new BadRequestException('Invalid assignment status');
    }

    const updated = await this.prisma.match_assignments.update({
      where: { id: assignmentId },
      data: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    });

    return {
      assignmentId: updated.id,
      matchId: updated.matchId,
      scoutId: updated.scoutId,
      missionType: updated.missionType,
      status: updated.status,
      mobileStatus: this.toMobileStatusFromAssignment(updated),
      reportSubmitted: updated.reportSubmitted,
    };
  }

  async completeAssignmentMission(assignmentId: string, userId: string, role?: string | null) {
    this.assertScoutRole(role);
    if (assignmentId.startsWith('legacy-')) {
      throw new BadRequestException(
        'Mission completion is unavailable on legacy assignments. Run pending database migrations first.',
      );
    }

    const assignment = await this.prisma.match_assignments.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }
    if (assignment.scoutId !== userId) {
      throw new ForbiddenException('You cannot complete another scout mission');
    }
    if (!this.scoutMissionStatuses.has(String(assignment.status ?? '').toUpperCase())) {
      throw new BadRequestException('Invalid assignment status');
    }
    if (String(assignment.status ?? '').toUpperCase() === 'CANCELLED') {
      throw new BadRequestException('Cancelled mission cannot be completed');
    }

    const updated = await this.prisma.match_assignments.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: assignment.completedAt ?? new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      assignmentId: updated.id,
      matchId: updated.matchId,
      scoutId: updated.scoutId,
      missionType: updated.missionType,
      status: updated.status,
      mobileStatus: this.toMobileStatusFromAssignment(updated),
      reportSubmitted: updated.reportSubmitted,
    };
  }

  async createMissionRequest(
    matchId: string,
    payload: CreateMissionRequestDto,
    requesterId: string,
    requesterRole?: string | null,
  ) {
    if (!requesterId) {
      throw new BadRequestException('Requester userId is required');
    }
    this.assertAgentOrCategoryA(requesterRole);

    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
        clubs_matches_awayClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
      },
    });
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const missionType = payload.missionType ?? 'PRIORITY';
    if (missionType === 'PRIORITY' && !payload.targetScoutId) {
      throw new BadRequestException('targetScoutId is required for PRIORITY mission requests');
    }

    if (payload.targetScoutId) {
      const scout = await this.prisma.users.findUnique({
        where: { id: payload.targetScoutId },
        select: { id: true, role: true },
      });
      if (!scout) {
        throw new NotFoundException(`Scout with ID ${payload.targetScoutId} not found`);
      }
      if (String(scout.role ?? '').toUpperCase() !== 'SCOUT') {
        throw new BadRequestException('Target user is not a scout');
      }
    }

    const metadata: MissionRequestMetadata = {
      kind: 'MATCH_MISSION_REQUEST',
      matchId,
      missionType,
      targetScoutId: payload.targetScoutId ?? null,
      note: payload.note?.trim() || null,
      requesterRole: this.normalizeRole(requesterRole) || null,
      decision: null,
      decisionNote: null,
      decidedById: null,
      decidedAt: null,
    };

    const title = `Mission request - ${
      match.clubs_matches_homeClubIdToclubs?.name ?? 'Club A'
    } vs ${match.clubs_matches_awayClubIdToclubs?.name ?? 'Club B'}`;

    const created = await this.prisma.tasks.create({
      data: {
        id: randomUUID(),
        title,
        description: JSON.stringify(metadata),
        status: TaskStatus.TODO,
        priority: metadata.missionType === 'PRIORITY' ? TaskPriority.HIGH : TaskPriority.MEDIUM,
        assigneeId: payload.targetScoutId ?? null,
        creatorId: requesterId,
        dueDate: match.scheduledAt,
        updatedAt: new Date(),
      },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return this.mapMissionRequest(created, metadata, match);
  }

  async listMissionRequests(
    params: { matchId?: string; status?: MissionRequestStatus },
    userId: string,
    role?: string | null,
  ) {
    const normalizedRole = this.normalizeRole(role);
    if (
      normalizedRole !== 'SCOUT' &&
      normalizedRole !== 'AGENT' &&
      !this.isCategoryARole(normalizedRole)
    ) {
      throw new ForbiddenException('Role is not authorized to read mission requests');
    }
    if (!userId) {
      throw new BadRequestException('Actor userId is required');
    }

    const where: any = {
      description: { startsWith: '{"kind":"MATCH_MISSION_REQUEST"' },
    };

    if (normalizedRole === 'AGENT') {
      where.creatorId = userId;
    } else if (normalizedRole === 'SCOUT') {
      where.OR = [
        { assigneeId: userId },
        { description: { contains: `"targetScoutId":"${userId}"` } },
      ];
    }

    if (params.matchId) {
      where.description = {
        ...where.description,
        contains: `"matchId":"${params.matchId}"`,
      };
    }

    const tasks = await this.prisma.tasks.findMany({
      where,
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedRows = tasks
      .map((task) => {
        const metadata = this.safeParseMissionRequestMetadata(task.description);
        if (!metadata) return null;
        const status = this.resolveMissionRequestStatus(task, metadata);

        if (params.matchId && metadata.matchId !== params.matchId) return null;
        if (params.status && status !== params.status) return null;

        if (normalizedRole === 'AGENT' && task.creatorId !== userId) return null;
        if (
          normalizedRole === 'SCOUT' &&
          metadata.targetScoutId !== userId &&
          task.assigneeId !== userId
        ) {
          return null;
        }

        return { task, metadata };
      })
      .filter(Boolean) as Array<{ task: any; metadata: MissionRequestMetadata }>;

    const matchIds = Array.from(new Set(parsedRows.map((entry) => entry.metadata.matchId)));
    const matches = matchIds.length
      ? await this.prisma.matches.findMany({
          where: { id: { in: matchIds } },
          include: {
            clubs_matches_homeClubIdToclubs: {
              select: { id: true, name: true, logo: true },
            },
            clubs_matches_awayClubIdToclubs: {
              select: { id: true, name: true, logo: true },
            },
          },
        })
      : [];
    const matchById = new Map(matches.map((match) => [match.id, match]));

    const data = parsedRows.map(({ task, metadata }) =>
      this.mapMissionRequest(task, metadata, matchById.get(metadata.matchId)),
    );

    return {
      data,
      meta: {
        total: data.length,
      },
    };
  }

  private async getMissionRequestTask(requestId: string) {
    const task = await this.prisma.tasks.findUnique({
      where: { id: requestId },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Mission request with ID ${requestId} not found`);
    }
    const metadata = this.safeParseMissionRequestMetadata(task.description);
    if (!metadata) {
      throw new NotFoundException(`Mission request with ID ${requestId} not found`);
    }
    return { task, metadata };
  }

  async approveMissionRequest(
    requestId: string,
    payload: DecideMissionRequestDto,
    actorId: string,
    actorRole?: string | null,
  ) {
    if (!actorId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertCategoryA(actorRole);

    const { task, metadata } = await this.getMissionRequestTask(requestId);
    if (this.resolveMissionRequestStatus(task, metadata) !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted mission requests can be approved');
    }

    const scoutId = payload.scoutId ?? metadata.targetScoutId ?? null;
    if (!scoutId) {
      throw new BadRequestException('A scoutId is required to approve mission request');
    }

    const scout = await this.prisma.users.findUnique({
      where: { id: scoutId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });
    if (!scout) {
      throw new NotFoundException(`Scout with ID ${scoutId} not found`);
    }
    if (String(scout.role ?? '').toUpperCase() !== 'SCOUT') {
      throw new BadRequestException('Selected user is not a scout');
    }

    const match = await this.prisma.matches.findUnique({
      where: { id: metadata.matchId },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
        clubs_matches_awayClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
      },
    });
    if (!match) {
      throw new NotFoundException(`Match with ID ${metadata.matchId} not found`);
    }

    let assignment: any;
    try {
      assignment = await this.prisma.match_assignments.upsert({
        where: {
          matchId_scoutId: {
            matchId: metadata.matchId,
            scoutId,
          },
        },
        update: {
          missionType: metadata.missionType ?? 'PRIORITY',
          assignedById: actorId,
          status: 'ASSIGNED',
          reportSubmitted: false,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          matchId: metadata.matchId,
          scoutId,
          missionType: metadata.missionType ?? 'PRIORITY',
          status: 'ASSIGNED',
          role: 'PRIMARY_SCOUT',
          targetPlayerNames: [],
          reportSubmitted: false,
          assignedById: actorId,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (!this.isMissingColumnError(error, 'match_assignments')) {
        throw error;
      }
      throw new BadRequestException(
        'Mission approval requires pending database migration. Apply migrations and retry.',
      );
    }

    await this.prisma.matches.update({
      where: { id: metadata.matchId },
      data: { scoutId },
    });

    const updatedMetadata: MissionRequestMetadata = {
      ...metadata,
      targetScoutId: scoutId,
      decision: 'APPROVED',
      decisionNote: payload.note?.trim() || null,
      decidedById: actorId,
      decidedAt: new Date().toISOString(),
    };

    const updatedTask = await this.prisma.tasks.update({
      where: { id: requestId },
      data: {
        status: TaskStatus.DONE,
        assigneeId: scoutId,
        completedAt: new Date(),
        description: JSON.stringify(updatedMetadata),
        updatedAt: new Date(),
      },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return {
      request: this.mapMissionRequest(updatedTask, updatedMetadata, match),
      assignment: {
        assignmentId: assignment.id,
        scoutId: assignment.scoutId,
        missionType: assignment.missionType,
        status: assignment.status,
      },
    };
  }

  async rejectMissionRequest(
    requestId: string,
    payload: DecideMissionRequestDto,
    actorId: string,
    actorRole?: string | null,
  ) {
    if (!actorId) {
      throw new BadRequestException('Actor userId is required');
    }
    this.assertCategoryA(actorRole);

    const { task, metadata } = await this.getMissionRequestTask(requestId);
    if (this.resolveMissionRequestStatus(task, metadata) !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted mission requests can be rejected');
    }

    const updatedMetadata: MissionRequestMetadata = {
      ...metadata,
      decision: 'REJECTED',
      decisionNote: payload.note?.trim() || null,
      decidedById: actorId,
      decidedAt: new Date().toISOString(),
    };

    const updatedTask = await this.prisma.tasks.update({
      where: { id: requestId },
      data: {
        status: TaskStatus.CANCELLED,
        completedAt: new Date(),
        description: JSON.stringify(updatedMetadata),
        updatedAt: new Date(),
      },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const match = await this.prisma.matches.findUnique({
      where: { id: metadata.matchId },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
        clubs_matches_awayClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    return this.mapMissionRequest(updatedTask, updatedMetadata, match);
  }

  async cancelMissionRequest(
    requestId: string,
    payload: DecideMissionRequestDto,
    actorId: string,
    actorRole?: string | null,
  ) {
    if (!actorId) {
      throw new BadRequestException('Actor userId is required');
    }
    const { task, metadata } = await this.getMissionRequestTask(requestId);
    const isOwner = task.creatorId === actorId;
    const isAdmin = this.isCategoryARole(actorRole);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Only requester/admin can cancel mission request');
    }
    if (this.resolveMissionRequestStatus(task, metadata) !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted mission requests can be cancelled');
    }

    const updatedMetadata: MissionRequestMetadata = {
      ...metadata,
      decision: 'CANCELLED',
      decisionNote: payload.note?.trim() || null,
      decidedById: isAdmin ? actorId : null,
      decidedAt: new Date().toISOString(),
    };

    const updatedTask = await this.prisma.tasks.update({
      where: { id: requestId },
      data: {
        status: TaskStatus.CANCELLED,
        completedAt: new Date(),
        description: JSON.stringify(updatedMetadata),
        updatedAt: new Date(),
      },
      include: {
        users_tasks_creatorIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        users_tasks_assigneeIdTousers: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    const match = await this.prisma.matches.findUnique({
      where: { id: metadata.matchId },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
        clubs_matches_awayClubIdToclubs: {
          select: { id: true, name: true, logo: true },
        },
      },
    });

    return this.mapMissionRequest(updatedTask, updatedMetadata, match);
  }

  /**
   * Create a new match
   */
  async create(createMatchDto: CreateMatchDto) {
    // Validate clubs exist
    const [homeClub, awayClub] = await Promise.all([
      this.prisma.clubs.findUnique({ where: { id: createMatchDto.homeClubId } }),
      this.prisma.clubs.findUnique({ where: { id: createMatchDto.awayClubId } }),
    ]);

    if (!homeClub) {
      throw new NotFoundException(`Home club with ID ${createMatchDto.homeClubId} not found`);
    }
    if (!awayClub) {
      throw new NotFoundException(`Away club with ID ${createMatchDto.awayClubId} not found`);
    }
    if (createMatchDto.homeClubId === createMatchDto.awayClubId) {
      throw new BadRequestException('Home and away clubs must be different');
    }

    return this.prisma.matches.create({
      data: {
        id: randomUUID(),
        ...createMatchDto,
        scheduledAt: new Date(createMatchDto.scheduledAt),
        updatedAt: new Date(),
      },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        clubs_matches_awayClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find all matches with filters and pagination
   */
  async findAll(params: {
    status?: MatchStatus;
    clubId?: string;
    scoutId?: string;
    competition?: string;
    season?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      clubId,
      scoutId,
      competition,
      season,
      from,
      to,
      page = 1,
      limit = 1000,
    } = params;

    const where: any = {};
    if (status) where.status = status;
    if (scoutId) where.scoutId = scoutId;
    if (competition) where.competitionOld = competition; // Use legacy field for now
    if (season) where.season = season;

    if (clubId) {
      where.OR = [{ homeClubId: clubId }, { awayClubId: clubId }];
    }

    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const baseInclude = {
      clubs_matches_homeClubIdToclubs: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
        },
      },
      clubs_matches_awayClubIdToclubs: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
        },
      },
      users_matches_scoutIdTousers: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      },
      _count: {
        select: {
          scouting_reports: true,
        },
      },
    } as const;

    const includeWithAssignments = {
      ...baseInclude,
      match_assignments: {
        include: {
          users_match_assignments_scoutIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
          users_match_assignments_assignedByIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      },
    } as const;

    const transformMatch = (match: any) => {
      const assignmentsFromTable = Array.isArray(match.match_assignments)
        ? match.match_assignments.map((assignment: any) => ({
            id: assignment.id,
            scoutId: assignment.scoutId,
            missionType: assignment.missionType,
            status: assignment.status,
            mobileStatus: this.toMobileStatusFromAssignment(assignment),
            role: assignment.role,
            reportSubmitted: assignment.reportSubmitted,
            scout: assignment.users_match_assignments_scoutIdTousers
              ? {
                  firstName: assignment.users_match_assignments_scoutIdTousers.firstName,
                  lastName: assignment.users_match_assignments_scoutIdTousers.lastName,
                  avatar: assignment.users_match_assignments_scoutIdTousers.avatar,
                  role: assignment.users_match_assignments_scoutIdTousers.role,
                }
              : null,
            assignedBy: assignment.users_match_assignments_assignedByIdTousers
              ? {
                  id: assignment.users_match_assignments_assignedByIdTousers.id,
                  firstName: assignment.users_match_assignments_assignedByIdTousers.firstName,
                  lastName: assignment.users_match_assignments_assignedByIdTousers.lastName,
                  role: assignment.users_match_assignments_assignedByIdTousers.role,
                }
              : null,
          }))
        : [];

      const assignments =
        assignmentsFromTable.length > 0
          ? assignmentsFromTable
          : match.users_matches_scoutIdTousers
            ? [
                {
                  id: `legacy-${match.id}-${match.users_matches_scoutIdTousers.id}`,
                  scoutId: match.users_matches_scoutIdTousers.id,
                  missionType: 'PRIORITY',
                  status: 'ASSIGNED',
                  mobileStatus: this.toMobileStatusFromMatch(match),
                  role: 'PRIMARY_SCOUT',
                  reportSubmitted: String(match?.status ?? '').toUpperCase() === 'COMPLETED',
                  scout: {
                    firstName: match.users_matches_scoutIdTousers.firstName,
                    lastName: match.users_matches_scoutIdTousers.lastName,
                    avatar: match.users_matches_scoutIdTousers.avatar,
                    role: match.users_matches_scoutIdTousers.role,
                  },
                  assignedBy: null,
                },
              ]
            : [];

      return {
        ...match,
        mobileStatus: this.toMobileStatusFromMatch(match),
        homeClub: match.clubs_matches_homeClubIdToclubs,
        awayClub: match.clubs_matches_awayClubIdToclubs,
        scout: match.users_matches_scoutIdTousers,
        assignments,
        _count: {
          scoutingReports: match._count?.scouting_reports || 0,
        },
      };
    };

    try {
      const [matches, total] = await Promise.all([
        this.prisma.matches.findMany({
          where,
          skip,
          take: limit,
          include: includeWithAssignments,
          orderBy: { scheduledAt: 'desc' },
        }),
        this.prisma.matches.count({ where }),
      ]);

      return {
        data: matches.map(transformMatch),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (!this.isMissingColumnError(error, 'match_assignments')) {
        throw error;
      }

      const [matches, total] = await Promise.all([
        this.prisma.matches.findMany({
          where,
          skip,
          take: limit,
          include: baseInclude,
          orderBy: { scheduledAt: 'desc' },
        }),
        this.prisma.matches.count({ where }),
      ]);

      return {
        data: matches.map(transformMatch),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          legacyAssignments: true,
        },
      };
    }
  }

  /**
   * Find matches assigned to a specific user (legacy scout assignment + advanced assignments)
   */
  async findUserAssignments(
    userId: string,
    params: {
      status?: MatchStatus;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const { status, from, to, page = 1, limit = 1000 } = params;

    const where: any = {
      OR: [{ scoutId: userId }, { match_assignments: { some: { scoutId: userId } } }],
    };

    if (status) where.status = status;
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    try {
      const [matches, total] = await Promise.all([
        this.prisma.matches.findMany({
          where,
          skip,
          take: limit,
          include: {
            clubs_matches_homeClubIdToclubs: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
              },
            },
            clubs_matches_awayClubIdToclubs: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
              },
            },
            users_matches_scoutIdTousers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            match_assignments: {
              include: {
                users_match_assignments_scoutIdTousers: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                  },
                },
                users_match_assignments_assignedByIdTousers: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
            _count: {
              select: {
                scouting_reports: true,
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        }),
        this.prisma.matches.count({ where }),
      ]);

      const transformedMatches = matches.map((match: any) => ({
        ...match,
        mobileStatus: this.toMobileStatusFromMatch(match),
        homeClub: match.clubs_matches_homeClubIdToclubs,
        awayClub: match.clubs_matches_awayClubIdToclubs,
        scout: match.users_matches_scoutIdTousers,
        assignments: (match.match_assignments ?? []).map((assignment: any) => ({
          id: assignment.id,
          scoutId: assignment.scoutId,
          missionType: assignment.missionType,
          status: assignment.status,
          mobileStatus: this.toMobileStatusFromAssignment(assignment),
          role: assignment.role,
          reportSubmitted: assignment.reportSubmitted,
          scout: assignment.users_match_assignments_scoutIdTousers
            ? {
                firstName: assignment.users_match_assignments_scoutIdTousers.firstName,
                lastName: assignment.users_match_assignments_scoutIdTousers.lastName,
                avatar: assignment.users_match_assignments_scoutIdTousers.avatar,
                role: assignment.users_match_assignments_scoutIdTousers.role,
              }
            : null,
          assignedBy: assignment.users_match_assignments_assignedByIdTousers
            ? {
                id: assignment.users_match_assignments_assignedByIdTousers.id,
                firstName: assignment.users_match_assignments_assignedByIdTousers.firstName,
                lastName: assignment.users_match_assignments_assignedByIdTousers.lastName,
                role: assignment.users_match_assignments_assignedByIdTousers.role,
              }
            : null,
        })),
        _count: {
          scoutingReports: match._count?.scouting_reports || 0,
        },
      }));

      return {
        data: transformedMatches,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (!this.isMissingColumnError(error, 'match_assignments')) {
        throw error;
      }

      const legacyWhere: any = { scoutId: userId };
      if (status) legacyWhere.status = status;
      if (from || to) {
        legacyWhere.scheduledAt = {};
        if (from) legacyWhere.scheduledAt.gte = new Date(from);
        if (to) legacyWhere.scheduledAt.lte = new Date(to);
      }

      const [matches, total] = await Promise.all([
        this.prisma.matches.findMany({
          where: legacyWhere,
          skip,
          take: limit,
          include: {
            clubs_matches_homeClubIdToclubs: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
              },
            },
            clubs_matches_awayClubIdToclubs: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
              },
            },
            users_matches_scoutIdTousers: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
            _count: {
              select: {
                scouting_reports: true,
              },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        }),
        this.prisma.matches.count({ where: legacyWhere }),
      ]);

      const transformedMatches = matches.map((match: any) => {
        const legacyAssignment = {
          id: `legacy-${match.id}-${userId}`,
          scoutId: userId,
          missionType: 'PRIORITY',
          status: 'ASSIGNED',
          mobileStatus: this.toMobileStatusFromMatch(match),
          role: 'PRIMARY_SCOUT',
          reportSubmitted: String(match?.status ?? '').toUpperCase() === 'COMPLETED',
          scout: match.users_matches_scoutIdTousers
            ? {
                firstName: match.users_matches_scoutIdTousers.firstName,
                lastName: match.users_matches_scoutIdTousers.lastName,
                avatar: match.users_matches_scoutIdTousers.avatar,
                role: match.users_matches_scoutIdTousers.role,
              }
            : null,
          assignedBy: null,
        };
        return {
          ...match,
          mobileStatus: this.toMobileStatusFromMatch(match),
          homeClub: match.clubs_matches_homeClubIdToclubs,
          awayClub: match.clubs_matches_awayClubIdToclubs,
          scout: match.users_matches_scoutIdTousers,
          assignments: [legacyAssignment],
          _count: {
            scoutingReports: match._count?.scouting_reports || 0,
          },
        };
      });

      return {
        data: transformedMatches,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          legacy: true,
        },
      };
    }
  }

  /**
   * Find one match by ID
   */
  async findOne(id: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        scouting_reports: {
          include: {
            players: {
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
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        media: true,
        _count: {
          select: {
            scouting_reports: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Transform to have cleaner field names
    return {
      ...match,
      mobileStatus: this.toMobileStatusFromMatch(match),
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
      scout: match.users_matches_scoutIdTousers,
      _count: {
        scoutingReports: match._count?.scouting_reports || 0,
      },
    };
  }

  /**
   * Update a match
   */
  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    const updateData: any = { ...updateMatchDto };
    if (updateMatchDto.scheduledAt) {
      updateData.scheduledAt = new Date(updateMatchDto.scheduledAt);
    }

    return this.prisma.matches.update({
      where: { id },
      data: updateData,
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        clubs_matches_awayClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a match
   */
  async remove(id: string) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return this.prisma.matches.delete({ where: { id } });
  }

  /**
   * Assign scout to match
   */
  async assignScout(id: string, scoutId: string, assignedById?: string) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    const scout = await this.prisma.users.findUnique({
      where: { id: scoutId },
    });
    if (!scout) {
      throw new NotFoundException(`Scout with ID ${scoutId} not found`);
    }
    if (scout.role !== 'SCOUT' && scout.role !== 'ADMIN' && scout.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('User is not a scout');
    }

    try {
      await this.prisma.match_assignments.upsert({
        where: {
          matchId_scoutId: {
            matchId: id,
            scoutId,
          },
        },
        update: {
          missionType: 'PRIORITY',
          assignedById: assignedById ?? null,
          status: 'ASSIGNED',
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          matchId: id,
          scoutId,
          missionType: 'PRIORITY',
          status: 'ASSIGNED',
          role: 'PRIMARY_SCOUT',
          targetPlayerNames: [],
          reportSubmitted: false,
          assignedById: assignedById ?? null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (!this.isMissingColumnError(error, 'match_assignments')) {
        throw error;
      }
      throw new BadRequestException(
        'Scout assignment requires pending database migration. Apply migrations and retry.',
      );
    }

    return this.prisma.matches.update({
      where: { id },
      data: { scoutId },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
        users_matches_scoutIdTousers: true,
      },
    });
  }

  /**
   * Update match score
   */
  async updateScore(id: string, homeScore: number, awayScore: number) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return this.prisma.matches.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        status: MatchStatus.COMPLETED,
      },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
      },
    });
  }

  /**
   * Get upcoming matches
   */
  async getUpcoming(limit: number = 10) {
    const matches = await this.prisma.matches.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: MatchStatus.SCHEDULED,
      },
      take: limit,
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        clubs_matches_awayClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Transform matches to have cleaner field names
    return matches.map((match: any) => ({
      ...match,
      mobileStatus: this.toMobileStatusFromMatch(match),
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
      scout: match.users_matches_scoutIdTousers,
    }));
  }

  /**
   * Get live matches
   */
  async getLive() {
    const matches = await this.prisma.matches.findMany({
      where: { status: MatchStatus.LIVE },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        clubs_matches_awayClubIdToclubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    // Transform matches to have cleaner field names
    return matches.map((match: any) => ({
      ...match,
      mobileStatus: this.toMobileStatusFromMatch(match),
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
    }));
  }
}
